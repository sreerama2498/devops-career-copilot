import { useState, useEffect } from "react"
import Topbar from "../components/layout/Topbar"
import { getProfile, updateProfile } from "../api/client"
import { User, MapPin, Briefcase, DollarSign, Plus, X, Save, Edit3 } from "lucide-react"

const REMOTE_OPTIONS = ["remote", "hybrid", "onsite", "any"]

const SUGGESTED_SKILLS = [
  "Kubernetes","Terraform","AWS","GCP","Azure","Docker","Helm",
  "ArgoCD","Jenkins","GitHub Actions","Ansible","Python","Go",
  "Prometheus","Grafana","Datadog","Linux","Bash","CI/CD","FinOps",
  "Vault","Consul","Istio","Cilium","PostgreSQL","Redis","Kafka"
]

const inp = {
  width: "100%", background: "var(--bg-hover)",
  border: "0.5px solid var(--border)", borderRadius: 7,
  padding: "8px 10px", fontSize: 12,
  color: "var(--text-primary)", outline: "none",
}

const label = {
  fontSize: 10, color: "var(--text-muted)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 6,
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm]       = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [newSkill, setNewSkill] = useState("")
  const [created, setCreated] = useState(false)

  useEffect(() => {
    getProfile()
      .then(r => { setProfile(r.data); setForm(r.data) })
      .catch(e => {
        if (e.response?.status === 404) setCreated(false)
        else setError("Failed to load profile")
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const method = profile ? updateProfile : createProfile
      const res = await method(form)
      setProfile(res.data); setForm(res.data); setEditing(false)
    } catch(e) { setError("Save failed: " + (e.response?.data?.detail || e.message)) }
    finally { setSaving(false) }
  }

  function addSkill(skill) {
    const s = skill.trim()
    if (!s || form.skills.includes(s)) return
    setForm(f => ({ ...f, skills: [...f.skills, s] }))
    setNewSkill("")
  }

  function removeSkill(skill) {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
  }

  if (loading) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Topbar title="Profile" />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading profile…</div>
    </div>
  )

  if (!profile && !editing) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Topbar title="Profile" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ fontSize: 36 }}>👤</div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>No profile yet</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Create your profile to enable AI job matching</div>
        <button onClick={() => { setForm({ title: "", years_experience: 0, location: "", remote_preference: "remote", skills: [], resume_text: "", salary_min: 0, salary_max: 0 }); setEditing(true) }}
          style={{ marginTop: 8, padding: "8px 20px", background: "var(--brand)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Create Profile
        </button>
      </div>
    </div>
  )

  const f = form || {}

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Topbar title="Profile" />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>

        {error && <div style={{ background: "rgba(163,45,45,0.15)", border: "0.5px solid #A32D2D", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f5a0a0" }}>{error}</div>}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(29,158,117,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 500, color: "var(--brand)" }}>KS</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{profile?.title || "Your Title"}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                {profile?.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{profile.location}</span>}
                {profile?.years_experience != null && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={11} />{profile.years_experience} yrs exp</span>}
                {profile?.remote_preference && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{profile.remote_preference}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: editing ? "var(--brand)" : "var(--bg-card)", border: "0.5px solid " + (editing ? "var(--brand)" : "var(--border)"), borderRadius: 8, color: editing ? "#fff" : "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {editing ? <><Save size={13} />{saving ? "Saving…" : "Save profile"}</> : <><Edit3 size={13} />Edit profile</>}
          </button>
        </div>

        {/* Basic info */}
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Basic Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <span style={label}>Job Title / Role</span>
              {editing
                ? <input style={inp} value={f.title || ""} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior SRE" />
                : <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{profile?.title || "—"}</div>
              }
            </div>
            <div>
              <span style={label}>Years of Experience</span>
              {editing
                ? <input style={inp} type="number" value={f.years_experience || ""} onChange={e => setForm(p => ({ ...p, years_experience: parseInt(e.target.value) }))} placeholder="e.g. 7" />
                : <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{profile?.years_experience ?? "—"}</div>
              }
            </div>
            <div>
              <span style={label}>Location</span>
              {editing
                ? <input style={inp} value={f.location || ""} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Hyderabad, India" />
                : <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{profile?.location || "—"}</div>
              }
            </div>
            <div>
              <span style={label}>Remote Preference</span>
              {editing
                ? <select style={inp} value={f.remote_preference || "any"} onChange={e => setForm(p => ({ ...p, remote_preference: e.target.value }))}>
                    {REMOTE_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                : <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{profile?.remote_preference || "—"}</div>
              }
            </div>
            <div>
              <span style={label}>Salary Min (USD/yr)</span>
              {editing
                ? <input style={inp} type="number" value={f.salary_min || ""} onChange={e => setForm(p => ({ ...p, salary_min: parseInt(e.target.value) }))} placeholder="e.g. 120000" />
                : <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{profile?.salary_min ? `$\${profile.salary_min.toLocaleString()}` : "—"}</div>
              }
            </div>
            <div>
              <span style={label}>Salary Max (USD/yr)</span>
              {editing
                ? <input style={inp} type="number" value={f.salary_max || ""} onChange={e => setForm(p => ({ ...p, salary_max: parseInt(e.target.value) }))} placeholder="e.g. 180000" />
                : <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{profile?.salary_max ? `$\${profile.salary_max.toLocaleString()}` : "—"}</div>
              }
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: editing ? 12 : 0 }}>
            {(editing ? f.skills : profile?.skills || []).map(s => (
              <span key={s} className="tag tag-blue" style={{ gap: 5 }}>
                {s}
                {editing && <X size={10} style={{ cursor: "pointer" }} onClick={() => removeSkill(s)} />}
              </span>
            ))}
            {(editing ? f.skills : profile?.skills || []).length === 0 && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No skills added yet</span>}
          </div>
          {editing && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input style={{ ...inp, flex: 1 }} value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addSkill(newSkill)}
                  placeholder="Type a skill and press Enter" />
                <button onClick={() => addSkill(newSkill)} style={{ padding: "8px 12px", background: "var(--brand)", border: "none", borderRadius: 7, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <Plus size={14} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick add</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SUGGESTED_SKILLS.filter(s => !(f.skills || []).includes(s)).map(s => (
                  <span key={s} onClick={() => addSkill(s)} className="tag tag-gray" style={{ cursor: "pointer" }}>{s}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Resume text */}
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Resume / Bio</div>
          {editing
            ? <textarea value={f.resume_text || ""} onChange={e => setForm(p => ({ ...p, resume_text: e.target.value }))}
                placeholder="Paste your resume text or write a bio — used by AI to tailor resumes and score jobs…"
                style={{ ...inp, height: 160, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
            : <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {profile?.resume_text || <span style={{ color: "var(--text-muted)" }}>No resume text added yet. Click Edit to add your bio or paste your resume.</span>}
              </div>
          }
        </div>

        {editing && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingBottom: 20 }}>
            <button onClick={() => { setForm(profile); setEditing(false) }} style={{ padding: "8px 18px", background: "transparent", border: "0.5px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 18px", background: "var(--brand)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save profile"}</button>
          </div>
        )}

      </div>
    </div>
  )
}
