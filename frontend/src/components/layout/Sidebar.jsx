import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, ListChecks, FileText, BarChart2, Settings, User, Zap } from 'lucide-react'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',         icon: Briefcase,       label: 'Jobs' },
  { to: '/applications', icon: ListChecks,      label: 'Applications' },
  { to: '/resume',       icon: FileText,        label: 'Resume' },
  { to: '/analytics',    icon: BarChart2,       label: 'Analytics' },
]
const BOTTOM = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile',  icon: User,     label: 'Profile' },
]

function NavBtn({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} title={label} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {({ isActive }) => (
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: isActive ? 'rgba(29,158,117,0.15)' : 'transparent', color: isActive ? 'var(--brand)' : 'var(--text-muted)', border: isActive ? '0.5px solid rgba(29,158,117,0.3)' : '0.5px solid transparent', transition: 'all 0.15s', cursor: 'pointer' }}>
          <Icon size={17} strokeWidth={isActive ? 2 : 1.6} />
        </div>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside style={{ width: 56, background: 'var(--bg-surface)', borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 4, flexShrink: 0 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Zap size={14} color="#fff" strokeWidth={2.5} />
      </div>
      {NAV.map(n => <NavBtn key={n.to} {...n} end={n.to === '/'} />)}
      <div style={{ flex: 1 }} />
      {BOTTOM.map(n => <NavBtn key={n.to} {...n} />)}
    </aside>
  )
}
