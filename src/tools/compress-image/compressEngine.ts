import type { CompressionSettings, ImageItem } from './types'

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

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not load image: ${file.name}`))
    }
    img.src = objectUrl
  })
}

export async function compressSingleImage(
  item: ImageItem,
  settings: CompressionSettings
): Promise<{
  blob: Blob
  url: string
  size: number
  outputName: string
  reductionPercent: number
  width: number
  height: number
}> {
  const img = await loadImageElement(item.file)
  const origWidth = img.naturalWidth || img.width
  const origHeight = img.naturalHeight || img.height

  let targetWidth = origWidth
  let targetHeight = origHeight

  if (settings.maxDimension > 0) {
    if (origWidth > origHeight && origWidth > settings.maxDimension) {
      targetWidth = settings.maxDimension
      targetHeight = Math.round((origHeight * settings.maxDimension) / origWidth)
    } else if (origHeight > settings.maxDimension) {
      targetHeight = settings.maxDimension
      targetWidth = Math.round((origWidth * settings.maxDimension) / origHeight)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) throw new Error('Could not initialize canvas rendering context.')

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Determine output MIME type
  let targetMime: string
  const ext = getFileExtension(item.name)

  if (settings.format === 'original') {
    if (ext === 'png') {
      // Check if user set quality < 95. If so, WebP preserves transparency and yields 60-80% compression.
      // If user wants original PNG and high quality, fallback to image/png
      targetMime = settings.quality < 90 ? 'image/webp' : 'image/png'
    } else if (ext === 'webp') {
      targetMime = 'image/webp'
    } else {
      targetMime = 'image/jpeg'
    }
  } else {
    targetMime = settings.format
  }

  // If output is JPEG, canvas has no alpha channel, so fill with white background
  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  const normalizedQuality = Math.max(0.01, Math.min(1.0, settings.quality / 100))

  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas image compression failed.'))
      },
      targetMime,
      normalizedQuality
    )
  })

  // Determine final extension
  let outExt = ext
  if (targetMime === 'image/webp') outExt = 'webp'
  else if (targetMime === 'image/jpeg') outExt = 'jpg'
  else if (targetMime === 'image/png') outExt = 'png'

  let outputName = replaceExtension(item.name, outExt)

  // Guard: if compressed blob is unexpectedly larger than original, and format wasn't explicitly changed,
  // preserve original file to protect user from bloating
  let finalBlob = compressedBlob
  if (compressedBlob.size >= item.originalSize && settings.format === 'original' && settings.maxDimension === 0) {
    finalBlob = item.file
    outputName = item.name
  }

  const reductionPercent = Math.max(
    0,
    Math.round(((item.originalSize - finalBlob.size) / item.originalSize) * 100)
  )

  const url = URL.createObjectURL(finalBlob)

  return {
    blob: finalBlob,
    url,
    size: finalBlob.size,
    outputName,
    reductionPercent,
    width: targetWidth,
    height: targetHeight,
  }
}
