import JSZip from 'jszip'
import type {
  ResizedItem,
  ResizeSettings,
  DimensionUnit,
  DpiOption,
  SocialPreset,
  CropRect,
} from './types'

export const SOCIAL_PRESETS: SocialPreset[] = [
  // Facebook
  { id: 'fb-profile', platform: 'Facebook', name: 'Profile', width: 170, height: 170, label: 'Profile (170 X 170)' },
  { id: 'fb-cover', platform: 'Facebook', name: 'Cover', width: 820, height: 312, label: 'Cover (820 X 312)' },
  { id: 'fb-post', platform: 'Facebook', name: 'Post', width: 1200, height: 900, label: 'Post (1200 X 900)' },
  { id: 'fb-ad', platform: 'Facebook', name: 'Ad', width: 1280, height: 720, label: 'Ad (1280 X 720)' },

  // Instagram
  { id: 'ig-profile', platform: 'Instagram', name: 'Profile', width: 110, height: 110, label: 'Profile (110 X 110)' },
  { id: 'ig-post', platform: 'Instagram', name: 'Post', width: 320, height: 320, label: 'Post (320 X 320)' },
  { id: 'ig-story', platform: 'Instagram', name: 'Story', width: 1080, height: 1920, label: 'Story (1080 X 1920)' },
  { id: 'ig-square', platform: 'Instagram', name: 'Square', width: 1080, height: 1080, label: 'Square (1080 X 1080)' },
  { id: 'ig-portrait', platform: 'Instagram', name: 'Portrait', width: 1080, height: 1350, label: 'Portrait (1080 X 1350)' },

  // Twitter
  { id: 'tw-profile', platform: 'Twitter', name: 'Profile', width: 400, height: 400, label: 'Profile (400 X 400)' },
  { id: 'tw-header', platform: 'Twitter', name: 'Header', width: 1500, height: 1500, label: 'Header (1500 X 1500)' },
  { id: 'tw-image', platform: 'Twitter', name: 'Image', width: 1024, height: 512, label: 'Image (1024 X 512)' },
  { id: 'tw-card', platform: 'Twitter', name: 'Card', width: 1200, height: 628, label: 'Card (1200 X 628)' },
  { id: 'tw-ad', platform: 'Twitter', name: 'Ad', width: 1200, height: 675, label: 'Ad (1200 X 675)' },

  // YouTube
  { id: 'yt-profile', platform: 'YouTube', name: 'Profile', width: 800, height: 800, label: 'Profile (800 X 800)' },
  { id: 'yt-art', platform: 'YouTube', name: 'Channel Art', width: 2560, height: 1440, label: 'Channel Art (2560 X 1440)' },
  { id: 'yt-thumb', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720, label: 'Thumbnail (1280 X 720)' },
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

export function convertUnitToPx(value: number, unit: DimensionUnit, dpi: DpiOption): number {
  if (value <= 0) return 0
  switch (unit) {
    case 'px':
      return Math.round(value)
    case 'in':
      return Math.round(value * dpi)
    case 'cm':
      return Math.round((value / 2.54) * dpi)
    case 'mm':
      return Math.round((value / 25.4) * dpi)
    default:
      return Math.round(value)
  }
}

export function convertPxToUnit(px: number, unit: DimensionUnit, dpi: DpiOption, decimals = 2): number {
  if (px <= 0) return 0
  switch (unit) {
    case 'px':
      return Math.round(px)
    case 'in':
      return parseFloat((px / dpi).toFixed(decimals))
    case 'cm':
      return parseFloat(((px / dpi) * 2.54).toFixed(decimals))
    case 'mm':
      return parseFloat(((px / dpi) * 25.4).toFixed(decimals))
    default:
      return Math.round(px)
  }
}

export function loadImageDimensions(file: File): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, url: objectUrl })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
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

export function calculateTargetDimensions(
  origW: number,
  origH: number,
  settings: ResizeSettings
): { targetW: number; targetH: number } {
  // If percentage mode
  if (settings.mode === 'percentage') {
    const scale = Math.max(1, Math.min(500, settings.percentage)) / 100
    const targetW = Math.max(1, Math.round(origW * scale))
    const targetH = Math.max(1, Math.round(origH * scale))
    return { targetW, targetH }
  }

  // Convert settings width and height from current unit to pixels
  const pxW = convertUnitToPx(settings.width, settings.unit, settings.dpi)
  const pxH = convertUnitToPx(settings.height, settings.unit, settings.dpi)

  let targetW = pxW > 0 ? pxW : origW
  let targetH = pxH > 0 ? pxH : origH

  if (settings.maintainAspectRatio) {
    const ratio = origW / origH
    if (pxW > 0 && pxH <= 0) {
      targetH = Math.max(1, Math.round(targetW / ratio))
    } else if (pxH > 0 && pxW <= 0) {
      targetW = Math.max(1, Math.round(targetH * ratio))
    } else if (pxW > 0 && pxH > 0) {
      const widthScale = pxW / origW
      const heightScale = pxH / origH
      const chosenScale = Math.min(widthScale, heightScale)
      targetW = Math.max(1, Math.round(origW * chosenScale))
      targetH = Math.max(1, Math.round(origH * chosenScale))
    }
  }

  return { targetW: Math.max(1, targetW), targetH: Math.max(1, targetH) }
}

export interface TransformOptions {
  rotation?: number
  flipH?: boolean
  crop?: CropRect
}

export async function resizeSingleImage(
  item: ResizedItem,
  settings: ResizeSettings,
  transforms?: TransformOptions
): Promise<{
  blob: Blob
  url: string
  size: number
  width: number
  height: number
  outputName: string
}> {
  const img = await loadImageFromUrl(item.originalUrl)

  // 1. Determine source image bounds (with crop if specified)
  const crop = transforms?.crop || item.crop
  const sourceX = crop ? Math.max(0, crop.x) : 0
  const sourceY = crop ? Math.max(0, crop.y) : 0
  const sourceW = crop ? Math.max(1, Math.min(item.originalWidth - sourceX, crop.width)) : item.originalWidth
  const sourceH = crop ? Math.max(1, Math.min(item.originalHeight - sourceY, crop.height)) : item.originalHeight

  // 2. Target dimensions
  const { targetW, targetH } = calculateTargetDimensions(sourceW, sourceH, settings)

  // 3. Transformations
  const rotation = transforms?.rotation !== undefined
    ? ((transforms.rotation % 360) + 360) % 360
    : ((item.rotation || 0) % 360 + 360) % 360

  const flipH = transforms?.flipH !== undefined ? !!transforms.flipH : !!item.flipH

  const isSwapped = rotation === 90 || rotation === 270

  // 4. Background Fill handling (e.g. for social media or fixed bounds with background)
  const isSocialMode = settings.mode === 'social-media'
  const isBgFill = settings.backgroundFill.enabled && (isSocialMode || !settings.maintainAspectRatio)
  const boxW = convertUnitToPx(settings.width, settings.unit, settings.dpi)
  const boxH = convertUnitToPx(settings.height, settings.unit, settings.dpi)

  let canvasW: number
  let canvasH: number
  let drawW = targetW
  let drawH = targetH

  if (isBgFill && boxW > 0 && boxH > 0) {
    canvasW = boxW
    canvasH = boxH
    // Scale image inside canvas box
    const scale = Math.min(boxW / sourceW, boxH / sourceH)
    drawW = Math.max(1, Math.round(sourceW * scale))
    drawH = Math.max(1, Math.round(sourceH * scale))
  } else {
    canvasW = isSwapped ? targetH : targetW
    canvasH = isSwapped ? targetW : targetH
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Determine output MIME & extension
  let mimeType = item.file.type || 'image/jpeg'
  let outExt = getFileExtension(item.name) || 'jpg'

  if (settings.format === 'jpeg') {
    mimeType = 'image/jpeg'
    outExt = 'jpg'
  } else if (settings.format === 'png') {
    mimeType = 'image/png'
    outExt = 'png'
  } else if (settings.format === 'webp') {
    mimeType = 'image/webp'
    outExt = 'webp'
  }

  // Background fill or default canvas background
  if (isBgFill) {
    if (settings.backgroundFill.transparent && mimeType === 'image/png') {
      ctx.clearRect(0, 0, canvasW, canvasH)
    } else {
      ctx.fillStyle = settings.backgroundFill.color || '#ffffff'
      ctx.fillRect(0, 0, canvasW, canvasH)
    }
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasW, canvasH)
  }

  // Draw image with transforms
  ctx.save()
  ctx.translate(canvasW / 2, canvasH / 2)
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180)
  }
  if (flipH) {
    ctx.scale(-1, 1)
  }

  const drawX = -drawW / 2
  const drawY = -drawH / 2
  ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, drawX, drawY, drawW, drawH)
  ctx.restore()

  // Quality & Target File Size
  let quality = Math.max(0.1, Math.min(1.0, settings.quality / 100))

  // If Target File Size is set and format is jpeg or webp
  let targetBytes: number | null = null
  if (settings.targetFileSizeEnabled && settings.targetFileSize && settings.targetFileSize > 0) {
    const mult = settings.targetSizeUnit === 'MB' ? 1024 * 1024 : 1024
    targetBytes = settings.targetFileSize * mult
  }

  const exportBlob = (q: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error(`Failed to encode image: ${item.name}`))
          else resolve(b)
        },
        mimeType,
        mimeType === 'image/png' ? undefined : q
      )
    })

  let finalBlob = await exportBlob(quality)

  // Target file size iterative refinement (binary search down to reach target size)
  if (targetBytes && (mimeType === 'image/jpeg' || mimeType === 'image/webp') && finalBlob.size > targetBytes) {
    let low = 0.05
    let high = quality
    let bestBlob = finalBlob

    for (let iter = 0; iter < 6; iter++) {
      const mid = (low + high) / 2
      const candidate = await exportBlob(mid)
      if (candidate.size <= targetBytes) {
        bestBlob = candidate
        low = mid
      } else {
        high = mid
      }
    }
    finalBlob = bestBlob
  }

  const url = URL.createObjectURL(finalBlob)
  const outputName = settings.format !== 'original' ? replaceExtension(item.name, outExt) : item.name

  return {
    blob: finalBlob,
    url,
    size: finalBlob.size,
    width: canvasW,
    height: canvasH,
    outputName,
  }
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
  items: ResizedItem[],
  folderName = 'ImgMojo-Resized-Images',
  onProgress?: (percent: number) => void
): Promise<{ zipBlob: Blob; zipFileName: string }> {
  const zip = new JSZip()
  const cleanFolder = folderName.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'ImgMojo-Resized-Images'
  const folder = zip.folder(cleanFolder) || zip

  const usedNames = new Set<string>()

  for (const item of items) {
    if (!item.resizedBlob) continue

    let filename = item.outputName || item.name
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
    folder.file(filename, item.resizedBlob)
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
