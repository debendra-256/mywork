import JSZip from 'jszip'
import type { ConvertItem, ConvertSettings, FormatInfo } from './types'

export const FORMAT_CATALOG: FormatInfo[] = [
  {
    id: 'webp',
    name: 'WebP',
    extension: 'webp',
    mimeType: 'image/webp',
    badge: 'Modern Web',
    description: 'Ultra-efficient modern format offering superior lossy and lossless compression with transparency.',
    supportsTransparency: true,
    supportsCompression: true,
  },
  {
    id: 'jpeg',
    name: 'JPG / JPEG',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    badge: 'Universal',
    description: 'Widely compatible photography format. Best for websites, sharing, and print.',
    supportsTransparency: false,
    supportsCompression: true,
  },
  {
    id: 'png',
    name: 'PNG',
    extension: 'png',
    mimeType: 'image/png',
    badge: 'Lossless',
    description: 'Lossless graphics format supporting full alpha transparency. Ideal for logos, icons, and text.',
    supportsTransparency: true,
    supportsCompression: false,
  },
  {
    id: 'avif',
    name: 'AVIF',
    extension: 'avif',
    mimeType: 'image/avif',
    badge: 'Next-Gen',
    description: 'Next-generation AV1 image format with highest compression ratios in modern browsers.',
    supportsTransparency: true,
    supportsCompression: true,
  },
  {
    id: 'gif',
    name: 'GIF (Static)',
    extension: 'gif',
    mimeType: 'image/gif',
    badge: 'Classic',
    description: 'Standard 256-color palette format for simple graphics and legacy compatibility.',
    supportsTransparency: true,
    supportsCompression: false,
  },
  {
    id: 'bmp',
    name: 'BMP',
    extension: 'bmp',
    mimeType: 'image/bmp',
    badge: 'Bitmap',
    description: 'Uncompressed Windows raster bitmap format for legacy system compatibility.',
    supportsTransparency: false,
    supportsCompression: false,
  },
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

export function loadImageData(file: File): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, url: objectUrl })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load file: ${file.name}`))
    }
    img.src = objectUrl
  })
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image element'))
    img.src = url
  })
}

export async function convertSingleImage(
  item: ConvertItem,
  settings: ConvertSettings
): Promise<{
  blob: Blob
  url: string
  size: number
  convertedName: string
  width: number
  height: number
}> {
  const img = await loadImageFromUrl(item.originalUrl)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const formatMeta = FORMAT_CATALOG.find((f) => f.id === settings.targetFormat) || FORMAT_CATALOG[0]

  // If target format doesn't support transparency or user requested removal, fill background
  if (!formatMeta.supportsTransparency || settings.removeTransparency) {
    ctx.fillStyle = settings.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)

  const quality = Math.max(0.1, Math.min(1.0, settings.quality / 100))
  let mimeType = formatMeta.mimeType

  // Test if browser supports target mimeType with canvas.toDataURL
  const sample = canvas.toDataURL(mimeType)
  if (!sample.startsWith(`data:${mimeType}`)) {
    // Fallback if browser doesn't support AVIF or BMP via canvas
    if (settings.targetFormat === 'avif') mimeType = 'image/webp'
    else if (settings.targetFormat === 'bmp') mimeType = 'image/png'
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Could not convert image to ${formatMeta.name}`))
          return
        }
        const url = URL.createObjectURL(blob)
        const convertedName = replaceExtension(item.name, formatMeta.extension)
        resolve({
          blob,
          url,
          size: blob.size,
          convertedName,
          width,
          height,
        })
      },
      mimeType,
      formatMeta.supportsCompression ? quality : undefined
    )
  })
}

export function downloadSingleFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function createAndDownloadZip(
  items: ConvertItem[],
  folderName = 'ImgMojo-Converted-Images',
  onProgress?: (percent: number) => void
): Promise<{ zipBlob: Blob; zipFileName: string }> {
  const zip = new JSZip()
  const cleanFolder = folderName.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'ImgMojo-Converted-Images'
  const folder = zip.folder(cleanFolder) || zip

  const usedNames = new Set<string>()

  for (const item of items) {
    if (!item.convertedBlob) continue

    let filename = item.convertedName || item.name
    if (usedNames.has(filename)) {
      const ext = getFileExtension(filename)
      const base = filename.replace(new RegExp(`\\.${ext}$`, 'i'), '')
      let count = 1
      while (usedNames.has(`${base}-${count}.${ext}`)) {
        count++
      }
      filename = `${base}-${count}.${ext}`
    }
    usedNames.add(filename)
    folder.file(filename, item.convertedBlob)
  }

  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => {
      if (onProgress) onProgress(Math.round(meta.percent))
    }
  )

  const zipFileName = `${cleanFolder}.zip`
  downloadSingleFile(zipBlob, zipFileName)
  return { zipBlob, zipFileName }
}
