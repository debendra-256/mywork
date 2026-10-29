import { appConfig } from '../config/app.config'
import { posterLabel } from '../domain/prompt'
import { getBloggerAccessToken } from './blogger-auth'
import { parseBloggerEditUrl } from './blogger-publisher'

/** Label that keeps poster photos apart from prompt posts in the Blogger blog. */
export const POSTER_LABEL = `#${posterLabel}`

/** The only wording a poster post carries. */
export const POSTER_BUTTON = 'Create your poster'

const MAX_POSTER_IMAGES = 12

interface BloggerPostImage { url: string }
interface BloggerPostBody {
  id?: string
  title?: string
  content?: string
  labels?: string[]
  url?: string
  images?: BloggerPostImage[]
  error?: { message?: string }
}

export interface PosterSourceImage { url: string; alt: string }

export interface PosterSourcePost {
  blogId: string
  postId: string
  title: string
  labels: string[]
  images: PosterSourceImage[]
}

export interface PosterEditLink { id: string; url: string; title: string; imageUrl: string }

function postEndpoint(blogId: string, postId?: string): string {
  const base = `${appConfig.blogger.apiUrl}/blogs/${encodeURIComponent(blogId)}/posts`
  return postId ? `${base}/${encodeURIComponent(postId)}` : base
}

/** Blogger resizes its hosted images through a size directive; ask for a print-friendly one. */
export function largeImage(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url
  const withDirective = url.replace(/=(?:s|w)\d[\w-]*$/i, '=s1600')
  if (withDirective !== url) return withDirective
  return url.replace(/\/(?:s|w)\d+(?:-[a-z0-9]+)*\/([^/]+)$/i, '/s1600/$1')
}

/** The photo a poster tile hands to the editor: the post's own image, at print size. */
export function posterPhotoUrl(content: string, fallback = ''): string {
  const src = content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? fallback
  return src ? largeImage(src) : ''
}

function cleanSrc(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return ''
  return trimmed
}

function fromContent(content = ''): PosterSourceImage[] {
  const list: PosterSourceImage[] = []
  for (const match of content.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0]
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? ''
    const url = src ? cleanSrc(largeImage(src)) : ''
    if (url) list.push({ url, alt })
  }
  return list
}

/** Reads one Blogger post and returns every image it holds, in page order. */
export async function readPosterSource(value: string): Promise<PosterSourcePost> {
  const { blogId, postId } = parseBloggerEditUrl(value)
  const accessToken = getBloggerAccessToken()
  const response = await fetch(`${postEndpoint(blogId, postId)}?view=ADMIN`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const result = await response.json().catch(() => ({})) as BloggerPostBody
  if (!response.ok || !result.id) throw new Error(result.error?.message || `Could not load that Blogger post (${response.status}).`)
  const apiImages = (result.images ?? []).map((image) => cleanSrc(largeImage(image.url))).filter(Boolean)
  const contentImages = fromContent(result.content)
  const seen = new Set<string>()
  const images: PosterSourceImage[] = []
  for (const image of [...contentImages, ...apiImages.map((url) => ({ url, alt: '' }))]) {
    const key = image.url.replace(/=(?:s|w)\d[\w-]*$/i, '').replace(/\/(?:s|w)\d+(?:-[a-z0-9]+)*\//i, '/')
    if (seen.has(key)) continue
    seen.add(key)
    images.push(image)
  }
  if (!images.length) throw new Error('That post has no images to split. Add the photos first and reload.')
  return {
    blogId,
    postId,
    title: result.title?.trim() || 'Untitled post',
    labels: result.labels ?? [],
    images: images.slice(0, MAX_POSTER_IMAGES),
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

/** The site origin the "Edit this template" button points back to. */
export function posterSiteBase(): string {
  if (appConfig.siteUrl) return appConfig.siteUrl
  return typeof window === 'undefined' ? '' : window.location.origin
}

export function posterEditUrl(imageUrl: string, siteBase = posterSiteBase()): string {
  if (!siteBase) throw new Error('Set VITE_SITE_URL so the edit button can point back to your site.')
  return `${siteBase}/poster?photo=${encodeURIComponent(imageUrl)}`
}

/** Photo posts stay text-free: the image and one button, nothing else. */
function posterPostHtml(image: PosterSourceImage, editUrl: string): string {
  return [
    `<figure><img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}" /></figure>`,
    `<p><a href="${escapeHtml(editUrl)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 26px;border-radius:10px;background:#0a9f62;color:#ffffff !important;font-weight:700;letter-spacing:.02em;text-decoration:none;">${POSTER_BUTTON}</a></p>`,
  ].join('')
}

async function createPosterEditPost(
  source: PosterSourcePost,
  image: PosterSourceImage,
  index: number,
  total: number,
  accessToken: string,
  asDraft: boolean
): Promise<PosterEditLink> {
  // Only used by the admin list — Blogger stores the post without a title.
  const name = `Photo ${index + 1} of ${total}`
  const editUrl = posterEditUrl(image.url)
  // Blogger's insert endpoint only honours drafts through the query flag.
  const response = await fetch(`${postEndpoint(source.blogId)}?isDraft=${asDraft ? 'true' : 'false'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'blogger#post',
      content: posterPostHtml(image, editUrl),
      labels: [POSTER_LABEL],
    }),
  })
  const result = await response.json().catch(() => ({})) as BloggerPostBody
  if (!response.ok || !result.id) {
    throw new Error(result.error?.message || `Blogger could not create ${name} (${response.status}).`)
  }
  return { id: result.id, url: result.url || '', title: name, imageUrl: image.url }
}

/** Creates one title-free Blogger post per image, each carrying only its "Create your poster" button. */
export async function splitPostIntoPosterEdits(
  source: PosterSourcePost,
  images: PosterSourceImage[],
  options: { onProgress?: (created: PosterEditLink[], pending: number) => void; asDraft?: boolean } = {}
): Promise<PosterEditLink[]> {
  if (!images.length) throw new Error('Tick at least one photo to create a post for it.')
  const accessToken = getBloggerAccessToken()
  const created: PosterEditLink[] = []
  for (let index = 0; index < images.length; index += 1) {
    created.push(await createPosterEditPost(source, images[index], index, images.length, accessToken, Boolean(options.asDraft)))
    options.onProgress?.(created, images.length - created.length)
  }
  return created
}
