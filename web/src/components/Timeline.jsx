export default function Timeline({ events }) {
  return (
    <div className="timeline-card">
      <h2>Timeline</h2>
      <ul className="timeline">
        {events.map(ev => (
          <li key={`${ev.type}-${ev.id}`}>
            <strong>{ev.type === 'sleep' ? 'Sleep' : 'Feed'}{ev.type === 'feed' && ev.amount ? ` (${ev.amount})` : ''}</strong>
            {' '}
            {new Date(ev.start_time).toLocaleString()}
            {ev.end_time ? ` - ${new Date(ev.end_time).toLocaleString()}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

