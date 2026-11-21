export type ResizeMode = 'dimensions' | 'percentage'
export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp'

export interface ResizeSettings {
  mode: ResizeMode
  width: number
  height: number
  percentage: number
  maintainAspectRatio: boolean
  format: OutputFormat
  quality: number // 1 - 100
  zipFolderName: string
}

export interface ResizedItem {
  id: string
  file: File
  name: string
  originalWidth: number
  originalHeight: number
  originalSize: number
  originalUrl: string
  aspectRatio: number

  // Processed state
  isProcessing: boolean
  resizedBlob?: Blob
  resizedUrl?: string
  resizedWidth?: number
  resizedHeight?: number
  resizedSize?: number
  outputName?: string
  error?: string
}

export interface DimensionPreset {
  id: string
  name: string
  width: number
  height: number
  tag: string
}
