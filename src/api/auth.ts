import { apiFetch, setTokens } from './client'

export interface UserProfile {
  id: string
  full_name: string
  phone_number: string
  email: string | null
  verification_status: string
  is_verified: boolean
  is_blocked: boolean
  rating: number | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  is_new_user: boolean
  verification_status: string
}

export async function signup(
  phoneNumber: string,
  fullName: string,
  acceptTerms: boolean,
): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber,
      full_name: fullName,
      accept_terms: acceptTerms,
    }),
  })
  setTokens(data.access_token, data.refresh_token)
  return data
}

export async function login(phoneNumber: string, acceptTerms = true): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber,
      accept_terms: acceptTerms,
    }),
  })
  setTokens(data.access_token, data.refresh_token)
  return data
}

export async function fetchMe(): Promise<UserProfile> {
  return apiFetch('/api/me')
}

export async function updateProfile(body: {
  full_name?: string
  email?: string
}): Promise<UserProfile> {
  return apiFetch('/api/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// OTP endpoints kept for when OTP_ENABLED=true
export async function requestOtp(phoneNumber: string): Promise<{ message: string }> {
  return apiFetch('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
  })
}

export async function verifyOtp(
  phoneNumber: string,
  otp: string,
  fullName?: string,
): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber,
      otp,
      full_name: fullName ?? null,
    }),
  })
  setTokens(data.access_token, data.refresh_token)
  return data
}
