import { ornamentMarkup } from './ornaments.js'

const icons = {
  phone: '<path d="M6.3 3.6c.5-.5 1.3-.4 1.7.2l1.9 2.7c.4.5.3 1.2-.2 1.6l-1 .9c-.2.2-.2.4-.1.6.8 1.6 2 2.8 3.6 3.6.2.1.4.1.6-.1l.9-1c.4-.5 1.1-.6 1.6-.2l2.7 1.9c.6.4.7 1.2.2 1.7l-1.1 1.1c-.9.9-2.2 1.3-3.4.9-2-.6-4-1.9-5.8-3.7s-3.1-3.8-3.7-5.8c-.4-1.2 0-2.5.9-3.4l1.1-1.1Z" fill="currentColor"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4.3 6.6 7.7 6.1 7.7-6.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  web: '<circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.8 12h16.4M12 3.6c2.5 2.4 3.8 5.2 3.8 8.4s-1.3 6-3.8 8.4c-2.5-2.4-3.8-5.2-3.8-8.4S9.5 6 12 3.6Z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  location: '<path d="M12 21s-6.6-5.7-6.6-11a6.6 6.6 0 1 1 13.2 0C18.6 15.3 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
}

export const CONTACT_KINDS = [
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'web', label: 'Website' },
  { id: 'location', label: 'Address' },
]

export const contactMarkup = (kind) => icons[kind] || icons.phone

export const contactSvg = (kind, color = '#ffffff', opacity = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="400" height="400" fill="none" style="color:${color};opacity:${opacity}">${contactMarkup(kind)}</svg>`

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<rect width="600" height="600" fill="#ffffff"/>
<circle cx="300" cy="300" r="282" fill="#ffffff" stroke="#2a342d" stroke-width="10"/>
<g transform="translate(150 150) scale(1.5)" style="color:#d97706">${ornamentMarkup('lotus')}</g>
</svg>`

export const NAME_CARD_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`
