import { promptTags, type Prompt, type PromptQuery, type PromptRepository } from '../domain/prompt'
import { posterPhotoUrl } from './blogger-poster-split'
import { getBloggerAccessTokenIfAvailable } from './blogger-auth'
import { demoPrompts } from './demo-prompts'

interface WordPressPost {
  id: number
  slug: string
  date: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  categories?: number[]
  _embedded?: { 'wp:term'?: Array<Array<{ name: string }>>; 'wp:featuredmedia'?: Array<{ source_url?: string; alt_text?: string }> }
}

interface BloggerPost {
  id: string
  url: string
  title: string
  content: string
  published: string
  labels?: string[]
  images?: Array<{ url: string }>
  video?: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'").replace(/\s+/g, ' ').trim()
}

function extractBloggerPrompt(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const enteredPrompt = document.querySelector('pre')?.textContent?.trim()
  return enteredPrompt || stripHtml(html)
}

function mapPost(post: WordPressPost): Prompt {
  const terms = post._embedded?.['wp:term']?.flat() ?? []
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  const content = stripHtml(post.content.rendered)
  return {
    id: String(post.id), slug: post.slug, title: stripHtml(post.title.rendered),
    description: stripHtml(post.excerpt.rendered), promptText: content,
    category: terms[0]?.name ?? 'Articles', tool: 'AI tool', style: 'Creative',
    featured: false, createdAt: post.date, image: media?.source_url, imageAlt: media?.alt_text,
    labels: terms.map((term) => term.name),
  }
}

function normalizeVideoUrl(rawUrl: string): string {
  let url = rawUrl.trim()
  if (url.startsWith('//')) {
    url = 'https:' + url
  }
  // YouTube watch, embed, shorts, youtu.be
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }
  // Google Drive preview
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i)
  if (driveMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }
  // Blogger video tokens
  const bloggerTokenMatch = url.match(/blogger\.com\/(?:video\.g|video-play\.mp4)\?token=([a-zA-Z0-9_-]+)/i)
  if (bloggerTokenMatch?.[1]) {
    return `https://www.blogger.com/video.g?token=${bloggerTokenMatch[1]}`
  }
  return url
}

function extractVideoUrl(html: string): string | undefined {
  if (!html) return undefined
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html')

      // 1. Check iframes (Blogger player, YouTube, Drive, Vimeo)
      const iframes = Array.from(doc.querySelectorAll('iframe'))
      for (const iframe of iframes) {
        const src = iframe.getAttribute('src') || iframe.getAttribute('data-src')
        if (src) return normalizeVideoUrl(src)
      }

      // 2. Check video elements & nested sources
      const videos = Array.from(doc.querySelectorAll('video'))
      for (const video of videos) {
        const src = video.getAttribute('src') || video.getAttribute('data-src')
        if (src) return normalizeVideoUrl(src)
        const sources = Array.from(video.querySelectorAll('source'))
        for (const s of sources) {
          const sSrc = s.getAttribute('src') || s.getAttribute('data-src')
          if (sSrc) return normalizeVideoUrl(sSrc)
        }
      }

      // 3. Standalone source tags
      const standaloneSources = Array.from(doc.querySelectorAll('source'))
      for (const s of standaloneSources) {
        const src = s.getAttribute('src') || s.getAttribute('data-src')
        if (src) return normalizeVideoUrl(src)
      }

      // 4. Anchor tags pointing directly to videos or video hosts
      const links = Array.from(doc.querySelectorAll('a'))
      for (const a of links) {
        const href = a.getAttribute('href') || ''
        if (
          /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(href) ||
          href.includes('blogger.com/video.g') ||
          href.includes('blogger.com/video-play.mp4') ||
          href.includes('youtube.com/') ||
          href.includes('youtu.be/') ||
          href.includes('drive.google.com/file/d/') ||
          href.includes('vimeo.com/')
        ) {
          return normalizeVideoUrl(href)
        }
      }
    } catch {}
  }

  // Regex fallbacks
  const bloggerMatch = html.match(/https?:\/\/(?:www\.)?blogger\.com\/(?:video\.g|video-play\.mp4)\?token=([a-zA-Z0-9_-]+)/i)
  if (bloggerMatch?.[1]) return `https://www.blogger.com/video.g?token=${bloggerMatch[1]}`

  const iframeMatch = html.match(/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i)
  if (iframeMatch?.[1]) return normalizeVideoUrl(iframeMatch[1])

  const videoMatch = html.match(/<video[^>]+(?:src|data-src)=["']([^"']+)["']/i)
  if (videoMatch?.[1]) return normalizeVideoUrl(videoMatch[1])

  const sourceMatch = html.match(/<source[^>]+(?:src|data-src)=["']([^"']+)["']/i)
  if (sourceMatch?.[1]) return normalizeVideoUrl(sourceMatch[1])

  const ytMatch = html.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`

  const driveMatch = html.match(/https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i)
  if (driveMatch?.[1]) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`

  const directVideoMatch = html.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov|m4v|ogg)(?:\?[^\s"'<>]*)?/i)
  if (directVideoMatch?.[0]) return normalizeVideoUrl(directVideoMatch[0])

  return undefined
}

function extractVideoThumbnail(videoUrl: string | undefined): string | undefined {
  if (!videoUrl) return undefined
  const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i)
  if (ytMatch?.[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
  return undefined
}

function mapBloggerPost(post: BloggerPost): Prompt {
  const content = stripHtml(post.content)
  const pathParts = new URL(post.url).pathname.split('/').filter(Boolean)
  const video = post.video || extractVideoUrl(post.content)
  const image = posterPhotoUrl(post.content, post.images?.[0]?.url ?? '') || extractVideoThumbnail(video)
  const rawTitle = stripHtml(post.title).trim()
  const derivedTitle = rawTitle || post.labels?.find((l) => !l.startsWith('#')) || post.labels?.[0]?.replace(/^#/, '') || (video ? 'AI Video' : 'Creative Photo')
  return {
    id: post.id,
    slug: pathParts.at(-1) || post.id,
    title: derivedTitle,
    description: content.length > 180 ? `${content.slice(0, 177)}…` : (content || derivedTitle),
    promptText: extractBloggerPrompt(post.content),
    category: post.labels?.find((l) => !l.startsWith('#')) ?? post.labels?.[0]?.replace(/^#/, '') ?? (video ? 'AI Video' : 'Articles'),
    tool: video ? 'Video AI' : 'Blogger',
    style: video ? 'Video' : 'Article',
    featured: post.labels?.some((label) => label.toLowerCase() === 'featured') ?? false,
    hashtags: post.labels?.filter((label) => label.startsWith('#')).map((label) => label.slice(1)),
    labels: post.labels,
    createdAt: post.published,
    image,
    video,
    sourceUrl: post.url,
  }
}

class DemoPromptRepository implements PromptRepository {
  async list(query: PromptQuery = {}) {
    const needle = query.search?.trim().toLowerCase()
    return demoPrompts.filter((prompt) => (!query.category || prompt.category === query.category)
      && (!needle || `${prompt.title} ${prompt.description} ${prompt.category} ${prompt.style}`.toLowerCase().includes(needle)))
  }
  async getBySlug(slug: string) { return demoPrompts.find((prompt) => prompt.slug === slug) ?? null }
  async categories() { return [...new Set(demoPrompts.map((prompt) => prompt.category))] }
}

class WordPressPromptRepository implements PromptRepository {
  constructor(private readonly config: PromptDataConfig) {}
  private endpoint(path = '') {
    if (!this.config.wordpressApiUrl) throw new Error('Set the WordPress REST API URL in the application configuration.')
    return `${this.config.wordpressApiUrl}${path}`
  }
  async list(query: PromptQuery = {}) {
    const params = new URLSearchParams({ per_page: String(this.config.pageSize), _embed: '1', _fields: 'id,slug,date,title,excerpt,content,categories,_embedded' })
    if (query.search) params.set('search', query.search)
    const response = await fetch(`${this.endpoint()}?${params}`)
    if (!response.ok) throw new Error(`WordPress returned ${response.status}. Check the API URL and public REST API access.`)
    const prompts = (await response.json() as WordPressPost[]).map(mapPost)
    return query.category ? prompts.filter((prompt) => prompt.category === query.category) : prompts
  }
  async getBySlug(slug: string) {
    const params = new URLSearchParams({ slug, _embed: '1', _fields: 'id,slug,date,title,excerpt,content,categories,_embedded' })
    const response = await fetch(`${this.endpoint()}?${params}`)
    if (!response.ok) throw new Error(`WordPress returned ${response.status}.`)
    const posts = await response.json() as WordPressPost[]
    return posts[0] ? mapPost(posts[0]) : null
  }
  async categories() {
    const response = await fetch(`${this.endpoint('/categories')}?per_page=${this.config.pageSize}`)
    if (!response.ok) throw new Error(`WordPress returned ${response.status}.`)
    return (await response.json() as Array<{ name: string }>).map((category) => category.name)
  }
}

function loadBloggerFeedJsonp(blogId: string, limit = 500, query?: string): Promise<{ feed?: { entry?: any[] } } | null> {
  if (typeof document === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const callbackName = '__blogger_feed_' + Math.random().toString(36).slice(2)
    const script = document.createElement('script')
    let resolved = false

    const cleanup = () => {
      try { delete (window as any)[callbackName] } catch {}
      script.remove()
    }

    const timer = window.setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve(null)
      }
    }, 8000)

    ;(window as any)[callbackName] = (data: any) => {
      if (!resolved) {
        resolved = true
        window.clearTimeout(timer)
        cleanup()
        resolve(data)
      }
    }

    script.onerror = () => {
      if (!resolved) {
        resolved = true
        window.clearTimeout(timer)
        cleanup()
        resolve(null)
      }
    }

    const params = new URLSearchParams({
      alt: 'json-in-script',
      'max-results': String(limit),
      callback: callbackName,
    })
    if (query?.trim()) params.set('q', query.trim())

    script.src = `https://www.blogger.com/feeds/${encodeURIComponent(blogId)}/posts/default?${params.toString()}`
    document.head.appendChild(script)
  })
}

function mapFeedEntryToBloggerPost(entry: any, blogId: string): BloggerPost {
  const rawId = String(entry.id?.$t || '')
  const postId = rawId.includes('.post-') ? rawId.split('.post-')[1] : rawId
  const alternateLink = entry.link?.find((l: any) => l.rel === 'alternate')?.href || ''
  const content = String(entry.content?.$t || entry.summary?.$t || '')
  const labels = Array.isArray(entry.category) ? entry.category.map((c: any) => String(c.term || '')).filter(Boolean) : []

  const images: Array<{ url: string }> = []
  if (entry.media$thumbnail?.url) {
    images.push({ url: entry.media$thumbnail.url.replace(/\/s\d+(-c)?\//, '/s1600/') })
  }
  const imgMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  for (const m of imgMatches) {
    if (m[1] && !images.some((img) => img.url === m[1])) {
      images.push({ url: m[1] })
    }
  }

  // Extract video from feed enclosure or media content if present
  let feedVideo: string | undefined = undefined
  const enclosure = entry.link?.find(
    (l: any) => l.rel === 'enclosure' && (l.type?.startsWith('video/') || l.href?.includes('video') || /\.(mp4|webm|mov|m4v)/i.test(l.href || ''))
  )
  if (enclosure?.href) {
    feedVideo = normalizeVideoUrl(enclosure.href)
  }

  const mediaContent = entry.media$content || entry['media$group']?.['media$content']
  if (!feedVideo) {
    if (Array.isArray(mediaContent)) {
      const videoMedia = mediaContent.find(
        (m: any) => m.medium === 'video' || m.type?.startsWith('video/') || m.url?.includes('video')
      )
      if (videoMedia?.url) feedVideo = normalizeVideoUrl(videoMedia.url)
    } else if (mediaContent?.medium === 'video' && mediaContent?.url) {
      feedVideo = normalizeVideoUrl(mediaContent.url)
    }
  }

  const mediaPlayer = entry.media$player || entry['media$group']?.['media$player']
  if (!feedVideo && mediaPlayer?.url) {
    feedVideo = normalizeVideoUrl(mediaPlayer.url)
  }

  return {
    id: postId,
    url: alternateLink || `https://www.blogger.com/blog/post/edit/${blogId}/${postId}`,
    title: String(entry.title?.$t || ''),
    content,
    published: String(entry.published?.$t || ''),
    labels,
    images: images.length ? images : undefined,
    video: feedVideo,
  }
}

class BloggerPromptRepository implements PromptRepository {
  constructor(private readonly config: PromptDataConfig) {}

  private endpoint(resource = 'posts') {
    const { blogId } = this.config.blogger
    if (!blogId) throw new Error('Set VITE_BLOGGER_BLOG_ID in .env.local.')
    return `${this.config.blogger.apiUrl}/blogs/${encodeURIComponent(blogId)}/${resource}`
  }

  private async fetchFromFeed(query: PromptQuery = {}, limit = 500): Promise<Prompt[]> {
    const { blogId } = this.config.blogger
    if (!blogId) return []
    const data = await loadBloggerFeedJsonp(blogId, limit || 500, query.search)
    const entries = data?.feed?.entry ?? []
    const posts: Prompt[] = entries.map((entry: any) => mapBloggerPost(mapFeedEntryToBloggerPost(entry, blogId)))
    return query.category ? posts.filter((post) => promptTags(post).includes(query.category!.toLowerCase())) : posts
  }

  private async fetchPosts(query: PromptQuery = {}, limit = 0): Promise<Prompt[]> {
    const hasKey = Boolean(this.config.blogger.apiKey)
    const accessToken = getBloggerAccessTokenIfAvailable()

    if (hasKey || accessToken) {
      try {
        const resource = query.search ? 'posts/search' : 'posts'
        let pageToken = ''
        const allItems: BloggerPost[] = []

        do {
          const params = new URLSearchParams({
            maxResults: '500',
            fetchBodies: 'true',
            fetchImages: 'true',
            orderBy: 'published',
          })
          if (resource === 'posts') params.set('status', 'live')
          if (hasKey) params.set('key', this.config.blogger.apiKey)
          if (query.search) params.set('q', query.search)
          if (pageToken) params.set('pageToken', pageToken)
          const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
          const response = await fetch(`${this.endpoint(resource)}?${params}`, headers ? { headers } : undefined)
          if (!response.ok) break
          const result = await response.json() as { items?: BloggerPost[]; nextPageToken?: string }
          if (result.items?.length) {
            allItems.push(...result.items)
          }
          if (limit > 0 && allItems.length >= limit) break
          pageToken = result.nextPageToken || ''
        } while (pageToken && allItems.length < 2000)

        if (allItems.length > 0) {
          const rawList = limit > 0 ? allItems.slice(0, limit) : allItems
          const posts = rawList.map((post) => mapBloggerPost(post))
          return query.category ? posts.filter((post) => promptTags(post).includes(query.category!.toLowerCase())) : posts
        }
      } catch {
        // Fall back to public feed below
      }
    }

    return this.fetchFromFeed(query, limit || 500)
  }

  list(query: PromptQuery = {}) { return this.fetchPosts(query, 0) }

  async getBySlug(slug: string) {
    const posts = await this.fetchPosts({}, 0)
    const norm = (s: string) => (s || '').replace(/\.html$/i, '').toLowerCase()
    return posts.find((post) => post.slug === slug || post.id === slug || norm(post.slug) === norm(slug)) ?? null
  }

  async categories() {
    const posts = await this.fetchPosts({}, 0)
    return [...new Set(posts.map((post) => post.category).filter(Boolean))]
  }
}

export interface PromptDataConfig {
  contentProvider: 'demo' | 'wordpress' | 'blogger'
  wordpressApiUrl: string
  blogger: { apiUrl: string; blogId: string; clientId: string; apiKey: string }
  pageSize: number
}

/** Platform-neutral data boundary: web and a future Expo app can provide their own config. */
export function createPromptRepository(config: PromptDataConfig): PromptRepository {
  if (config.contentProvider === 'wordpress') return new WordPressPromptRepository(config)
  if (config.contentProvider === 'blogger') return new BloggerPromptRepository(config)
  return new DemoPromptRepository()
}
