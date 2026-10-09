import { appConfig } from '../config/app.config'
import { getBloggerAccessToken } from './blogger-auth'

interface DriveFileResponse { id?: string; name?: string; webViewLink?: string; error?: { message?: string } }
interface BloggerProductPostResponse { id?: string; url?: string; error?: { message?: string } }

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function makeProductId(title: string): string {
  return title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || `pdf-${Date.now()}`
}

async function uploadPrivatePdf(file: File, accessToken: string): Promise<DriveFileResponse> {
  const boundary = `promptseen_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const metadata = JSON.stringify({ name: file.name, mimeType: 'application/pdf' })
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ], { type: `multipart/related; boundary=${boundary}` })
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  const result = await response.json().catch(() => ({})) as DriveFileResponse
  if (!response.ok || !result.id) throw new Error(result.error?.message || `Google Drive could not upload the PDF (${response.status}). Enable the Drive API and reconnect Google.`)
  return result
}

/** Upload a private PDF to Drive, then create its public product listing on Blogger. */
export async function publishPdfProduct(input: { file: File; title: string; description: string; pricePaise: number }): Promise<{ id: string; driveFileId: string; fileName: string; postUrl: string; catalogRecord: string }> {
  if (!appConfig.blogger.blogId) throw new Error('Set VITE_BLOGGER_BLOG_ID in .env.local.')
  if (input.file.type !== 'application/pdf' && !input.file.name.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF file.')
  if (input.file.size > 25 * 1024 * 1024) throw new Error('Choose a PDF smaller than 25 MB.')
  if (!Number.isSafeInteger(input.pricePaise) || input.pricePaise < 100) throw new Error('Set a price of at least ₹1.00.')
  const accessToken = getBloggerAccessToken()
  const file = await uploadPrivatePdf(input.file, accessToken)
  const driveFileId = file.id!
  const id = makeProductId(input.title)
  const checkoutUrl = `${appConfig.siteUrl || window.location.origin}/checkout/${encodeURIComponent(id)}`
  const content = `<p>${escapeHtml(input.description)}</p><p><strong>Digital PDF · ₹${(input.pricePaise / 100).toFixed(2)}</strong></p><p><a href="${escapeHtml(checkoutUrl)}">View payment page</a></p>`
  const postResponse = await fetch(`${appConfig.blogger.apiUrl}/blogs/${encodeURIComponent(appConfig.blogger.blogId)}/posts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'blogger#post', title: input.title.trim(), content, labels: ['Sell online', 'PDF', 'Paid', `product-${id}`] }),
  })
  const post = await postResponse.json().catch(() => ({})) as BloggerProductPostResponse
  if (!postResponse.ok || !post.id || !post.url) throw new Error(post.error?.message || `Drive upload succeeded, but Blogger could not create the product post (${postResponse.status}). Drive file ID: ${driveFileId}`)
  const catalogResponse = await fetch('/api/store/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title: input.title.trim(), description: input.description.trim(), pricePaise: input.pricePaise, driveFileId }),
  })
  const catalogResult = await catalogResponse.json().catch(() => ({})) as { error?: string }
  if (!catalogResponse.ok) throw new Error(`The PDF and Blogger post were created, but the store database could not save the listing: ${catalogResult.error || catalogResponse.status}. Set DATABASE_URL and try again.`)
  const catalogRecord = JSON.stringify({ id, title: input.title.trim(), type: 'pdf', description: input.description.trim(), pricePaise: input.pricePaise, currency: 'INR', driveFileId, fileName: file.name || input.file.name })
  return { id, driveFileId, fileName: file.name || input.file.name, postUrl: post.url, catalogRecord }
}
