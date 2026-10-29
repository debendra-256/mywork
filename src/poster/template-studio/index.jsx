/**
 * Template Studio — a self-contained, pluggable React invitation template module.
 *
 * Drop the `template-studio` folder into any React app (React 18/19, no extra deps):
 *
 *   import { TemplateProvider, TemplateMenu } from './template-studio'
 *
 *   <TemplateProvider>
 *     <SiteHeader>... <TemplateMenu /> ...</SiteHeader>
 *     <App />
 *   </TemplateProvider>
 *
 * Or drive it yourself:
 *
 *   <TemplateStudio open={open} onClose={() => setOpen(false)} initialCategory="Wedding" />
 *
 * Styles are injected once at import — no CSS file or Tailwind setup required.
 */
import { css } from './styles.js'

let injected = false

export function injectStyles() {
  if (injected || typeof document === 'undefined') return
  if (document.getElementById('qoder-template-studio-css')) {
    injected = true
    return
  }
  const style = document.createElement('style')
  style.id = 'qoder-template-studio-css'
  style.textContent = css
  document.head.appendChild(style)
  injected = true
}

injectStyles()

export { default as TemplateStudio } from './components/Studio.jsx'
export { default as TemplateGallery } from './components/Gallery.jsx'
export { default as TemplateEditor } from './components/Editor.jsx'
export { default as TemplateCanvas } from './components/TemplateCanvas.jsx'
export { TemplateProvider, TemplateMenu, useTemplateStudio } from './components/TemplateMenu.jsx'

export { TEMPLATES, getTemplate, docFromTemplate } from './data/templates.js'
export { PALETTES, ASPECTS, FONTS, CATEGORIES } from './data/presets.js'
export { ORNAMENTS } from './data/ornaments.js'
export { downloadPng, renderToCanvas } from './export.js'
export { loadDesigns, saveDesign, deleteDesign } from './model.js'
