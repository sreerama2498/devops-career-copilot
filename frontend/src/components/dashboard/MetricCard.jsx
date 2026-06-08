export default function MetricCard({ label, value, sub, subType = 'neutral' }) {
  const subColor = { up: 'var(--score-high)', warn: 'var(--score-mid)', down: 'var(--score-low)', neutral: 'var(--text-muted)' }[subType]
  return (
    <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: subColor, marginTop: 5 }}>{sub}</div>}
    </div>
  )
}
