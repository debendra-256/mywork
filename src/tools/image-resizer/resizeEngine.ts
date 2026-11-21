import JSZip from 'jszip'
import type { ResizedItem, ResizeSettings } from './types'

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
  if (settings.mode === 'percentage') {
    const scale = Math.max(1, Math.min(500, settings.percentage)) / 100
    const targetW = Math.max(1, Math.round(origW * scale))
    const targetH = Math.max(1, Math.round(origH * scale))
    return { targetW, targetH }
  }

  // Dimension mode
  let targetW = settings.width > 0 ? settings.width : origW
  let targetH = settings.height > 0 ? settings.height : origH

  if (settings.maintainAspectRatio) {
    const ratio = origW / origH
    if (settings.width > 0 && settings.height <= 0) {
      targetH = Math.max(1, Math.round(targetW / ratio))
    } else if (settings.height > 0 && settings.width <= 0) {
      targetW = Math.max(1, Math.round(targetH * ratio))
    } else if (settings.width > 0 && settings.height > 0) {
      // Fit proportionally within bounding box
      const widthScale = settings.width / origW
      const heightScale = settings.height / origH
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
  const { targetW, targetH } = calculateTargetDimensions(item.originalWidth, item.originalHeight, settings)
  const rotation = transforms?.rotation ? (transforms.rotation % 360 + 360) % 360 : 0
  const flipH = !!transforms?.flipH

  const isSwapped = rotation === 90 || rotation === 270
  const canvasW = isSwapped ? targetH : targetW
  const canvasH = isSwapped ? targetW : targetH

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // If converting to JPEG, fill transparent background with white
  let mimeType = item.file.type || 'image/jpeg'
  let outExt = getFileExtension(item.name) || 'jpg'

  if (settings.format === 'jpeg') {
    mimeType = 'image/jpeg'
    outExt = 'jpg'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasW, canvasH)
  } else if (settings.format === 'png') {
    mimeType = 'image/png'
    outExt = 'png'
  } else if (settings.format === 'webp') {
    mimeType = 'image/webp'
    outExt = 'webp'
  } else {
    // Original format
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasW, canvasH)
    }
  }

  ctx.save()
  ctx.translate(canvasW / 2, canvasH / 2)
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180)
  }
  if (flipH) {
    ctx.scale(-1, 1)
  }
  ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH)
  ctx.restore()

  const quality = Math.max(0.1, Math.min(1.0, settings.quality / 100))

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode image: ${item.name}`))
          return
        }

        const url = URL.createObjectURL(blob)
        const outputName = settings.format !== 'original' ? replaceExtension(item.name, outExt) : item.name

        resolve({
          blob,
          url,
          size: blob.size,
          width: canvasW,
          height: canvasH,
          outputName,
        })
      },
      mimeType,
      mimeType === 'image/png' ? undefined : quality
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
