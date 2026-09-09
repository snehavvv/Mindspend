/// <reference types="vite/client" />
/**
 * Axios instance for all Finlytics API calls.
 *
 * Token strategy
 * ──────────────
 * • Access token  → stored in this module's closure (memory only — never localStorage).
 *   Set by setAccessToken() after every successful login / refresh.
 * • Refresh token → httpOnly cookie, set by the backend on login.
 *   The browser sends it automatically via withCredentials:true.
 *
 * Interceptors
 * ────────────
 * • Request  : attaches `Authorization: Bearer <accessToken>` if present.
 * • Response : on 401 (except /auth/login|refresh), auto-calls /auth/refresh,
 *   retries the original request once, queues concurrent 401s so we don't
 *   fire multiple simultaneous refresh calls.
 */
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'

// ── In-memory access token ────────────────────────────────────────────────────
let _accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// ── Axios instance ────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  withCredentials: true,          // send the httpOnly refresh cookie on every request
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────────────────────
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

// ── Response interceptor (silent token refresh) ───────────────────────────────
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void }

let _isRefreshing = false
let _queue: QueueEntry[] = []

function flushQueue(error: unknown, token: string | null) {
  _queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  _queue = []
}

client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status   = error.response?.status

    const isAuthRoute =
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login')

    if (status === 401 && !original._retry && !isAuthRoute) {
      // ── If another refresh is in-flight, queue this request ──────────────
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _queue.push({
            resolve: (token) => {
              original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
              resolve(client(original))
            },
            reject,
          })
        })
      }

      original._retry = true
      _isRefreshing   = true

      try {
        const { data } = await client.post<{ access_token: string }>('/auth/refresh')
        _accessToken   = data.access_token
        flushQueue(null, _accessToken)
        original.headers = { ...original.headers, Authorization: `Bearer ${_accessToken}` }
        return client(original)
      } catch (refreshErr) {
        flushQueue(refreshErr, null)
        _accessToken = null
        // Signal AuthContext to clear user state
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshErr)
      } finally {
        _isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default client
