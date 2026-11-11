import { appConfig } from '../config/app.config'
import { posterLabel } from '../domain/prompt'
import { getBloggerAccessToken, getBloggerAccessTokenIfAvailable } from './blogger-auth'
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

export interface PosterSourceItem {
  id: string
  url: string
  alt: string
  title: string
  prompt: string
}

export interface PosterSourcePost {
  blogId: string
  postId: string
  title: string
  labels: string[]
  items: PosterSourceItem[]
  images: PosterSourceItem[]
  content?: string
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

export function parsePostItems(content: string, postTitle: string, rawApiImages: string[]): PosterSourceItem[] {
  const imgRegex = /<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  const rawContentImages: Array<{ index: number; length: number; url: string; alt: string }> = []
  while ((match = imgRegex.exec(content)) !== null) {
    const fullTag = match[0]
    const alt = fullTag.match(/\balt=["']([^"']*)["']/i)?.[1] || ''
    const url = cleanSrc(largeImage(match[1]))
    if (url) rawContentImages.push({ index: match.index, length: fullTag.length, url, alt })
  }

  const seen = new Set<string>()
  const images: Array<{ index: number; length: number; url: string; alt: string }> = []
  for (const img of rawContentImages) {
    const key = img.url.replace(/=(?:s|w)\d[\w-]*$/i, '').replace(/\/(?:s|w)\d+(?:-[a-z0-9]+)*\//i, '/')
    if (seen.has(key)) continue
    seen.add(key)
    images.push(img)
  }

  if (!images.length && rawApiImages.length) {
    for (const url of rawApiImages) {
      const clean = cleanSrc(largeImage(url))
      const key = clean.replace(/=(?:s|w)\d[\w-]*$/i, '').replace(/\/(?:s|w)\d+(?:-[a-z0-9]+)*\//i, '/')
      if (clean && !seen.has(key)) {
        seen.add(key)
        images.push({ index: 0, length: 0, url: clean, alt: '' })
      }
    }
  }

  return images.slice(0, MAX_POSTER_IMAGES).map((img, i) => {
    const prevEnd = i === 0 ? 0 : images[i - 1].index + images[i - 1].length
    const beforeSection = content.slice(prevEnd, img.index)

    const nextStart = i < images.length - 1 ? images[i + 1].index : content.length
    const afterSection = content.slice(img.index + img.length, nextStart)

    const beforeHeadings = [...beforeSection.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
      .filter(Boolean)

    let title = beforeHeadings.pop() || ''
    if (!title) {
      const filename = decodeURIComponent(img.url.split('/').pop() || '').replace(/\.[a-zA-Z0-9]+$/, '').trim()
      if (img.alt && img.alt.length > 2 && !img.alt.startsWith('http')) {
        title = img.alt
      } else if (filename && !/^\d+$/.test(filename) && !filename.startsWith('image')) {
        title = filename
      } else {
        title = i === 0 ? postTitle : `${postTitle} - Part ${i + 1}`
      }
    }

    let promptHtml = afterSection
    const nextHeadingMatch = afterSection.match(/<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>/i)
    if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
      promptHtml = afterSection.slice(0, nextHeadingMatch.index)
    }

    const cleanPrompt = promptHtml
      .replace(/<a\b[^>]*><img\b[^>]*><\/a>/gi, '')
      .replace(/<img\b[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/li>|<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    return {
      id: `item-${i + 1}-${img.url.slice(-8).replace(/[^a-zA-Z0-9]/g, '')}`,
      url: img.url,
      alt: img.alt || title,
      title,
      prompt: cleanPrompt,
    }
  })
}

/** Reads one Blogger post and returns every item with image, title, and prompt. */
export async function readPosterSource(value: string): Promise<PosterSourcePost> {
  const { blogId, postId } = parseBloggerEditUrl(value)
  const token = getBloggerAccessTokenIfAvailable()
  const apiKey = appConfig.blogger.apiKey

  let url = postEndpoint(blogId, postId)
  const headers: Record<string, string> = {}
  if (token) {
    url += '?view=ADMIN'
    headers.Authorization = `Bearer ${token}`
  } else if (apiKey) {
    url += `?key=${encodeURIComponent(apiKey)}`
  }

  const response = await fetch(url, Object.keys(headers).length ? { headers } : undefined)
  const result = await response.json().catch(() => ({})) as BloggerPostBody
  if (!response.ok || !result.id) throw new Error(result.error?.message || `Could not load that Blogger post (${response.status}).`)

  const postTitle = result.title?.trim() || 'Untitled post'
  const apiImages = (result.images ?? []).map((image) => cleanSrc(largeImage(image.url))).filter(Boolean)
  const items = parsePostItems(result.content || '', postTitle, apiImages)

  if (!items.length) throw new Error('That post has no images to split. Add the photos first and reload.')

  return {
    blogId,
    postId,
    title: postTitle,
    labels: result.labels ?? [],
    items,
    images: items,
    content: result.content || '',
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

/** Standard photo post content with image and prompt paragraphs (no button). */
function posterPostHtml(imageUrl: string, promptText = '', title = ''): string {
  const safeTitle = escapeHtml(title)
  const safeImg = escapeHtml(imageUrl)
  const paragraphs = promptText
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n')

  return [
    `<div class="separator" style="clear: both; text-align: center;"><a href="${safeImg}" style="margin-left: 1em; margin-right: 1em;"><img border="0" src="${safeImg}" alt="${safeTitle}" /></a></div>`,
    paragraphs,
  ].filter(Boolean).join('\n')
}

async function createPosterEditPost(
  source: PosterSourcePost,
  item: PosterSourceItem,
  accessToken: string,
  asDraft: boolean
): Promise<PosterEditLink> {
  const title = item.title?.trim() || source.title || 'Creative Photo'
  const labels = source.labels && source.labels.length ? source.labels : ['Creative']
  const response = await fetch(`${postEndpoint(source.blogId)}?isDraft=${asDraft ? 'true' : 'false'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'blogger#post',
      title,
      content: posterPostHtml(item.url, item.prompt, title),
      labels,
    }),
  })
  const result = await response.json().catch(() => ({})) as BloggerPostBody
  if (!response.ok || !result.id) {
    throw new Error(result.error?.message || `Blogger could not create "${title}" (${response.status}).`)
  }
  return { id: result.id, url: result.url || '', title, imageUrl: item.url }
}

/** Creates one Blogger post per selected item, carrying the image, title, and prompt copy. */
export async function splitPostIntoPosterEdits(
  source: PosterSourcePost,
  items: PosterSourceItem[],
  options: { onProgress?: (created: PosterEditLink[], pending: number) => void; asDraft?: boolean } = {}
): Promise<PosterEditLink[]> {
  if (!items.length) throw new Error('Select at least one photo to create a post for it.')
  const accessToken = getBloggerAccessToken()
  const created: PosterEditLink[] = []
  for (let index = 0; index < items.length; index += 1) {
    created.push(await createPosterEditPost(source, items[index], accessToken, Boolean(options.asDraft)))
    options.onProgress?.(created, items.length - created.length)
  }
  return created
}
