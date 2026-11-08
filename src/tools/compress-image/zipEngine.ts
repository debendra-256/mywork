import JSZip from 'jszip'
import type { ImageItem } from './types'

export async function createAndDownloadZip(
  items: ImageItem[],
  folderName = 'compressed-images',
  onProgress?: (percent: number) => void
): Promise<{ zipBlob: Blob; zipFileName: string }> {
  const zip = new JSZip()
  const cleanFolderName = folderName.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/^\.+/, '') || 'compressed-images'
  
  // Create the subfolder inside the ZIP archive
  const targetFolder = zip.folder(cleanFolderName) || zip

  const usedNames = new Set<string>()

  for (const item of items) {
    if (!item.compressedBlob) continue

    let filename = item.outputName || item.name
    // Avoid duplicate filenames
    if (usedNames.has(filename)) {
      const dotIndex = filename.lastIndexOf('.')
      const base = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename
      const ext = dotIndex !== -1 ? filename.slice(dotIndex) : ''
      let counter = 1
      while (usedNames.has(`${base}-${counter}${ext}`)) {
        counter++
      }
      filename = `${base}-${counter}${ext}`
    }
    usedNames.add(filename)

    targetFolder.file(filename, item.compressedBlob)
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata: { percent: number; currentFile: string | null }) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent))
      }
    }
  )

  const zipFileName = `${cleanFolderName}.zip`

  // Trigger download
  const downloadUrl = URL.createObjectURL(zipBlob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = zipFileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Cleanup object URL
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000)

  return { zipBlob, zipFileName }
}

export function downloadSingleFile(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000)
}
