const maxItemsPerSource = 12

function makeRequestUrl(base, path, params) {
  const url = new URL(`${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url
}

async function readJson(url, token) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json()
}

function engagement(metrics = {}) {
  return Number(metrics.like_count ?? 0)
    + Number(metrics.reply_count ?? 0)
    + Number(metrics.retweet_count ?? 0)
    + Number(metrics.quote_count ?? 0)
    + Number(metrics.comments_count ?? 0)
}

async function fetchX(env) {
  if (!env.SOCIAL_X_BEARER_TOKEN || !env.SOCIAL_X_API_URL || !env.SOCIAL_X_SEARCH_QUERY) return []
  const url = makeRequestUrl(env.SOCIAL_X_API_URL, 'tweets/search/recent', {
    query: env.SOCIAL_X_SEARCH_QUERY,
    max_results: String(maxItemsPerSource),
    sort_order: 'relevancy',
    'tweet.fields': 'created_at,public_metrics,attachments',
    expansions: 'author_id,attachments.media_keys',
    'user.fields': 'name,username',
    'media.fields': 'url,preview_image_url,type',
  })
  const payload = await readJson(url, env.SOCIAL_X_BEARER_TOKEN)
  const users = new Map((payload.includes?.users ?? []).map((user) => [user.id, user]))
  const media = new Map((payload.includes?.media ?? []).map((item) => [item.media_key, item]))
  return (payload.data ?? []).map((post) => {
    const author = users.get(post.author_id)
    const attachment = post.attachments?.media_keys?.map((key) => media.get(key)).find(Boolean)
    return {
      id: String(post.id), platform: 'X', author: author?.username ?? 'X user',
      text: post.text, permalink: `https://x.com/${author?.username ?? 'i'}/status/${post.id}`,
      createdAt: post.created_at ?? '', imageUrl: attachment?.url ?? attachment?.preview_image_url,
      engagement: engagement(post.public_metrics),
    }
  })
}

async function fetchInstagram(env) {
  const hashtags = (env.SOCIAL_INSTAGRAM_HASHTAGS ?? '').split(',').map((tag) => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean).slice(0, 6)
  if (!env.SOCIAL_INSTAGRAM_ACCESS_TOKEN || !env.SOCIAL_INSTAGRAM_USER_ID || !env.SOCIAL_INSTAGRAM_API_URL || hashtags.length === 0) return []
  const results = await Promise.all(hashtags.map(async (hashtag) => {
    const searchUrl = makeRequestUrl(env.SOCIAL_INSTAGRAM_API_URL, 'ig_hashtag_search', { user_id: env.SOCIAL_INSTAGRAM_USER_ID, q: hashtag, fields: 'id' })
    const found = await readJson(searchUrl, env.SOCIAL_INSTAGRAM_ACCESS_TOKEN)
    const hashtagId = found.data?.[0]?.id
    if (!hashtagId) return []
    const mediaUrl = makeRequestUrl(env.SOCIAL_INSTAGRAM_API_URL, `${encodeURIComponent(hashtagId)}/top_media`, {
      user_id: env.SOCIAL_INSTAGRAM_USER_ID,
      fields: 'id,username,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit: '6',
    })
    const payload = await readJson(mediaUrl, env.SOCIAL_INSTAGRAM_ACCESS_TOKEN)
    return (payload.data ?? []).map((post) => ({
      id: String(post.id), platform: 'Instagram', author: post.username ?? `#${hashtag}`,
      text: post.caption ?? `Popular #${hashtag} post`, permalink: post.permalink ?? 'https://www.instagram.com/',
      createdAt: post.timestamp ?? '', imageUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
      engagement: engagement(post),
    }))
  }))
  return results.flat()
}

function safeError(platform, error) {
  const reason = error instanceof Error ? error.message : 'request failed'
  return `${platform}: ${reason}. Check the server API credentials, permissions, and usage limits.`
}

function scoreTrend(item, terms, now) {
  const searchableText = `${item.text} ${item.author}`.toLowerCase()
  const relevance = terms.reduce((total, term) => total + (searchableText.includes(term) ? 1 : 0), 0)
  const ageHours = item.createdAt ? Math.max(0, (now - Date.parse(item.createdAt)) / 3_600_000) : 168
  const freshness = Number.isFinite(ageHours) ? Math.exp(-ageHours / 72) : 0
  return Math.log1p(item.engagement) * 20 + freshness * 40 + relevance * 10
}

function dedupeKey(item) {
  return item.text.toLowerCase().normalize('NFKC').replace(/https?:\/\/\S+/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 120)
}

export async function getSocialTrends(env = process.env) {
  const configured = {
    x: Boolean(env.SOCIAL_X_BEARER_TOKEN && env.SOCIAL_X_API_URL && env.SOCIAL_X_SEARCH_QUERY),
    instagram: Boolean(env.SOCIAL_INSTAGRAM_ACCESS_TOKEN && env.SOCIAL_INSTAGRAM_USER_ID && env.SOCIAL_INSTAGRAM_API_URL && env.SOCIAL_INSTAGRAM_HASHTAGS),
  }
  const errors = []
  const results = await Promise.all([
    configured.x ? fetchX(env).catch((error) => { errors.push(safeError('X', error)); return [] }) : Promise.resolve([]),
    configured.instagram ? fetchInstagram(env).catch((error) => { errors.push(safeError('Instagram', error)); return [] }) : Promise.resolve([]),
  ])
  const terms = (env.SOCIAL_RELEVANCE_TERMS ?? '').split(',').map((term) => term.trim().toLowerCase()).filter(Boolean)
  const seen = new Set()
  const items = results.flat()
    .map((item) => ({ ...item, score: scoreTrend(item, terms, Date.now()) }))
    .filter((item) => {
      const content = `${item.text} ${item.author}`.toLowerCase()
      return item.text.trim() && (!terms.length || terms.some((term) => content.includes(term)))
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = dedupeKey(item)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 18)
    .map(({ score: _score, ...item }) => item)
  return { items, configured, errors }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }
  try {
    const data = await getSocialTrends()
    response.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600')
    response.status(200).json(data)
  } catch {
    response.status(500).json({ error: 'Could not load social trends.' })
  }
}
