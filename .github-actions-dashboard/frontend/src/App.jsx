import React, { useEffect, useMemo, useState } from 'react'
import { getMetrics, getRuns, pollNow } from './api'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function App() {
  const [metrics, setMetrics] = useState(null)
  const [runs, setRuns] = useState({ items: [], page: 1, pageSize: 20 })
  const [hours, setHours] = useState(24)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const [m, r] = await Promise.all([
      getMetrics(hours),
      getRuns(1, 20)
    ])
    setMetrics(m)
    setRuns(r)
    setLoading(false)
  }

  useEffect(() => { load() }, [hours])

  const successRatePct = useMemo(() => Math.round((metrics?.successRate || 0) * 100), [metrics])

  const barData = useMemo(() => ([
    { name: 'Success', value: metrics?.success || 0 },
    { name: 'Failure', value: metrics?.failure || 0 },
  ]), [metrics])

  return (
    <div style={{ fontFamily: 'ui-sans-serif,system-ui', padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>GitHub Actions Dashboard</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>Owner/Repo from backend env. Window: {hours}h</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card title="✅ Success Rate">
          <Big>{successRatePct}%</Big>
        </Card>
        <Card title="🕒 Avg Build Time (s)">
          <Big>{metrics?.averageBuildTimeSec ?? '—'}</Big>
        </Card>
        <Card title="📌 Last Build Status">
          <div style={{ fontSize: 18 }}>
            {metrics?.latestRun ? (
              <>
                <strong>{metrics.latestRun.conclusion?.toUpperCase() || metrics.latestRun.status}</strong> on <code>{metrics.latestRun.branch}</code><br/>
                <a href={metrics.latestRun.html_url} target="_blank">Open on GitHub ↗</a>
              </>
            ) : '—'}
          </div>
        </Card>
        <Card title="Window (hours)">
          <select value={hours} onChange={e => setHours(Number(e.target.value))}>
            {[1,6,12,24,48,72,168].map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </Card>
        <Card title="Actions">
          <button onClick={async ()=>{ await pollNow(); await load(); }} disabled={loading}>
            {loading ? 'Polling…' : 'Poll Now'}
          </button>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <Card title="Completions (Success vs Failure)">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Runs">
          <table width="100%" cellPadding={6} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th>ID</th><th>Name</th><th>Branch</th><th>Status</th><th>Conclusion</th><th>Duration (s)</th><th>Link</th>
              </tr>
            </thead>
            <tbody>
              {runs.items.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td><code>{r.branch}</code></td>
                  <td>{r.status}</td>
                  <td>{r.conclusion || '—'}</td>
                  <td>{r.duration_seconds ?? '—'}</td>
                  <td><a href={r.html_url} target="_blank">Logs</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

function Big({ children }) {
  return <div style={{ fontSize: 36, fontWeight: 700 }}>{children}</div>
}
