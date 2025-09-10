import { useEffect, useState } from 'react';
import { getSleepEvents, getFeedEvents } from '../api';
import SleepForm from '../components/SleepForm';
import FeedForm from '../components/FeedForm';
import Timeline from '../components/Timeline';
import './pages.css';

export default function Logs() {
  const [sleepEvents, setSleepEvents] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);

  const load = () => {
    getSleepEvents().then(setSleepEvents).catch(() => {});
    getFeedEvents().then(setFeedEvents).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const events = [
    ...sleepEvents.map(e => ({ ...e, type: 'sleep' })),
    ...feedEvents.map(e => ({ ...e, type: 'feed' }))
  ].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div className="logs">
      <SleepForm onAdd={load} />
      <FeedForm onAdd={load} />
      <Timeline events={events} />
    </div>
  );
}

