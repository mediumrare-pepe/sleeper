import { useState } from 'react';
import { addSleepEvent } from '../api';

export default function SleepForm({ onAdd }) {
  const [form, setForm] = useState({ start_time: '', end_time: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = new Date(form.start_time);
    const end = form.end_time ? new Date(form.end_time) : null;
    if (!form.start_time || isNaN(start)) {
      alert('Start time is required');
      return;
    }
    if (end && end <= start) {
      alert('End time must be after start');
      return;
    }
    const payload = {
      start_time: start.toISOString(),
      end_time: end ? end.toISOString() : null,
      notes: form.notes
    };
    addSleepEvent(payload)
      .then(() => {
        setForm({ start_time: '', end_time: '', notes: '' });
        onAdd && onAdd();
      })
      .catch(() => {});
  };

  return (
    <div className="form-card">
      <h2>Add Sleep</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="datetime-local"
          value={form.start_time}
          onChange={e => setForm({ ...form, start_time: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          value={form.end_time}
          onChange={e => setForm({ ...form, end_time: e.target.value })}
        />
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes"
        />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}

