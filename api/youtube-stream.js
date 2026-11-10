import { Readable } from 'node:stream'

const ID_RE = /^[A-Za-z0-9_-]{11}$/
const VISIONOS_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const VR_UA = 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'
const IOS_UA = 'com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)'

const urlCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000

let cachedVisitorData = ''
let visitorDataTs = 0

async function getVisitorData(videoId) {
  if (cachedVisitorData && Date.now() - visitorDataTs < CACHE_TTL_MS) {
    return cachedVisitorData
  }
  try {
    const res = await fetch(`https://www.youtube.com/embed/${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const match = html.match(/"VISITOR_DATA":"([^"]+)"/)
    if (match?.[1]) {
      cachedVisitorData = match[1]
      visitorDataTs = Date.now()
      return cachedVisitorData
    }
  } catch {
    // ignore
  }
  return cachedVisitorData || ''
}

function pickBestStreams(streamingData, ua) {
  const formats = Array.isArray(streamingData?.formats) ? streamingData.formats : []
  const adaptive = Array.isArray(streamingData?.adaptiveFormats) ? streamingData.adaptiveFormats : []

  const muxed = formats
    .filter((f) => f && f.url && /^video\/(mp4|webm)/i.test(String(f.mimeType || '')))
    .sort((a, b) => (Number(b.height) || 0) - (Number(a.height) || 0))

  const adaptiveVideo = adaptive
    .filter((f) => f && f.url && /^video\/(mp4|webm)/i.test(String(f.mimeType || '')))
    .sort((a, b) => {
      const aAvc = /avc1/i.test(String(a.mimeType || '')) ? 1 : 0
      const bAvc = /avc1/i.test(String(b.mimeType || '')) ? 1 : 0
      if (aAvc !== bAvc) return bAvc - aAvc
      const aH = Number(a.height) || 0
      const bH = Number(b.height) || 0
      const aCap = aH <= 1080 ? aH + 1000 : aH
      const bCap = bH <= 1080 ? bH + 1000 : bH
      return bCap - aCap
    })

  const adaptiveAudio = adaptive
    .filter((f) => f && f.url && /^audio\/(mp4|webm)/i.test(String(f.mimeType || '')))
    .sort((a, b) => {
      const aMp4 = /^audio\/mp4/i.test(String(a.mimeType || '')) ? 1 : 0
      const bMp4 = /^audio\/mp4/i.test(String(b.mimeType || '')) ? 1 : 0
      if (aMp4 !== bMp4) return bMp4 - aMp4
      return (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0)
    })

  const chosenVideo = adaptiveVideo[0] || muxed[0] || null
  const chosenAudio = adaptiveAudio[0] || muxed[0] || null

  if (!chosenVideo) return null

  return {
    video: {
      url: chosenVideo.url,
      mimeType: String(chosenVideo.mimeType || 'video/mp4').split(';')[0],
    },
    audio: chosenAudio
      ? {
          url: chosenAudio.url,
          mimeType: String(chosenAudio.mimeType || 'audio/mp4').split(';')[0],
        }
      : null,
    ua,
    ts: Date.now(),
  }
}

async function resolveStreamInfo(videoId) {
  const cached = urlCache.get(videoId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached
  }

  const visitorData = await getVisitorData(videoId)

  const clients = [
    {
      ua: VISIONOS_UA,
      extraHeaders: {
        Origin: 'https://www.youtube.com',
        ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}),
      },
      context: {
        client: {
          clientName: 'VISIONOS',
          clientVersion: '0.1',
          deviceMake: 'Apple',
          deviceModel: 'RealityDevice14,1',
          osName: 'visionOS',
          osVersion: '1.0.21N307',
          hl: 'en',
          gl: 'US',
          ...(visitorData ? { visitorData } : {}),
        },
      },
    },
    {
      ua: VR_UA,
      extraHeaders: {
        ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}),
      },
      context: {
        client: {
          clientName: 'ANDROID_VR',
          clientVersion: '1.60.19',
          deviceMake: 'Oculus',
          deviceModel: 'Quest 3',
          androidSdkVersion: 32,
          osName: 'Android',
          osVersion: '12L',
          hl: 'en',
          gl: 'US',
          ...(visitorData ? { visitorData } : {}),
        },
      },
    },
    {
      ua: IOS_UA,
      extraHeaders: {
        'X-YouTube-Client-Name': '5',
        'X-YouTube-Client-Version': '20.03.02',
        ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}),
      },
      context: {
        client: {
          clientName: 'IOS',
          clientVersion: '20.03.02',
          deviceMake: 'Apple',
          deviceModel: 'iPhone16,2',
          osName: 'iPhone',
          osVersion: '18.2.1.22C161',
          hl: 'en',
          gl: 'US',
          ...(visitorData ? { visitorData } : {}),
        },
      },
    },
  ]

  for (const c of clients) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': c.ua,
          ...c.extraHeaders,
        },
        body: JSON.stringify({
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
          context: c.context,
        }),
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const info = pickBestStreams(data?.streamingData, c.ua)
      if (info) {
        urlCache.set(videoId, info)
        return info
      }
    } catch {
      // try next client
    }
  }
  return null
}

export async function handleYouTubeStream(request, response) {
  if (request.method && request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.end()
    return
  }

  const parsed = new URL(request.url || '', 'http://127.0.0.1')
  const videoId = String(parsed.searchParams.get('id') || '').trim()
  const kind = parsed.searchParams.get('kind') === 'audio' ? 'audio' : 'video'

  if (!ID_RE.test(videoId)) {
    response.statusCode = 400
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Invalid YouTube video ID.' }))
    return
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), 120000)
  request.on?.('close', () => {
    clearTimeout(timeoutId)
    abortController.abort()
  })

  try {
    const info = await resolveStreamInfo(videoId)
    const target = kind === 'audio' ? (info?.audio || info?.video) : info?.video
    if (!info || !target || !target.url) {
      clearTimeout(timeoutId)
      response.statusCode = 404
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'Could not resolve direct video stream for this YouTube ID.' }))
      return
    }

    const headers = { 'User-Agent': info.ua }
    const range = request.headers?.range || request.headers?.Range
    if (range) headers.Range = range

    const upstream = await fetch(target.url, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
      redirect: 'follow',
      signal: abortController.signal,
    })

    if (!upstream.ok && upstream.status !== 206) {
      clearTimeout(timeoutId)
      urlCache.delete(videoId)
      response.statusCode = 502
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: `Upstream returned ${upstream.status}.` }))
      return
    }

    response.statusCode = upstream.status
    response.setHeader('Content-Type', upstream.headers.get('content-type') || target.mimeType || 'video/mp4')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes')
    const contentLength = upstream.headers.get('content-length')
    if (contentLength) response.setHeader('Content-Length', contentLength)
    const contentRange = upstream.headers.get('content-range')
    if (contentRange) response.setHeader('Content-Range', contentRange)
    response.setHeader('Cache-Control', 'private, max-age=600')

    if (request.method === 'HEAD' || !upstream.body) {
      clearTimeout(timeoutId)
      response.end()
      return
    }

    const nodeStream = Readable.fromWeb(upstream.body)
    nodeStream.on('error', () => {
      clearTimeout(timeoutId)
      try { response.end() } catch { /* ignore */ }
    })
    nodeStream.on('end', () => {
      clearTimeout(timeoutId)
    })
    nodeStream.pipe(response)
  } catch {
    clearTimeout(timeoutId)
    if (!response.headersSent) {
      response.statusCode = 502
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'Could not stream video.' }))
    } else {
      try { response.end() } catch { /* ignore */ }
    }
  }
}

export default handleYouTubeStream
