import fs from 'node:fs'
import path from 'node:path'
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
  { path: '/', priority: '1.0', changefreq: 'daily', title: 'ImgMojo – Free Online Image, Video & PDF Tools' },
  { path: '/Recorder', priority: '0.9', changefreq: 'weekly', title: 'Free Online Screen Recorder' },
  { path: '/screen-recorder', priority: '0.8', changefreq: 'weekly', title: 'Screen Recorder Online' },
  { path: '/qr-code', priority: '0.9', changefreq: 'weekly', title: 'Free QR Code Generator Online' },
  { path: '/compress-image', priority: '0.9', changefreq: 'weekly', title: 'Compress Image Online' },
  { path: '/image-resizer', priority: '0.9', changefreq: 'weekly', title: 'Image Resizer Online' },
  { path: '/image-converter', priority: '0.9', changefreq: 'weekly', title: 'Image Converter Online' },
  { path: '/image-cropper', priority: '0.8', changefreq: 'weekly', title: 'Image Cropper Online' },
  { path: '/passport-photo', priority: '0.9', changefreq: 'weekly', title: 'Passport Photo Maker Online' },
  { path: '/watermark-remover', priority: '0.8', changefreq: 'weekly', title: 'Watermark Remover Online' },
  { path: '/remove-object', priority: '0.8', changefreq: 'weekly', title: 'Remove Object from Image Online' },
  { path: '/collage', priority: '0.8', changefreq: 'weekly', title: 'Photo and Video Collage Studio' },
  { path: '/shorts', priority: '0.8', changefreq: 'weekly', title: 'YouTube Video to Shorts & Reels Maker' },
  { path: '/poster', priority: '0.8', changefreq: 'weekly', title: 'Create Poster Online' },
  { path: '/fakechat', priority: '0.7', changefreq: 'weekly', title: 'FakeChat Generator Online' },
  { path: '/get-emoji', priority: '0.7', changefreq: 'weekly', title: 'GetEmoji – Copy and Paste Emojis' },
  { path: '/emoji-text', priority: '0.7', changefreq: 'weekly', title: 'Emoji Text Generator' },
  { path: '/mindcloud', priority: '0.7', changefreq: 'weekly', title: 'Mind Cloud Mind Mapping Tool' },
  { path: '/prompt-generator', priority: '0.8', changefreq: 'weekly', title: 'AI Prompt Generator Studio' },
  { path: '/store', priority: '0.8', changefreq: 'daily', title: 'ImgMojo Digital Store' },
  { path: '/Globalsearch', priority: '0.6', changefreq: 'weekly', title: 'Search Prompts & Tools' },
  { path: '/about', priority: '0.5', changefreq: 'monthly', title: 'About Us' },
  { path: '/privacy', priority: '0.5', changefreq: 'monthly', title: 'Privacy Policy' },
  { path: '/terms', priority: '0.5', changefreq: 'monthly', title: 'Terms of Service' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly', title: 'Contact Us' },
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
  console.log('[sitemap] Generating sitemap.xml for ImgMojo...')
  const today = formatDate()
  const urlEntries = []
  const seenUrls = new Set()

  function addUrl(loc, lastmod = today, changefreq = 'weekly', priority = '0.7', image = null, title = '') {
    const cleanLoc = loc.trim()
    if (seenUrls.has(cleanLoc.toLowerCase())) return
    seenUrls.add(cleanLoc.toLowerCase())

    let xml = '  <url>\n'
    xml += `    <loc>${escapeXml(cleanLoc)}</loc>\n`
    xml += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`
    xml += `    <changefreq>${escapeXml(changefreq)}</changefreq>\n`
    xml += `    <priority>${escapeXml(priority)}</priority>\n`

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
    addUrl(`${BASE_URL}${route.path}`, today, route.changefreq, route.priority)
  }

  // 2. Fetch Live Blogger Posts
  const bloggerPosts = await fetchBloggerPosts()
  console.log(`[sitemap] Found ${bloggerPosts.length} live Blogger posts.`)

  for (const post of bloggerPosts) {
    addUrl(
      `${BASE_URL}/prompt/${post.slug}`,
      post.lastmod || today,
      'weekly',
      '0.8',
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
      'weekly',
      '0.8',
      null,
      p.title
    )
  }

  // 4. Construct Full XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>
`

  // 5. Write to public/sitemap.xml and dist/sitemap.xml
  const publicPath = path.join(ROOT_DIR, 'public', 'sitemap.xml')
  fs.writeFileSync(publicPath, sitemapXml, 'utf8')
  console.log(`[sitemap] Successfully wrote ${urlEntries.length} URLs to ${publicPath}`)

  const distDir = path.join(ROOT_DIR, 'dist')
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, 'sitemap.xml')
    fs.writeFileSync(distPath, sitemapXml, 'utf8')
    console.log(`[sitemap] Mirrored sitemap to ${distPath}`)
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
