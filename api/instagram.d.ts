export interface InstagramPost {
  configured: boolean
  shortcode: string
  kind: 'p' | 'reel' | 'tv'
  permalink: string
  title: string
  authorName: string
  authorUrl: string
  mediaId: string
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM' | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  mediaError: string
}

export function parseInstagramUrl(value: unknown): { shortcode: string; kind: string; permalink: string } | null
export function scrapeEmbedMedia(kind: string, shortcode: string): Promise<{ mediaType: 'VIDEO' | 'IMAGE'; mediaUrl: string } | null>
export function resolveInstagramPost(postUrl: unknown, env?: Record<string, string | undefined>): Promise<InstagramPost>
export default function handler(request: unknown, response: unknown, env?: Record<string, string | undefined>): Promise<void>
