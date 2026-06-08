import { MapPin, ExternalLink } from 'lucide-react'

const scoreColor = s => s >= 85 ? 'var(--score-high)' : s >= 70 ? 'var(--score-mid)' : 'var(--score-low)'
const scoreBg    = s => s >= 85 ? 'rgba(29,158,117,0.12)' : s >= 70 ? 'rgba(186,117,23,0.12)' : 'rgba(163,45,45,0.12)'
const initials   = (c = '') => c.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const SRC = {
  remoteok:  { bg: 'rgba(29,158,117,0.15)', color: '#5DCAA5' },
  indeed:    { bg: 'rgba(55,138,221,0.15)', color: '#7ab8f5' },
  wellfound: { bg: 'rgba(127,119,221,0.15)', color: '#a9a3f5' },
}

export default function JobCard({ job, onClick, compact = false }) {
  const score = job.ai_score ?? job.score ?? null
  const src = (job.source || '').toLowerCase()
  const srcStyle = SRC[src] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }

  return (
    <div className="card card-hover" onClick={() => onClick?.(job)} style={{ padding: compact ? '10px 12px' : '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'var(--bg-hover)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
        {initials(job.company)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{job.company}</span>
          {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{job.location}</span>}
          {job.salary && <span>{job.salary}</span>}
        </div>
        {!compact && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
            <span className="tag" style={{ background: srcStyle.bg, color: srcStyle.color }}>{job.source || 'unknown'}</span>
            {(job.tags || job.skills || []).slice(0, 4).map(t => <span key={t} className="tag tag-blue">{t}</span>)}
            {job.remote && <span className="tag tag-green">Remote</span>}
          </div>
        )}
      </div>
      {score !== null && (
        <div style={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: scoreBg(score), borderRadius: 8, padding: '5px 0' }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: scoreColor(score), lineHeight: 1 }}>{Math.round(score)}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>MATCH</span>
        </div>
      )}
      {job.url && (
        <a href={job.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}
