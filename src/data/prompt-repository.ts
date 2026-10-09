import type { Prompt, PromptQuery, PromptRepository } from '../domain/prompt'
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
  }
}

function mapBloggerPost(post: BloggerPost): Prompt {
  const content = stripHtml(post.content)
  const pathParts = new URL(post.url).pathname.split('/').filter(Boolean)
  return {
    id: post.id,
    slug: pathParts.at(-1) || post.id,
    title: stripHtml(post.title),
    description: content.length > 180 ? `${content.slice(0, 177)}…` : content,
    promptText: extractBloggerPrompt(post.content),
    category: post.labels?.[0] ?? 'Articles',
    tool: 'Blogger',
    style: 'Article',
    featured: post.labels?.some((label) => label.toLowerCase() === 'featured') ?? false,
    hashtags: post.labels?.filter((label) => label.startsWith('#')).map((label) => label.slice(1)),
    createdAt: post.published,
    image: post.images?.[0]?.url ?? post.content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
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

class BloggerPromptRepository implements PromptRepository {
  constructor(private readonly config: PromptDataConfig) {}

  private endpoint(resource = 'posts') {
    const { blogId } = this.config.blogger
    if (!blogId) throw new Error('Set VITE_BLOGGER_BLOG_ID in .env.local.')
    return `${this.config.blogger.apiUrl}/blogs/${encodeURIComponent(blogId)}/${resource}`
  }

  private async fetchPosts(query: PromptQuery = {}, limit = this.config.pageSize): Promise<Prompt[]> {
    if (!this.config.blogger.apiKey && !getBloggerAccessTokenIfAvailable()) {
      throw new Error('Set VITE_BLOGGER_API_KEY for public posts, or connect a Google account for authorized access.')
    }
    const resource = query.search ? 'posts/search' : 'posts'
    const params = new URLSearchParams({
      maxResults: String(limit),
      fetchBodies: 'true',
      fetchImages: 'true',
      orderBy: 'published',
    })
    if (resource === 'posts') params.set('status', 'live')
    if (this.config.blogger.apiKey) params.set('key', this.config.blogger.apiKey)
    if (query.search) params.set('q', query.search)
    const accessToken = getBloggerAccessTokenIfAvailable()
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    const response = await fetch(`${this.endpoint(resource)}?${params}`, headers ? { headers } : undefined)
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: { message?: string } }
      throw new Error(body.error?.message ?? `Blogger API returned ${response.status}. Check the blog ID and access permissions.`)
    }
    const result = await response.json() as { items?: BloggerPost[] }
    const posts = (result.items ?? []).map(mapBloggerPost)
    return query.category ? posts.filter((post) => post.category === query.category) : posts
  }

  list(query: PromptQuery = {}) { return this.fetchPosts(query) }

  async getBySlug(slug: string) {
    const posts = await this.fetchPosts({}, 100)
    return posts.find((post) => post.slug === slug) ?? null
  }

  async categories() {
    const posts = await this.fetchPosts({}, 100)
    return [...new Set(posts.map((post) => post.category))]
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
