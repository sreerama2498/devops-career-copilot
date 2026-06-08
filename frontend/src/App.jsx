import { Routes, Route } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import Dashboard from "./pages/Dashboard"
import Jobs from "./pages/Jobs"
import Applications from "./pages/Applications"
import Profile from "./pages/Profile"
import Resume from "./pages/Resume"
import { AnalyticsPage, SettingsPage } from "./pages/Placeholders"

export default function App() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/jobs"          element={<Jobs />} />
          <Route path="/applications"  element={<Applications />} />
          <Route path="/resume"        element={<Resume />} />
          <Route path="/analytics"     element={<AnalyticsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/profile"       element={<Profile />} />
        </Routes>
      </div>
    </div>
  )
}
