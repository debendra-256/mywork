import { appConfig } from '../config/app.config'

export interface SocialProviderFlags {
  google: boolean
  facebook: boolean
}

const googleIdentityScriptUrl = 'https://accounts.google.com/gsi/client'
const facebookSdkScriptUrl = 'https://connect.facebook.net/en_US/sdk.js'

const pending = new Map<string, Promise<void>>()

const googleReady = () => Boolean(window.google?.accounts.id)
const facebookReady = () => Boolean(window.FB)

/**
 * Waits for the provider global instead of the script load event: the Google script is
 * already on the page when Blogger is connected, and its load event has long fired.
 */
function loadSdk(marker: string, url: string, isReady: () => boolean): Promise<void> {
  if (isReady()) return Promise.resolve()
  const failure = new Error(`${marker === 'google' ? 'Google' : 'Facebook'} sign-in could not load. Check your network connection and try again.`)
  const existing = document.querySelector<HTMLScriptElement>(`script[data-provider-sdk="${marker}"]`)
  if (!existing) {
    const script = document.createElement('script')
    script.async = true
    script.src = url
    script.dataset.providerSdk = marker
    script.onerror = () => { pending.delete(marker) }
    document.head.append(script)
  }
  if (pending.has(marker)) return pending.get(marker)!
  const attempt = new Promise<void>((resolve, reject) => {
    const finish = (ok: boolean) => {
      window.clearInterval(watch)
      window.clearTimeout(deadline)
      if (ok) resolve()
      else reject(failure)
    }
    const watch = window.setInterval(() => { if (isReady()) finish(true) }, 120)
    const deadline = window.setTimeout(() => finish(false), 12_000)
  }).catch((error: unknown) => {
    pending.delete(marker)
    throw error
  })
  pending.set(marker, attempt)
  return attempt
}

export async function loadSocialProviders(): Promise<SocialProviderFlags> {
  const unavailable: SocialProviderFlags = { google: false, facebook: false }
  if (!appConfig.social.googleClientId && !appConfig.social.facebookAppId) return unavailable
  try {
    const response = await fetch('/api/social-auth')
    if (!response.ok) return unavailable
    const result = await response.json() as { providers?: Partial<SocialProviderFlags> }
    return {
      google: Boolean(result.providers?.google) && Boolean(appConfig.social.googleClientId),
      facebook: Boolean(result.providers?.facebook) && Boolean(appConfig.social.facebookAppId),
    }
  } catch {
    return unavailable
  }
}

/** Renders Google's own sign-in button; its callback hands over an ID token the server verifies. */
export async function mountGoogleSignInButton(container: HTMLElement, onCredential: (credential: string) => void): Promise<void> {
  const clientId = appConfig.social.googleClientId
  if (!clientId) throw new Error('Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.')
  await loadSdk('google', googleIdentityScriptUrl, googleReady)
  if (!window.google?.accounts.id) throw new Error('Google sign-in did not initialize. Reload the page and try again.')
  window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => onCredential(response.credential ?? '') })
  window.google.accounts.id.renderButton(container, { theme: 'inherit', size: 'large', text: 'continue_with', shape: 'pill' })
}

async function facebookSdk() {
  const appId = appConfig.social.facebookAppId
  if (!appId) throw new Error('Set VITE_FACEBOOK_APP_ID to enable Facebook sign-in.')
  if (!window.fbAsyncInit) {
    window.fbAsyncInit = () => window.FB?.init({ appId, cookie: true, xfbml: false, version: 'v21.0' })
  }
  await loadSdk('facebook', facebookSdkScriptUrl, facebookReady)
  if (!window.FB) throw new Error('Facebook sign-in did not initialize. Reload the page and try again.')
  return window.FB
}

export async function requestFacebookToken(): Promise<string> {
  const FB = await facebookSdk()
  return new Promise<string>((resolve, reject) => {
    FB.login((response) => {
      if (response.status === 'connected' && response.authResponse?.accessToken) resolve(response.authResponse.accessToken)
      else reject(new Error(response.status === 'cancelled' ? 'Facebook sign-in was cancelled.' : 'Facebook did not share your account details.'))
    }, { scope: 'email' })
  })
}
