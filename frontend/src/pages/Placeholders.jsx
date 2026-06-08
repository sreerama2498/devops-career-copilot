import Topbar from "../components/layout/Topbar"
function P({ title, icon, desc }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Topbar title={title} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-muted)" }}>
        <div style={{ fontSize: 36 }}>{icon}</div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12 }}>{desc}</div>
        <div style={{ fontSize: 11, color: "var(--brand)" }}>Coming soon</div>
      </div>
    </div>
  )
}
export const AnalyticsPage = () => <P title="Career Analytics"  icon="📊" desc="Score trends and funnel insights" />
export const SettingsPage  = () => <P title="Settings"          icon="⚙️"  desc="Configure sources and preferences" />

