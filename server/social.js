import { createHmac, createPublicKey, verify } from 'node:crypto'

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com'])
const GOOGLE_KEY_REFRESH_MS = 6 * 60 * 60 * 1000
const GRAPH_API = 'https://graph.facebook.com/v21.0'

let googleKeys = { at: 0, list: [] }

function googleClientId(env) {
  return String(env.VITE_GOOGLE_CLIENT_ID || env.VITE_BLOGGER_CLIENT_ID || '').trim()
}

function facebookAppId(env) {
  return String(env.VITE_FACEBOOK_APP_ID || '').trim()
}

export function socialConfigured(env = process.env) {
  return {
    google: Boolean(googleClientId(env)),
    facebook: Boolean(facebookAppId(env) && String(env.FACEBOOK_APP_SECRET || '').trim()),
  }
}

async function remoteJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error?.message || payload?.error_description || `Provider request failed (${response.status}).`
    throw new Error(message)
  }
  return payload
}

async function googleSigningKeys() {
  if (googleKeys.list.length && Date.now() - googleKeys.at < GOOGLE_KEY_REFRESH_MS) return googleKeys.list
  const { keys } = await remoteJson(GOOGLE_JWKS_URL)
  const list = (Array.isArray(keys) ? keys : [])
    .filter((key) => key.kid && key.n && key.e)
    .map((key) => ({ kid: String(key.kid), object: createPublicKey({ key, format: 'jwk' }) }))
  if (!list.length) throw new Error('Google did not return usable signing keys.')
  googleKeys = { at: Date.now(), list }
  return list
}

function decodeJwtSegment(segment) {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
  } catch {
    throw new Error('Google did not return a valid sign-in credential.')
  }
}

function displayNameFrom(identity, fallback) {
  const name = String(identity.name || identity.given_name || '').trim()
  if (name) return name.slice(0, 60)
  const email = String(identity.email || '').trim()
  return (email ? email.split('@')[0] : fallback).slice(0, 60)
}

export async function verifyGoogleCredential(credential, env = process.env) {
  const clientId = googleClientId(env)
  if (!clientId) throw new Error('Google sign-in is not configured on this server.')
  const segments = String(credential ?? '').split('.')
  if (segments.length !== 3) throw new Error('Google did not return a valid sign-in credential.')
  const [header, payload, signature] = segments
  const decodedHeader = decodeJwtSegment(header)
  if (decodedHeader.alg !== 'RS256') throw new Error('Google credential is not signed with RS256.')
  const decoded = decodeJwtSegment(payload)
  const key = (await googleSigningKeys()).find((item) => item.kid === decodedHeader.kid)
  if (!key) throw new Error('Google credential was signed with an unknown key.')
  const valid = verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), key.object, Buffer.from(signature, 'base64url'))
  if (!valid) throw new Error('Google credential signature could not be verified.')
  if (!GOOGLE_ISSUERS.has(decoded.iss)) throw new Error('Google credential has an unexpected issuer.')
  if (decoded.aud !== clientId) throw new Error('Google credential was issued for a different client.')
  if (!Number.isInteger(decoded.exp) || decoded.exp * 1000 <= Date.now()) throw new Error('Google credential has expired. Sign in again.')
  if (!decoded.sub) throw new Error('Google credential has no account identifier.')
  const email = String(decoded.email ?? '').trim().toLowerCase()
  return {
    provider: 'google',
    providerId: String(decoded.sub),
    email,
    // Google marks this verified, so the email can safely link to an existing account.
    emailVerified: decoded.email_verified === true && Boolean(email),
    displayName: displayNameFrom(decoded, 'Google member'),
  }
}

export async function verifyFacebookCredential(accessToken, env = process.env) {
  const appId = facebookAppId(env)
  const appSecret = String(env.FACEBOOK_APP_SECRET ?? '').trim()
  if (!appId || !appSecret) throw new Error('Facebook sign-in is not configured on this server.')
  const token = String(accessToken ?? '').trim()
  if (!token) throw new Error('Facebook did not return a valid access token.')
  const debug = await remoteJson(`${GRAPH_API}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`)
  if (!debug?.data?.is_valid) throw new Error('That Facebook session is no longer valid. Sign in again.')
  if (String(debug.data.app_id ?? '') !== appId) throw new Error('That Facebook token was issued for a different app.')
  const proof = createHmac('sha256', appSecret).update(token).digest('hex')
  const profile = await remoteJson(`${GRAPH_API}/me?fields=id,name,email&access_token=${encodeURIComponent(token)}&appsecret_proof=${proof}`)
  if (!profile?.id) throw new Error('Facebook did not return an account identifier.')
  const email = String(profile.email ?? '').trim().toLowerCase()
  return {
    provider: 'facebook',
    providerId: String(profile.id),
    email,
    // Facebook exposes no verified flag, so an email is never used to claim an existing account.
    emailVerified: false,
    displayName: displayNameFrom(profile, 'Facebook member'),
  }
}
