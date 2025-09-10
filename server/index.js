const express = require('express');
const session = require('express-session');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const { ApolloServer, gql } = require('apollo-server-express');

(async () => {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'sleeper-secret',
    resave: false,
    saveUninitialized: false
  }));

  const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sleeper',
    connectionLimit: 5
  });

  const db = {
    query: (sql, params) => pool.query(sql, params),
    get: async (sql, params) => (await pool.query(sql, params))[0],
    run: async (sql, params) => {
      const res = await pool.query(sql, params);
      return { lastID: res.insertId };
    },
    all: (sql, params) => pool.query(sql, params)
  };

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255)
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS sleep_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    start_time DATETIME,
    end_time DATETIME,
    notes TEXT
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS feed_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    start_time DATETIME,
    end_time DATETIME,
    amount DOUBLE,
    notes TEXT
  )`);

  // Authentication routes
  app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    try {
      const result = await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
      req.session.userId = result.lastID;
      res.json({ id: result.lastID, username });
    } catch (err) {
      res.status(400).json({ error: 'User exists' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  function requireLogin(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    next();
  }

  // REST endpoints for SleepEvent
  app.get('/api/sleep', requireLogin, async (req, res) => {
    const rows = await db.all('SELECT * FROM sleep_events WHERE user_id = ?', [req.session.userId]);
    res.json(rows);
  });

  app.post('/api/sleep', requireLogin, async (req, res) => {
    const { start_time, end_time, notes } = req.body;
    const result = await db.run('INSERT INTO sleep_events (user_id, start_time, end_time, notes) VALUES (?, ?, ?, ?)', [req.session.userId, start_time, end_time, notes]);
    const row = await db.get('SELECT * FROM sleep_events WHERE id = ?', [result.lastID]);
    res.json(row);
  });

  app.put('/api/sleep/:id', requireLogin, async (req, res) => {
    const { start_time, end_time, notes } = req.body;
    await db.run('UPDATE sleep_events SET start_time = ?, end_time = ?, notes = ? WHERE id = ? AND user_id = ?', [start_time, end_time, notes, req.params.id, req.session.userId]);
    const row = await db.get('SELECT * FROM sleep_events WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json(row);
  });

  app.delete('/api/sleep/:id', requireLogin, async (req, res) => {
    await db.run('DELETE FROM sleep_events WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  });

  // REST endpoints for FeedEvent
  app.get('/api/feed', requireLogin, async (req, res) => {
    const rows = await db.all('SELECT * FROM feed_events WHERE user_id = ?', [req.session.userId]);
    res.json(rows);
  });

  app.post('/api/feed', requireLogin, async (req, res) => {
    const { start_time, end_time, amount, notes } = req.body;
    const result = await db.run('INSERT INTO feed_events (user_id, start_time, end_time, amount, notes) VALUES (?, ?, ?, ?, ?)', [req.session.userId, start_time, end_time, amount, notes]);
    const row = await db.get('SELECT * FROM feed_events WHERE id = ?', [result.lastID]);
    res.json(row);
  });

  app.put('/api/feed/:id', requireLogin, async (req, res) => {
    const { start_time, end_time, amount, notes } = req.body;
    await db.run('UPDATE feed_events SET start_time = ?, end_time = ?, amount = ?, notes = ? WHERE id = ? AND user_id = ?', [start_time, end_time, amount, notes, req.params.id, req.session.userId]);
    const row = await db.get('SELECT * FROM feed_events WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json(row);
  });

  app.delete('/api/feed/:id', requireLogin, async (req, res) => {
    await db.run('DELETE FROM feed_events WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
    res.json({ ok: true });
  });

  // GraphQL schema and resolvers
  const typeDefs = gql`
    type SleepEvent { id: ID!, startTime: String!, endTime: String, notes: String }
    type FeedEvent { id: ID!, startTime: String!, endTime: String, amount: Float, notes: String }
    type Query { sleepEvents: [SleepEvent], feedEvents: [FeedEvent] }
    input SleepInput { startTime: String!, endTime: String, notes: String }
    input FeedInput { startTime: String!, endTime: String, amount: Float, notes: String }
    type Mutation {
      createSleepEvent(input: SleepInput!): SleepEvent
      updateSleepEvent(id: ID!, input: SleepInput!): SleepEvent
      deleteSleepEvent(id: ID!): Boolean
      createFeedEvent(input: FeedInput!): FeedEvent
      updateFeedEvent(id: ID!, input: FeedInput!): FeedEvent
      deleteFeedEvent(id: ID!): Boolean
    }
  `;

  const resolvers = {
    Query: {
      sleepEvents: async (_, __, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        return db.all('SELECT * FROM sleep_events WHERE user_id = ?', [userId]);
      },
      feedEvents: async (_, __, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        return db.all('SELECT * FROM feed_events WHERE user_id = ?', [userId]);
      }
    },
    Mutation: {
      createSleepEvent: async (_, { input }, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        const result = await db.run('INSERT INTO sleep_events (user_id, start_time, end_time, notes) VALUES (?, ?, ?, ?)', [userId, input.startTime, input.endTime, input.notes]);
        return db.get('SELECT * FROM sleep_events WHERE id = ?', [result.lastID]);
      },
      updateSleepEvent: async (_, { id, input }, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        await db.run('UPDATE sleep_events SET start_time = ?, end_time = ?, notes = ? WHERE id = ? AND user_id = ?', [input.startTime, input.endTime, input.notes, id, userId]);
        return db.get('SELECT * FROM sleep_events WHERE id = ? AND user_id = ?', [id, userId]);
      },
      deleteSleepEvent: async (_, { id }, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        await db.run('DELETE FROM sleep_events WHERE id = ? AND user_id = ?', [id, userId]);
        return true;
      },
      createFeedEvent: async (_, { input }, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        const result = await db.run('INSERT INTO feed_events (user_id, start_time, end_time, amount, notes) VALUES (?, ?, ?, ?, ?)', [userId, input.startTime, input.endTime, input.amount, input.notes]);
        return db.get('SELECT * FROM feed_events WHERE id = ?', [result.lastID]);
      },
      updateFeedEvent: async (_, { id, input }, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        await db.run('UPDATE feed_events SET start_time = ?, end_time = ?, amount = ?, notes = ? WHERE id = ? AND user_id = ?', [input.startTime, input.endTime, input.amount, input.notes, id, userId]);
        return db.get('SELECT * FROM feed_events WHERE id = ? AND user_id = ?', [id, userId]);
      },
      deleteFeedEvent: async (_, { id }, { userId }) => {
        if (!userId) throw new Error('Unauthorized');
        await db.run('DELETE FROM feed_events WHERE id = ? AND user_id = ?', [id, userId]);
        return true;
      }
    }
  };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ userId: req.session.userId })
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
})();
