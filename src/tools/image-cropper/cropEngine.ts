import type { CropArea, CropSettings, CropperPreset } from './types'

export const CROP_PRESETS: CropperPreset[] = [
  { id: 'free', name: 'Freeform', ratio: null, label: 'Custom' },
  { id: '1:1', name: 'Square (1:1)', ratio: 1, label: 'Instagram, Avatar' },
  { id: '4:5', name: 'Portrait (4:5)', ratio: 4 / 5, label: 'Instagram Post' },
  { id: '16:9', name: 'Landscape (16:9)', ratio: 16 / 9, label: 'YouTube, Web' },
  { id: '9:16', name: 'Story (9:16)', ratio: 9 / 16, label: 'TikTok, Reel' },
  { id: '4:3', name: 'Standard (4:3)', ratio: 4 / 3, label: 'Tablet, Print' },
  { id: '3:2', name: 'Classic (3:2)', ratio: 3 / 2, label: '35mm Camera' },
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
  // Create an offscreen canvas for rotation/flip transformations if needed
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  const cropW = Math.max(1, Math.round(cropArea.width))
  const cropH = Math.max(1, Math.round(cropArea.height))

  // Determine rotation orientation
  const rot = (settings.rotation % 360 + 360) % 360
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
