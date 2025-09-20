import { fetchWorkflowRuns } from './github.js';
import { query } from './db.js';
import { notifyFailure } from './slack.js';

function toBranch(ref) {
  if (!ref) return null;
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

function calcDurationSeconds(run) {
  const start = run.run_started_at ? new Date(run.run_started_at) : null;
  const end = run.updated_at ? new Date(run.updated_at) : null;
  return start && end ? Math.max(0, Math.round((end - start) / 1000)) : null;
}

async function upsertRun(run) {
  const sql = `
    INSERT INTO runs (id, status, conclusion, name, event, branch, actor, created_at, run_started_at, updated_at, html_url, run_attempt, duration_seconds)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      conclusion = EXCLUDED.conclusion,
      name = EXCLUDED.name,
      event = EXCLUDED.event,
      branch = EXCLUDED.branch,
      actor = EXCLUDED.actor,
      created_at = EXCLUDED.created_at,
      run_started_at = EXCLUDED.run_started_at,
      updated_at = EXCLUDED.updated_at,
      html_url = EXCLUDED.html_url,
      run_attempt = EXCLUDED.run_attempt,
      duration_seconds = EXCLUDED.duration_seconds
  `;

  const values = [
    run.id,
    run.status,
    run.conclusion,
    run.name,
    run.event,
    toBranch(run.head_branch),
    run.actor?.login || null,
    run.created_at,
    run.run_started_at,
    run.updated_at,
    run.html_url,
    run.run_attempt ?? 1,
    calcDurationSeconds(run)
  ];

  await query(sql, values);
}

export async function pollOnce() {
  let page = 1;
  let ingested = 0;
  while (true) {
    const data = await fetchWorkflowRuns(page, 50);
    if (!data.workflow_runs?.length) break;
    for (const run of data.workflow_runs) {
      await upsertRun(run);
      if (run.status === 'completed' && run.conclusion === 'failure') {
        await notifyFailure({
          id: run.id,
          name: run.name,
          branch: toBranch(run.head_branch),
          event: run.event,
          actor: run.actor?.login,
          duration_seconds: calcDurationSeconds(run),
          html_url: run.html_url
        });
      }
      ingested++;
    }
    if (data.workflow_runs.length < 50) break;
    page++;
  }
  return ingested;
}
