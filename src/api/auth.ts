import { apiFetch, setTokens } from './client'

export interface UserProfile {
  id: string
  full_name: string
  phone_number: string
  is_verified: boolean
  rating: number | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  is_new_user: boolean
}

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

export async function fetchMe(): Promise<UserProfile> {
  return apiFetch('/api/me')
}
