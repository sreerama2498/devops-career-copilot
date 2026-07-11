import axios from "axios"

const api = axios.create({ baseURL: "/api/v1", headers: { "Content-Type": "application/json" } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getDashboardStats    = () => api.get("/dashboard/stats?profile_id=c828ce5d-68dd-416a-afd3-f4d427f6911e")
export const getAnalyticsOverview = (params = {}) => api.get("/analytics/overview", { params: { profile_id: "c828ce5d-68dd-416a-afd3-f4d427f6911e", days: 30, ...params } })
export const getJobs              = (params = {}) => api.get("/jobs/", { params: { profile_id: "c828ce5d-68dd-416a-afd3-f4d427f6911e", ...params } })
export const getJob               = (id) => api.get(`/jobs/${id}`)
export const getApplications      = (params = {}) => api.get("/applications/", { params })
export const createApplication    = (data) => api.post("/applications/", data)
export const updateApplication    = (id, data) => api.patch(`/applications/${id}`, data)
export const deleteApplication    = (id) => api.delete(`/applications/${id}`)
export const getProfile           = () => api.get("/profile/")
export const createProfile        = (data) => api.post("/profile/", data)
export const updateProfile        = (data) => api.patch("/profile/", data)
export const login                = (data) => api.post("/auth/login", data)
export const register             = (data) => api.post("/auth/register", data)

export default api
