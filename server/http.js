import { createHash } from 'node:crypto'

export function parseQuery(request) {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost'
    return Object.fromEntries(new URL(String(request.url ?? '/'), base).searchParams)
  } catch {
    return {}
  }
}

export function cookieValue(request, name) {
  const entries = String(request.headers?.cookie ?? '').split(';')
  const entry = entries.map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : ''
}

export function setSessionCookie(request, response, name, value, maxAge) {
  const forwardedProto = String(request.headers?.['x-forwarded-proto'] ?? '').split(',')[0].trim()
  const secure = forwardedProto === 'https' || process.env.NODE_ENV === 'production'
  const cookie = `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
  if (typeof response.appendHeader === 'function' && typeof response.getHeader === 'function') {
    const existing = response.getHeader('Set-Cookie')
    if (existing) response.appendHeader('Set-Cookie', cookie)
    else response.setHeader('Set-Cookie', cookie)
  } else {
    response.setHeader('Set-Cookie', cookie)
  }
}

export function tokenHash(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

export function isEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(email)
}

/** Throttle repeated failures per client address, in process memory only. */
export function createRateLimiter({ windowMs, max }) {
  const attempts = new Map()
  return {
    clientAddress(request) {
      const forwarded = request.headers?.['x-forwarded-for']
      return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || 'unknown').split(',')[0].trim()
    },
    blocked(address) {
      const now = Date.now()
      const recent = (attempts.get(address) ?? []).filter((timestamp) => now - timestamp < windowMs)
      attempts.set(address, recent)
      return recent.length >= max
    },
    record(address) {
      const now = Date.now()
      const recent = (attempts.get(address) ?? []).filter((timestamp) => now - timestamp < windowMs)
      recent.push(now)
      attempts.set(address, recent)
    },
    clear(address) {
      attempts.delete(address)
    },
  }
}

export function methodNotAllowed(response, allow) {
  response.setHeader('Allow', allow)
  return response.status(405).json({ error: 'Method not allowed.' })
}

export function unavailable(response, error) {
  return response.status(503).json({ error: error?.message || 'Store database is unavailable.' })
}
