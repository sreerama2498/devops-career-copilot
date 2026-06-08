import { Bell, RefreshCw } from 'lucide-react'

export default function Topbar({ title, onRefresh }) {
  return (
    <header style={{ height: 48, padding: '0 20px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{title}</span>
        <span style={{ fontSize: 9, letterSpacing: '0.08em', background: 'rgba(29,158,117,0.15)', color: 'var(--brand)', border: '0.5px solid rgba(29,158,117,0.3)', padding: '2px 7px', borderRadius: 20 }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          Automation running
        </div>
        <div style={{ width: '0.5px', height: 14, background: 'var(--border-hover)' }} />
        {onRefresh && <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}><RefreshCw size={14} /></button>}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}><Bell size={14} /></button>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(29,158,117,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: 'var(--brand)' }}>KS</div>
      </div>
    </header>
  )
}
