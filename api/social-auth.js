import { getStore, newId } from '../server/db/index.js'
import { createRateLimiter, methodNotAllowed } from '../server/http.js'
import { customerState, startCustomerSession } from '../server/accounts.js'
import { socialConfigured, verifyFacebookCredential, verifyGoogleCredential } from '../server/social.js'

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 12 })
const verifiers = { google: verifyGoogleCredential, facebook: verifyFacebookCredential }

function providerUnreachable(message) {
  return /fetch failed|network|timed? ?out|abort|ECONN|ENOTFOUND|socket hang/i.test(String(message))
}

async function resolveUser(store, identity) {
  const linked = await store.findSocialUser(identity.provider, identity.providerId)
  if (linked) return linked
  if (identity.emailVerified) {
    const account = await store.findUserByEmail(identity.email)
    if (account) {
      const attached = await store.attachSocialIdentity(account.id, identity.provider, identity.providerId)
      if (!attached) throw new Error('That email is already linked to a different sign-in account. Use the original one.')
      return attached
    }
  }
  return store.insertSocialUser({
    id: newId('usr'),
    provider: identity.provider,
    providerId: identity.providerId,
    email: identity.email,
    emailNormalized: identity.email || `${identity.provider}:${identity.providerId}`,
    displayName: identity.displayName,
  })
}

export default async function handler(request, response, env = process.env) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'GET') {
    return response.status(200).json({ providers: socialConfigured(env) })
  }
  if (request.method !== 'POST') return methodNotAllowed(response, 'GET, POST')

  const provider = String(request.body?.provider ?? '').trim().toLowerCase()
  const verify = verifiers[provider]
  if (!verify) return response.status(400).json({ error: 'Choose Google or Facebook to sign in.' })

  const address = limiter.clientAddress(request)
  if (limiter.blocked(address)) return response.status(429).json({ error: 'Too many attempts. Wait 15 minutes and try again.' })

  let identity
  try {
    identity = await verify(String(request.body?.credential ?? ''), env)
  } catch (error) {
    limiter.record(address)
    const message = error?.message
    return response.status(401).json({ error: providerUnreachable(message) ? `Could not reach ${provider}. Try again in a moment.` : message || 'Social sign-in could not be verified.' })
  }

  const store = getStore(env)
  try {
    const user = await resolveUser(store, identity)
    if (user.status !== 'active') return response.status(403).json({ error: 'This account is disabled. Contact support.' })
    const token = await startCustomerSession(store, request, response, user.id)
    const state = await customerState(store, request, token)
    limiter.clear(address)
    return response.status(200).json({ ok: true, provider, ...state })
  } catch (error) {
    const message = error?.message || 'Could not complete social sign-in.'
    if (/database|DATABASE_URL|unavailable/i.test(message)) return response.status(503).json({ error: message })
    return response.status(400).json({ error: message })
  }
}
