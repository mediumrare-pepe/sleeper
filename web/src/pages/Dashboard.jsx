import { useEffect, useState } from 'react';
import { getSleepEvents, getFeedEvents, getRecommendations } from '../api';
import './pages.css';

export default function Dashboard() {
  const [sleepCount, setSleepCount] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    getSleepEvents().then(data => setSleepCount(data.length)).catch(() => {});
    getFeedEvents().then(data => setFeedCount(data.length)).catch(() => {});
    getRecommendations().then(setRecs).catch(() => {});
  }, []);

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Sleep Sessions</h2>
        <p>{sleepCount}</p>
      </div>
      <div className="card">
        <h2>Feeds</h2>
        <p>{feedCount}</p>
      </div>
      <div className="card">
        <h2>Recommendations</h2>
        <ul>
          {recs.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
