import { Readable } from 'node:stream'

const ID_RE = /^[A-Za-z0-9_-]{11}$/
const IOS_UA = 'com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)'
const VISIONOS_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const VR_UA = 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'

const urlCache = new Map()
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 mins

function pickBestStreams(streamingData, ua) {
  const formats = Array.isArray(streamingData?.formats) ? streamingData.formats : []
  const adaptive = Array.isArray(streamingData?.adaptiveFormats) ? streamingData.adaptiveFormats : []

  // Prefer H.264/avc1 MP4 streams up to 1080p for broad canvas & hardware decoding support
  const adaptiveVideo = adaptive
    .filter((f) => f && f.url && /^video\/(mp4|webm)/i.test(String(f.mimeType || '')))
    .sort((a, b) => {
      const aAvc = /avc1/i.test(String(a.mimeType || '')) ? 1 : 0
      const bAvc = /avc1/i.test(String(b.mimeType || '')) ? 1 : 0
      if (aAvc !== bAvc) return bAvc - aAvc
      const aH = Number(a.height) || 0
      const bH = Number(b.height) || 0
      const aScore = aH <= 1080 ? aH + 2000 : aH
      const bScore = bH <= 1080 ? bH + 2000 : bH
      return bScore - aScore
    })

  const muxed = formats
    .filter((f) => f && f.url && /^video\/(mp4|webm)/i.test(String(f.mimeType || '')))
    .sort((a, b) => (Number(b.height) || 0) - (Number(a.height) || 0))

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
      contentLength: Number(chosenVideo.contentLength) || 0,
      height: chosenVideo.height,
    },
    audio: chosenAudio
      ? {
          url: chosenAudio.url,
          mimeType: String(chosenAudio.mimeType || 'audio/mp4').split(';')[0],
          contentLength: Number(chosenAudio.contentLength) || 0,
        }
      : null,
    ua,
    ts: Date.now(),
  }
}

async function resolveStreamInfo(videoId) {
  const cached = urlCache.get(videoId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { info: cached, attempts: [{ cached: true }] }
  }

  // IOS is prioritized first because it returns direct, unthrottled, unencrypted adaptive MP4 streams
  // without needing visitor data pre-fetches or poToken
  const clients = [
    {
      name: 'IOS',
      ua: IOS_UA,
      extraHeaders: {
        'X-YouTube-Client-Name': '5',
        'X-YouTube-Client-Version': '20.03.02',
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
        },
      },
    },
    {
      name: 'VISIONOS',
      ua: VISIONOS_UA,
      extraHeaders: {
        Origin: 'https://www.youtube.com',
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
        },
      },
    },
    {
      name: 'ANDROID_VR',
      ua: VR_UA,
      extraHeaders: {},
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
        },
      },
    },
  ]

  const attempts = []
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
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        attempts.push({ client: c.name, httpStatus: res.status, error: 'HTTP not ok' })
        continue
      }
      const data = await res.json()
      const playability = data?.playabilityStatus?.status
      const hasStreaming = !!data?.streamingData
      attempts.push({ client: c.name, httpStatus: res.status, playability, hasStreaming, reason: data?.playabilityStatus?.reason })
      if (playability !== 'OK' && playability !== 'LIVE_STREAM_OFFLINE') {
        continue
      }
      const info = pickBestStreams(data?.streamingData, c.ua)
      if (info && info.video?.url) {
        urlCache.set(videoId, info)
        return { info, attempts }
      }
    } catch (err) {
      attempts.push({ client: c.name, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return { info: null, attempts }
}

export async function handleYouTubeStream(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept')

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }

  if (request.method && request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.end()
    return
  }

  const parsed = new URL(request.url || '', 'http://127.0.0.1')
  const videoId = String(parsed.searchParams.get('id') || '').trim()
  const kind = parsed.searchParams.get('kind')

  if (!ID_RE.test(videoId)) {
    response.statusCode = 400
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Invalid YouTube video ID.' }))
    return
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), 60000)
  request.on?.('close', () => {
    clearTimeout(timeoutId)
    abortController.abort()
  })

  try {
    const { info, attempts } = await resolveStreamInfo(videoId)
    if (!info || !info.video?.url) {
      clearTimeout(timeoutId)
      response.statusCode = 404
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'Could not resolve direct video stream for this YouTube ID.', attempts }))
      return
    }

    // Diagnostic info query
    if (kind === 'info') {
      clearTimeout(timeoutId)
      response.statusCode = 200
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(
        JSON.stringify({
          ok: true,
          videoId,
          video: {
            mimeType: info.video.mimeType,
            contentLength: info.video.contentLength,
            height: info.video.height,
          },
          audio: info.audio
            ? {
                mimeType: info.audio.mimeType,
                contentLength: info.audio.contentLength,
              }
            : null,
        }),
      )
      return
    }

    const target = kind === 'audio' ? (info.audio || info.video) : info.video
    if (!target || !target.url) {
      clearTimeout(timeoutId)
      response.statusCode = 404
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: `Could not resolve ${kind || 'video'} stream.` }))
      return
    }

    // Google Video CDN requires bounded range chunks (open-ended "bytes=0-" returns 403 Forbidden).
    // Calculate a safe bounded range slice (4MB default chunk size).
    const rawRange = request.headers?.range || request.headers?.Range || ''
    const totalLength = Number(target.contentLength) || 0
    const CHUNK_SIZE = 4 * 1024 * 1024

    let start = 0
    let end = totalLength > 0 ? Math.min(totalLength - 1, start + CHUNK_SIZE - 1) : CHUNK_SIZE - 1

    if (rawRange) {
      const match = String(rawRange).match(/bytes=(\d+)-(\d*)/)
      if (match) {
        start = Number(match[1]) || 0
        if (match[2]) {
          end = Number(match[2])
        } else if (totalLength > 0) {
          end = Math.min(totalLength - 1, start + CHUNK_SIZE - 1)
        } else {
          end = start + CHUNK_SIZE - 1
        }
      }
    }

    const boundedRange = `bytes=${start}-${end}`
    const upstream = await fetch(target.url, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {
        'User-Agent': info.ua,
        Range: boundedRange,
      },
      redirect: 'follow',
      signal: abortController.signal,
    })

    if (!upstream.ok && upstream.status !== 206) {
      clearTimeout(timeoutId)
      response.statusCode = 502
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: `Upstream CDN returned ${upstream.status}.` }))
      return
    }

    response.statusCode = rawRange ? 206 : upstream.status
    response.setHeader('Content-Type', upstream.headers.get('content-type') || target.mimeType || 'video/mp4')
    response.setHeader('Accept-Ranges', 'bytes')

    const upstreamRange = upstream.headers.get('content-range')
    if (upstreamRange) {
      response.setHeader('Content-Range', upstreamRange)
    } else if (rawRange && totalLength > 0) {
      response.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`)
    }

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) {
      response.setHeader('Content-Length', contentLength)
    }

    response.setHeader('Cache-Control', 'public, max-age=3600')

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
