/** Google's image proxy re-renders a Blogger cover at any width on request, so each surface can take the size it actually draws. */
const sizeDirective = /([/=])[swh]\d+(?![\w-])/i

export function imageAtWidth(url: string | undefined, width: number): string | undefined {
  return url?.replace(sizeDirective, `$1s${width}`)
}

const renditions = [320, 480, 640, 960, 1200]

/** Lets the browser choose a Blogger rendition for the space and pixel density, so retina screens stay sharp without phones downloading megabytes. */
export function responsiveImage(url: string | undefined, sizes: string): { src?: string; srcSet?: string; sizes?: string } {
  if (!url) return {}
  const directive = url.match(sizeDirective)?.[0]
  if (!directive) return { src: url }
  return {
    src: imageAtWidth(url, 640),
    srcSet: renditions.map((width) => `${imageAtWidth(url, width)} ${width}w`).join(', '),
    sizes,
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
}

export async function downloadImageFile(imageUrl: string, filename = 'image.jpg'): Promise<boolean> {
  if (!imageUrl) return false
  const cleanName = filename.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'image.jpg'
  const finalFilename = /\.(jpe?g|png|webp|gif)$/i.test(cleanName) ? cleanName : `${cleanName}.jpg`
  const targetUrl = imageAtWidth(imageUrl, 1600) || imageUrl

  // Strategy 1: Direct CORS fetch
  try {
    const res = await fetch(targetUrl, { mode: 'cors' })
    if (res.ok) {
      const blob = await res.blob()
      triggerBlobDownload(blob, finalFilename)
      return true
    }
  } catch {
    // Continue to proxy strategy
  }

  // Strategy 2: Via local proxy if Google/Blogger image
  try {
    const res = await fetch(`/api/poster-photo?photo=${encodeURIComponent(targetUrl)}`)
    if (res.ok) {
      const blob = await res.blob()
      triggerBlobDownload(blob, finalFilename)
      return true
    }
  } catch {
    // Continue to canvas strategy
  }

  // Strategy 3: Canvas drawing
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95)
            return
          }
        } catch {
          // Canvas tainted
        }
        resolve(null)
      }
      img.onerror = () => resolve(null)
      img.src = targetUrl
    })
    if (blob) {
      triggerBlobDownload(blob, finalFilename)
      return true
    }
  } catch {
    // Continue to fallback
  }

  // Strategy 4: Fallback to anchor click or new tab
  try {
    const a = document.createElement('a')
    a.href = targetUrl
    a.download = finalFilename
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch {
    window.open(targetUrl, '_blank')
    return false
  }
}
