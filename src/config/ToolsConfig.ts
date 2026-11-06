import type { ComponentType } from 'react'

export type ToolIcon = 'images' | 'youtube' | 'image-plus' | 'video' | 'qr-code' | 'download' | 'scan' | 'layers' | 'message'

/** Where a tool is surfaced: its own page, an inline/overlay panel on the home page, or Creator Studio. */
export type ToolPlacement = 'library' | 'utility' | 'admin'

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
}

/**
 * The single source of truth for the site's tools. A tool is routed, linked and
 * loaded only while it has an entry here; remove the entry and it disappears
 * from the app without touching any other file.
 */
export const toolsConfig: readonly ToolDefinition[] = [
  { id: 'screen-recorder', title: 'Screen Recorder', placement: 'utility', icon: 'video', overlay: true, enabled: true, load: () => import('../tools/screen-recorder/ScreenRecorder') },
  { id: 'qr-code', title: 'QR Code Generator', placement: 'utility', icon: 'qr-code', enabled: true, load: () => import('../tools/qr-code/QRCodeGenerator') },
  { id: 'collage', title: 'Photo and Video Editor', placement: 'library', path: '/collage', href: '/collage', icon: 'images', editorFonts: true, enabled: true, load: () => import('../tools/collage/CollageStudio') },
  { id: 'shorts', title: 'YouTube to Shorts Maker', placement: 'library', path: '/shorts', href: '/shorts', icon: 'youtube', enabled: true, load: () => import('../tools/shorts/ShortsCreator') },
  { id: 'poster', title: 'Create Poster', placement: 'library', path: '/poster/*', href: '/poster', icon: 'image-plus', editorFonts: true, enabled: true, load: () => import('../tools/poster/CreatePoster') },
  { id: 'fakechat', title: 'FakeChat', placement: 'library', path: '/fakechat', href: '/fakechat', icon: 'message', enabled: true, load: () => import('../tools/fakechat/FakeChat') },
  { id: 'video-downloader', title: 'Video Downloader', placement: 'library', icon: 'download', enabled: false },
  { id: 'element-scanner', title: 'Element Scanner', placement: 'admin', path: '/admin/elements', icon: 'scan', enabled: true, load: () => import('../tools/poster/ElementScanner') },
  { id: 'poster-splitter', title: 'Poster Split', placement: 'admin', path: '/admin/poster-split', icon: 'layers', enabled: true, load: () => import('../tools/poster/PosterSplitter') },
]

/** Effective lists (bundled defaults overlaid with admin settings) live in toolSettings.ts. */
