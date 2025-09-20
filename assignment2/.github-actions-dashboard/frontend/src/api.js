const base = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export async function getMetrics(windowHours = 24) {
  const res = await fetch(`${base}/metrics?windowHours=${windowHours}`);
  return res.json();
}

export async function getRuns(page = 1, pageSize = 20) {
  const res = await fetch(`${base}/runs?page=${page}&pageSize=${pageSize}`);
  return res.json();
}

export async function pollNow() {
  const res = await fetch(`${base}/poll`, { method: 'POST' });
  return res.json();
}
