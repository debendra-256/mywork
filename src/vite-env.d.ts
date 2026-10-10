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
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_FACEBOOK_APP_ID?: string
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

interface GoogleCredentialResponse {
  credential?: string
}

interface FacebookAuthResponse {
  status?: string
  authResponse?: { accessToken?: string }
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
      id: {
        initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }): void
        renderButton(element: HTMLElement, options?: { theme?: 'inherit' | 'black' | 'white'; size?: 'large' | 'medium' | 'small'; text?: 'signin_with' | 'signup_with' | 'continue_with'; shape?: 'rectangular' | 'pill' | 'circle'; width?: number }): void
        prompt(notifications?: (notification: unknown) => void): void
      }
    }
  }
  FB?: {
    init(options: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void
    login(callback: (response: FacebookAuthResponse) => void, options?: { scope: string }): void
    getLoginStatus(callback: (response: FacebookAuthResponse) => void): void
  }
  fbAsyncInit?: () => void
}

