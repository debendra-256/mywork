/**
 * Site theme definitions. Every colour the app paints comes from these token
 * maps, so a theme is data plus one `data-theme` attribute — no component knows
 * which theme is active. `src/theme/themes.css` consumes the tokens.
 */

export type ThemeId = 'premium-purple' | 'dark-neon' | 'ocean-cyan' | 'sunset-gradient'

export interface ThemeDefinition {
  id: ThemeId
  number: number
  name: string
  tagline: string
  /** The five dots shown next to a theme in the admin picker. */
  swatches: readonly string[]
  /** Dark themes flip form controls, scrollbars and `color-scheme`. */
  dark: boolean
  tokens: Readonly<Record<string, string>>
}

export const DEFAULT_THEME: ThemeId = 'premium-purple'

export const themeList: readonly ThemeDefinition[] = [
  {
    id: 'premium-purple',
    number: 1,
    name: 'Premium Purple',
    tagline: 'Modern, clean and professional. Great for a premium AI tools platform.',
    swatches: ['#1e1b3a', '#7c3aed', '#c4b5fd', '#f4f1fb', '#22c55e'],
    dark: false,
    tokens: {
      canvas: '#f5f3fb',
      paper: '#ffffff',
      surface: '#faf8fe',
      ink: '#1d1a2b',
      'ink-soft': '#3a3450',
      muted: '#77708c',
      faint: '#a9a3bd',
      line: '#e9e4f5',
      'line-strong': '#d9d0ee',
      brand: '#7c3aed',
      'brand-dark': '#5f24c9',
      'brand-ink': '#4a1fa8',
      'brand-soft': '#f1eafe',
      'brand-softer': '#f8f4ff',
      'brand-line': '#ded0f9',
      'brand-glow': '#7c3aed2b',
      accent: '#a855f7',
      'accent-2': '#4f46e5',
      mint: '#c4b5fd',
      'header-bg': '#ffffff',
      'nav-hover': '#f4f0fd',
      'pill-bg': '#f3edfd',
      'chip-bg': '#f7f4fd',
      'btn-ink': '#ffffff',
      'btn-primary': 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      'btn-primary-hover': '#5b21b6',
      'hero-bg': 'linear-gradient(135deg,#f7f2ff 0%,#efe6ff 46%,#e6dcff 100%)',
      'hero-ink': '#211c33',
      'hero-muted': '#6b6482',
      'hero-line': '#e6dcf8',
      'hero-card': '#ffffff',
      'hero-chip': '#f0e9fe',
      'hero-glow': '#a855f733',
      shadow: '0 16px 40px #4c1d951f',
      'shadow-strong': '0 22px 60px #4c1d9529',
    },
  },
  {
    id: 'dark-neon',
    number: 2,
    name: 'Dark Neon',
    tagline: 'Bold, modern and high-contrast. Perfect for a tech and AI focused brand.',
    swatches: ['#07060e', '#a855f7', '#22d3ee', '#f472b6', '#f2eeff'],
    dark: true,
    tokens: {
      canvas: '#07060e',
      paper: '#131022',
      surface: '#1a1530',
      ink: '#f2eeff',
      'ink-soft': '#d8d1f0',
      muted: '#9a92b8',
      faint: '#6f688c',
      line: '#292145',
      'line-strong': '#3a2f61',
      brand: '#a855f7',
      'brand-dark': '#c084fc',
      'brand-ink': '#e4c9ff',
      'brand-soft': '#241a44',
      'brand-softer': '#1b1435',
      'brand-line': '#3d2c6e',
      'brand-glow': '#a855f759',
      accent: '#22d3ee',
      'accent-2': '#f472b6',
      mint: '#67e8f9',
      'header-bg': '#0d0a1a',
      'nav-hover': '#1d1638',
      'pill-bg': '#241a44',
      'chip-bg': '#1a1530',
      'btn-ink': '#0b0716',
      'btn-primary': 'linear-gradient(135deg,#c084fc,#7c3aed)',
      'btn-primary-hover': '#d8b4fe',
      'hero-bg': 'linear-gradient(135deg,#140d2b 0%,#1b1038 45%,#0a1233 100%)',
      'hero-ink': '#ffffff',
      'hero-muted': '#b6a9d8',
      'hero-line': '#2c2150',
      'hero-card': '#171130',
      'hero-chip': '#241a44',
      'hero-glow': '#22d3ee4d',
      shadow: '0 18px 44px #0000008c',
      'shadow-strong': '0 24px 60px #000000a6',
    },
  },
  {
    id: 'ocean-cyan',
    number: 3,
    name: 'Ocean Cyan',
    tagline: 'Fresh, trustworthy and modern. Ideal for a clean and scalable product.',
    swatches: ['#0c2a33', '#0891b2', '#22d3ee', '#d9f2f8', '#14b8a6'],
    dark: false,
    tokens: {
      canvas: '#f0f8fb',
      paper: '#ffffff',
      surface: '#f7fcfd',
      ink: '#0c2a33',
      'ink-soft': '#1d4a58',
      muted: '#567882',
      faint: '#9ab6bd',
      line: '#d9eaf0',
      'line-strong': '#bcdfe9',
      brand: '#0891b2',
      'brand-dark': '#0a6f88',
      'brand-ink': '#075a6e',
      'brand-soft': '#e0f5fa',
      'brand-softer': '#f1fafd',
      'brand-line': '#bfe6f0',
      'brand-glow': '#0891b22e',
      accent: '#14b8a6',
      'accent-2': '#2563eb',
      mint: '#99f6e4',
      'header-bg': '#ffffff',
      'nav-hover': '#eaf7fa',
      'pill-bg': '#e2f4f9',
      'chip-bg': '#f2fafc',
      'btn-ink': '#ffffff',
      'btn-primary': 'linear-gradient(135deg,#22c1d6,#0891b2)',
      'btn-primary-hover': '#0e7490',
      'hero-bg': 'linear-gradient(135deg,#eafaff 0%,#dbf3fb 48%,#cdeef7 100%)',
      'hero-ink': '#0b2b34',
      'hero-muted': '#4f7681',
      'hero-line': '#cbe9f1',
      'hero-card': '#ffffff',
      'hero-chip': '#dff4fa',
      'hero-glow': '#14b8a633',
      shadow: '0 16px 40px #0b4a5a1f',
      'shadow-strong': '0 22px 60px #0b4a5a2b',
    },
  },
  {
    id: 'sunset-gradient',
    number: 4,
    name: 'Sunset Gradient',
    tagline: 'Creative, vibrant and premium. Stands out while keeping a friendly look.',
    swatches: ['#2a1620', '#f97316', '#ec4899', '#ffd9c2', '#fbbf24'],
    dark: false,
    tokens: {
      canvas: '#fff6f1',
      paper: '#fffdfa',
      surface: '#fff8f4',
      ink: '#2a1620',
      'ink-soft': '#4d2a36',
      muted: '#8c6b75',
      faint: '#b99aa2',
      line: '#f7ddd0',
      'line-strong': '#f2c6b2',
      brand: '#f97316',
      'brand-dark': '#dd500c',
      'brand-ink': '#a83a08',
      'brand-soft': '#ffe7d6',
      'brand-softer': '#fff3ea',
      'brand-line': '#fbd0b6',
      'brand-glow': '#f9731633',
      accent: '#ec4899',
      'accent-2': '#f59e0b',
      mint: '#fcd34d',
      'header-bg': '#fffdfa',
      'nav-hover': '#ffeee2',
      'pill-bg': '#ffe6d5',
      'chip-bg': '#fff4ec',
      'btn-ink': '#ffffff',
      'btn-primary': 'linear-gradient(135deg,#fb923c,#ec4899)',
      'btn-primary-hover': '#e0500f',
      'hero-bg': 'linear-gradient(135deg,#fff1e6 0%,#ffe4ee 52%,#ffd6e6 100%)',
      'hero-ink': '#2a1620',
      'hero-muted': '#7c5a63',
      'hero-line': '#f8d6c6',
      'hero-card': '#fffdfa',
      'hero-chip': '#ffe6d5',
      'hero-glow': '#ec489933',
      shadow: '0 16px 40px #a3341a1f',
      'shadow-strong': '0 22px 60px #a3341a29',
    },
  },
]

export const themeIds: readonly ThemeId[] = themeList.map((theme) => theme.id)

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (themeIds as readonly string[]).includes(value)
}

export function themeById(id: ThemeId): ThemeDefinition {
  return themeList.find((theme) => theme.id === id) ?? themeList[0]
}

/** CSS custom properties for the palette, ready to write onto an element. */
export function themeVariables(theme: ThemeDefinition): Record<string, string> {
  const variables: Record<string, string> = { '--scheme': theme.dark ? 'dark' : 'light' }
  for (const [name, value] of Object.entries(theme.tokens)) variables[`--${name}`] = value
  return variables
}
