import { PDFDocument } from 'pdf-lib'
import { isEncrypted, decryptPDF } from '@pdfsmaller/pdf-decrypt'
import type { EncryptionInfo } from './types'

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}

export interface InspectResult {
  isEncrypted: boolean
  requiresPassword: boolean
  encryptionInfo?: EncryptionInfo
  pageCount?: number
}

/**
 * Inspects a PDF file to check whether it is encrypted,
 * and if so, whether it requires a user password or can be unlocked directly (permissions lock).
 */
export async function inspectPdfFile(file: File): Promise<InspectResult> {
  const bytes = await fileToUint8Array(file)

  // Verify PDF header magic bytes (%PDF-)
  const header = String.fromCharCode(...bytes.subarray(0, 5))
  if (!header.startsWith('%PDF')) {
    throw new Error('The selected file does not appear to be a valid PDF document.')
  }

  const encInfo = await isEncrypted(bytes)
  if (!encInfo.encrypted) {
    let pageCount = 0
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
      pageCount = doc.getPageCount()
    } catch {
      // Ignore if metadata extraction fails
    }
    return {
      isEncrypted: false,
      requiresPassword: false,
      pageCount,
    }
  }

  // File is encrypted. Test if an empty password unlocks it (Owner/Permissions lock).
  try {
    const decrypted = await decryptPDF(bytes, '')
    const doc = await PDFDocument.load(decrypted, { ignoreEncryption: true, updateMetadata: false })
    return {
      isEncrypted: true,
      requiresPassword: false, // Can be unlocked without password!
      encryptionInfo: encInfo,
      pageCount: doc.getPageCount(),
    }
  } catch {
    // Requires an open / user password
    return {
      isEncrypted: true,
      requiresPassword: true,
      encryptionInfo: encInfo,
    }
  }
}

export interface UnlockResult {
  unlockedBytes: Uint8Array
  pageCount: number
  alreadyUnlocked?: boolean
}

/**
 * Decrypts a PDF file using the provided password or empty string,
 * then re-encodes it into an unlocked, restriction-free standard PDF.
 */
export async function unlockPdfFile(file: File, password = ''): Promise<UnlockResult> {
  const bytes = await fileToUint8Array(file)

  const encInfo = await isEncrypted(bytes)
  if (!encInfo.encrypted) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const unlockedBytes = await doc.save()
    return {
      unlockedBytes,
      pageCount: doc.getPageCount(),
      alreadyUnlocked: true,
    }
  }

  try {
    const decryptedBytes = await decryptPDF(bytes, password)
    const doc = await PDFDocument.load(decryptedBytes, { ignoreEncryption: true })
    const pageCount = doc.getPageCount()
    const unlockedBytes = await doc.save()
    return {
      unlockedBytes,
      pageCount,
      alreadyUnlocked: false,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.toLowerCase().includes('password') ||
      message.toLowerCase().includes('incorrect') ||
      message.toLowerCase().includes('failed to decrypt') ||
      message.toLowerCase().includes('hash mismatch')
    ) {
      throw new Error('Incorrect password. Please verify the password and try again.')
    }
    throw new Error(`Failed to decrypt PDF: ${message}`)
  }
}

export function downloadUnlockedPdf(blob: Blob, originalName: string) {
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'document'
  const downloadName = `${baseName}_unlocked.pdf`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
