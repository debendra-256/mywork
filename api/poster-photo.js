/** Only Google's image hosts are reachable here, so the endpoint cannot be pointed at arbitrary internal URLs. */
const ALLOWED_HOSTS = new Set(['blogger.googleusercontent.com', 'www.googleusercontent.com', 'lh3.googleusercontent.com', 'photos.google.com', 'drive.google.com'])

const MAX_BYTES = 25 * 1024 * 1024

function allowedPhoto(raw) {
  if (!raw) return null
  let url
  try { url = new URL(raw) } catch { return null }
  if (url.protocol !== 'https:') return null
  if (url.hostname !== 'googleusercontent.com' && !ALLOWED_HOSTS.has(url.hostname)) return null
  return url.toString()
}

export async function handlePosterPhoto(request, response) {
  if (request.method && request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.end()
    return
  }
  const photo = allowedPhoto(new URL(request.url, 'http://127.0.0.1').searchParams.get('photo'))
  if (!photo) {
    response.statusCode = 400
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Only a Google image URL can be opened in the poster editor.' }))
    return
  }
  try {
    const upstream = await fetch(photo, { redirect: 'follow', signal: AbortSignal.timeout(20000) })
    if (!upstream.ok || !upstream.body) {
      response.statusCode = 502
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: `The photo host returned ${upstream.status}.` }))
      return
    }
    const length = Number(upstream.headers.get('content-length') ?? 0)
    if (length > MAX_BYTES) {
      response.statusCode = 413
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'That photo is larger than 25 MB.' }))
      return
    }
    const body = Buffer.from(await upstream.arrayBuffer())
    if (body.byteLength > MAX_BYTES) {
      response.statusCode = 413
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'That photo is larger than 25 MB.' }))
      return
    }
    response.statusCode = 200
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Cache-Control', 'public, max-age=3600')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.end(body)
  } catch {
    response.statusCode = 502
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'The photo could not be downloaded.' }))
  }
}

export default handlePosterPhoto
