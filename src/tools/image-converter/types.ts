export type TargetFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'avif'

export interface ConvertSettings {
  targetFormat: TargetFormat
  quality: number // 1 - 100 (for lossy formats)
  backgroundColor: string // for converting transparent PNG to JPEG
  removeTransparency: boolean
  zipFolderName: string
}

export interface ConvertItem {
  id: string
  file: File
  name: string
  originalSize: number
  originalFormat: string
  originalUrl: string
  originalWidth: number
  originalHeight: number

  // Converted result
  isConverting: boolean
  convertedBlob?: Blob
  convertedUrl?: string
  convertedSize?: number
  convertedName?: string
  convertedWidth?: number
  convertedHeight?: number
  error?: string
}

export interface FormatInfo {
  id: TargetFormat
  name: string
  extension: string
  mimeType: string
  badge: string
  description: string
  supportsTransparency: boolean
  supportsCompression: boolean
}
