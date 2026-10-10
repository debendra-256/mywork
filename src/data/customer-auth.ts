import { useSyncExternalStore } from 'react'
import { emptyCustomerSession, type CustomerSession } from '../domain/store'

const listeners = new Set<() => void>()
let current: CustomerSession = emptyCustomerSession

function apply(payload: Partial<CustomerSession> | undefined) {
  current = {
    user: payload?.user ?? null,
    entitlements: payload?.entitlements ?? [],
    benefits: payload?.benefits ?? [],
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function read() {
  return current
}

async function send(method: 'POST' | 'DELETE', body?: Record<string, unknown>, endpoint = '/api/account'): Promise<CustomerSession> {
  const response = await fetch(endpoint, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json().catch(() => ({})) as Partial<CustomerSession> & { error?: string }
  if (!response.ok) throw new Error(result.error || `Account request failed (${response.status}).`)
  apply(result)
  return current
}

export function useCustomer(): CustomerSession {
  return useSyncExternalStore(subscribe, read, read)
}

export async function loadCustomerSession(): Promise<CustomerSession> {
  try {
    const response = await fetch('/api/account')
    if (!response.ok) throw new Error(String(response.status))
    apply(await response.json() as Partial<CustomerSession>)
  } catch {
    apply(undefined)
  }
  return current
}

export function signUp(email: string, password: string, displayName: string) {
  return send('POST', { action: 'signup', email, password, displayName })
}

export function signIn(email: string, password: string) {
  return send('POST', { action: 'login', email, password })
}

export function signInWithProvider(provider: 'google' | 'facebook', credential: string) {
  return send('POST', { provider, credential }, '/api/social-auth')
}

export async function signOut(): Promise<CustomerSession> {
  try { await send('DELETE') } catch { apply(undefined) }
  return current
}

export function redeemLicenseCode(code: string) {
  return send('POST', { action: 'redeem', code })
}
