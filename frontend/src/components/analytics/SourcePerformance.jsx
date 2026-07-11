const SRC_COLOR = {
  remoteok: '#5DCAA5',
  indeed: '#7ab8f5',
  wellfound: '#a9a3f5',
  linkedin: '#378ADD',
  company_portal: '#BA7517',
  other: '#8b92a8',
}

export default function SourcePerformance({ data = [] }) {
  if (!data.length) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
        No jobs collected yet — run the ingest pipeline
      </div>
    )
  }

  const maxJobs = Math.max(...data.map(d => d.jobs_collected), 1)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px 60px 60px', gap: 8, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid var(--border)' }}>
        <span>Source</span><span>Volume</span><span style={{ textAlign: 'right' }}>Score</span>
        <span style={{ textAlign: 'right' }}>Applied</span><span style={{ textAlign: 'right' }}>Conv.</span>
      </div>
      {data.map(s => {
        const color = SRC_COLOR[s.source] || '#8b92a8'
        return (
          <div key={s.source} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px 60px 60px', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.source}</span>
            <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(s.jobs_collected / maxJobs) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}>{s.avg_score || '—'}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}>{s.applications}</span>
            <span style={{ fontSize: 11, color: s.conversion_rate > 0 ? 'var(--score-high)' : 'var(--text-muted)', textAlign: 'right' }}>{s.conversion_rate}%</span>
          </div>
        )
      })}
    </div>
  )
}
