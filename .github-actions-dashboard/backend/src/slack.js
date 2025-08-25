import axios from 'axios';

const webhook = process.env.SLACK_WEBHOOK_URL;
const branchFilter = (process.env.ALERT_BRANCHES || '')
  .split(',').map(s => s.trim()).filter(Boolean);

export async function notifyFailure(run) {
  if (!webhook) return;
  if (branchFilter.length && !branchFilter.includes(run.branch)) return;

  const text = `❗ GitHub Actions failure in *${run.name}*\n`
    + `• Branch: ${run.branch}\n`
    + `• Event: ${run.event}\n`
    + `• By: ${run.actor}\n`
    + `• Duration: ${run.duration_seconds ?? 'n/a'}s\n`
    + `• Link: ${run.html_url}`;

  try { await axios.post(webhook, { text }); }
  catch (e) { console.error('Slack error', e.message); }
}
