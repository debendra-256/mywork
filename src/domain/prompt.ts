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
  /** All labels the source gives this prompt, so a filter can match any of them instead of only the first. */
  labels?: string[]
  sourceUrl?: string
}

/** The labels a prompt carries, `#` stripped, in source order with duplicates removed. */
export function promptLabels(prompt: Prompt): string[] {
  const labels = new Set<string>()
  for (const raw of [prompt.category, ...(prompt.labels ?? []), ...(prompt.hashtags ?? [])]) {
    // A Blogger label is often typed as one field holding several hashtags.
    const parts = /[,\s]#/.test(raw) ? raw.split(/[\s,]+/) : [raw]
    for (const part of parts) {
      const clean = part.replace(/^#+/, '').trim()
      if (clean) labels.add(clean)
    }
  }
  return [...labels]
}

/** The same labels lowercased, so category filters and hashtags match regardless of spelling. */
export function promptTags(prompt: Prompt): string[] {
  return [...new Set(promptLabels(prompt).map((label) => label.toLowerCase()))]
}

/** Tags worth printing under a cover: every label except the one already shown as the category badge. */
export function promptHashtags(prompt: Prompt, limit = 4): string[] {
  const category = prompt.category.replace(/^#+/, '').trim().toLowerCase()
  return [...new Set(promptLabels(prompt))]
    .filter((label) => { const key = label.toLowerCase(); return key !== category && key !== 'featured' })
    .slice(0, limit)
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
