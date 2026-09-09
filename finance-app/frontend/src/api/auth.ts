/**
 * Auth service layer — typed wrappers around the /api/auth/* endpoints.
 * All side-effects on the access token are handled here so routes never
 * need to touch the Axios client directly.
 */
import client, { setAccessToken } from './client'

// ── Shared types ─────────────────────────────────────────────────────────────
export interface UserData {
  id:         string
  email:      string
  username:   string
  created_at: string
  is_active:  boolean
}

export interface RegisterPayload {
  email:    string
  username: string
  password: string
}

export interface LoginPayload {
  email:    string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type:   string
  user:         UserData
}

export interface RefreshResponse {
  access_token: string
  token_type:   string
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Register a new account. Returns the created UserData (no token). */
export async function apiRegister(payload: RegisterPayload): Promise<UserData> {
  const { data } = await client.post<UserData>('/auth/register', payload)
  return data
}

/**
 * Sign in. Stores the access token in memory and relies on the backend
 * setting the httpOnly refresh cookie via Set-Cookie.
 */
export async function apiLogin(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/auth/login', payload)
  setAccessToken(data.access_token)
  return data
}

/**
 * Exchange the httpOnly refresh cookie for a new access token.
 * Called automatically by the Axios interceptor on 401 and explicitly
 * by AuthContext on mount to restore sessions.
 */
export async function apiRefresh(): Promise<string> {
  const { data } = await client.post<RefreshResponse>('/auth/refresh')
  setAccessToken(data.access_token)
  return data.access_token
}

/** Clear the refresh cookie server-side and wipe the in-memory token. */
export async function apiLogout(): Promise<void> {
  await client.post('/auth/logout')
  setAccessToken(null)
}

/** Fetch the currently authenticated user (requires valid access token). */
export async function apiGetMe(): Promise<UserData> {
  const { data } = await client.get<UserData>('/auth/me')
  return data
}
