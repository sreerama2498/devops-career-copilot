import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Pipeline from '../components/pipeline/Pipeline'
import { useApplications } from '../hooks/useData'
import { createApplication } from '../api/client'

const STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected']

export default function Applications() {
  const { applications, loading, refetch, moveApplication } = useApplications()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ company: '', title: '', status: 'applied', url: '' })
  const [saving, setSaving] = useState(false)

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: applications.filter(a => a.status === s).length }), {})

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.company || !form.title) return
    setSaving(true)
    try { await createApplication(form); setForm({ company: '', title: '', status: 'applied', url: '' }); setShowAdd(false); refetch() }
    catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Topbar title="Application Tracker" onRefresh={refetch} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {STATUSES.map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>{counts[s]}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAdd(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--brand)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> Add application
          </button>
        </div>

        {showAdd && (
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>New application</span>
              <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowAdd(false)} />
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                {[['company','Company'],['title','Job title'],['url','Job URL (optional)']].map(([key, ph]) => (
                  <input key={key} type="text" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ background: 'var(--bg-hover)', border: '0.5px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
                ))}
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ background: 'var(--bg-hover)', border: '0.5px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '6px 14px', background: 'transparent', border: '0.5px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '6px 14px', background: 'var(--brand)', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontSize: 12, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Add'}</button>
              </div>
            </form>
          </div>
        )}

        {loading
          ? <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading applications…</div>
          : <Pipeline applications={applications} onMove={moveApplication} />
        }
        {!loading && applications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 13 }}>No applications yet</div>
          </div>
        )}
      </div>
    </div>
  )
}
