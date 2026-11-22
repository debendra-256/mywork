export type ResizeMode = 'by-size' | 'percentage' | 'social-media' | 'dimensions'
export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp'
export type DimensionUnit = 'px' | 'in' | 'cm' | 'mm'
export type DpiOption = 72 | 96 | 150 | 300
export type SocialPlatform = 'Facebook' | 'Instagram' | 'Twitter' | 'YouTube'
export type TargetSizeUnit = 'KB' | 'MB'

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface BackgroundFillSettings {
  enabled: boolean
  color: string
  transparent: boolean
}

export interface ResizeSettings {
  mode: ResizeMode
  width: number
  height: number
  percentage: number
  maintainAspectRatio: boolean
  unit: DimensionUnit
  dpi: DpiOption
  socialPlatform: SocialPlatform
  socialPreset: string
  backgroundFill: BackgroundFillSettings
  targetFileSizeEnabled: boolean
  targetFileSize?: number
  targetSizeUnit: TargetSizeUnit
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

  // Per-item transforms
  rotation?: number
  flipH?: boolean
  crop?: CropRect

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

export interface SocialPreset {
  id: string
  platform: SocialPlatform
  name: string
  width: number
  height: number
  label: string
}

export interface DimensionPreset {
  id: string
  name: string
  width: number
  height: number
  tag: string
}
