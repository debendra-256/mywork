import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const cookieName = 'promptseen_admin'
const sessionLifetimeSeconds = 60 * 60 * 24 * 7
const failedAttempts = new Map()

function configured(env) {
  return Boolean(env.ADMIN_USER_ID?.trim() && env.ADMIN_PASSWORD && env.ADMIN_SESSION_SECRET)
}

function digest(value) {
  return createHash('sha256').update(value).digest()
}

function equalSecret(left, right) {
  return timingSafeEqual(digest(left), digest(right))
}

function clientAddress(request) {
  const forwarded = request.headers['x-forwarded-for']
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || 'unknown').split(',')[0].trim()
}

function cookieValue(request) {
  const cookies = String(request.headers.cookie ?? '').split(';')
  const entry = cookies.map((item) => item.trim()).find((item) => item.startsWith(`${cookieName}=`))
  return entry?.slice(cookieName.length + 1) || ''
}

function sign(payload, env) {
  return createHmac('sha256', env.ADMIN_SESSION_SECRET).update(payload).digest('base64url')
}

export function isValidAdminSession(request, env = process.env) {
  if (!configured(env)) return false
  const [payload, signature, extra] = cookieValue(request).split('.')
  if (!payload || !signature || extra) return false
  const expected = sign(payload, env)
  if (!equalSecret(signature, expected)) return false
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return session.userId === env.ADMIN_USER_ID.trim() && Number.isInteger(session.expiresAt) && session.expiresAt > Math.floor(Date.now() / 1000)
  } catch { return false }
}

function setSessionCookie(request, response, value, maxAge) {
  const forwardedProto = String(request.headers['x-forwarded-proto'] ?? '').split(',')[0].trim()
  const secure = forwardedProto === 'https' || process.env.NODE_ENV === 'production'
  response.setHeader('Set-Cookie', `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`)
}

function tooManyFailures(address) {
  const now = Date.now()
  const recent = (failedAttempts.get(address) ?? []).filter((timestamp) => now - timestamp < 15 * 60 * 1000)
  failedAttempts.set(address, recent)
  return recent.length >= 10
}

export default async function handler(request, response, env = process.env) {
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, DELETE')
    return response.status(405).json({ error: 'Method not allowed.' })
  }
  if (request.method === 'GET') return response.status(200).json({ configured: configured(env), authenticated: isValidAdminSession(request, env), userId: isValidAdminSession(request, env) ? env.ADMIN_USER_ID.trim() : undefined })
  if (request.method === 'DELETE') {
    setSessionCookie(request, response, '', 0)
    return response.status(200).json({ authenticated: false })
  }
  if (!configured(env)) return response.status(503).json({ error: 'Password sign-in is not configured. Set ADMIN_USER_ID, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET on the server.' })
  const address = clientAddress(request)
  if (tooManyFailures(address)) return response.status(429).json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' })
  const userId = typeof request.body?.userId === 'string' ? request.body.userId.trim() : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!equalSecret(userId, env.ADMIN_USER_ID.trim()) || !equalSecret(password, env.ADMIN_PASSWORD)) {
    failedAttempts.get(address).push(Date.now())
    return response.status(401).json({ error: 'User ID or password is incorrect.' })
  }
  failedAttempts.delete(address)
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds
  const payload = Buffer.from(JSON.stringify({ userId: env.ADMIN_USER_ID.trim(), expiresAt })).toString('base64url')
  setSessionCookie(request, response, `${payload}.${sign(payload, env)}`, sessionLifetimeSeconds)
  return response.status(200).json({ authenticated: true, userId: env.ADMIN_USER_ID.trim() })
}
