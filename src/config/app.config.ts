const env = import.meta.env

function normalizeBaseUrl(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

const communitySettings: { whatsappPhone: string; instagramUsername: string; facebookPageId: string; telegramUsername: string } = {
  // Add the community IDs here. WhatsApp must include the country code, digits only.
  whatsappPhone: '',
  instagramUsername: '',
  facebookPageId: '',
  telegramUsername: '',
}

/** Central, typed configuration shared by app features and adapters. Never put secrets here. */
export const appConfig = Object.freeze({
  appName: env.VITE_SITE_NAME?.trim() || 'Promptseen',
  adminDisplayName: env.VITE_ADMIN_DISPLAY_NAME?.trim() || 'Creator',
  siteUrl: normalizeBaseUrl(env.VITE_SITE_URL),
  contentProvider: env.VITE_CONTENT_PROVIDER === 'blogger' ? 'blogger' : env.VITE_CONTENT_PROVIDER === 'wordpress' ? 'wordpress' : 'demo',
  contentMode: env.VITE_CONTENT_MODE === 'blog' ? 'blog' : 'prompts',
  wordpress: Object.freeze({
    apiUrl: normalizeBaseUrl(env.VITE_WORDPRESS_API_URL),
    rankMathApiUrl: normalizeBaseUrl(env.VITE_RANK_MATH_API_URL),
  }),
  blogger: Object.freeze({
    apiUrl: normalizeBaseUrl(env.VITE_BLOGGER_API_URL) || 'https://www.googleapis.com/blogger/v3',
    blogId: env.VITE_BLOGGER_BLOG_ID?.trim() || '',
    clientId: env.VITE_BLOGGER_CLIENT_ID?.trim() || '',
    // Browser-visible by design; restrict this key to Blogger API + approved origins in Google Cloud.
    apiKey: env.VITE_BLOGGER_API_KEY?.trim() || '',
  }),
  analytics: Object.freeze({ measurementId: env.VITE_GA_MEASUREMENT_ID?.trim() || '' }),
  community: Object.freeze(communitySettings),
  promptSharing: Object.freeze({
    messaging: Object.freeze([
      Object.freeze({ id: 'whatsapp', label: 'WhatsApp', baseUrl: 'https://wa.me/' }),
      Object.freeze({ id: 'telegram', label: 'Telegram', baseUrl: 'https://t.me/share/url' }),
    ]),
    aiTools: Object.freeze([
      Object.freeze({ id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com/' }),
      Object.freeze({ id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/app' }),
      Object.freeze({ id: 'google-flow', label: 'Google Flow', url: 'https://labs.google/fx/tools/flow' }),
      Object.freeze({ id: 'claude', label: 'Claude', url: 'https://claude.ai/new' }),
      Object.freeze({ id: 'copilot', label: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/' }),
      Object.freeze({ id: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai/' }),
      Object.freeze({ id: 'midjourney', label: 'Midjourney', url: 'https://www.midjourney.com/' }),
    ]),
  }),
  storage: Object.freeze({
    localPromptsKey: env.VITE_LOCAL_PROMPTS_STORAGE_KEY?.trim() || 'promptseen:local-prompts',
    sideMenusKey: env.VITE_SIDE_MENUS_STORAGE_KEY?.trim() || 'promptseen:side-menus',
  }),
  pagination: Object.freeze({ pageSize: 12 }),
})

export type AppConfig = typeof appConfig
