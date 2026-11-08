export type CompressionPreset = 'recommended' | 'extreme' | 'low' | 'custom'
export type OutputFormat = 'original' | 'image/jpeg' | 'image/webp' | 'image/png'

export interface CompressionSettings {
  preset: CompressionPreset
  quality: number // 1 - 100
  format: OutputFormat
  maxDimension: number // 0 = keep original, or 1920, 1280, etc.
  zipFolderName: string
}

export type ImageStatus = 'pending' | 'compressing' | 'done' | 'error'

export interface ImageItem {
  id: string
  file: File
  name: string
  originalSize: number
  previewUrl: string
  width?: number
  height?: number
  status: ImageStatus
  error?: string
  compressedBlob?: Blob
  compressedUrl?: string
  compressedSize?: number
  outputName?: string
  reductionPercent?: number
}

export interface CompressionSummary {
  totalOriginalSize: number
  totalCompressedSize: number
  savedBytes: number
  savedPercent: number
  completedCount: number
  totalCount: number
}
