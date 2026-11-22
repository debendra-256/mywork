import type { CropArea, CropSettings, CropperPreset } from './types'

export const CROP_PRESETS: CropperPreset[] = [
  // Standard Presets
  { id: 'free', name: 'FreeForm', ratio: null, label: 'Freeform', category: 'Standard' },
  { id: 'original', name: 'Original', ratio: null, label: 'Match Source', category: 'Standard' },
  { id: 'custom', name: 'Custom', ratio: null, label: 'Custom Ratio', category: 'Standard' },
  { id: '1:1', name: '1:1 (Square)', ratio: 1, label: 'Square', category: 'Standard' },
  { id: '4:3', name: '4:3 (Monitor)', ratio: 4 / 3, label: 'Standard Screen', category: 'Standard' },
  { id: '14:9', name: '14:9', ratio: 14 / 9, label: 'Commercials', category: 'Standard' },
  { id: '16:9', name: '16:9 (Widescreen)', ratio: 16 / 9, label: 'Widescreen HD', category: 'Standard' },
  { id: '16:10', name: '16:10', ratio: 16 / 10, label: 'Computer Display', category: 'Standard' },
  { id: '2:1', name: '2:1', ratio: 2 / 1, label: 'Univisium', category: 'Standard' },
  { id: '3:1', name: '3:1 (Panorama)', ratio: 3 / 1, label: 'Panoramic Landscape', category: 'Standard' },
  { id: '4:1', name: '4:1', ratio: 4 / 1, label: 'Ultrawide Banner', category: 'Standard' },
  { id: '3:2', name: '3:2 (35mm film)', ratio: 3 / 2, label: 'Classic Photography', category: 'Standard' },
  { id: '5:4', name: '5:4', ratio: 5 / 4, label: 'Large Format Photo', category: 'Standard' },
  { id: '7:5', name: '7:5', ratio: 7 / 5, label: 'Standard Print 5x7', category: 'Standard' },
  { id: '4:5', name: '4:5 (Vertical Portrait)', ratio: 4 / 5, label: 'Instagram Portrait', category: 'Standard' },
  { id: '9:16', name: '9:16 (Story / Reel)', ratio: 9 / 16, label: 'Mobile Fullscreen', category: 'Standard' },
  { id: '19:10', name: '19:10', ratio: 19 / 10, label: 'Modern Smartphone', category: 'Standard' },
  { id: '21:9', name: '21:9 (Cinemascope)', ratio: 21 / 9, label: 'Cinematic Anamorphic', category: 'Standard' },
  { id: '32:9', name: '32:9 (Super Ultra Wide)', ratio: 32 / 9, label: 'Super Ultrawide', category: 'Standard' },

  // Social Media Presets
  { id: 'fb-profile', name: 'Facebook profile 170x170', ratio: 1, label: 'Avatar', category: 'Social Media', targetWidth: 170, targetHeight: 170 },
  { id: 'fb-cover', name: 'Facebook cover 820x312', ratio: 820 / 312, label: 'Cover Banner', category: 'Social Media', targetWidth: 820, targetHeight: 312 },
  { id: 'fb-post', name: 'Facebook post 1200x900', ratio: 1200 / 900, label: 'Timeline Post', category: 'Social Media', targetWidth: 1200, targetHeight: 900 },
  { id: 'fb-ad', name: 'Facebook ad 1280x720', ratio: 16 / 9, label: 'Landscape Ad', category: 'Social Media', targetWidth: 1280, targetHeight: 720 },
  { id: 'ig-profile', name: 'Instagram profile 110x110', ratio: 1, label: 'Avatar', category: 'Social Media', targetWidth: 110, targetHeight: 110 },
  { id: 'ig-post', name: 'Instagram post 1080x1080', ratio: 1, label: 'Square Post', category: 'Social Media', targetWidth: 1080, targetHeight: 1080 },
  { id: 'ig-story', name: 'Instagram story 1080x1920', ratio: 9 / 16, label: 'Story & Reel', category: 'Social Media', targetWidth: 1080, targetHeight: 1920 },
  { id: 'twitter-profile', name: 'Twitter profile 400x400', ratio: 1, label: 'Profile Avatar', category: 'Social Media', targetWidth: 400, targetHeight: 400 },
  { id: 'twitter-header', name: 'Twitter header 1500x500', ratio: 3 / 1, label: 'Header Banner', category: 'Social Media', targetWidth: 1500, targetHeight: 500 },
  { id: 'twitter-image', name: 'Twitter image 1024x512', ratio: 2 / 1, label: 'Tweet Image', category: 'Social Media', targetWidth: 1024, targetHeight: 512 },
  { id: 'twitter-card', name: 'Twitter card 1200x628', ratio: 1200 / 628, label: 'Web Summary Card', category: 'Social Media', targetWidth: 1200, targetHeight: 628 },
  { id: 'twitter-ad', name: 'Twitter ad 1200x675', ratio: 16 / 9, label: 'Promo Ad', category: 'Social Media', targetWidth: 1200, targetHeight: 675 },
  { id: 'youtube-profile', name: 'Youtube profile 800x800', ratio: 1, label: 'Channel Avatar', category: 'Social Media', targetWidth: 800, targetHeight: 800 },
  { id: 'youtube-channel-art', name: 'Youtube channel art 2560x1440', ratio: 16 / 9, label: 'Channel Art Banner', category: 'Social Media', targetWidth: 2560, targetHeight: 1440 },
  { id: 'youtube-thumb', name: 'Youtube thumb 1280x720', ratio: 16 / 9, label: 'HD Thumbnail', category: 'Social Media', targetWidth: 1280, targetHeight: 720 },

  // Web & Display Presets
  { id: 'web-mini', name: 'Web mini 1024x768', ratio: 4 / 3, label: 'Standard Tablet', category: 'Web & Screen', targetWidth: 1024, targetHeight: 768 },
  { id: 'web-small', name: 'Web small 1280x800', ratio: 16 / 10, label: 'Small Laptop', category: 'Web & Screen', targetWidth: 1280, targetHeight: 800 },
  { id: 'web-common', name: 'Web common 1366x768', ratio: 1366 / 768, label: 'Common Laptop', category: 'Web & Screen', targetWidth: 1366, targetHeight: 768 },
  { id: 'web-medium', name: 'Web medium 1440x900', ratio: 16 / 10, label: 'Desktop Monitor', category: 'Web & Screen', targetWidth: 1440, targetHeight: 900 },
  { id: 'fll-hd', name: 'Full HD 1920x1080', ratio: 16 / 9, label: '1080p FHD Screen', category: 'Web & Screen', targetWidth: 1920, targetHeight: 1080 },
  { id: 'ultra-hd-4k', name: 'Ultra HD 4x 3840x2160', ratio: 16 / 9, label: '4K UHD Display', category: 'Web & Screen', targetWidth: 3840, targetHeight: 2160 },

  // Paper Sizes
  { id: 'paper-a4', name: 'Paper A4 2480x3508', ratio: 2480 / 3508, label: 'A4 Document (300 DPI)', category: 'Paper', targetWidth: 2480, targetHeight: 3508 },
  { id: 'paper-a5', name: 'Paper A5 1748x2480', ratio: 1748 / 2480, label: 'A5 Notebook (300 DPI)', category: 'Paper', targetWidth: 1748, targetHeight: 2480 },
  { id: 'paper-a6', name: 'Paper A6 1280x1748', ratio: 1280 / 1748, label: 'A6 Postcard (300 DPI)', category: 'Paper', targetWidth: 1280, targetHeight: 1748 },
  { id: 'paper-letter', name: 'Paper letter 2400x3300', ratio: 2400 / 3300, label: 'US Letter (300 DPI)', category: 'Paper', targetWidth: 2400, targetHeight: 3300 },
]

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export function replaceExtension(filename: string, newExt: string): string {
  const lastDot = filename.lastIndexOf('.')
  const base = lastDot !== -1 ? filename.slice(0, lastDot) : filename
  return `${base}.${newExt}`
}

export function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ img, url, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not load image: ${file.name}`))
    }
    img.src = url
  })
}

export async function exportCroppedImage(
  img: HTMLImageElement,
  cropArea: CropArea,
  settings: CropSettings,
  originalFilename: string
): Promise<{
  blob: Blob
  url: string
  size: number
  width: number
  height: number
  filename: string
}> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  const cropW = Math.max(1, Math.round(cropArea.width))
  const cropH = Math.max(1, Math.round(cropArea.height))

  // Determine rotation orientation
  const rot = ((settings.rotation % 360) + 360) % 360
  const isRotated90or270 = rot === 90 || rot === 270

  canvas.width = isRotated90or270 ? cropH : cropW
  canvas.height = isRotated90or270 ? cropW : cropH

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.save()
  // Move origin to center of target canvas
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rot * Math.PI) / 180)
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1)

  // Draw the cropped portion centered
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    -cropW / 2,
    -cropH / 2,
    cropW,
    cropH
  )
  ctx.restore()

  let mimeType = 'image/jpeg'
  let ext = 'jpg'
  if (settings.format === 'png') {
    mimeType = 'image/png'
    ext = 'png'
  } else if (settings.format === 'webp') {
    mimeType = 'image/webp'
    ext = 'webp'
  }

  const quality = Math.max(0.1, Math.min(1.0, settings.quality / 100))

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode cropped image'))
          return
        }
        const url = URL.createObjectURL(blob)
        const filename = `cropped-${replaceExtension(originalFilename, ext)}`
        resolve({
          blob,
          url,
          size: blob.size,
          width: canvas.width,
          height: canvas.height,
          filename,
        })
      },
      mimeType,
      mimeType === 'image/png' ? undefined : quality
    )
  })
}

export function downloadSingleFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
