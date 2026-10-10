import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { benefitKeys, getStore, newId } from '../server/db/index.js'
import { createRateLimiter, isEmail, methodNotAllowed, parseQuery, tokenHash } from '../server/http.js'
import { customerState, endCustomerSession, readCustomerToken, startCustomerSession } from '../server/accounts.js'

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 12 })

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('base64')
}

function passwordMatches(password, salt, expectedHash) {
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(String(expectedHash), 'base64')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function validateCredentials(body) {
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (!isEmail(email)) throw new Error('Enter a valid email address.')
  const password = typeof body?.password === 'string' ? body.password : ''
  if (password.length < 8 || password.length > 200) throw new Error('Password must be at least 8 characters.')
  return { email, password }
}

async function redeemLicense(store, user, code, env) {
  const normalized = String(code ?? '').trim().toUpperCase()
  if (!normalized) throw new Error('Enter a license code.')
  const license = await store.findLicenseByCode(normalized)
  if (!license) throw new Error('That license code was not found. Check for typos and try again.')
  if (license.status === 'revoked') throw new Error('This license code has been revoked.')
  if (license.status === 'redeemed') {
    if (license.redeemedUserId === user.id) return { license, reused: true }
    throw new Error('This license code has already been used.')
  }
  if (license.expiresAt && new Date(license.expiresAt).getTime() <= Date.now()) throw new Error('This license code has expired.')
  const keys = license.benefitKeys.filter((key) => /^[a-z0-9_]{1,40}$/.test(key))
  if (!keys.length) throw new Error('This license code has no benefits configured. Contact support.')
  for (const benefitKey of keys) {
    await store.insertEntitlement({ id: newId('ent'), userId: user.id, productId: license.productId, benefitKey, licenseId: license.id, expiresAt: license.expiresAt })
  }
  await store.updateLicense(license.id, { status: 'redeemed', redeemedUserId: user.id, redeemedEmail: user.email, note: license.note, buyerEmail: license.buyerEmail, expiresAt: license.expiresAt })
  return { license, reused: false }
}

export default async function handler(request, response, env = process.env) {
  response.setHeader('Cache-Control', 'no-store')
  const store = getStore(env)

  if (request.method === 'GET') {
    try {
      const state = await customerState(store, request)
      const { productId } = parseQuery(request)
      let product = null
      if (productId) product = await store.getProduct(String(productId).toLowerCase())
      return response.status(200).json({ ...state, benefitCatalog: benefitKeys, product })
    } catch (error) {
      return response.status(503).json({ error: error.message || 'Store database is unavailable.' })
    }
  }

  if (request.method === 'DELETE') {
    const token = readCustomerToken(request)
    try {
      if (token) await store.deleteSession(tokenHash(token))
    } catch { /* the cookie below already ends the session for the browser */ }
    endCustomerSession(request, response)
    return response.status(200).json({ ok: true, user: null, entitlements: [], benefits: [] })
  }

  if (request.method !== 'POST') return methodNotAllowed(response, 'GET, POST, DELETE')

  const address = limiter.clientAddress(request)
  if (limiter.blocked(address)) return response.status(429).json({ error: 'Too many attempts. Wait 15 minutes and try again.' })

  const action = typeof request.body?.action === 'string' ? request.body.action : ''
  try {
    if (action === 'signup') {
      const { email, password } = validateCredentials(request.body)
      const displayName = String(request.body?.displayName ?? '').trim().slice(0, 60)
      if (await store.findUserByEmail(email)) {
        limiter.record(address)
        return response.status(409).json({ error: 'An account already exists for that email. Sign in instead.' })
      }
      const salt = randomBytes(16).toString('hex')
      const user = await store.insertUser({ id: newId('usr'), email, emailNormalized: email, passwordHash: hashPassword(password, salt), passwordSalt: salt, displayName })
      const token = await startCustomerSession(store, request, response, user.id)
      const state = await customerState(store, request, token)
      return response.status(201).json({ ok: true, ...state })
    }

    if (action === 'login') {
      const { email, password } = validateCredentials(request.body)
      const user = await store.findUserByEmail(email)
      if (!user || user.status !== 'active' || !passwordMatches(password, user.passwordSalt, user.passwordHash)) {
        limiter.record(address)
        return response.status(401).json({ error: 'Email or password is incorrect.' })
      }
      limiter.clear(address)
      const token = await startCustomerSession(store, request, response, user.id)
      const state = await customerState(store, request, token)
      return response.status(200).json({ ok: true, ...state })
    }

    const current = await customerState(store, request)
    if (!current.user) return response.status(401).json({ error: 'Sign in to your account first.' })

    if (action === 'redeem') {
      const result = await redeemLicense(store, current.user, request.body?.code, env)
      const state = await customerState(store, request)
      return response.status(200).json({ ok: true, reused: result.reused, license: result.license, ...state })
    }

    return response.status(400).json({ error: `Unknown action "${action || 'none'}".` })
  } catch (error) {
    const message = error?.message || 'Could not complete that request.'
    if (/database|DATABASE_URL|unavailable/i.test(message)) return response.status(503).json({ error: message })
    return response.status(400).json({ error: message })
  }
}
