const STAGE = {
  saved:     { label: 'Saved',     color: '#8b92a8' },
  applied:   { label: 'Applied',   color: '#378ADD' },
  screening: { label: 'Screening', color: '#BA7517' },
  interview: { label: 'Interview', color: '#7F77DD' },
  offer:     { label: 'Offer',     color: '#1D9E75' },
  rejected:  { label: 'Rejected',  color: '#A32D2D' },
  withdrawn: { label: 'Withdrawn', color: '#6b7184' },
}

export default function Funnel({ funnel = [], dropped = [] }) {
  const total = funnel.length ? funnel[0].count : 0

  if (!total && !dropped.some(d => d.count)) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
        No applications yet — save a job to start your pipeline
      </div>
    )
  }

  const maxCount = Math.max(...funnel.map(f => f.count), 1)

  return (
    <div>
      {funnel.map(f => {
        const meta = STAGE[f.status] || { label: f.status, color: '#8b92a8' }
        const pct = (f.count / maxCount) * 100
        return (
          <div key={f.status} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                {meta.label}
              </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{f.count}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(pct, f.count ? 4 : 0)}%`, height: '100%', background: meta.color, borderRadius: 4 }} />
            </div>
          </div>
        )
      })}

      {dropped.some(d => d.count) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
          {dropped.map(d => {
            const meta = STAGE[d.status] || { label: d.status, color: '#8b92a8' }
            return (
              <span key={d.status} className="tag" style={{ background: 'rgba(255,255,255,0.04)', color: meta.color, border: `0.5px solid ${meta.color}33` }}>
                {meta.label}: {d.count}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
