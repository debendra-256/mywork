import { paletteColors } from './presets.js'
import { makeFooter, makePhoto } from '../model.js'
import { ornamentSvg } from './ornaments.js'

let seq = 0
const eid = (p) => `${p}${++seq}`

const tx = (text, x, y, w, o = {}) => ({
  id: eid('t'),
  type: 'text',
  text,
  x,
  y,
  w,
  size: o.size ?? 4,
  font: o.font ?? 'display',
  color: o.color ?? 'ink',
  weight: o.weight ?? 400,
  italic: !!o.italic,
  align: o.align ?? 'center',
  tracking: o.tracking ?? 0,
  lineHeight: o.lineHeight ?? 1.3,
  transform: o.transform ?? 'none',
  rotation: o.rotation ?? 0,
  opacity: o.opacity ?? 1,
})

const sh = (shape, x, y, w, h, o = {}) => ({
  id: eid('s'),
  type: 'shape',
  shape,
  x,
  y,
  w,
  h,
  fill: o.fill ?? 'none',
  ...(o.fill2 ? { fill2: o.fill2 } : {}),
  ...(o.fill3 ? { fill3: o.fill3, mix: o.mix ?? 50 } : {}),
  ...(o.angle != null ? { angle: o.angle } : {}),
  ...(o.radius ? { radius: o.radius } : {}),
  stroke: o.stroke ?? 'none',
  strokeWidth: o.sw ?? 0.3,
  opacity: o.opacity ?? 1,
  rotation: o.rotation ?? 0,
})

const orn = (ornament, x, y, w, o = {}) => ({
  id: eid('o'),
  type: 'ornament',
  ornament,
  x,
  y,
  w,
  rotation: o.rotation ?? 0,
  color: o.color ?? 'accent',
  opacity: o.opacity ?? 1,
  flipX: !!o.flipX,
})

const line = (x, y, w, color = 'accent', opacity = 0.5) =>
  sh('line', x, y, w, 0.14, { fill: color, opacity })

const frame = (x, y, w, h, sw = 0.35, opacity = 1) =>
  sh('rect', x, y, w, h, { stroke: 'accent', sw, opacity })

const ph = (x, y, w, h, o = {}) => makePhoto({ x, y, w, h, ...o })

const LOGO_MARK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ornamentSvg('lotus', '#d97706'))}`

const CUTOUT_MARK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<circle cx="300" cy="128" r="84" fill="#c9b99a" fill-opacity="0.5"/>
<path d="M300 236c-126 0-206 94-216 364h432c-10-270-90-364-216-364Z" fill="#c9b99a" fill-opacity="0.5"/>
</svg>`
)}`

const lightBg = { type: 'linear', from: 'paper', to: 'sand', angle: 165, texture: true }
const darkBg = { type: 'linear', from: 'paper', to: 'sand', angle: 160, texture: false }

const tpl = (id, name, category, tag, palette, bg, elements, extra = {}) => ({
  id,
  name,
  category,
  tag,
  palette,
  aspect: extra.aspect || 'portrait',
  bg,
  featured: !!extra.featured,
  elements,
})

export const TEMPLATES = [
  tpl(
    'w-bloom', 'Garden Bloom', 'Wedding', 'Invitation', 'sage', lightBg,
    [
      orn('floralCorner', 1, 1, 30, { opacity: 0.9 }),
      orn('floralCorner', 69, 68, 30, { rotation: 180, opacity: 0.9 }),
      sh('arch', 18, 9, 64, 112, { stroke: 'accent', sw: 0.24, opacity: 0.75 }),
      tx('THE WEDDING OF', 25, 19, 50, { size: 2.1, font: 'sans', tracking: 0.34, color: 'accent' }),
      tx('Olivia\n& Noah', 12, 23.5, 76, { size: 9.4, lineHeight: 1.08 }),
      tx('JUNE 14, 2026', 30, 40.5, 40, { size: 2.6, font: 'sans', tracking: 0.28 }),
      orn('dots', 40, 31, 20, { color: 'accent' }),
      tx('TOGETHER WITH THEIR FAMILIES, WE INVITE YOU TO CELEBRATE OUR MARRIAGE', 20, 49, 60, {
        size: 2.35, font: 'sans', lineHeight: 1.75, tracking: 0.05, color: 'soft',
      }),
      tx('FOUR IN THE AFTERNOON', 25, 63, 50, { size: 2.3, font: 'sans', tracking: 0.2 }),
      tx('THE GARDEN HOUSE · AUSTIN, TEXAS', 20, 68, 60, { size: 2.15, font: 'sans', tracking: 0.1, color: 'soft' }),
      line(35, 74.5, 30, 'accent', 0.45),
      tx('DINNER, DANCING & JOY TO FOLLOW', 22, 78, 56, { size: 2, font: 'sans', tracking: 0.16, color: 'soft' }),
      tx('RSVP — OLIVIAANDNOAH.COM', 25, 85, 50, { size: 1.8, font: 'sans', tracking: 0.14, color: 'soft' }),
    ],
    { featured: true }
  ),

  tpl(
    'w-modern', 'Modern Union', 'Wedding', 'Invitation', 'monochrome', lightBg,
    [
      sh('rect', 0, 0, 100, 100, { fill: 'ink' }),
      tx('O & N', 9, 8, 40, { size: 2.8, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('OLIVIA\n& NOAH', 9, 12.5, 82, { size: 11.5, lineHeight: 1.0, color: 'paper' }),
      tx('MARRIED', 9, 29.5, 40, { size: 2.1, font: 'sans', tracking: 0.48, color: 'accent' }),
      line(9, 33.6, 12, 'accent', 0.9),
      tx('EST. 2026', 70, 30, 21, { size: 1.7, font: 'sans', tracking: 0.2, color: 'paper', align: 'right' }),
      orn('sunburst', 66, 42, 28, { color: 'accent', opacity: 0.85 }),
      line(9, 61, 24, 'accent', 0.8),
      tx('THE WEDDING CELEBRATION', 9, 64, 55, { size: 2.1, font: 'sans', tracking: 0.3, color: 'soft', align: 'left' }),
      tx('Saturday\nSeptember 12, 2026', 9, 69, 58, { size: 4.4, font: 'serif', align: 'left', lineHeight: 1.35 }),
      tx('Villa Serena · Lake Como, Italy', 9, 81, 58, { size: 2.4, font: 'sans', align: 'left', color: 'soft' }),
      tx('RSVP BY AUGUST 1', 9, 87, 40, { size: 1.8, font: 'sans', tracking: 0.2, align: 'left', color: 'soft' }),
    ],
    { featured: true }
  ),

  tpl(
    'w-heirloom', 'Heirloom', 'Wedding', 'Invitation', 'sand', lightBg,
    [
      frame(6, 5, 88, 124, 0.45),
      frame(9, 7.5, 82, 118, 0.14, 0.7),
      orn('wreath', 35, 11.5, 30, { color: 'accent' }),
      tx('TOGETHER WITH OUR FAMILIES', 20, 36, 60, { size: 2.1, font: 'sans', tracking: 0.3 }),
      tx('Amelia\n& Henry', 12, 40.5, 76, { size: 9, lineHeight: 1.12 }),
      tx('REQUEST THE PLEASURE OF YOUR COMPANY AT THEIR WEDDING', 22, 58, 56, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      orn('dots', 40, 60, 20, { color: 'accent' }),
      tx('SATURDAY · MAY 3 · 2026', 25, 71, 50, { size: 2.4, font: 'sans', tracking: 0.2 }),
      tx('FIVE O’CLOCK IN THE EVENING', 25, 76, 50, { size: 2.2, font: 'sans', color: 'soft' }),
      tx('ST. MARY’S CHAPEL · CHARLESTON', 20, 81, 60, { size: 2.2, font: 'sans' }),
      tx('RECEPTION TO FOLLOW', 28, 88, 44, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ],
    { featured: true }
  ),

  tpl(
    'w-savethedate', 'Save the Date', 'Wedding', 'Save the date', 'blush',
    { type: 'radial', from: 'paper', to: 'sand', angle: 0, texture: true },
    [
      orn('wreath', 32, 6, 36, { color: 'accent' }),
      tx('SAVE THE DATE', 25, 44, 50, { size: 2.2, font: 'sans', tracking: 0.4, color: 'accent' }),
      tx('Olivia & Noah', 8, 48, 84, { size: 8.6, lineHeight: 1.1 }),
      tx('JUNE 14, 2026', 25, 64, 50, { size: 2.8, font: 'sans', tracking: 0.26 }),
      tx('AUSTIN, TEXAS', 30, 71, 40, { size: 2.1, font: 'sans', tracking: 0.2, color: 'soft' }),
      line(35, 78, 30, 'accent', 0.4),
      tx('FORMAL INVITATION TO FOLLOW', 25, 82, 50, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ],
    { aspect: 'square' }
  ),

  tpl(
    'w-rsvp', 'RSVP Card', 'Wedding', 'RSVP', 'blush', lightBg,
    [
      orn('floralCorner', 1, 1, 24, { opacity: 0.75 }),
      orn('floralCorner', 75, 74, 24, { rotation: 180, opacity: 0.75 }),
      sh('circle', 34, 7, 32, 32, { stroke: 'accent', sw: 0.28 }),
      tx('O & N', 34, 15, 32, { size: 5, tracking: 0.06, color: 'accent' }),
      tx('KINDLY RESPOND', 20, 45, 60, { size: 2.8, font: 'sans', tracking: 0.34 }),
      tx('We would love to celebrate with you.', 22, 50, 56, { size: 2.6, font: 'serif', italic: true, lineHeight: 1.5, color: 'soft' }),
      tx('Name', 22, 62, 24, { size: 1.9, font: 'sans', align: 'left', transform: 'uppercase', tracking: 0.14, color: 'soft' }),
      line(22, 65.5, 56, 'soft', 0.45),
      tx('Number of guests', 22, 70, 30, { size: 1.9, font: 'sans', align: 'left', transform: 'uppercase', tracking: 0.14, color: 'soft' }),
      line(22, 73.5, 56, 'soft', 0.45),
      tx('Please reply by May 1, 2026', 20, 84, 60, { size: 2, font: 'sans', tracking: 0.16, color: 'soft' }),
    ]
  ),

  tpl(
    'w-menu', 'Dinner Menu', 'Wedding', 'Menu', 'sage', lightBg,
    [
      orn('sprig', 43, 3, 14, { color: 'accent' }),
      tx('WEDDING DINNER', 30, 14, 40, { size: 2.1, font: 'sans', tracking: 0.4, color: 'accent' }),
      tx('Menu', 20, 18, 60, { size: 9, italic: true, lineHeight: 1 }),
      orn('dots', 40, 18, 20, { color: 'accent' }),
      tx('TO BEGIN', 20, 38, 60, { size: 1.7, font: 'sans', tracking: 0.3, color: 'soft' }),
      tx('Heirloom Tomato · Burrata · Basil Oil', 20, 41.5, 60, { size: 2.5, font: 'serif' }),
      line(40, 47.5, 20, 'accent', 0.35),
      tx('FIRST', 20, 50, 60, { size: 1.7, font: 'sans', tracking: 0.3, color: 'soft' }),
      tx('Herb Roasted Sea Bass · Fennel · Saffron', 20, 53.5, 60, { size: 2.5, font: 'serif' }),
      line(40, 59.5, 20, 'accent', 0.35),
      tx('DESSERT', 20, 62, 60, { size: 1.7, font: 'sans', tracking: 0.3, color: 'soft' }),
      tx('Olive Oil Cake · Fig · Honey', 20, 65.5, 60, { size: 2.5, font: 'serif' }),
      line(40, 71.5, 20, 'accent', 0.35),
      tx('WINE PAIRING BY THE HOUSE SOMMELIER', 22, 80, 56, { size: 1.8, font: 'sans', tracking: 0.16, color: 'soft' }),
    ]
  ),

  tpl(
    'w-program', 'Ceremony Program', 'Wedding', 'Program', 'ivory', lightBg,
    [
      tx('THE CEREMONY', 20, 10, 60, { size: 2.2, font: 'sans', tracking: 0.4, color: 'accent' }),
      tx('Olivia & Noah', 15, 14.5, 70, { size: 6.4 }),
      tx('JUNE 14, 2026 · FOUR O’CLOCK', 25, 24, 50, { size: 1.9, font: 'sans', tracking: 0.2, color: 'soft' }),
      sh('line', 49.94, 31, 0.12, 58, { fill: 'accent', opacity: 0.45 }),
      tx('4:00 · PRELUDE', 25, 34, 50, { size: 1.7, font: 'sans', tracking: 0.22, color: 'accent' }),
      tx('Breath & Strings', 25, 37, 50, { size: 2.5, font: 'serif', color: 'soft' }),
      tx('4:30 · PROCESSIONAL', 25, 44, 50, { size: 1.7, font: 'sans', tracking: 0.22, color: 'accent' }),
      tx('The Garden Aisle', 25, 47, 50, { size: 2.5, font: 'serif', color: 'soft' }),
      tx('4:45 · VOWS', 25, 54, 50, { size: 1.7, font: 'sans', tracking: 0.22, color: 'accent' }),
      tx('Officiated by Rev. Hale', 25, 57, 50, { size: 2.5, font: 'serif', color: 'soft' }),
      tx('5:15 · RECESSIONAL', 25, 64, 50, { size: 1.7, font: 'sans', tracking: 0.22, color: 'accent' }),
      tx('Champagne on the Lawn', 25, 67, 50, { size: 2.5, font: 'serif', color: 'soft' }),
      orn('eucalyptus', 4, 79, 18, { rotation: -22, opacity: 0.85 }),
      orn('eucalyptus', 78, 79, 18, { rotation: 22, opacity: 0.85 }),
      tx('DINNER & DANCING TO FOLLOW', 25, 88, 50, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ]
  ),

  tpl(
    'w-engage', 'She Said Yes', 'Wedding', 'Engagement', 'blush', lightBg,
    [
      orn('floralCorner', 1, 1, 26, { opacity: 0.85 }),
      orn('floralCorner', 73, 71, 26, { rotation: 180, opacity: 0.85 }),
      tx('A LITTLE CELEBRATION', 25, 15, 50, { size: 2, font: 'sans', tracking: 0.36, color: 'accent' }),
      tx('She said yes!', 10, 20, 80, { size: 10.5, font: 'script', lineHeight: 1.1 }),
      tx('Olivia & Noah', 25, 36, 50, { size: 4, font: 'serif', tracking: 0.04 }),
      orn('rings', 39, 44, 22, { color: 'accent' }),
      tx('PLEASE JOIN US FOR AN ENGAGEMENT PARTY', 22, 63, 56, { size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft' }),
      tx('SATURDAY, AUGUST 22 · 7 PM', 22, 70, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('THE ROOFTOP AT SOHO HOUSE', 22, 75, 56, { size: 2.1, font: 'sans', color: 'soft' }),
      tx('COCKTAILS & SMALL PLATES', 25, 81, 50, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ]
  ),

  tpl(
    'a-golden', 'Fifty Years', 'Anniversary', 'Golden anniversary', 'noir', darkBg,
    [
      frame(7, 6, 86, 124, 0.4),
      orn('deco', 4.5, 3.5, 16, { color: 'accent' }),
      orn('deco', 79.5, 3.5, 16, { color: 'accent', rotation: 90 }),
      orn('deco', 4.5, 78, 16, { color: 'accent', rotation: 270 }),
      orn('deco', 79.5, 78, 16, { color: 'accent', rotation: 180 }),
      tx('FIFTY YEARS', 25, 20, 50, { size: 2.4, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('Eleanor\n& James', 12, 25, 76, { size: 9, lineHeight: 1.1, color: 'ink' }),
      tx('1976 — 2026', 30, 45, 40, { size: 2.8, tracking: 0.2, color: 'accent' }),
      orn('dots', 40, 45, 20, { color: 'accent' }),
      tx('JOIN US FOR AN EVENING OF GOLDEN MEMORIES, GOOD WINE, AND GREAT COMPANY.', 24, 58, 52, {
        size: 2.1, font: 'sans', lineHeight: 1.8, color: 'soft',
      }),
      tx('SATURDAY, OCTOBER 10, 2026', 22, 71, 56, { size: 2.3, font: 'sans', tracking: 0.18, color: 'ink' }),
      tx('SEVEN IN THE EVENING', 25, 76, 50, { size: 2, font: 'sans', color: 'soft' }),
      tx('THE CONSERVATORY · 12 ELM STREET', 22, 81, 56, { size: 2.1, font: 'sans', color: 'soft' }),
      tx('DINNER & DANCING TO FOLLOW', 25, 87, 50, { size: 1.7, font: 'sans', tracking: 0.16, color: 'accent' }),
    ]
  ),

  tpl(
    'a-still', 'Still I Do', 'Anniversary', 'Anniversary', 'terracotta', lightBg,
    [
      orn('floralCorner', 1, 1, 24, { opacity: 0.85 }),
      orn('floralCorner', 75, 72, 24, { rotation: 180, opacity: 0.85 }),
      tx('TEN YEARS OF', 25, 15, 50, { size: 2.2, font: 'sans', tracking: 0.38, color: 'accent' }),
      tx('Still\nI Do', 15, 19, 70, { size: 12, italic: true, lineHeight: 1.0 }),
      tx('Olivia & Noah', 25, 40, 50, { size: 3.8, font: 'serif', tracking: 0.04 }),
      orn('rings', 40, 48, 20, { color: 'accent' }),
      tx('JOIN US FOR A DINNER TO CELEBRATE A DECADE OF MARRIAGE', 23, 63, 54, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY, SEPTEMBER 19 · 6 PM', 21, 71, 58, { size: 2.2, font: 'sans', tracking: 0.16 }),
      tx('THE OLIVE GROVE · 27 HILL ROAD', 22, 76, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('DINNER & DANCING', 28, 83, 44, { size: 1.8, font: 'sans', tracking: 0.2, color: 'accent' }),
    ]
  ),

  tpl(
    'b-bash', 'Birthday Bash', 'Birthday', 'Birthday', 'festive', lightBg,
    [
      orn('stars', 62, 4, 28, { color: 'accent' }),
      tx('YOU’RE INVITED TO', 25, 14, 50, { size: 2.2, font: 'sans', tracking: 0.32, color: 'accent' }),
      tx('THE BIG\nTHREE-OH', 10, 18, 80, { size: 12, lineHeight: 0.98 }),
      tx('& feeling fabulous', 25, 36, 50, { size: 5, font: 'script', color: 'accent' }),
      orn('dots', 40, 39, 20, { color: 'ink' }),
      tx('JOIN US FOR COCKTAILS, CAKE & A LITTLE CHAOS', 22, 51, 56, {
        size: 2.2, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY · NOV 8 · 8 PM', 22, 61, 56, { size: 2.4, font: 'sans', tracking: 0.2 }),
      tx('THE LOFT · 44 CANAL STREET', 22, 66, 56, { size: 2.1, font: 'sans', color: 'soft' }),
      tx('DRESS CODE — FESTIVE', 25, 74, 50, { size: 1.9, font: 'sans', tracking: 0.22, color: 'accent' }),
      line(35, 81, 30, 'accent', 0.4),
      tx('RSVP TO MAYA · 555 0142', 25, 85, 50, { size: 1.8, font: 'sans', color: 'soft' }),
    ],
    { featured: true }
  ),

  tpl(
    'b-little', 'Little One', 'Birthday', 'Kids birthday', 'pastel', lightBg,
    [
      sh('arch', 20, 11, 60, 96, { stroke: 'accent', sw: 0.22, opacity: 0.6 }),
      tx('HENRY TURNS', 25, 19, 50, { size: 2.4, font: 'sans', tracking: 0.36, color: 'accent' }),
      tx('FOUR', 10, 23, 80, { size: 16, lineHeight: 1 }),
      tx('join us for cake, games & confetti', 22, 43, 56, { size: 2.6, font: 'serif', italic: true, color: 'soft' }),
      orn('stars', 41, 51, 18, { color: 'accent' }),
      tx('SUNDAY, APRIL 19 · 2 PM', 22, 60, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('THE PARK PAVILION · RIVERSIDE', 22, 65, 56, { size: 2.1, font: 'sans', color: 'soft' }),
      tx('PLEASE RSVP TO HENRY’S MOM', 24, 73, 52, { size: 1.8, font: 'sans', tracking: 0.16, color: 'soft' }),
    ]
  ),

  tpl(
    'b-forty', 'Cheers to Forty', 'Birthday', 'Milestone', 'noir', darkBg,
    [
      tx('CHEERS TO', 25, 13, 50, { size: 2.6, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('FORTY', 10, 18, 80, { size: 15, lineHeight: 1, color: 'ink' }),
      tx('years of you', 30, 40, 40, { size: 4.5, font: 'script', color: 'accent' }),
      orn('sunburst', 38, 49, 24, { color: 'accent', opacity: 0.85 }),
      tx('PLEASE JOIN US FOR A NIGHT OF DINNER, DRINKS & TOASTS', 22, 67, 56, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY, DECEMBER 6 · 7 PM', 22, 75, 56, { size: 2.2, font: 'sans', tracking: 0.18, color: 'ink' }),
      tx('THE WINE CELLAR · 8 KING STREET', 22, 80, 56, { size: 2, font: 'sans', color: 'soft' }),
      line(35, 86, 30, 'accent', 0.5),
      tx('BLACK TIE OPTIONAL', 28, 89, 44, { size: 1.7, font: 'sans', tracking: 0.2, color: 'soft' }),
    ]
  ),

  tpl(
    'baby-bloom', 'Baby in Bloom', 'Baby', 'Baby shower', 'sage', lightBg,
    [
      orn('floralCorner', 1, 1, 26, { opacity: 0.85 }),
      orn('floralCorner', 73, 71, 26, { rotation: 180, opacity: 0.85 }),
      tx('BABY SHOWER', 25, 15, 50, { size: 2.4, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('Little\nSprout', 15, 20, 70, { size: 10, italic: true, lineHeight: 1.05 }),
      tx('for baby Olivia', 27, 41, 46, { size: 4, font: 'script', color: 'accent' }),
      orn('sprig', 43, 50, 14, { color: 'accent' }),
      tx('PLEASE JOIN US TO CELEBRATE A LITTLE ONE ON THE WAY', 23, 64, 54, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY, MARCH 14 · 11 AM', 22, 72, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('THE GARDEN ROOM · 22 WILLOW LANE', 22, 77, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('BRUNCH & BLOOMS', 28, 84, 44, { size: 1.8, font: 'sans', tracking: 0.2, color: 'accent' }),
    ]
  ),

  tpl(
    'baby-hello', 'Hello, World', 'Baby', 'Announcement', 'pastel', lightBg,
    [
      orn('heart', 41, 5, 18, { color: 'accent' }),
      tx('HELLO, WORLD', 22, 17, 56, { size: 2.5, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('Mia Rose', 12, 22, 76, { size: 10, font: 'script', lineHeight: 1.1 }),
      tx('arrived june 2, 2026 at 4:12 am', 22, 39, 56, { size: 2.4, font: 'serif', italic: true, color: 'soft' }),
      line(30, 45, 40, 'accent', 0.35),
      tx('7 lb 4 oz', 12, 49, 24, { size: 2.6, font: 'display' }),
      tx('20 inches', 38, 49, 24, { size: 2.6, font: 'display' }),
      tx('4:12 am', 64, 49, 24, { size: 2.6, font: 'display' }),
      tx('WEIGHT', 12, 55.5, 24, { size: 1.5, font: 'sans', tracking: 0.24, color: 'soft' }),
      tx('LENGTH', 38, 55.5, 24, { size: 1.5, font: 'sans', tracking: 0.24, color: 'soft' }),
      tx('TIME', 64, 55.5, 24, { size: 1.5, font: 'sans', tracking: 0.24, color: 'soft' }),
      tx('PROUD PARENTS', 30, 64, 40, { size: 1.8, font: 'sans', tracking: 0.3, color: 'soft' }),
      tx('Olivia & Noah Bennett', 25, 68, 50, { size: 3, font: 'serif' }),
      tx('OUR LIVES ARE FOREVER CHANGED FOR THE BETTER.', 24, 77, 52, { size: 2, font: 'sans', lineHeight: 1.6, color: 'soft' }),
    ]
  ),

  tpl(
    'baby-wild', 'Wild One', 'Baby', 'First birthday', 'sand', lightBg,
    [
      tx('ROAN TURNS', 28, 14, 44, { size: 2.3, font: 'sans', tracking: 0.38, color: 'accent' }),
      tx('WILD\nONE', 15, 18, 70, { size: 14, lineHeight: 0.98 }),
      tx('a first birthday adventure', 22, 39, 56, { size: 3.6, font: 'script', color: 'accent' }),
      orn('stars', 63, 45, 22, { color: 'accent', opacity: 0.85 }),
      tx('JOIN US FOR CAKE, GAMES & A LITTLE WILDERNESS', 23, 55, 54, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY, MAY 30 · 10 AM', 22, 65, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('PIONEER PARK · THE OLD BARN', 22, 70, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('RSVP TO MOM · 555 0163', 26, 77, 48, { size: 1.8, font: 'sans', tracking: 0.16, color: 'soft' }),
    ]
  ),

  tpl(
    'p-cocktail', 'Cocktail Hour', 'Party', 'Cocktail party', 'teal', darkBg,
    [
      orn('deco', 4.5, 3.5, 14, { color: 'accent' }),
      orn('deco', 81.5, 3.5, 14, { color: 'accent', rotation: 90 }),
      orn('deco', 4.5, 80, 14, { color: 'accent', rotation: 270 }),
      orn('deco', 81.5, 80, 14, { color: 'accent', rotation: 180 }),
      tx('AN EVENING OF', 25, 17, 50, { size: 2.2, font: 'sans', tracking: 0.4, color: 'accent' }),
      tx('Cocktails', 10, 21, 80, { size: 11, italic: true, color: 'ink' }),
      tx('& CONVERSATION', 25, 35, 50, { size: 2.2, font: 'sans', tracking: 0.36, color: 'accent' }),
      orn('dots', 40, 36, 20, { color: 'accent' }),
      tx('PLEASE JOIN US FOR DRINKS AND SMALL BITES', 24, 48, 52, { size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft' }),
      tx('FRIDAY, SEPTEMBER 5 · 7 PM', 22, 58, 56, { size: 2.2, font: 'sans', tracking: 0.18, color: 'ink' }),
      tx('THE OBSERVATORY · 200 PARK AVE', 22, 63, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('COCKTAIL ATTIRE', 28, 71, 44, { size: 1.9, font: 'sans', tracking: 0.28, color: 'accent' }),
      line(35, 79, 30, 'accent', 0.5),
      tx('RSVP BY AUGUST 28', 27, 83, 46, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ]
  ),

  tpl(
    'p-newhome', 'New Home', 'Party', 'Housewarming', 'terracotta', lightBg,
    [
      orn('floralCorner', 1, 1, 24, { opacity: 0.8 }),
      orn('floralCorner', 75, 72, 24, { rotation: 180, opacity: 0.8 }),
      tx('YOU’RE INVITED TO', 25, 14, 50, { size: 2.1, font: 'sans', tracking: 0.34, color: 'accent' }),
      tx('Come see\nour new place', 12, 19, 76, { size: 8, italic: true, lineHeight: 1.12 }),
      tx('The Martinez Family', 25, 40, 50, { size: 3.6, font: 'serif' }),
      line(32, 47, 36, 'accent', 0.4),
      tx('AN OPEN HOUSE & HOUSEWARMING', 23, 52, 54, { size: 2.2, font: 'sans', lineHeight: 1.7, color: 'soft' }),
      tx('SATURDAY, JULY 18 · 4 PM', 22, 60, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('418 CEDAR AVENUE', 25, 65, 50, { size: 2.4, tracking: 0.08 }),
      tx('DRINKS, SNACKS & GOOD COMPANY', 24, 73, 52, { size: 1.9, font: 'sans', tracking: 0.14, color: 'soft' }),
      tx('RSVP TO ANA · 555 0188', 27, 80, 46, { size: 1.8, font: 'sans', tracking: 0.16, color: 'soft' }),
    ]
  ),

  tpl(
    'p-grad', 'The Graduate', 'Party', 'Graduation', 'midnight', darkBg,
    [
      orn('sunburst', 40, 5, 20, { color: 'accent', opacity: 0.9 }),
      tx('CONGRATULATIONS', 22, 17, 56, { size: 2.6, font: 'sans', tracking: 0.44, color: 'accent' }),
      tx('CLASS OF\n2026', 15, 22, 70, { size: 11, lineHeight: 1.0, color: 'ink' }),
      tx('Sophia Chen', 25, 42, 50, { size: 4, font: 'serif', italic: true }),
      tx('BACHELOR OF ARCHITECTURE · UNIVERSITY OF WASHINGTON', 22, 51, 56, {
        size: 2, font: 'sans', lineHeight: 1.6, color: 'soft',
      }),
      orn('dots', 40, 53, 20, { color: 'accent' }),
      tx('JOIN US FOR A CELEBRATION OF THE NEXT CHAPTER', 24, 64, 52, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY, JUNE 13 · 5 PM', 22, 72, 56, { size: 2.2, font: 'sans', tracking: 0.18, color: 'ink' }),
      tx('THE FOUNDRY · 300 WESTLAKE AVE', 22, 77, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('DINNER & TOASTS TO FOLLOW', 26, 84, 48, { size: 1.8, font: 'sans', tracking: 0.18, color: 'accent' }),
    ]
  ),

  tpl(
    'f-diwali', 'Festival of Lights', 'Festival', 'Diwali', 'festive',
    { type: 'radial', from: 'paper', to: 'sand', angle: 0, texture: true },
    [
      orn('lotus', 39, 4, 22, { color: 'accent' }),
      tx('SHUBH DEEPAVALI', 25, 17, 50, { size: 2.5, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('Festival\nof Lights', 15, 22, 70, { size: 10.5, lineHeight: 1.05 }),
      tx('Light · Love · Prosperity', 24, 42, 52, { size: 3, font: 'script', color: 'accent' }),
      orn('dots', 40, 42, 20, { color: 'accent' }),
      tx('THE SHARMA FAMILY INVITES YOU TO CELEBRATE DIWALI', 23, 53, 54, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('SATURDAY, NOVEMBER 7 · 6 PM', 22, 63, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('POOJA · DINNER · MUSIC', 26, 69, 48, { size: 2.2, font: 'sans', color: 'soft' }),
      tx('42 MAPLE GROVE LANE', 26, 75, 48, { size: 2 }),
      tx('RSVP BY OCTOBER 30', 27, 82, 46, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ],
    { featured: true }
  ),

  tpl(
    'f-christmas', 'Merry & Bright', 'Festival', 'Christmas', 'emerald', lightBg,
    [
      orn('pine', 40, 4, 20, { color: 'accent' }),
      tx('YOU’RE INVITED TO', 25, 15, 50, { size: 2.1, font: 'sans', tracking: 0.36, color: 'accent' }),
      tx('A Merry\n& Bright', 15, 19, 70, { size: 10, lineHeight: 1.05 }),
      tx('CHRISTMAS GATHERING', 25, 39, 50, { size: 2.4, font: 'sans', tracking: 0.36, color: 'accent' }),
      orn('dots', 40, 38, 20, { color: 'accent' }),
      tx('COCKTAILS, CAROLS & A LITTLE TOO MUCH PUDDING', 24, 50, 52, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft',
      }),
      tx('FRIDAY, DECEMBER 18 · 7 PM', 22, 60, 56, { size: 2.2, font: 'sans', tracking: 0.18 }),
      tx('THE HOLLY HOUSE · 9 WINTER LANE', 22, 65, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('DRESS — FESTIVE', 28, 72, 44, { size: 1.9, font: 'sans', tracking: 0.24, color: 'accent' }),
      tx('RSVP BY DECEMBER 10', 27, 79, 46, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ]
  ),

  tpl(
    'f-nye', 'Hello, 2027', 'Festival', 'New Year', 'noir', darkBg,
    [
      orn('stars', 65, 4, 26, { color: 'accent' }),
      tx('GOODBYE, 2026', 25, 13, 50, { size: 2.2, font: 'sans', tracking: 0.38, color: 'soft' }),
      tx('HELLO,\n2027', 10, 18, 80, { size: 14, lineHeight: 1.0, color: 'ink' }),
      orn('stars', 11, 29, 14, { color: 'accent', opacity: 0.75 }),
      tx('NEW YEAR’S EVE', 25, 43, 50, { size: 2.5, font: 'sans', tracking: 0.42, color: 'accent' }),
      tx('DINNER · DRINKS · MIDNIGHT TOAST', 22, 52, 56, { size: 2.2, font: 'sans', lineHeight: 1.7, color: 'soft' }),
      tx('THURSDAY, DECEMBER 31 · 8 PM', 21, 60, 58, { size: 2.2, font: 'sans', tracking: 0.16, color: 'ink' }),
      tx('THE GRAND BALLROOM · 1 PARK ROW', 22, 65, 56, { size: 2, font: 'sans', color: 'soft' }),
      tx('BLACK TIE', 30, 72, 40, { size: 1.9, font: 'sans', tracking: 0.32, color: 'accent' }),
      line(35, 79, 30, 'accent', 0.5),
      tx('RSVP BY DECEMBER 20', 27, 83, 46, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft' }),
    ]
  ),

  tpl(
    'c-opening', 'Grand Opening', 'Corporate', 'Business', 'monochrome', lightBg,
    [
      sh('rect', 0, 0, 38, 142, { fill: 'ink' }),
      tx('MARIGOLD', 0, 55, 38, { size: 3, font: 'sans', tracking: 0.4, color: 'paper', rotation: -90 }),
      tx('YOU’RE INVITED TO THE', 48, 20, 45, { size: 1.9, font: 'sans', tracking: 0.24, color: 'soft', align: 'left' }),
      tx('Grand\nOpening', 48, 24, 45, { size: 8, lineHeight: 1.05, align: 'left' }),
      line(48, 42, 20, 'accent', 0.9),
      tx('MARIGOLD STUDIO', 48, 46, 45, { size: 2.2, font: 'sans', tracking: 0.32, color: 'accent', align: 'left' }),
      tx('A NEW SPACE FOR FLORAL DESIGN & SLOW LIVING', 48, 52, 42, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft', align: 'left',
      }),
      tx('THURSDAY, MAY 21 · 6 PM', 48, 64, 45, { size: 2.1, font: 'sans', tracking: 0.12, align: 'left' }),
      tx('18 MERCER STREET, NEW YORK', 48, 69, 45, { size: 2, font: 'sans', color: 'soft', align: 'left' }),
      tx('DRINKS · FLOWERS · MUSIC', 48, 78, 45, { size: 1.9, font: 'sans', tracking: 0.12, color: 'soft', align: 'left' }),
      tx('RSVP — HELLO@MARIGOLDSTUDIO.COM', 48, 84, 45, { size: 1.6, font: 'sans', color: 'soft', align: 'left' }),
    ]
  ),

  tpl(
    'c-summit', 'Summit 2026', 'Corporate', 'Conference', 'midnight', darkBg,
    [
      tx('SUMMIT', 12, 11, 76, { size: 13, font: 'sans', weight: 700, tracking: -0.02, align: 'left', color: 'ink' }),
      tx('2026', 12, 27, 60, { size: 8, color: 'accent', align: 'left' }),
      sh('line', 12, 38, 76, 0.12, { fill: 'accent', opacity: 0.7 }),
      tx('DESIGN · BUILD · SCALE', 12, 42, 70, { size: 2.2, font: 'sans', tracking: 0.32, color: 'soft', align: 'left' }),
      tx('TWO DAYS OF TALKS, WORKSHOPS & CONVERSATIONS FOR PEOPLE WHO MAKE THINGS.', 12, 52, 62, {
        size: 2.1, font: 'sans', lineHeight: 1.7, color: 'soft', align: 'left',
      }),
      tx('OCTOBER 22–23', 12, 66, 45, { size: 3.4, align: 'left' }),
      tx('THE CONVENTION CENTER · SEATTLE', 12, 72, 60, { size: 2, font: 'sans', color: 'soft', align: 'left' }),
      tx('REGISTER AT SUMMIT2026.COM', 12, 82, 60, { size: 1.9, font: 'sans', tracking: 0.18, color: 'accent', align: 'left' }),
      orn('sunburst', 73, 69, 20, { color: 'accent', opacity: 0.6 }),
    ]
  ),

  tpl(
    'pol-rally', 'People’s Rally', 'Political', 'Campaign poster', 'tricolor',
    { type: 'linear', from: 'paper', to: 'sand', angle: 165, texture: false },
    [
      sh('rect', 0, 0, 100, 9, { fill: '#d97706' }),
      sh('rect', 0, 9, 100, 0.4, { fill: '#fff6e6', opacity: 0.9 }),
      sh('rect', 0, 92, 100, 8, { fill: '#2f7d4f' }),
      tx('PUBLIC MEETING · 2026', 0, 2.4, 100, {
        size: 2.2, font: 'sans', tracking: 0.34, color: 'paper', weight: 700, align: 'center',
      }),
      tx('Your voice.\nYour future.', 7, 15, 55, {
        size: 8.6, lineHeight: 1.05, align: 'left',
      }),
      line(7, 37.5, 18, '#d97706', 1),
      tx('STAND WITH US FOR A STRONGER TOMORROW. EVERY VOICE COUNTS.', 7, 41.5, 52, {
        size: 2.2, font: 'sans', lineHeight: 1.7, color: 'soft', align: 'left',
      }),
      tx('DATE · TIME', 7, 55.5, 52, { size: 2.4, font: 'sans', tracking: 0.16, align: 'left' }),
      tx('VENUE NAME, CITY', 7, 60.5, 55, { size: 2.1, font: 'sans', color: 'soft', align: 'left' }),
      tx('Add your message here', 7, 70, 52, {
        size: 3.6, font: 'serif', italic: true, lineHeight: 1.35, align: 'left',
      }),
      tx('CONTACT · RSVP', 7, 84, 52, { size: 1.9, font: 'sans', tracking: 0.18, color: 'soft', align: 'left' }),
      ph(63, 46, 31, 31, { borderColor: 'paper', borderWidth: 0.9, backdrop: 'paper' }),
      tx('CANDIDATE NAME', 63, 79.5, 31, { size: 1.8, font: 'sans', tracking: 0.16, align: 'center' }),
      tx('PARTY · CONSTITUENCY', 63, 83, 31, { size: 1.5, font: 'sans', tracking: 0.18, color: 'soft', align: 'center' }),
    ],
    { aspect: 'square' }
  ),

  tpl(
    'pol-foundation', 'Foundation Day', 'Political', 'Leader poster', 'tricolor',
    { type: 'linear', from: '#f7a23b', to: '#fbd9a4', angle: 180, texture: false },
    [
      sh('rect', 0, 0, 100, 6, { fill: 'paper' }),
      line(0, 6, 100, 'soft', 0.85),
      sh('rect', 0, 70, 100, 42, { fill: 'paper' }),
      tx('+91 98906 35788', 3, 1.6, 45, {
        size: 1.9, font: 'sans', weight: 700, tracking: 0.02, color: 'soft', align: 'left',
      }),
      tx('officialjoshuadesouza@gmail.com', 48, 1.6, 49, {
        size: 1.85, font: 'sans', weight: 600, tracking: 0.01, color: 'soft', align: 'right',
      }),
      ph(6, 8.5, 21, 21, {
        role: 'logo', src: LOGO_MARK, shape: 'circle', radius: 0,
        backdrop: 'paper', borderColor: 'paper', borderWidth: 0.9,
      }),
      tx('47TH BHARATIYA', 5, 26, 52, {
        size: 3.4, font: 'sans', weight: 700, tracking: 0.08, color: 'paper', align: 'left',
      }),
      tx('JANATA\nPARTY', 5, 30, 52, {
        size: 10.2, lineHeight: 0.98, weight: 700, color: 'paper', align: 'left',
      }),
      tx('FOUNDATION DAY', 5, 46, 55, {
        size: 3.2, font: 'sans', weight: 600, tracking: 0.26, color: 'paper', align: 'left',
      }),
      line(5, 52, 20, 'paper', 0.7),
      tx('Wishing you a happy foundation day. Together, let us keep building a stronger tomorrow.', 5, 55, 46, {
        size: 2.3, font: 'serif', italic: true, lineHeight: 1.6, color: 'paper', align: 'left',
      }),
      ph(56, 30, 40, 54, {
        shape: 'rounded', radius: 1.2, backdrop: 'paper', borderColor: 'paper', borderWidth: 0.7,
      }),
      tx('Joshua Peter De Souza', 5, 75.5, 90, {
        size: 5, weight: 700, color: '#1e40af', align: 'left',
      }),
      tx('Dy. Speaker - Goa Legislative Assembly | MLA - Mapusa Constituency', 5, 81.5, 90, {
        size: 1.95, font: 'sans', weight: 600, color: 'ink', align: 'left',
      }),
      line(5, 86, 30, '#1e40af', 0.35),
      makeFooter('night', {
        x: 0,
        y: 94.9,
        w: 100,
        h: 7.2,
        radius: 0,
        items: [
          { id: 'fi1', icon: 'x', text: '@Joshua_de_souza', src: '' },
          { id: 'fi2', icon: 'instagram', text: '@joshuadesouza', src: '' },
          { id: 'fi3', icon: 'facebook', text: 'JoshuaDeSouzaOfficial', src: '' },
        ],
      }),
    ]
  ),

  tpl(
    'pol-banner', 'Campaign Banner', 'Political', 'Banner', 'tricolor',
    { type: 'linear', from: 'paper', to: 'sand', angle: 170, texture: false },
    [
      sh('rect', 0, 0, 100, 8, { fill: '#d97706' }),
      sh('rect', 0, 8, 100, 0.4, { fill: '#fff6e6', opacity: 0.9 }),
      sh('rect', 0, 88, 100, 12, { fill: '#2f7d4f' }),
      tx('PUBLIC MEETING · 2026', 5, 2.2, 90, {
        size: 2.2, font: 'sans', tracking: 0.34, color: 'paper', weight: 700, align: 'left',
      }),
      ph(5, 18, 30, 30, { borderColor: 'paper', borderWidth: 0.9, backdrop: 'paper' }),
      tx('CANDIDATE NAME', 5, 62.5, 30, { size: 1.8, font: 'sans', tracking: 0.16, align: 'center' }),
      tx('PARTY · CONSTITUENCY', 5, 66, 30, { size: 1.5, font: 'sans', tracking: 0.18, color: 'soft', align: 'center' }),
      tx('Your voice.\nYour future.', 41, 15, 54, { size: 8.2, lineHeight: 1.05, align: 'left' }),
      line(41, 36, 16, '#d97706', 1),
      tx('STAND WITH US FOR A STRONGER TOMORROW.', 41, 40, 52, {
        size: 2.1, font: 'sans', lineHeight: 1.65, color: 'soft', align: 'left',
      }),
      tx('DATE · TIME', 41, 53, 52, { size: 2.4, font: 'sans', tracking: 0.16, align: 'left' }),
      tx('VENUE NAME, CITY', 41, 58, 55, { size: 2.1, font: 'sans', color: 'soft', align: 'left' }),
      tx('Add your message here', 41, 65, 52, { size: 3.2, font: 'serif', italic: true, align: 'left' }),
      tx('CONTACT · RSVP', 41, 80, 52, { size: 1.8, font: 'sans', tracking: 0.18, color: 'soft', align: 'left' }),
    ],
    { aspect: 'landscape' }
  ),

  tpl(
    'pol-ribbon-saffron', 'Ribbon Leader', 'Political', 'Leader banner', 'tricolor',
    { type: 'solid', from: '#ffffff', to: '#ffffff', angle: 0, texture: false },
    [
      sh('rect', 7.5, 49.2, 72.5, 7.3, {
        fill: '#f8a63d', fill2: '#e06a10', angle: 90, radius: 3.65,
      }),
      orn('diya', 69.5, 54.2, 4.8, { color: '#fff0c2' }),
      tx('Anil Sharma', 24, 49.3, 52, {
        size: 5.6, font: 'sans', weight: 700, tracking: 0.01, color: '#ffffff', align: 'center',
      }),
      ph(0.5, 0, 24, 25, {
        src: CUTOUT_MARK, fit: 'contain', shape: 'rect', radius: 0,
        backdrop: 'none', borderColor: 'none', borderWidth: 0,
      }),
      sh('rect', 0, 77, 100, 0.6, { fill: '#6d1b1b' }),
      makeFooter('night', {
        x: 0,
        y: 79.4,
        w: 100,
        h: 5.15,
        radius: 0,
        bg: '#0d1233',
        color: '#ffffff',
        icons: 'brand',
        items: [
          { id: 'fi1', icon: 'x', text: '@AnilSharma', src: '' },
          { id: 'fi2', icon: 'instagram', text: '@anil_sharma', src: '' },
          { id: 'fi3', icon: 'facebook', text: 'Anil Sharma', src: '' },
        ],
      }),
    ],
    { aspect: 'banner' }
  ),

  tpl(
    'pol-ribbon-green', 'Green Ribbon Leader', 'Political', 'Leader banner', 'sage',
    { type: 'solid', from: '#ffffff', to: '#ffffff', angle: 0, texture: false },
    [
      orn('sunburst', 42, 18, 16, { color: '#f0d9a6', opacity: 0.9 }),
      sh('rect', 7.5, 49.2, 89, 7.3, {
        fill: '#2f9e44', fill2: '#2f9e44', fill3: '#ffffff', mix: 80, angle: 90, radius: 3.65,
      }),
      orn('stars', 90.5, 50, 5, { color: '#ffffff', opacity: 0.95 }),
      tx('Priya Singh', 24, 49.3, 52, {
        size: 5.6, font: 'sans', weight: 700, tracking: 0.01, color: '#ffffff', align: 'center',
      }),
      ph(0.5, 0, 24, 25, {
        src: CUTOUT_MARK, fit: 'contain', shape: 'rect', radius: 0,
        backdrop: 'none', borderColor: 'none', borderWidth: 0,
      }),
      sh('rect', 0, 77, 100, 0.6, { fill: '#7a1f1f' }),
      makeFooter('night', {
        x: 0,
        y: 79.4,
        w: 100,
        h: 5.15,
        radius: 0,
        bg: '#0d1233',
        color: '#ffffff',
        icons: 'brand',
        items: [
          { id: 'fi1', icon: 'x', text: '@PriyaSingh', src: '' },
          { id: 'fi2', icon: 'instagram', text: '@priya_singh', src: '' },
          { id: 'fi3', icon: 'facebook', text: 'Priya Singh', src: '' },
        ],
      }),
    ],
    { aspect: 'banner' }
  ),
]

export const CATEGORY_COUNTS = TEMPLATES.reduce((acc, t) => {
  acc[t.category] = (acc[t.category] || 0) + 1
  return acc
}, {})

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id)

const clone = (v) => JSON.parse(JSON.stringify(v))

export function docFromTemplate(id) {
  const template = getTemplate(id)
  if (!template) return null
  return {
    templateId: template.id,
    name: template.name,
    category: template.category,
    tag: template.tag,
    aspect: template.aspect,
    paletteId: template.palette,
    colors: { ...paletteColors(template.palette) },
    bg: clone(template.bg),
    elements: clone(template.elements),
  }
}

export function blankDoc() {
  return docFromTemplate('w-bloom')
}
