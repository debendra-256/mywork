const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'm.instagram.com'])
const MEDIA_HOSTS = ['.fbcdn.net', '.cdninstagram.com']
const REQUEST_TIMEOUT_MS = 15000
const CRAWLER_USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

function isInstagramMediaUrl(value) {
  let url
  try { url = new URL(String(value ?? '')) } catch { return false }
  if (url.protocol !== 'https:') return false
  return MEDIA_HOSTS.some((host) => url.hostname.endsWith(host))
}

/** Streams an Instagram CDN image through our origin so browsers are not blocked by its CORP header. */
async function proxyThumbnail(target, response) {
  if (!isInstagramMediaUrl(target)) {
    response.status(400).json({ error: 'Unsupported thumbnail URL.' })
    return
  }
  const upstream = await fetch(String(target), {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!upstream.ok || !(upstream.headers.get('content-type') ?? '').startsWith('image/')) {
    response.status(502).json({ error: 'Could not load the thumbnail.' })
    return
  }
  const buffer = Buffer.from(await upstream.arrayBuffer())
  response.setHeader?.('Content-Type', upstream.headers.get('content-type'))
  response.setHeader?.('Cache-Control', 'private, max-age=3600')
  response.status(200)
  response.send ? response.send(buffer) : response.end(buffer)
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`Instagram responded with HTTP ${response.status}`)
  return await response.json()
}

async function fetchText(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`Instagram responded with HTTP ${response.status}`)
  return await response.text()
}

export function parseInstagramUrl(value) {
  let url
  try { url = new URL(String(value ?? '').trim()) } catch { return null }
  if (!INSTAGRAM_HOSTS.has(url.hostname)) return null
  const match = url.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,20})\/?/)
  if (!match) return null
  const kind = match[1] === 'reels' ? 'reel' : match[1]
  return { shortcode: match[2], kind, permalink: `https://www.instagram.com/${kind}/${match[2]}/` }
}

function unescapeEmbedUrl(raw) {
  return raw
    .replace(/\\+/g, '\\')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
}

/**
 * Instagram's anonymous GraphQL/embed access is login-walled, but the embed page
 * is still server-rendered for crawler user agents and carries the signed media
 * URL (mp4 for reels/videos, jpg for photos) as a double-escaped JSON string.
 */
export async function scrapeEmbedMedia(kind, shortcode) {
  const html = await fetchText(`https://www.instagram.com/${kind}/${shortcode}/embed/`, {
    headers: { 'User-Agent': CRAWLER_USER_AGENT },
  })
  const takeUrl = (needle) => {
    const at = html.indexOf(needle)
    if (at === -1) return null
    const start = html.lastIndexOf('https:', at)
    const end = html.indexOf('"', at)
    if (start === -1 || end === -1) return null
    let raw = html.slice(start, end)
    if (raw.endsWith('\\')) raw = raw.slice(0, -1)
    return unescapeEmbedUrl(raw)
  }
  const videoUrl = takeUrl('.mp4')
  if (videoUrl) return { mediaType: 'VIDEO', mediaUrl: videoUrl }
  const imageUrl = takeUrl('.jpg')
  if (imageUrl) return { mediaType: 'IMAGE', mediaUrl: imageUrl }
  return null
}

async function fetchOembed(permalink) {
  return await fetchJson(`https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(permalink)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImgMojo/1.0)' },
  })
}

async function fetchMediaDetails(mediaId, env) {
  const base = String(env.SOCIAL_INSTAGRAM_API_URL).replace(/\/+$/, '')
  const url = new URL(`${base}/${encodeURIComponent(mediaId)}`)
  url.searchParams.set('fields', 'media_type,media_url,thumbnail_url,username,permalink')
  url.searchParams.set('access_token', env.SOCIAL_INSTAGRAM_ACCESS_TOKEN)
  return await fetchJson(url)
}

export async function resolveInstagramPost(postUrl, env = process.env) {
  const parsed = parseInstagramUrl(postUrl)
  if (!parsed) throw new Error('Paste a link to a public Instagram reel, video, or photo.')
  const [oembed, scraped] = await Promise.all([
    fetchOembed(parsed.permalink).catch(() => null),
    scrapeEmbedMedia(parsed.kind, parsed.shortcode).catch(() => null),
  ])
  if (!oembed && !scraped) throw new Error('Instagram did not respond for this link. The post may be private or removed.')

  let media = scraped
  let mediaError = ''
  if (!media) {
    const mediaId = String(oembed?.media_id ?? '')
    const configured = Boolean(env.SOCIAL_INSTAGRAM_ACCESS_TOKEN && env.SOCIAL_INSTAGRAM_API_URL)
    if (configured && mediaId) {
      try { media = await fetchMediaDetails(mediaId, env) }
      catch (error) { mediaError = error instanceof Error ? error.message : 'Could not load the media file.' }
    }
  }
  return {
    configured: true,
    shortcode: parsed.shortcode,
    kind: parsed.kind,
    permalink: parsed.permalink,
    title: String(oembed?.title ?? ''),
    authorName: String(oembed?.author_name ?? ''),
    authorUrl: String(oembed?.author_url ?? ''),
    mediaId: String(oembed?.media_id ?? ''),
    mediaType: media?.mediaType ?? media?.media_type ?? null,
    mediaUrl: media?.mediaUrl ?? media?.media_url ?? null,
    thumbnailUrl: media?.thumbnailUrl ?? media?.thumbnail_url ?? oembed?.thumbnail_url ?? null,
    mediaError,
  }
}

export default async function handler(request, response, env = process.env) {
  try {
    if (request.query?.thumb) {
      await proxyThumbnail(request.query.u, response)
      return
    }
    const url = request.method === 'GET' ? request.query?.url : request.body?.url
    const result = await resolveInstagramPost(url, env)
    response.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not resolve this Instagram link.'
    const status = /Paste a link/.test(message) ? 400 : 502
    response.status(status).json({ error: message })
  }
}
