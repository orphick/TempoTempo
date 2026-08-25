import axios from 'axios'

const LOCAL_API_BASE_URL = 'http://localhost:8000/api'
const PRODUCTION_API_BASE_URL = 'https://tempotempo-api.onrender.com/api'

const isLocalBrowser =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname)

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalBrowser ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let accessToken = null
let refreshPromise = null

export const setAccessToken = (token) => { accessToken = token }
export const clearAccessToken = () => { accessToken = null }

async function csrf() {
  const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, { withCredentials: true })
  return response.data.csrfToken
}

api.interceptors.request.use(async (config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRFToken'] = await csrf()
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/token/refresh/')) {
      original._retry = true
      try {
        refreshPromise ||= axios.post(`${API_BASE_URL}/auth/token/refresh/`, {}, { withCredentials: true, headers: { 'X-CSRFToken': await csrf() } })
        const res = await refreshPromise
        setAccessToken(res.data.access)
        if (original.headers) {
          original.headers.Authorization = `Bearer ${res.data.access}`
        }
        return api(original)
      } catch {
        clearAccessToken()
      } finally {
        refreshPromise = null
      }
    }
    return Promise.reject(error)
  }
)

export default api
