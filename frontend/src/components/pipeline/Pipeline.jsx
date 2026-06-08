import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const COLUMNS = [
  { id: 'applied',   label: 'Applied',   color: '#378ADD' },
  { id: 'screening', label: 'Screening', color: '#BA7517' },
  { id: 'interview', label: 'Interview', color: '#7F77DD' },
  { id: 'offer',     label: 'Offer',     color: '#1D9E75' },
  { id: 'rejected',  label: 'Rejected',  color: '#A32D2D' },
]

function PipeCard({ app, isDragging }) {
  const col = COLUMNS.find(c => c.id === app.status)
  return (
    <div className="pipe-card" style={{ borderLeftColor: col?.color || '#555', opacity: isDragging ? 0.4 : 1, userSelect: 'none' }}>
      <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{app.job?.company || app.company || '—'}</div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.job?.title || app.title || '—'}</div>
      {app.applied_at && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(app.applied_at).toLocaleDateString()}</div>}
    </div>
  )
}

function SortableCard({ app }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <PipeCard app={app} isDragging={isDragging} />
    </div>
  )
}

export default function Pipeline({ applications, onMove }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const byStatus = s => applications.filter(a => a.status === s)

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const overApp = applications.find(a => a.id === over.id)
    const overCol = COLUMNS.find(c => c.id === over.id)
    const newStatus = overApp?.status || overCol?.id
    if (!newStatus) return
    const dragged = applications.find(a => a.id === active.id)
    if (dragged && dragged.status !== newStatus) onMove(active.id, newStatus)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {COLUMNS.map(col => {
          const cards = byStatus(col.id)
          return (
            <div key={col.id} style={{ flex: '1 0 160px', minWidth: 150, maxWidth: 220 }}>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', padding: '6px 8px', background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderBottom: 'none', borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.label}
                </span>
                <span style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '0 6px', fontSize: 9, color: 'var(--text-muted)' }}>{cards.length}</span>
              </div>
              <SortableContext items={cards.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div id={col.id} style={{ border: '0.5px solid var(--border)', borderRadius: '0 0 6px 6px', padding: 6, background: 'var(--bg-card)', minHeight: 80 }}>
                  {cards.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '14px 0' }}>Drop here</div>}
                  {cards.map(app => <SortableCard key={app.id} app={app} />)}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>{activeId ? <PipeCard app={applications.find(a => a.id === activeId)} /> : null}</DragOverlay>
    </DndContext>
  )
}
