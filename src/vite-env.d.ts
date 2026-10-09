/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_CONTENT_PROVIDER?: string
  readonly VITE_CONTENT_MODE?: string
  readonly VITE_BLOGGER_API_URL?: string
  readonly VITE_BLOGGER_BLOG_ID?: string
  readonly VITE_BLOGGER_CLIENT_ID?: string
  readonly VITE_WORDPRESS_API_URL?: string
  readonly VITE_RANK_MATH_API_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_SIDE_MENUS_STORAGE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface GoogleTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient(options: {
          client_id: string
          scope: string
          callback: (response: GoogleTokenResponse) => void
          error_callback?: (error: { type: string; message?: string }) => void
        }): { requestAccessToken(options?: { prompt?: string }): void }
      }
    }
  }
}

