import { randomBytes } from 'node:crypto'
import { newId } from './db/index.js'
import { cookieValue, setSessionCookie, tokenHash } from './http.js'

export const customerCookieName = 'promptseen_customer'
const sessionLifetimeSeconds = 60 * 60 * 24 * 30

export function readCustomerToken(request) {
  return cookieValue(request, customerCookieName)
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    status: user.status,
    signupSource: user.signupSource ?? 'password',
  }
}

export async function customerState(store, request, tokenOverride = '') {
  const token = tokenOverride || readCustomerToken(request)
  if (!token) return { user: null, entitlements: [], benefits: [] }
  const user = await store.findSessionUser(tokenHash(token))
  if (!user || user.status !== 'active') return { user: null, entitlements: [], benefits: [] }
  const entitlements = await store.listEntitlements(user.id)
  return { user: publicUser(user), entitlements, benefits: entitlements.map((entitlement) => entitlement.benefitKey) }
}

export async function startCustomerSession(store, request, response, userId) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString()
  await store.insertSession({ id: newId('ses'), userId, tokenHash: tokenHash(token), expiresAt })
  setSessionCookie(request, response, customerCookieName, token, sessionLifetimeSeconds)
  return token
}

export function endCustomerSession(request, response) {
  setSessionCookie(request, response, customerCookieName, '', 0)
}
