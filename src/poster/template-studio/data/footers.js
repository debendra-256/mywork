export const FOOTER_PRESETS = [
  { id: 'blank', name: 'Blank footer', bg: '#ffffff', color: '#1d241f', radius: 0, w: 100, h: 7.2, blank: true },
  { id: 'night', name: 'Night bar', bg: '#121317', color: '#f5f1e6', radius: 0, w: 100, h: 7.2 },
  { id: 'saffron', name: 'Saffron bar', bg: '#d97706', color: '#fff6e6', radius: 0, w: 100, h: 7.2 },
  { id: 'paper', name: 'Paper bar', bg: '#f7f2e6', color: '#1d241f', radius: 0, w: 100, h: 7.2 },
  { id: 'pill', name: 'Night pill', bg: '#121317', color: '#f5f1e6', radius: 4.4, w: 64, h: 7.6 },
]

export const footerPreset = (id) => FOOTER_PRESETS.find((p) => p.id === id) || FOOTER_PRESETS.find((p) => p.id === 'night') || FOOTER_PRESETS[0]
