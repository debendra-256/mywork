import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const cookieName = 'imgmojo_admin'
const sessionLifetimeSeconds = 60 * 60 * 24 * 7
const failedAttempts = new Map()

const DEFAULT_USER_ID = 'Imgmojo'
const DEFAULT_PASSWORD = 'Imgmojo@123'
const DEFAULT_SECRET = 'imgmojo_session_secret_key_32bytes_super_secure'

function getAdminConfig(env = process.env) {
  return {
    userId: env.ADMIN_USER_ID?.trim() || DEFAULT_USER_ID,
    password: env.ADMIN_PASSWORD || DEFAULT_PASSWORD,
    secret: env.ADMIN_SESSION_SECRET || DEFAULT_SECRET,
  }
}

function configured() {
  return true
}

function digest(value) {
  return createHash('sha256').update(value).digest()
}

function equalSecret(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
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
  const { secret } = getAdminConfig(env)
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function isValidAdminSession(request, env = process.env) {
  const { userId } = getAdminConfig(env)
  const [payload, signature, extra] = cookieValue(request).split('.')
  if (!payload || !signature || extra) return false
  const expected = sign(payload, env)
  if (!equalSecret(signature, expected)) return false
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return (
      typeof session.userId === 'string' &&
      session.userId.toLowerCase() === userId.toLowerCase() &&
      Number.isInteger(session.expiresAt) &&
      session.expiresAt > Math.floor(Date.now() / 1000)
    )
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
  return recent.length >= 20
}

export default async function handler(request, response, env = process.env) {
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, DELETE')
    return response.status(405).json({ error: 'Method not allowed.' })
  }
  const config = getAdminConfig(env)
  if (request.method === 'GET') {
    const authenticated = isValidAdminSession(request, env)
    return response.status(200).json({
      configured: true,
      authenticated,
      userId: authenticated ? config.userId : undefined,
    })
  }
  if (request.method === 'DELETE') {
    setSessionCookie(request, response, '', 0)
    return response.status(200).json({ authenticated: false })
  }

  const address = clientAddress(request)
  if (tooManyFailures(address)) return response.status(429).json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' })

  const enteredUserId = typeof request.body?.userId === 'string' ? request.body.userId.trim() : ''
  const enteredPassword = typeof request.body?.password === 'string' ? request.body.password : ''

  const userMatches = enteredUserId.toLowerCase() === config.userId.toLowerCase()
  const passwordMatches = equalSecret(enteredPassword, config.password)

  if (!userMatches || !passwordMatches) {
    if (!failedAttempts.has(address)) failedAttempts.set(address, [])
    failedAttempts.get(address).push(Date.now())
    return response.status(401).json({ error: 'User ID or password is incorrect.' })
  }

  failedAttempts.delete(address)
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds
  const payload = Buffer.from(JSON.stringify({ userId: config.userId, expiresAt })).toString('base64url')
  setSessionCookie(request, response, `${payload}.${sign(payload, env)}`, sessionLifetimeSeconds)
  return response.status(200).json({ authenticated: true, userId: config.userId })
}
