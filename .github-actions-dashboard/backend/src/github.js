import axios from 'axios';

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

const gh = axios.create({
  baseURL: `https://api.github.com/repos/${owner}/${repo}`,
  headers: token ? { Authorization: `Bearer ${token}` } : {}
});

export async function fetchWorkflowRuns(page = 1, per_page = 50) {
  const { data } = await gh.get(`/actions/runs`, {
    params: { per_page, page, exclude_pull_requests: false }
  });
  return data; // { total_count, workflow_runs: [...] }
}
