import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import MetricCard from '../components/dashboard/MetricCard'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import JobCard from '../components/jobs/JobCard'
import Pipeline from '../components/pipeline/Pipeline'
import { useDashboardStats, useJobs, useApplications } from '../hooks/useData'

const SKILLS = [
  { name: 'Kubernetes', pct: 88, color: '#639922' },
  { name: 'Terraform',  pct: 82, color: '#3B8BD4' },
  { name: 'Golang',     pct: 60, color: '#BA7517' },
  { name: 'FinOps',     pct: 45, color: '#D85A30' },
  { name: 'Cilium',     pct: 22, color: '#A32D2D' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, activity, loading: sLoad, refetch } = useDashboardStats()
  const { jobs, loading: jLoad } = useJobs({ limit: 3, min_score: 75 })
  const { applications, moveApplication } = useApplications()
  const s = stats || {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar title="Dashboard" onRefresh={refetch} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
          <MetricCard
            label="Jobs found today"
            value={sLoad ? '…' : (s.jobs_collected_today ?? '—')}
            sub="from all sources"
            subType="up"
          />
          <MetricCard
            label="Avg AI match score"
            value={sLoad ? '…' : (s.avg_match_score != null ? `${s.avg_match_score}%` : '—')}
            sub="across scored jobs"
            subType="up"
          />
          <MetricCard
            label="Active applications"
            value={sLoad ? '…' : (s.active_applications ?? '—')}
            sub={s.applications_by_status ? `${s.applications_by_status.interview || 0} in interview` : ''}
            subType="warn"
          />
          <MetricCard
            label="Interviews scheduled"
            value={sLoad ? '…' : (s.interviews_scheduled ?? '—')}
            sub="active stage"
            subType="up"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Top AI matches</div>
            {jLoad
              ? [1,2,3].map(i => <div key={i} className="card" style={{ height: 68, marginBottom: 8, opacity: 0.3 }} />)
              : jobs.length > 0
                ? jobs.map(j => <JobCard key={j.id} job={j} onClick={() => navigate('/jobs')} compact />)
                : <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No matches yet — run the ingest pipeline</div>
            }
            <div onClick={() => navigate('/jobs')} style={{ fontSize: 11, color: 'var(--brand)', cursor: 'pointer', marginTop: 4 }}>View all jobs →</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Application pipeline</div>
            <Pipeline applications={applications} onMove={moveApplication} />
            <div onClick={() => navigate('/applications')} style={{ fontSize: 11, color: 'var(--brand)', cursor: 'pointer', marginTop: 8 }}>Full tracker →</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Skill gap radar</div>
            {SKILLS.map(({ name, pct, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 72, flexShrink: 0 }}>{name}</span>
                <div style={{ flex: 1, height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>{pct}%</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Activity feed</div>
            <ActivityFeed items={activity} />
          </div>
        </div>

      </div>
    </div>
  )
}
