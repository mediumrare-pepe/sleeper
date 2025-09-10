import { useState } from 'react';
import { addFeedEvent } from '../api';

export default function FeedForm({ onAdd }) {
  const [form, setForm] = useState({ start_time: '', end_time: '', amount: '', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = new Date(form.start_time);
    const end = form.end_time ? new Date(form.end_time) : null;
    const amount = form.amount ? parseFloat(form.amount) : null;
    if (!form.start_time || isNaN(start)) {
      alert('Start time is required');
      return;
    }
    if (end && end <= start) {
      alert('End time must be after start');
      return;
    }
    if (amount !== null && amount <= 0) {
      alert('Amount must be positive');
      return;
    }
    const payload = {
      start_time: start.toISOString(),
      end_time: end ? end.toISOString() : null,
      amount,
      notes: form.notes
    };
    addFeedEvent(payload)
      .then(() => {
        setForm({ start_time: '', end_time: '', amount: '', notes: '' });
        onAdd && onAdd();
      })
      .catch(() => {});
  };

  return (
    <div className="form-card">
      <h2>Add Feed</h2>
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
        <input
          type="number"
          step="0.1"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount"
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

