import { appConfig } from '../config/app.config'
import type { Prompt } from '../domain/prompt'
import { getBloggerAccessToken } from './blogger-auth'

interface BloggerInsertResponse {
  id: string
  title: string
  url: string
  published: string
}
interface BloggerEditablePost extends BloggerInsertResponse {
  content?: string
  labels?: string[]
  status?: string
  images?: Array<{ url: string }>
  error?: { message?: string }
}

interface DriveImageResponse { id?: string; name?: string; error?: { message?: string } }

export const promptBloggerDraft: Readonly<{ blogId: string; postId: string }> = Object.freeze({ blogId: '1194691713972639537', postId: '6325536142783879304' })

export function parseBloggerEditUrl(value: string): { blogId: string; postId: string } {
  let parsed: URL
  try { parsed = new URL(value.trim()) } catch { throw new Error('Paste a valid Blogger post edit link.') }
  const match = parsed.hostname === 'www.blogger.com' && parsed.pathname.match(/^\/blog\/post\/edit\/(\d+)\/(\d+)\/?$/)
  if (!match) throw new Error('Use a Blogger edit link in the format https://www.blogger.com/blog/post/edit/blogId/postId.')
  return { blogId: match[1], postId: match[2] }
}

export async function getPromptBloggerDraftMetadata(target = promptBloggerDraft): Promise<{ title: string; hashtags: string[] }> {
  const accessToken = getBloggerAccessToken()
  const response = await fetch(`${appConfig.blogger.apiUrl}/blogs/${encodeURIComponent(target.blogId)}/posts/${encodeURIComponent(target.postId)}?view=ADMIN`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const result = await response.json().catch(() => ({})) as BloggerEditablePost
  if (!response.ok || !result.id) throw new Error(result.error?.message || `Could not load the Blogger draft (${response.status}).`)
  return { title: result.title, hashtags: (result.labels ?? []).filter((label) => label.startsWith('#')).map((label) => label.slice(1)) }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

async function uploadCoverToDrive(dataUrl: string, fileName: string, accessToken: string): Promise<string> {
  const image = await fetch(dataUrl).then((response) => response.blob())
  const boundary = `promptseen_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const metadata = JSON.stringify({ name: fileName, mimeType: image.type || 'image/webp' })
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${image.type || 'image/webp'}\r\n\r\n`, image,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` })
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const result = await response.json().catch(() => ({})) as DriveImageResponse
  if (!response.ok || !result.id) throw new Error(result.error?.message || `Google Drive could not upload the cover image (${response.status}). Enable the Drive API and reconnect Google.`)
  const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(result.id)}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'anyone', role: 'reader' }),
  })
  if (!permissionResponse.ok) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(result.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => undefined)
    throw new Error('The cover uploaded to Drive, but Google did not allow public image access. Check your Drive sharing settings or use a public HTTPS image URL.')
  }
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(result.id)}`
}

function buildPostHtml(prompt: Prompt, imageUrl: string): string {
  const image = `<figure><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(prompt.imageAlt || prompt.title)}" /></figure>`
  const description = prompt.description ? `<p>${escapeHtml(prompt.description)}</p>` : ''
  const promptBody = `<h2>Prompt</h2><pre>${escapeHtml(prompt.promptText)}</pre>`
  const hashtags = prompt.hashtags?.length ? `<p>${prompt.hashtags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}</p>` : ''
  const metadata = `<p><strong>Category:</strong> ${escapeHtml(prompt.category)} &nbsp; <strong>AI tool:</strong> ${escapeHtml(prompt.tool)}</p>`
  return `${image}${description}${promptBody}${metadata}${hashtags}`
}

function buildEditedPostHtml(prompt: Prompt, currentContent = ''): string {
  const images = [...currentContent.matchAll(/<img\b[^>]*>/gi)].map(([image]) => image).join('')
  const description = prompt.description.trim() ? `<p>${escapeHtml(prompt.description)}</p>` : ''
  const promptBody = `<h2>Prompt</h2><pre>${escapeHtml(prompt.promptText)}</pre>`
  const metadata = `<p><strong>Category:</strong> ${escapeHtml(prompt.category)} &nbsp; <strong>AI tool:</strong> ${escapeHtml(prompt.tool)}</p>`
  const hashtags = prompt.hashtags?.length ? `<p>${prompt.hashtags.map((tag) => `#${escapeHtml(tag.replace(/^#/, ''))}`).join(' ')}</p>` : ''
  return `${images}${description}${promptBody}${metadata}${hashtags}`
}

/** Updates and publishes the supplied Blogger draft, or creates a new post when no target is supplied. */
export async function publishPromptToBlogger(prompt: Prompt, target?: { blogId: string; postId: string }): Promise<{ id: string; url: string; published: string; imageUrl: string }> {
  const blogId = target?.blogId || appConfig.blogger.blogId
  if (!blogId) throw new Error('Set VITE_BLOGGER_BLOG_ID in .env.local.')
  const accessToken = getBloggerAccessToken()
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  if (target) {
    const postUrl = `${appConfig.blogger.apiUrl}/blogs/${encodeURIComponent(blogId)}/posts/${encodeURIComponent(target.postId)}`
    const currentResponse = await fetch(`${postUrl}?view=ADMIN`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const current = await currentResponse.json().catch(() => ({})) as BloggerEditablePost
    if (!currentResponse.ok || !current.id) throw new Error(current.error?.message || `Could not load the Blogger draft (${currentResponse.status}).`)
    const wasDraft = current.status?.toUpperCase() === 'DRAFT'
    const labels = [...new Set([prompt.category, prompt.tool, ...(prompt.hashtags ?? []).map((tag) => `#${tag.replace(/^#/, '')}`), ...(prompt.featured ? ['Featured'] : [])].filter(Boolean))]
    const updateResponse = await fetch(postUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: target.postId, title: prompt.title, content: buildEditedPostHtml(prompt, current.content), labels }),
    })
    let updated = await updateResponse.json().catch(() => ({})) as BloggerEditablePost
    if (!updateResponse.ok || !updated.id) throw new Error(updated.error?.message || `Could not update the Blogger post (${updateResponse.status}).`)
    if (wasDraft) {
      const publishResponse = await fetch(`${postUrl}/publish`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
      const published = await publishResponse.json().catch(() => ({})) as BloggerEditablePost
      if (!publishResponse.ok || !published.id) throw new Error(published.error?.message || `The Blogger post was updated but could not be published (${publishResponse.status}).`)
      updated = published
    }
    const imageUrl = updated.images?.[0]?.url ?? updated.content?.match(/<img[^>]+src=["']([^"']+)/i)?.[1] ?? current.images?.[0]?.url ?? current.content?.match(/<img[^>]+src=["']([^"']+)/i)?.[1] ?? ''
    return { id: updated.id, url: updated.url || current.url, published: updated.published || current.published, imageUrl }
  }
  if (!prompt.image) throw new Error('Choose an image or enter a public image URL before publishing.')
  const imageUrl = prompt.image.startsWith('data:image/')
    ? await uploadCoverToDrive(prompt.image, `${prompt.slug || prompt.id}-cover.webp`, accessToken)
    : prompt.image
  let parsedImageUrl: URL
  try { parsedImageUrl = new URL(imageUrl) } catch { throw new Error('The image URL is not valid. Choose an image or enter a public image URL.') }
  if (parsedImageUrl.protocol !== 'https:') throw new Error('Use an HTTPS image URL so Blogger can display the cover securely.')

  const response = await fetch(`${appConfig.blogger.apiUrl}/blogs/${encodeURIComponent(blogId)}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      kind: 'blogger#post',
      title: prompt.title,
      content: buildPostHtml(prompt, imageUrl),
      labels: [...new Set([prompt.category, prompt.tool, ...(prompt.hashtags ?? []).map((tag) => `#${tag}`), ...(prompt.featured ? ['Featured'] : [])].filter(Boolean))],
    }),
  })
  const result = await response.json().catch(() => ({})) as BloggerInsertResponse & { error?: { message?: string } }
  if (!response.ok || !result.id || !result.url) {
    throw new Error(result.error?.message || `Blogger could not publish this post (${response.status}). Check that the signed-in account can edit this blog.`)
  }
  return { id: result.id, url: result.url, published: result.published, imageUrl }
}
