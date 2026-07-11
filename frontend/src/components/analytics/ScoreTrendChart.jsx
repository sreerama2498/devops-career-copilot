export default function ScoreTrendChart({ data = [] }) {
  if (!data.length) {
    return (
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        No score history yet — run the scoring job to start tracking trends
      </div>
    )
  }

  const W = 760, H = 140, PAD = 24
  const scores = data.map(d => d.avg_score)
  const max = Math.max(...scores, 10)
  const min = Math.min(...scores, 0)
  const range = max - min || 1
  const stepX = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0

  const points = data.map((d, i) => {
    const x = PAD + i * stepX
    const y = H - PAD - ((d.avg_score - min) / range) * (H - PAD * 2)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H - PAD} L ${points[0].x.toFixed(1)} ${H - PAD} Z`

  const labelEvery = Math.max(1, Math.ceil(points.length / 6))

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="scoreFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map(f => (
        <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)}
              stroke="var(--border)" strokeWidth="1" />
      ))}

      <path d={areaPath} fill="url(#scoreFade)" stroke="none" />
      <path d={linePath} fill="none" stroke="#1D9E75" strokeWidth="1.75" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#1D9E75" />
      ))}

      {points.map((p, i) => (
        i % labelEvery === 0 && (
          <text key={i} x={p.x} y={H + 14} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
            {p.date.slice(5)}
          </text>
        )
      ))}
    </svg>
  )
}
