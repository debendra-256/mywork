export interface SocialTrendItem {
  id: string
  platform: 'X' | 'Instagram'
  author: string
  text: string
  permalink: string
  createdAt: string
  imageUrl?: string
  engagement: number
}

export interface SocialTrendsResult {
  items: SocialTrendItem[]
  configured: { x: boolean; instagram: boolean }
  errors: string[]
}

export function getSocialTrends(env?: Record<string, string>): Promise<SocialTrendsResult>
export default function handler(request: unknown, response: unknown): Promise<void>
