import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import JobCard from '../components/jobs/JobCard'
import { useJobs } from '../hooks/useData'

const SOURCES = ['All', 'remoteok', 'indeed', 'wellfound']
const PAGE_SIZE = 20

export default function Jobs() {
  const [search, setSearch]       = useState('')
  const [source, setSource]       = useState('All')
  const [minScore, setMinScore]   = useState(0)
  const [remoteOnly, setRemote]   = useState(false)
  const [page, setPage]           = useState(0)

  const filters = useMemo(() => ({
    search: search || undefined,
    source: source !== 'All' ? source : undefined,
    min_score: minScore > 0 ? minScore : undefined,
    remote_only: remoteOnly || undefined,
    skip: page * PAGE_SIZE, limit: PAGE_SIZE,
  }), [search, source, minScore, remoteOnly, page])

  const { jobs, total, loading, refetch } = useJobs(filters)

  const reset = () => { setSearch(''); setSource('All'); setMinScore(0); setRemote(false); setPage(0) }
  const dirty = search || source !== 'All' || minScore > 0 || remoteOnly

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar title="Job Feed" onRefresh={refetch} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Filter panel */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '0.5px solid var(--border)', background: 'var(--bg-surface)', padding: 14, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
            <SlidersHorizontal size={11} /> Filters
          </div>

          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Search</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="title, company, skill…"
              style={{ width: '100%', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 7, padding: '6px 8px 6px 26px', fontSize: 11, color: 'var(--text-primary)', outline: 'none' }} />
            {search && <X size={11} onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} />}
          </div>

          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Source</label>
          <div style={{ marginBottom: 16 }}>
            {SOURCES.map(s => (
              <div key={s} onClick={() => { setSource(s); setPage(0) }} style={{ padding: '5px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', marginBottom: 2, background: source === s ? 'rgba(29,158,117,0.12)' : 'transparent', color: source === s ? 'var(--brand)' : 'var(--text-secondary)', border: source === s ? '0.5px solid rgba(29,158,117,0.25)' : '0.5px solid transparent' }}>
                {s === 'All' ? 'All sources' : s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>

          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Min AI score — <span style={{ color: 'var(--brand)' }}>{minScore}</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={e => { setMinScore(Number(e.target.value)); setPage(0) }} style={{ width: '100%', marginBottom: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginBottom: 16 }}><span>0</span><span>50</span><span>100</span></div>

          <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={remoteOnly} onChange={e => { setRemote(e.target.checked); setPage(0) }} style={{ accentColor: 'var(--brand)', width: 13, height: 13 }} />
            Remote only
          </label>

          {dirty && <button onClick={reset} style={{ width: '100%', padding: 6, fontSize: 11, background: 'transparent', border: '0.5px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', cursor: 'pointer' }}>Clear filters</button>}
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>{loading ? 'Loading…' : `${total} jobs found`}</span>
            {total > PAGE_SIZE && <span>Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</span>}
          </div>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ height: 82, marginBottom: 8, opacity: 0.2 + i * 0.1 }} />)
            : jobs.length > 0
              ? jobs.map(j => <JobCard key={j.id} job={j} />)
              : <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No jobs match your filters</div>
          }
          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingTop: 16 }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', cursor: page === 0 ? 'default' : 'pointer', fontSize: 11, opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
              <button disabled={(page+1)*PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', cursor: (page+1)*PAGE_SIZE >= total ? 'default' : 'pointer', fontSize: 11, opacity: (page+1)*PAGE_SIZE >= total ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

