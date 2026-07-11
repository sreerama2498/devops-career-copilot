import Topbar from '../components/layout/Topbar'
import ScoreTrendChart from '../components/analytics/ScoreTrendChart'
import SourcePerformance from '../components/analytics/SourcePerformance'
import Funnel from '../components/analytics/Funnel'
import { useAnalytics } from '../hooks/useData'

export default function Analytics() {
  const { data, loading, refetch } = useAnalytics(30)
  const d = data || {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar title="Career Analytics" onRefresh={refetch} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            AI match score trend (last 30 days)
          </div>
          {loading ? <div style={{ height: 140, opacity: 0.3 }} /> : <ScoreTrendChart data={d.score_trends} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Source performance
            </div>
            {loading ? <div style={{ height: 120, opacity: 0.3 }} /> : <SourcePerformance data={d.source_performance} />}
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Application funnel
            </div>
            {loading ? <div style={{ height: 120, opacity: 0.3 }} /> : <Funnel funnel={d.funnel} dropped={d.dropped} />}
          </div>
        </div>

      </div>
    </div>
  )
}
