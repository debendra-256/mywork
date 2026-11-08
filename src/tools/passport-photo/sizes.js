/**
 * Passport / ID photo catalogue.
 * Every published standard is stored in millimetres because that is the unit the
 * rules are written in; pixels are always derived from the chosen DPI so the same
 * preset can be printed at 200, 300 or 600 DPI.
 */

export const MM_PER_UNIT = { mm: 1, cm: 10, in: 25.4 }

export const sizeUnits = [
  { id: 'mm', label: 'MM' },
  { id: 'cm', label: 'CM' },
  { id: 'in', label: 'Inch' },
  { id: 'px', label: 'PX' },
]

export const dpiOptions = [
  { id: 200, label: '200 DPI', note: 'Web / screen' },
  { id: 300, label: '300 DPI', note: 'Standard print' },
  { id: 600, label: '600 DPI', note: 'Lab quality' },
]

export const sizeRegions = [
  { id: 'popular', label: 'Most used' },
  { id: 'americas', label: 'Americas' },
  { id: 'europe', label: 'Europe' },
  { id: 'asia', label: 'Asia' },
  { id: 'middle-east', label: 'Middle East' },
  { id: 'africa', label: 'Africa' },
  { id: 'oceania', label: 'Oceania' },
  { id: 'online', label: 'Online upload' },
]

/**
 * headTop / headBottom are the fraction of the photo height where the crown and
 * chin should sit (ICAO-style guidance), eyeLine is where the eyes are measured.
 * bg is the backdrop most applications for that size expect.
 */
export const passportSizes = [
  { id: '35x45', label: '35 × 45 mm', region: 'popular', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'UK, EU Schengen, India, China ID, most of the world' },
  { id: '2x2in', label: '2 × 2 inch', region: 'popular', w: 50.8, h: 50.8, headTop: 0.12, headBottom: 0.82, eyeLine: 0.45, bg: 'white', note: 'USA passport, visa, green card' },
  { id: '3x4cm', label: '3 × 4 cm', region: 'popular', w: 30, h: 40, headTop: 0.08, headBottom: 0.78, eyeLine: 0.42, bg: 'white', note: 'India OCI, some Asian IDs' },
  { id: '5x7cm', label: '5 × 7 cm', region: 'popular', w: 50, h: 70, headTop: 0.1, headBottom: 0.8, eyeLine: 0.45, bg: 'white', note: 'Large format visa sheet' },
  { id: '35x35', label: '3.5 × 3.5 cm', region: 'popular', w: 35, h: 35, headTop: 0.12, headBottom: 0.84, eyeLine: 0.46, bg: 'white', note: 'Square format IDs' },
  { id: '25x35', label: '25 × 35 mm', region: 'popular', w: 25, h: 35, headTop: 0.07, headBottom: 0.78, eyeLine: 0.42, bg: 'lightblue', note: 'Japan, Korea ID, India stamp size' },

  { id: 'ca-50x70', label: 'Canada 50 × 70 mm', region: 'americas', w: 50, h: 70, headTop: 0.11, headBottom: 0.69, eyeLine: 0.42, bg: 'white', note: 'Canadian passport and visa' },
  { id: 'br-30x40', label: 'Brazil 30 × 40 mm', region: 'americas', w: 30, h: 40, headTop: 0.08, headBottom: 0.76, eyeLine: 0.42, bg: 'white', note: 'RG, passport' },
  { id: 'mx-45x56', label: 'Mexico 45 × 56 mm', region: 'americas', w: 45, h: 56, headTop: 0.1, headBottom: 0.75, eyeLine: 0.43, bg: 'white', note: 'Pasaporte' },
  { id: 'ar-40x40', label: 'Argentina 40 × 40 mm', region: 'americas', w: 40, h: 40, headTop: 0.12, headBottom: 0.82, eyeLine: 0.46, bg: 'white', note: 'DNI square format' },
  { id: 'us-37x47', label: 'USA 37 × 47 mm', region: 'americas', w: 37, h: 47, headTop: 0.1, headBottom: 0.8, eyeLine: 0.45, bg: 'white', note: 'Some visa and school forms' },

  { id: 'de-35x45', label: 'Germany 35 × 45 mm', region: 'europe', w: 35, h: 45, headTop: 0.06, headBottom: 0.82, eyeLine: 0.44, bg: 'offwhite', note: 'Personalausweis, biometric' },
  { id: 'fr-35x45', label: 'France 35 × 45 mm', region: 'europe', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'lightblue', note: 'Carte identité, passeport' },
  { id: 'es-32x40', label: 'Spain 32 × 40 mm', region: 'europe', w: 32, h: 40, headTop: 0.08, headBottom: 0.78, eyeLine: 0.43, bg: 'white', note: 'DNI' },
  { id: 'it-35x40', label: 'Italy 35 × 40 mm', region: 'europe', w: 35, h: 40, headTop: 0.08, headBottom: 0.78, eyeLine: 0.43, bg: 'lightblue', note: 'Carta d’identità' },
  { id: 'ru-35x45', label: 'Russia 35 × 45 mm', region: 'europe', w: 35, h: 45, headTop: 0.08, headBottom: 0.76, eyeLine: 0.42, bg: 'white', note: 'Internal passport' },
  { id: 'pl-35x45', label: 'Poland 35 × 45 mm', region: 'europe', w: 35, h: 45, headTop: 0.07, headBottom: 0.79, eyeLine: 0.44, bg: 'offwhite', note: 'Dowód osobisty' },
  { id: 'tr-50x60', label: 'Türkiye 50 × 60 mm', region: 'europe', w: 50, h: 60, headTop: 0.1, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'ID and visa' },

  { id: 'cn-33x48', label: 'China 33 × 48 mm', region: 'asia', w: 33, h: 48, headTop: 0.1, headBottom: 0.75, eyeLine: 0.42, bg: 'white', note: 'Passport (JPK)' },
  { id: 'jp-35x45', label: 'Japan 35 × 45 mm', region: 'asia', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.43, bg: 'white', note: 'Passport, driver ID' },
  { id: 'kr-35x45', label: 'Korea 35 × 45 mm', region: 'asia', w: 35, h: 45, headTop: 0.08, headBottom: 0.77, eyeLine: 0.43, bg: 'white', note: 'Passport' },
  { id: 'in-51x51', label: 'India 51 × 51 mm', region: 'asia', w: 51, h: 51, headTop: 0.12, headBottom: 0.82, eyeLine: 0.46, bg: 'white', note: 'US visa from India, some state forms' },
  { id: 'vn-40x60', label: 'Vietnam 40 × 60 mm', region: 'asia', w: 40, h: 60, headTop: 0.1, headBottom: 0.75, eyeLine: 0.43, bg: 'white', note: 'Passport (square-shoulder)' },
  { id: 'th-40x60', label: 'Thailand 40 × 60 mm', region: 'asia', w: 40, h: 60, headTop: 0.1, headBottom: 0.76, eyeLine: 0.43, bg: 'white', note: 'Passport, visa' },
  { id: 'id-30x40', label: 'Indonesia 30 × 40 mm', region: 'asia', w: 30, h: 40, headTop: 0.08, headBottom: 0.78, eyeLine: 0.43, bg: 'red', note: 'KTP, some licences' },
  { id: 'ph-35x45', label: 'Philippines 35 × 45 mm', region: 'asia', w: 35, h: 45, headTop: 0.08, headBottom: 0.77, eyeLine: 0.43, bg: 'white', note: 'Passport' },
  { id: 'pk-35x45', label: 'Pakistan 35 × 45 mm', region: 'asia', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'Passport, NICOP' },

  { id: 'ae-43x55', label: 'UAE 43 × 55 mm', region: 'middle-east', w: 43, h: 55, headTop: 0.1, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'Visa, Emirates ID' },
  { id: 'sa-40x60', label: 'Saudi Arabia 40 × 60 mm', region: 'middle-east', w: 40, h: 60, headTop: 0.1, headBottom: 0.76, eyeLine: 0.43, bg: 'white', note: 'Passport, visa' },
  { id: 'qa-35x45', label: 'Qatar 35 × 45 mm', region: 'middle-east', w: 35, h: 45, headTop: 0.08, headBottom: 0.77, eyeLine: 0.43, bg: 'white', note: 'ID card, visa' },
  { id: 'om-40x50', label: 'Oman 40 × 50 mm', region: 'middle-east', w: 40, h: 50, headTop: 0.09, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'Passport' },

  { id: 'za-35x45', label: 'South Africa 35 × 45 mm', region: 'africa', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'ID book, passport' },
  { id: 'ng-30x40', label: 'Nigeria 30 × 40 mm', region: 'africa', w: 30, h: 40, headTop: 0.08, headBottom: 0.78, eyeLine: 0.43, bg: 'white', note: 'Passport, NIN slip' },
  { id: 'ke-35x45', label: 'Kenya 35 × 45 mm', region: 'africa', w: 35, h: 45, headTop: 0.08, headBottom: 0.77, eyeLine: 0.43, bg: 'white', note: 'ID card, passport' },
  { id: 'eg-40x60', label: 'Egypt 40 × 60 mm', region: 'africa', w: 40, h: 60, headTop: 0.1, headBottom: 0.76, eyeLine: 0.43, bg: 'white', note: 'National ID' },

  { id: 'au-35x45', label: 'Australia 35 × 45 mm', region: 'oceania', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'Passport, licence' },
  { id: 'nz-35x45', label: 'New Zealand 35 × 45 mm', region: 'oceania', w: 35, h: 45, headTop: 0.08, headBottom: 0.77, eyeLine: 0.43, bg: 'white', note: 'Passport' },
  { id: 'fj-35x45', label: 'Fiji 35 × 45 mm', region: 'oceania', w: 35, h: 45, headTop: 0.08, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'Passport' },

  { id: 'px-300', label: '300 × 300 px', region: 'online', px: { w: 300, h: 300 }, headTop: 0.12, headBottom: 0.82, eyeLine: 0.46, bg: 'white', note: 'Bangladesh e-passport, online forms' },
  { id: 'px-600', label: '600 × 600 px', region: 'online', px: { w: 600, h: 600 }, headTop: 0.12, headBottom: 0.82, eyeLine: 0.46, bg: 'white', note: 'High resolution online upload' },
  { id: 'px-200x230', label: '200 × 230 px', region: 'online', px: { w: 200, h: 230 }, headTop: 0.08, headBottom: 0.78, eyeLine: 0.43, bg: 'white', note: 'DS-160 style small upload' },
  { id: 'px-413x531', label: '413 × 531 px', region: 'online', px: { w: 413, h: 531 }, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: '35 × 45 mm at 300 DPI' },
]

export const customPreset = { id: 'custom', label: 'Custom size', region: 'popular', w: 35, h: 45, headTop: 0.07, headBottom: 0.78, eyeLine: 0.44, bg: 'white', note: 'Set your own width, height and unit' }

export const sizeById = (id) => passportSizes.find((item) => item.id === id) || passportSizes[0]

export const backgrounds = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'offwhite', label: 'Off white', color: '#f4f2ee' },
  { id: 'lightblue', label: 'Light blue', color: '#cfe1f1' },
  { id: 'blue', label: 'Blue', color: '#2f6fb2' },
  { id: 'grey', label: 'Grey', color: '#d8dade' },
  { id: 'navy', label: 'Navy', color: '#1e2c47' },
  { id: 'red', label: 'Red', color: '#cf2331' },
  { id: 'green', label: 'Green', color: '#2e8b57' },
  { id: 'beige', label: 'Beige', color: '#e7dcc6' },
  { id: 'transparent', label: 'Transparent', color: null },
]

export const backgroundById = (id) => backgrounds.find((item) => item.id === id) || backgrounds[0]

export const papers = [
  { id: '4x6', label: '4 × 6 in', w: 101.6, h: 152.4 },
  { id: '5x7', label: '5 × 7 in', w: 127, h: 177.8 },
  { id: '3.5x5', label: '3.5 × 5 in', w: 88.9, h: 127 },
  { id: 'a4', label: 'A4', w: 210, h: 297 },
  { id: 'a5', label: 'Half A4 (A5)', w: 148, h: 210 },
  { id: 'a6', label: 'A6', w: 105, h: 148 },
  { id: 'letter', label: 'US Letter', w: 215.9, h: 279.4 },
]

export const paperById = (id) => papers.find((item) => item.id === id) || papers[0]

export const mmToPx = (mm, dpi) => Math.round((mm / 25.4) * dpi)
export const pxToMm = (px, dpi) => (px / dpi) * 25.4

export function unitToMm(value, unit, dpi) {
  if (unit === 'px') return pxToMm(value, dpi)
  return value * MM_PER_UNIT[unit]
}

export function mmToUnit(mm, unit, dpi) {
  if (unit === 'px') return Math.round(mmToPx(mm, dpi))
  return Math.round((mm / MM_PER_UNIT[unit]) * 100) / 100
}

/** Output pixel box for a preset, honouring the px-only online presets. */
export function framePixels(preset, dpi, custom) {
  if (preset.px) return { w: preset.px.w, h: preset.px.h }
  const source = custom || preset
  return { w: mmToPx(source.w, dpi), h: mmToPx(source.h, dpi) }
}
