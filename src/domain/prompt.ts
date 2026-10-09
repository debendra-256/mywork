export interface Prompt {
  id: string
  slug: string
  title: string
  description: string
  promptText: string
  category: string
  tool: string
  style: string
  featured: boolean
  createdAt: string
  image?: string
  imageAlt?: string
  hashtags?: string[]
  sourceUrl?: string
}

export interface PromptQuery {
  search?: string
  category?: string
  sort?: 'latest' | 'popular'
}

export interface PromptRepository {
  list(query?: PromptQuery): Promise<Prompt[]>
  getBySlug(slug: string): Promise<Prompt | null>
  categories(): Promise<string[]>
}
