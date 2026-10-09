import { appConfig } from '../config/app.config'

const bloggerScope = 'https://www.googleapis.com/auth/blogger https://www.googleapis.com/auth/drive.file'
const identityScriptUrl = 'https://accounts.google.com/gsi/client'
const sessionStorageKey = 'promptseen:blogger-oauth-session'
let accessToken: string | null = null
let expiresAt = 0
let scriptLoad: Promise<void> | null = null

function restoreSession(): void {
  if (accessToken && Date.now() < expiresAt) return
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(sessionStorageKey) || 'null') as { accessToken?: string; expiresAt?: number } | null
    if (saved?.accessToken && typeof saved.expiresAt === 'number' && Date.now() < saved.expiresAt) {
      accessToken = saved.accessToken
      expiresAt = saved.expiresAt
      return
    }
  } catch { /* Storage can be unavailable in private browsing contexts. */ }
  accessToken = null
  expiresAt = 0
  try { window.sessionStorage.removeItem(sessionStorageKey) } catch { /* Ignore unavailable storage. */ }
}

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve()
  if (scriptLoad) return scriptLoad
  scriptLoad = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    const script = existing ?? document.createElement('script')
    script.async = true
    script.src = identityScriptUrl
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google sign-in could not load. Check your network connection and try again.'))
    if (!existing) document.head.append(script)
  }).catch((error: unknown) => {
    scriptLoad = null
    throw error
  })
  return scriptLoad!
}

export async function connectBlogger(): Promise<void> {
  if (!appConfig.blogger.clientId) throw new Error('Set VITE_BLOGGER_CLIENT_ID in .env.local.')
  await loadGoogleIdentityServices()
  if (!window.google?.accounts.oauth2) throw new Error('Google sign-in did not initialize. Reload the page and try again.')

  await new Promise<void>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: appConfig.blogger.clientId,
      scope: bloggerScope,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Google authorization did not return an access token.'))
          return
        }
        accessToken = response.access_token
        expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
        try { window.sessionStorage.setItem(sessionStorageKey, JSON.stringify({ accessToken, expiresAt })) } catch { /* Keep this session usable until the page is closed. */ }
        resolve()
      },
      error_callback: (error) => reject(new Error(error.message || 'Google sign-in was closed or blocked.')),
    })
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function getBloggerAccessToken(): string {
  restoreSession()
  if (!accessToken || Date.now() >= expiresAt) {
    accessToken = null
    throw new Error('Connect to Blogger again. Your authorization session may have expired.')
  }
  return accessToken
}

/** Returns a valid in-memory token when the user has already granted access. */
export function getBloggerAccessTokenIfAvailable(): string | null {
  restoreSession()
  if (!accessToken || Date.now() >= expiresAt) {
    accessToken = null
    return null
  }
  return accessToken
}

export function hasBloggerSession(): boolean {
  return getBloggerAccessTokenIfAvailable() !== null
}

export function clearBloggerSession(): void {
  accessToken = null
  expiresAt = 0
  try { window.sessionStorage.removeItem(sessionStorageKey) } catch { /* Ignore unavailable storage. */ }
}
