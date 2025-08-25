import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { init, query } from './db.js';
import { pollOnce } from './poller.js';
import { getMetrics } from './metrics.js';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get('/api/metrics', async (req, res) => {
  const windowHours = Number(req.query.windowHours || 24);
  const metrics = await getMetrics({ windowHours });
  res.json(metrics);
});

app.get('/api/runs', async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  const { rows } = await query(
    `SELECT id, status, conclusion, name, branch, event, actor, created_at, run_started_at, updated_at, html_url, duration_seconds
     FROM runs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  res.json({ page, pageSize, items: rows });
});

app.get('/api/latest-run', async (req, res) => {
  const { rows: [row] } = await query(
    `SELECT id, status, conclusion, name, branch, event, actor, created_at, run_started_at, updated_at, html_url, duration_seconds
     FROM runs ORDER BY created_at DESC LIMIT 1`
  );
  res.json(row || null);
});

app.post('/api/poll', async (req, res) => {
  const count = await pollOnce();
  res.json({ ingested: count });
});

const port = Number(process.env.PORT || 8080);

async function start() {
  await init();
  try {
    if (fs.existsSync('/app/sql/init.sql')) {
      const sql = fs.readFileSync('/app/sql/init.sql', 'utf8');
      await query(sql);
    }
  } catch (e) { console.error('Init SQL error:', e.message); }

  try { await pollOnce(); } catch (e) { console.error('Initial poll error:', e.message); }
  const interval = Math.max(15, Number(process.env.POLL_INTERVAL_SECONDS || 60)) * 1000;
  setInterval(async () => {
    try { await pollOnce(); } catch (e) { console.error('Poll error:', e.message); }
  }, interval);

  app.listen(port, () => console.log(`API listening on :${port}`));
}

start();
