import { query } from './db.js';

export async function getMetrics({ windowHours = 24 } = {}) {
  const { rows: [counts] } = await query(
    `SELECT 
       COUNT(*) FILTER (WHERE status='completed' AND conclusion='success') AS success,
       COUNT(*) FILTER (WHERE status='completed' AND conclusion='failure') AS failure,
       COUNT(*) FILTER (WHERE status='completed') AS completed
     FROM runs 
     WHERE created_at >= NOW() - INTERVAL '${windowHours} hours'`
  );

  const { rows: [avgRow] } = await query(
    `SELECT AVG(duration_seconds) AS avg_sec
     FROM runs 
     WHERE status='completed' AND duration_seconds IS NOT NULL 
       AND created_at >= NOW() - INTERVAL '${windowHours} hours'`
  );

  const { rows: [latest] } = await query(
    `SELECT id, status, conclusion, name, branch, event, actor, created_at, run_started_at, updated_at, html_url, duration_seconds
     FROM runs
     ORDER BY created_at DESC
     LIMIT 1`
  );

  return {
    windowHours,
    success: Number(counts?.success || 0),
    failure: Number(counts?.failure || 0),
    completed: Number(counts?.completed || 0),
    successRate: (Number(counts?.completed || 0) ? (Number(counts?.success || 0) / Number(counts?.completed)) : 0),
    averageBuildTimeSec: avgRow?.avg_sec ? Math.round(Number(avgRow.avg_sec)) : null,
    latestRun: latest || null
  };
}
