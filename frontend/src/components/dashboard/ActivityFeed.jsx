const DOTS = { ingest: '#1D9E75', score: '#7F77DD', application: '#378ADD', resume: '#BA7517', warning: '#D85A30', default: '#555e78' }

const timeAgo = ts => {
  if (!ts) return ''
  const d = (Date.now() - new Date(ts)) / 1000
  if (d < 60) return `${Math.round(d)}s ago`
  if (d < 3600) return `${Math.round(d/60)}m ago`
  if (d < 86400) return `${Math.round(d/3600)}h ago`
  return `${Math.round(d/86400)}d ago`
}

const DEMO = [
  { type: 'ingest',      message: '47 jobs ingested via n8n automation',        ts: new Date(Date.now()-120000).toISOString() },
  { type: 'score',       message: '47 jobs AI-scored — 6 high matches',          ts: new Date(Date.now()-180000).toISOString() },
  { type: 'application', message: 'Stripe SRE moved to Screening',               ts: new Date(Date.now()-3600000).toISOString() },
  { type: 'resume',      message: 'Resume generated for Datadog Platform Eng',   ts: new Date(Date.now()-10800000).toISOString() },
  { type: 'warning',     message: 'Cloudflare SRE — follow-up recommended',      ts: new Date(Date.now()-172800000).toISOString() },
]

export default function ActivityFeed({ items = [] }) {
  const feed = items.length > 0 ? items : DEMO
  return (
    <div>
      {feed.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < feed.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: DOTS[item.type] || DOTS.default }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.message}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(item.ts)}{item.source ? ` · ${item.source}` : ''}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
