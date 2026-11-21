export type AspectRatioPreset = 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '4:3' | '3:2'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface CropSettings {
  aspectRatioPreset: AspectRatioPreset
  format: 'jpeg' | 'png' | 'webp'
  quality: number // 1 - 100
  rotation: number // degrees (0, 90, 180, 270)
  flipH: boolean
  flipV: boolean
  showGrid: boolean
}

export interface CropperPreset {
  id: AspectRatioPreset
  name: string
  ratio: number | null // null for freeform
  label: string
}
