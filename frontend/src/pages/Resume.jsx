import { useState, useEffect } from "react"
import Topbar from "../components/layout/Topbar"
import { getJobs } from "../api/client"
import { FileText, Zap, Copy, Check, ChevronDown } from "lucide-react"
import api from "../api/client"

const PROFILE_ID = "00000000-0000-0000-0000-000000000001"

export default function Resume() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState("resume")
  const [copied, setCopied] = useState(false)
  const [jobSearch, setJobSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    getJobs({ limit: 100 }).then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data.jobs || []
      setJobs(list)
    })
  }, [])

  async function generate() {
    if (!selectedJob) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.post("/resume/generate", { job_id: selectedJob.id })
      setResult(res.data)
      setTab("resume")
    } catch(e) {
      setError(e.response?.data?.detail || "Generation failed — check backend logs")
    } finally {
      setLoading(false)
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = jobs.filter(j =>
    (j.title + " " + j.company).toLowerCase().includes(jobSearch.toLowerCase())
  )

  const tabStyle = (t) => ({
    padding: "7px 16px", fontSize: 11, cursor: "pointer", borderRadius: 6,
    background: tab === t ? "var(--brand)" : "transparent",
    color: tab === t ? "#fff" : "var(--text-secondary)",
    border: "none", fontFamily: "inherit", fontWeight: tab === t ? 500 : 400,
  })

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Topbar title="Resume Generator" />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>

        {/* Job selector */}
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Select a job to tailor your resume
          </div>
          <div style={{ position: "relative" }}>
            <div onClick={() => setShowDropdown(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
              {selectedJob
                ? <div><div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{selectedJob.title}</div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{selectedJob.company}</div></div>
                : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Choose a job from your feed…</span>
              }
              <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </div>
            {showDropdown && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 8, marginTop: 4, maxHeight: 260, overflowY: "auto" }}>
                <div style={{ padding: "8px 10px", borderBottom: "0.5px solid var(--border)" }}>
                  <input autoFocus value={jobSearch} onChange={e => setJobSearch(e.target.value)} placeholder="Search jobs…"
                    style={{ width: "100%", background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 6, padding: "6px 8px", fontSize: 11, color: "var(--text-primary)", outline: "none" }} />
                </div>
                {filtered.length === 0 && <div style={{ padding: "14px", fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>No jobs found</div>}
                {filtered.slice(0, 30).map(j => (
                  <div key={j.id} onClick={() => { setSelectedJob(j); setShowDropdown(false); setResult(null) }}
                    style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "0.5px solid var(--border)", background: selectedJob?.id === j.id ? "rgba(29,158,117,0.1)" : "transparent" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{j.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{j.company} · {j.location || "Remote"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={generate} disabled={!selectedJob || loading}
            style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", background: selectedJob ? "var(--brand)" : "var(--bg-hover)", border: "none", borderRadius: 8, color: selectedJob ? "#fff" : "var(--text-muted)", fontSize: 13, fontWeight: 500, cursor: selectedJob ? "pointer" : "default", opacity: loading ? 0.7 : 1 }}>
            <Zap size={15} />
            {loading ? "Generating with AI… (this takes ~15s)" : "Generate tailored resume + cover letter"}
          </button>
          {error && <div style={{ marginTop: 10, background: "rgba(163,45,45,0.15)", border: "0.5px solid #A32D2D", borderRadius: 7, padding: "9px 12px", fontSize: 12, color: "#f5a0a0" }}>{error}</div>}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="card" style={{ padding: "30px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>AI is crafting your resume…</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Analyzing job requirements and tailoring your profile</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card" style={{ padding: "14px 16px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{result.job_title} · {result.company}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>AI-tailored resume ready</div>
              </div>
              <button onClick={() => copy(tab === "resume" ? result.resume_text : result.cover_letter)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}>
                {copied ? <><Check size={13} style={{ color: "var(--brand)" }} />Copied!</> : <><Copy size={13} />Copy</>}
              </button>
            </div>

            {/* Keywords */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
              {result.keywords.map(k => <span key={k} className="tag tag-green">{k}</span>)}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "var(--bg-hover)", padding: 4, borderRadius: 8, width: "fit-content" }}>
              <button style={tabStyle("resume")} onClick={() => setTab("resume")}>Resume</button>
              <button style={tabStyle("cover")} onClick={() => setTab("cover")}>Cover Letter</button>
            </div>

            {/* Content */}
            <pre style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--bg-base)", borderRadius: 8, padding: "14px 16px", maxHeight: 500, overflowY: "auto", border: "0.5px solid var(--border)" }}>
              {tab === "resume" ? result.resume_text : result.cover_letter}
            </pre>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            <FileText size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>Select a job above and click Generate</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>AI will tailor your resume and write a cover letter using your profile</div>
          </div>
        )}

      </div>
    </div>
  )
}
