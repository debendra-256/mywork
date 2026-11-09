import type { ComponentType } from 'react'

export type ToolIcon = 'images' | 'youtube' | 'image-plus' | 'video' | 'qr-code' | 'download' | 'scan' | 'layers' | 'message' | 'network' | 'eraser' | 'droplets' | 'sparkles' | 'wand' | 'bot' | 'monitor-play' | 'zap' | 'instagram' | 'smile' | 'palette' | 'panel-left' | 'id-card' | 'file-archive'

/** Where a tool is surfaced: its own page, an inline/overlay panel on the home page, Creator Studio, or its own sidebar menu. */
export type ToolPlacement = 'library' | 'utility' | 'admin' | 'feature'

export interface ToolDefinition {
  id: string
  title: string
  placement: ToolPlacement
  icon: ToolIcon
  /** Route pattern registered for page tools. */
  path?: string
  /** Link target used by the sidebar. */
  href?: string
  /** The home-page tool opens over the library instead of inline. */
  overlay?: boolean
  /** Canvas text tools wait for the Google font library before painting. */
  editorFonts?: boolean
  /** Link shortcut (usually added from Admin → Tools) instead of a bundled component. */
  external?: boolean
  /**
   * Master on/off switch. `false` removes the tool from the sidebar, from the
   * router and from the build entirely — its chunk is never emitted.
   */
  enabled: boolean
  /** Dynamic import: the tool code downloads only when the tool is opened. */
  load?: () => Promise<{ default: ComponentType<any> }>
  /** Feature tools get their own sidebar menu group instead of a tools-list link. */
  menu?: { heading: string; mark: string; label: string }
}

/**
 * The single source of truth for the site's tools. A tool is routed, linked and
 * loaded only while it has an entry here; remove the entry and it disappears
 * from the app without touching any other file.
 */
export const toolsConfig: readonly ToolDefinition[] = [
  { id: 'screen-recorder', title: 'Screen Recorder', placement: 'utility', icon: 'monitor-play', overlay: true, enabled: true, load: () => import('../tools/screen-recorder/ScreenRecorder') },
  { id: 'qr-code', title: 'QR Code Generator', placement: 'utility', icon: 'qr-code', enabled: true, load: () => import('../tools/qr-code/QRCodeGenerator') },
  { id: 'collage', title: 'Photo and Video Editor', placement: 'library', path: '/collage', href: '/collage', icon: 'wand', editorFonts: true, enabled: true, load: () => import('../tools/collage/CollageStudio') },
  { id: 'compress-image', title: 'Compress Image', placement: 'library', path: '/compress-image', href: '/compress-image', icon: 'file-archive', enabled: true, load: () => import('../tools/compress-image/CompressImage') },
  { id: 'shorts', title: 'YouTube to Shorts Maker', placement: 'library', path: '/shorts', href: '/shorts', icon: 'zap', enabled: true, load: () => import('../tools/shorts/ShortsCreator') },
  { id: 'poster', title: 'Create Poster', placement: 'library', path: '/poster/*', href: '/poster', icon: 'sparkles', editorFonts: true, enabled: true, load: () => import('../tools/poster/CreatePoster') },
  { id: 'fakechat', title: 'FakeChat', placement: 'library', path: '/fakechat', href: '/fakechat', icon: 'bot', enabled: true, load: () => import('../tools/fakechat/FakeChat') },
  { id: 'emoji-text', title: 'Emoji Text Generator', placement: 'library', path: '/emoji-text', href: '/emoji-text', icon: 'smile', enabled: true, load: () => import('../tools/emoji-text/EmojiTextGenerator') },
  { id: 'remove-object', title: 'Remove Object from Image', placement: 'library', path: '/remove-object', href: '/remove-object', icon: 'eraser', enabled: true, load: () => import('../tools/remove-object/RemoveObject') },
  { id: 'watermark-remover', title: 'Watermark Remover', placement: 'library', path: '/watermark-remover', href: '/watermark-remover', icon: 'droplets', enabled: true, load: () => import('../tools/watermark-remover/WatermarkRemover') },
  { id: 'mindcloud', title: 'Mind Cloud', placement: 'feature', path: '/mindcloud', href: '/mindcloud', icon: 'network', enabled: true, menu: { heading: 'Mind Cloud', mark: 'M', label: 'Mind map maker' }, load: () => import('../tools/mindcloud/MindCloud') },
  { id: 'prompt-generator', title: 'Prompt Generator', placement: 'feature', path: '/prompt-generator', href: '/prompt-generator', icon: 'sparkles', enabled: true, menu: { heading: 'Prompt Studio', mark: 'P', label: 'AI prompt generator' }, load: () => import('../tools/prompt-generator/PromptGenerator') },
  { id: 'passport-photo', title: 'Passport Photo Maker', placement: 'feature', path: '/passport-photo', href: '/passport-photo', icon: 'id-card', enabled: true, menu: { heading: 'Passport Photo', mark: 'P', label: 'Passport photo maker' }, load: () => import('../tools/passport-photo/PassportPhotoMaker') },
  { id: 'video-downloader', title: 'Video Downloader', placement: 'library', icon: 'download', enabled: false },
  { id: 'element-scanner', title: 'Element Scanner', placement: 'admin', path: '/admin/elements', icon: 'scan', enabled: true, load: () => import('../tools/poster/ElementScanner') },
  { id: 'poster-splitter', title: 'Poster Split', placement: 'admin', path: '/admin/poster-split', icon: 'layers', enabled: true, load: () => import('../tools/poster/PosterSplitter') },
  { id: 'site-theme', title: 'Site Theme', placement: 'admin', path: '/admin/themes', icon: 'palette', enabled: true, load: () => import('../tools/site-theme/ThemeManager') },
  { id: 'sidebar', title: 'Sidebar', placement: 'admin', path: '/admin/sidebar', icon: 'panel-left', enabled: true, load: () => import('../tools/sidebar/SidebarSettingsPage') },
]

/** Effective lists (bundled defaults overlaid with admin settings) live in toolSettings.ts. */
