import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const BASE_URL = 'https://www.imgmojo.com'
const BLOGGER_BLOG_ID = '7320184749093787409'
const BLOGGER_API_KEY = 'AIzaSyCj2wg9a-JBEkSlMw2gIt80oswPzNftsdY'

// Helper to format ISO date to YYYY-MM-DD
function formatDate(d = new Date()) {
  return d.toISOString().split('T')[0]
}

function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 1. Core Tool and Information Pages
const STATIC_ROUTES = [
  { path: '/', title: 'ImgMojo – Free Online Image, Video & PDF Tools' },
  { path: '/Recorder', title: 'Free Online Screen Recorder' },
  { path: '/screen-recorder', title: 'Screen Recorder Online' },
  { path: '/qr-code', title: 'Free QR Code Generator Online' },
  { path: '/compress-image', title: 'Compress Image Online' },
  { path: '/image-resizer', title: 'Image Resizer Online' },
  { path: '/image-converter', title: 'Image Converter Online' },
  { path: '/image-cropper', title: 'Image Cropper Online' },
  { path: '/passport-photo', title: 'Passport Photo Maker Online' },
  { path: '/watermark-remover', title: 'Watermark Remover Online' },
  { path: '/remove-object', title: 'Remove Object from Image Online' },
  { path: '/collage', title: 'Photo and Video Collage Studio' },
  { path: '/shorts', title: 'YouTube Video to Shorts & Reels Maker' },
  { path: '/poster', title: 'Create Poster Online' },
  { path: '/fakechat', title: 'FakeChat Generator Online' },
  { path: '/get-emoji', title: 'GetEmoji – Copy and Paste Emojis' },
  { path: '/emoji-text', title: 'Emoji Text Generator' },
  { path: '/mindcloud', title: 'Mind Cloud Mind Mapping Tool' },
  { path: '/prompt-generator', title: 'AI Prompt Generator Studio' },
  { path: '/store', title: 'ImgMojo Digital Store' },
  { path: '/Globalsearch', title: 'Search Prompts & Tools' },
  { path: '/about', title: 'About Us' },
  { path: '/privacy', title: 'Privacy Policy' },
  { path: '/terms', title: 'Terms of Service' },
  { path: '/contact', title: 'Contact Us' },
]

// 2. Extract Catalog Prompts from local files
function extractLocalCatalogPrompts() {
  const prompts = []
  const catalogPath = path.join(ROOT_DIR, 'src', 'data', 'prompt-catalog.ts')
  if (fs.existsSync(catalogPath)) {
    const content = fs.readFileSync(catalogPath, 'utf8')
    const regex = /slug:\s*['"]([^'"]+)['"].*?title:\s*['"]([^'"]+)['"]/gs
    let match
    while ((match = regex.exec(content)) !== null) {
      prompts.push({
        slug: match[1].trim(),
        title: match[2].trim(),
        lastmod: formatDate(),
      })
    }
  }

  const demoPath = path.join(ROOT_DIR, 'src', 'data', 'demo-prompts.ts')
  if (fs.existsSync(demoPath)) {
    const content = fs.readFileSync(demoPath, 'utf8')
    const regex = /slug:\s*['"]([^'"]+)['"].*?title:\s*['"]([^'"]+)['"]/gs
    let match
    while ((match = regex.exec(content)) !== null) {
      if (!prompts.some((p) => p.slug === match[1].trim())) {
        prompts.push({
          slug: match[1].trim(),
          title: match[2].trim(),
          lastmod: formatDate(),
        })
      }
    }
  }
  return prompts
}

// 3. Fetch Live Blogger Posts if available
async function fetchBloggerPosts() {
  const posts = []
  try {
    let pageToken = null
    let fetched = 0
    do {
      const url = new URL(`https://www.googleapis.com/blogger/v3/blogs/${BLOGGER_BLOG_ID}/posts`)
      url.searchParams.set('key', BLOGGER_API_KEY)
      url.searchParams.set('maxResults', '500')
      url.searchParams.set('fetchBodies', 'false')
      url.searchParams.set('fetchImages', 'true')
      if (pageToken) url.searchParams.set('pageToken', pageToken)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      const res = await fetch(url.toString(), { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) break
      const data = await res.json()
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (!item.url) continue
          // Extract filename slug from Blogger URL, e.g. /political-birthday-wishes.html
          const slugMatch = item.url.match(/\/([^/]+?)(?:\.html)?$/i)
          if (!slugMatch) continue
          const rawSlug = slugMatch[1]
          const slug = rawSlug.replace(/\.html$/i, '')
          const published = item.published ? item.published.split('T')[0] : formatDate()
          const updated = item.updated ? item.updated.split('T')[0] : published
          const image = item.images && item.images[0] ? item.images[0].url : undefined

          posts.push({
            slug: `${slug}.html`,
            title: item.title || slug,
            lastmod: updated,
            image,
          })
          fetched++
        }
      }
      pageToken = data.nextPageToken
    } while (pageToken && fetched < 2000)
  } catch (err) {
    console.warn(`[sitemap] Could not fetch live Blogger posts (${err.message}). Using local catalog fallback.`)
  }
  return posts
}

export async function generateSitemap() {
  console.log('[sitemap] Generating sitemap.xml and sitemap.xml.gz for ImgMojo...')
  const today = formatDate()
  const urlEntries = []
  const seenUrls = new Set()

  function addUrl(loc, lastmod = today, image = null, title = '') {
    const cleanLoc = loc.trim()
    if (seenUrls.has(cleanLoc.toLowerCase())) return
    seenUrls.add(cleanLoc.toLowerCase())

    let xml = '  <url>\n'
    xml += `    <loc>${escapeXml(cleanLoc)}</loc>\n`
    if (lastmod) {
      xml += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`
    }

    if (image) {
      xml += '    <image:image>\n'
      xml += `      <image:loc>${escapeXml(image)}</image:loc>\n`
      if (title) xml += `      <image:title>${escapeXml(title)}</image:title>\n`
      xml += '    </image:image>\n'
    }

    xml += '  </url>'
    urlEntries.push(xml)
  }

  // 1. Add Static Routes
  for (const route of STATIC_ROUTES) {
    addUrl(`${BASE_URL}${route.path}`, today, null, route.title)
  }

  // 2. Fetch Live Blogger Posts
  const bloggerPosts = await fetchBloggerPosts()
  console.log(`[sitemap] Found ${bloggerPosts.length} live Blogger posts.`)

  for (const post of bloggerPosts) {
    addUrl(
      `${BASE_URL}/prompt/${post.slug}`,
      post.lastmod || today,
      post.image,
      post.title
    )
  }

  // 3. Add Local Catalog Prompts as fallbacks
  const localPrompts = extractLocalCatalogPrompts()
  console.log(`[sitemap] Found ${localPrompts.length} local catalog prompts.`)

  for (const p of localPrompts) {
    addUrl(
      `${BASE_URL}/prompt/${p.slug}.html`,
      p.lastmod || today,
      null,
      p.title
    )
  }

  // 4. Construct Full XML (clean, standard-compliant without ignored tags)
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>
`

  // 5. Write to public/sitemap.xml and public/sitemap.xml.gz
  const publicXmlPath = path.join(ROOT_DIR, 'public', 'sitemap.xml')
  fs.writeFileSync(publicXmlPath, sitemapXml, 'utf8')
  console.log(`[sitemap] Successfully wrote ${urlEntries.length} URLs to ${publicXmlPath}`)

  const gzipBuffer = zlib.gzipSync(Buffer.from(sitemapXml, 'utf-8'), { level: 9 })
  const publicGzPath = path.join(ROOT_DIR, 'public', 'sitemap.xml.gz')
  fs.writeFileSync(publicGzPath, gzipBuffer)
  console.log(`[sitemap] Successfully wrote compressed sitemap to ${publicGzPath}`)

  const distDir = path.join(ROOT_DIR, 'dist')
  if (fs.existsSync(distDir)) {
    const distXmlPath = path.join(distDir, 'sitemap.xml')
    fs.writeFileSync(distXmlPath, sitemapXml, 'utf8')
    const distGzPath = path.join(distDir, 'sitemap.xml.gz')
    fs.writeFileSync(distGzPath, gzipBuffer)
    console.log(`[sitemap] Mirrored sitemap.xml and sitemap.xml.gz to dist/`)
  }

  return urlEntries.length
}

// Auto-run if executed directly via node scripts/generate-sitemap.mjs
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemap().catch((err) => {
    console.error('[sitemap] Failed to generate sitemap:', err)
    process.exit(1)
  })
}
