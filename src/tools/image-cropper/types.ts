export type AspectRatioPreset =
  | 'free'
  | 'original'
  | 'custom'
  | '1:1'
  | '4:3'
  | '14:9'
  | '16:9'
  | '16:10'
  | '2:1'
  | '3:1'
  | '4:1'
  | '3:2'
  | '5:4'
  | '7:5'
  | '4:5'
  | '9:16'
  | '19:10'
  | '21:9'
  | '32:9'
  | 'fb-profile'
  | 'fb-cover'
  | 'fb-post'
  | 'fb-ad'
  | 'ig-profile'
  | 'ig-post'
  | 'ig-story'
  | 'twitter-profile'
  | 'twitter-header'
  | 'twitter-image'
  | 'twitter-card'
  | 'twitter-ad'
  | 'youtube-profile'
  | 'youtube-channel-art'
  | 'youtube-thumb'
  | 'web-mini'
  | 'web-small'
  | 'web-common'
  | 'web-medium'
  | 'fll-hd'
  | 'ultra-hd-4k'
  | 'paper-a4'
  | 'paper-a5'
  | 'paper-a6'
  | 'paper-letter'
  | string

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface CropSettings {
  aspectRatioPreset: AspectRatioPreset
  customRatioW?: number
  customRatioH?: number
  format: 'jpeg' | 'png' | 'webp'
  quality: number // 1 - 100
  rotation: number // degrees (0, 90, 180, 270)
  flipH: boolean
  flipV: boolean
  showGrid: boolean
}

export interface CropperPreset {
  id: string
  name: string
  ratio: number | null // null for freeform / custom
  label?: string
  category: 'Standard' | 'Social Media' | 'Web & Screen' | 'Paper'
  targetWidth?: number
  targetHeight?: number
}
