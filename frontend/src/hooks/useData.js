import { useState, useEffect, useCallback } from 'react'
import { getDashboardStats, getJobs, getApplications, updateApplication, getAnalyticsOverview } from '../api/client'

export function useDashboardStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getDashboardStats()
      setStats(res.data)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { stats, activity: [], loading, error, refetch: fetch }
}

export function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getJobs(filters)
      if (Array.isArray(res.data)) { setJobs(res.data); setTotal(res.data.length) }
      else { setJobs(res.data.jobs || []); setTotal(res.data.total || 0) }
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])
  return { jobs, total, loading, error, refetch: fetch }
}

export function useApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getApplications()
      setApplications(Array.isArray(res.data) ? res.data : res.data.applications || [])
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const moveApplication = useCallback(async (id, newStatus) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    try { await updateApplication(id, { status: newStatus }) }
    catch (e) { fetch() }
  }, [fetch])

  return { applications, loading, error, refetch: fetch, moveApplication }
}

export function useAnalytics(days = 30) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getAnalyticsOverview({ days })
      setData(res.data)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}
