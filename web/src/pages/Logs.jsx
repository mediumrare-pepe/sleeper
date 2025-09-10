import { useEffect, useState } from 'react';
import { getSleepEvents, getFeedEvents, addSleepEvent, addFeedEvent } from '../api';
import './pages.css';

export default function Logs() {
  const [sleepEvents, setSleepEvents] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);
  const [sleepForm, setSleepForm] = useState({ start_time: '', end_time: '', notes: '' });
  const [feedForm, setFeedForm] = useState({ start_time: '', end_time: '', amount: '', notes: '' });

  const load = () => {
    getSleepEvents().then(setSleepEvents).catch(() => {});
    getFeedEvents().then(setFeedEvents).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSleepSubmit = (e) => {
    e.preventDefault();
    addSleepEvent(sleepForm).then(() => {
      setSleepForm({ start_time: '', end_time: '', notes: '' });
      load();
    }).catch(() => {});
  };

  const handleFeedSubmit = (e) => {
    e.preventDefault();
    addFeedEvent(feedForm).then(() => {
      setFeedForm({ start_time: '', end_time: '', amount: '', notes: '' });
      load();
    }).catch(() => {});
  };

  return (
    <div className="logs">
      <div className="form-card">
        <h2>Add Sleep</h2>
        <form onSubmit={handleSleepSubmit}>
          <input type="datetime-local" value={sleepForm.start_time} onChange={e => setSleepForm({ ...sleepForm, start_time: e.target.value })} required />
          <input type="datetime-local" value={sleepForm.end_time} onChange={e => setSleepForm({ ...sleepForm, end_time: e.target.value })} />
          <textarea value={sleepForm.notes} onChange={e => setSleepForm({ ...sleepForm, notes: e.target.value })} placeholder="Notes" />
          <button type="submit">Save</button>
        </form>
        <ul>
          {sleepEvents.map(e => (
            <li key={e.id}>{e.start_time} - {e.end_time}</li>
          ))}
        </ul>
      </div>
      <div className="form-card">
        <h2>Add Feed</h2>
        <form onSubmit={handleFeedSubmit}>
          <input type="datetime-local" value={feedForm.start_time} onChange={e => setFeedForm({ ...feedForm, start_time: e.target.value })} required />
          <input type="datetime-local" value={feedForm.end_time} onChange={e => setFeedForm({ ...feedForm, end_time: e.target.value })} />
          <input type="number" step="0.1" value={feedForm.amount} onChange={e => setFeedForm({ ...feedForm, amount: e.target.value })} placeholder="Amount" />
          <textarea value={feedForm.notes} onChange={e => setFeedForm({ ...feedForm, notes: e.target.value })} placeholder="Notes" />
          <button type="submit">Save</button>
        </form>
        <ul>
          {feedEvents.map(e => (
            <li key={e.id}>{e.start_time} - {e.amount}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
