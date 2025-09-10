export const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  });
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export const getSleepEvents = () => fetchJSON('/api/sleep');
export const getFeedEvents = () => fetchJSON('/api/feed');
export const getRecommendations = () => fetchJSON('/api/recommendations');

export const addSleepEvent = (data) =>
  fetchJSON('/api/sleep', { method: 'POST', body: JSON.stringify(data) });

export const addFeedEvent = (data) =>
  fetchJSON('/api/feed', { method: 'POST', body: JSON.stringify(data) });
