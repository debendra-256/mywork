/**
 * The poster and collage editors paint text with the families offered by their
 * font pickers. The Google Fonts stylesheet is injected the first time an editor
 * tool is opened, so the library no longer downloads ~47 font families on the
 * first visit to the site.
 */
const editorFontsParams = [
  'family=Roboto:ital,wght@0,400;0,700;1,400',
  'family=Playfair+Display:ital,wght@0,400;0,700;1,400',
  'family=Lora:ital,wght@0,400;0,700;1,400',
  'family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
  'family=EB+Garamond:ital,wght@0,400;0,700;1,400',
  'family=Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  'family=Merriweather:ital,wght@0,400;0,700;1,400',
  'family=Cinzel:wght@400;700',
  'family=DM+Serif+Display:ital@0;1',
  'family=Josefin+Sans:ital,wght@0,300;0,400;0,700;1,300',
  'family=Raleway:ital,wght@0,300;0,400;0,700;1,400',
  'family=Montserrat:ital,wght@0,300;0,400;0,700;1,400',
  'family=Open+Sans:ital,wght@0,300;0,400;0,700;1,400',
  'family=Nunito:ital,wght@0,300;0,400;0,700;1,400',
  'family=Poppins:ital,wght@0,300;0,400;0,700;1,400',
  'family=Lato:ital,wght@0,300;0,400;0,700;1,400',
  'family=Source+Sans+3:ital,wght@0,300;0,400;0,700;1,400',
  'family=Inter:ital,wght@0,300;0,400;0,700;1,400',
  'family=DM+Sans:ital,wght@0,300;0,400;0,700;1,400',
  'family=Syne:wght@400;700',
  'family=Space+Grotesk:wght@300;400;700',
  'family=Outfit:wght@300;400;700',
  'family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;1,400',
  'family=Bricolage+Grotesque:wght@400;700',
  'family=Dancing+Script:wght@400;700',
  'family=Great+Vibes',
  'family=Pacifico',
  'family=Satisfy',
  'family=Sacramento',
  'family=Pinyon+Script',
  'family=Alex+Brush',
  'family=Petit+Formal+Script',
  'family=Cormorant+Upright:wght@400;700',
  'family=Italiana',
  'family=Cardo:ital,wght@0,400;1,400',
  'family=Spectral:ital,wght@0,400;0,700;1,400',
  'family=Vollkorn:ital,wght@0,400;0,700;1,400',
  'family=Alegreya:ital,wght@0,400;0,700;1,400',
  'family=PT+Serif:ital,wght@0,400;0,700;1,400',
  'family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400',
  'family=Roboto+Mono:ital,wght@0,400;0,700;1,400',
  'family=Space+Mono:ital@0;1',
  'family=JetBrains+Mono:ital,wght@0,400;0,700;1,400',
  'family=Fira+Code:wght@400;700',
]

export const editorFontsHref = `https://fonts.googleapis.com/css2?${editorFontsParams.join('&')}&display=swap`

let fontsReady: Promise<void> | null = null

export function loadEditorFonts(): Promise<void> {
  if (fontsReady) return fontsReady
  fontsReady = new Promise<void>((resolve) => {
    if (typeof document === 'undefined') { resolve(); return }
    const settle = () => {
      const timeout = new Promise<void>((done) => { window.setTimeout(done, 4000) })
      const ready = document.fonts?.ready.then(() => undefined) ?? Promise.resolve()
      void Promise.race([ready, timeout]).then(() => resolve())
    }
    const existing = document.getElementById('promptseen-editor-fonts')
    if (existing) { settle(); return }
    const link = document.createElement('link')
    link.id = 'promptseen-editor-fonts'
    link.rel = 'stylesheet'
    link.href = editorFontsHref
    // A blocked font CDN must cost the editor its display fonts, not its ability to open.
    link.onload = settle
    link.onerror = () => resolve()
    document.head.appendChild(link)
  })
  return fontsReady
}
