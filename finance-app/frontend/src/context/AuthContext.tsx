import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  apiGetMe,
  apiLogin,
  apiLogout,
  apiRefresh,
  apiRegister,
  type LoginPayload,
  type RegisterPayload,
  type UserData,
} from '@/api/auth'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user:            UserData | null
  isAuthenticated: boolean
  /** True during the initial session-restoration attempt on app mount. */
  isLoading:       boolean
}

interface AuthContextValue extends AuthState {
  login:    (payload: LoginPayload)    => Promise<void>
  register: (payload: RegisterPayload) => Promise<UserData>
  logout:   () => Promise<void>
  /** Update in-place after profile edits (no re-fetch needed). */
  setUser:  (user: UserData)           => void
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:            null,
    isAuthenticated: false,
    isLoading:       true,   // Optimistically assume we might have a session
  })

  const didMount = useRef(false)

  // ── Restore session from httpOnly refresh-token cookie on app mount ──────
  useEffect(() => {
    if (didMount.current) return
    didMount.current = true

    let cancelled = false

    async function restoreSession() {
      try {
        await apiRefresh()        // gets a new access token via cookie
        const user = await apiGetMe()
        if (!cancelled) setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        // No valid cookie / token — not an error, user just isn't logged in
        if (!cancelled) setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }

    restoreSession()

    // Forceful logout signal from Axios interceptor (refresh failed mid-session)
    const handleForcedLogout = () => {
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
    window.addEventListener('auth:logout', handleForcedLogout)

    return () => {
      cancelled = true
      window.removeEventListener('auth:logout', handleForcedLogout)
    }
  }, [])

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiLogin(payload)
    setState({ user: response.user, isAuthenticated: true, isLoading: false })
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    return apiRegister(payload)
  }, [])

  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore network errors during logout */ }
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  const setUser = useCallback((user: UserData) => {
    setState(prev => ({ ...prev, user }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
