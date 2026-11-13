/**
 * Unicode text transforms behind the Emoji Text Generator.
 *
 * Every style is a pure `(text) => text` function, so adding one means adding a
 * catalog entry and nothing else. Combining marks attach to a base transform
 * rather than to raw text, which is what lets a style stack with a font.
 */

const code = (value) => String.fromCodePoint(value)
const codes = (values) => values.map(code)
const range = (start, count) => codes(Array.from({ length: count }, (_, index) => start + index))

function mapCharacters(text, spec) {
  const { lower, upper, digits, exceptions } = spec
  return Array.from(text, (character) => {
    const exception = exceptions?.[character]
    if (exception) return exception
    const value = character.codePointAt(0)
    if (lower !== undefined && value >= 97 && value <= 122) return code(lower + value - 97)
    if (upper !== undefined && value >= 65 && value <= 90) return code(upper + value - 65)
    if (digits !== undefined && value >= 48 && value <= 57) {
      if (Array.isArray(digits)) return digits[value - 48]
      return code(digits + value - 48)
    }
    return character
  }).join('')
}

/**
 * A substitute alphabet. `raise` mirrors the input's capitalisation onto the
 * replacement glyph; `flat` keeps one glyph for both cases, which is what small
 * caps wants since its capitals are the same letters.
 */
function alphabetMap(table, caseMode = 'raise') {
  return (text) => Array.from(text, (character) => {
    const lower = character.toLowerCase()
    const glyph = table[lower]
    if (!glyph) return character
    return caseMode === 'flat' || character === lower ? glyph : glyph.toUpperCase()
  }).join('')
}

function tableFrom(entries) {
  return entries.reduce((table, [letter, glyph]) => Object.assign(table, { [letter]: glyph }), {})
}

function zipTable(glyphs) {
  return tableFrom([...'abcdefghijklmnopqrstuvwxyz'].map((letter, index) => [letter, glyphs[index]]))
}

/** Attach a combining mark after every non-space character. */
function overlay(text, mark) {
  return Array.from(text, (character) => (/\s/.test(character) ? character : `${character}${mark}`)).join('')
}

function surround(prefix, suffix) {
  return (text) => (text ? `${prefix}${text}${suffix}` : '')
}

/** `⚡H⚡i` — put the decoration in front of every character. */
function eachWith(decoration) {
  return (text) => Array.from(text, (character) => (/\s/.test(character) ? character : `${decoration}${character}`)).join('')
}

const exceptions = (entries) => tableFrom(entries.map(([letter, value]) => [code(letter), code(value)]))

const MATH_FONTS = [
  { id: 'bold', name: 'Bold', spec: { lower: 0x1d41a, upper: 0x1d400, digits: 0x1d7ce } },
  { id: 'bold-italic', name: 'Bold Italic', spec: { lower: 0x1d482, upper: 0x1d468, exceptions: exceptions([[0x68, 0x210f]]) } },
  { id: 'sans-bold', name: 'Sans Bold', spec: { lower: 0x1d5ee, upper: 0x1d5d4, digits: 0x1d7ec } },
  { id: 'sans-bold-italic', name: 'Sans Bold Italic', spec: { lower: 0x1d656, upper: 0x1d63c } },
  { id: 'script-bold', name: 'Bold Script', spec: { lower: 0x1d4ea, upper: 0x1d4d0 } },
  { id: 'italic', name: 'Italic', spec: { lower: 0x1d44e, upper: 0x1d434, exceptions: exceptions([[0x68, 0x210e]]) } },
  { id: 'script', name: 'Script', spec: { lower: 0x1d4b6, upper: 0x1d49c, exceptions: exceptions([[0x42, 0x212c], [0x45, 0x2130], [0x46, 0x2131], [0x48, 0x210b], [0x49, 0x2110], [0x4c, 0x2112], [0x4d, 0x2133], [0x52, 0x211b], [0x65, 0x212f], [0x67, 0x210a], [0x6f, 0x2134]]) } },
  { id: 'sans', name: 'Sans Serif', spec: { lower: 0x1d5ba, upper: 0x1d5a0, digits: 0x1d7e2 } },
  { id: 'sans-italic', name: 'Sans Italic', spec: { lower: 0x1d622, upper: 0x1d608 } },
  { id: 'fraktur', name: 'Fraktur', spec: { lower: 0x1d51e, upper: 0x1d504, exceptions: exceptions([[0x43, 0x212d], [0x48, 0x210c], [0x49, 0x2111], [0x52, 0x211c], [0x5a, 0x211d]]) } },
  { id: 'fraktur-bold', name: 'Bold Fraktur', spec: { lower: 0x1d586, upper: 0x1d56c } },
  { id: 'double-struck', name: 'Double Struck', spec: { lower: 0x1d552, upper: 0x1d538, digits: 0x1d7d8, exceptions: exceptions([[0x43, 0x2102], [0x48, 0x210d], [0x4e, 0x2115], [0x50, 0x2119], [0x51, 0x211a], [0x52, 0x211d], [0x5a, 0x2124]]) } },
  { id: 'monospace', name: 'Monospace', spec: { lower: 0x1d68a, upper: 0x1d670, digits: 0x1d7f6 } },
]

/** Reuse a Unicode math alphabet as a standalone transform. */
const mathFont = (id) => (text) => mapCharacters(text, MATH_FONTS.find((font) => font.id === id).spec)

const SMALL_CAPS = zipTable(codes([
  0x1d00, 0x0299, 0x1d04, 0x1d05, 0x1d07, 0xa730, 0x0262, 0x029c, 0x026a, 0x1d0c, 0x1d0d, 0x029f,
  0x1d0f, 0x0274, 0x1d11, 0x1d18, 0x01eb, 0x0280, 0xa731, 0x1d1b, 0x1d1c, 0x1d20, 0x1d21, 0x0078, 0x028f, 0x1d22,
]))

const GREEK = zipTable(codes([
  0x03b1, 0x03b2, 0x03c7, 0x03b4, 0x03b5, 0x03c6, 0x03b3, 0x03b7, 0x03b9, 0x03f3, 0x03ba, 0x03bb,
  0x03bc, 0x03bd, 0x03bf, 0x03c0, 0x03d9, 0x03c1, 0x03c3, 0x03c4, 0x03c5, 0x03bd, 0x03c9, 0x03be, 0x03c5, 0x03b6,
]))

const CYRILLIC = zipTable(codes([
  0x0430, 0x0432, 0x0441, 0x0501, 0x0435, 0x0444, 0x0493, 0x04bb, 0x0456, 0x0458, 0x043a, 0x043b,
  0x043c, 0x0438, 0x043e, 0x0440, 0x0071, 0x0433, 0x0455, 0x0442, 0x0446, 0x0475, 0x0448, 0x0445, 0x0443, 0x0437,
]))

const CHEROKEE = zipTable(range(0x13a0, 26))
const RUNIC = zipTable(range(0x16a0, 26))

const CIRCLED_DIGITS = codes([0x24ea, 0x2460, 0x2461, 0x2462, 0x2463, 0x2464, 0x2465, 0x2466, 0x2467, 0x2468])
const PAREN_DIGITS = ['0', ...codes([0x2474, 0x2475, 0x2476, 0x2477, 0x2478, 0x2479, 0x247a, 0x247b, 0x247c])]

const SUPERSRIPT = tableFrom([
  ['0', '⁰'], ['1', '¹'], ['2', '²'], ['3', '³'], ['4', '⁴'], ['5', '⁵'], ['6', '⁶'], ['7', '⁷'], ['8', '⁸'], ['9', '⁹'],
  ['a', 'ᵃ'], ['b', 'ᵇ'], ['c', 'ᶜ'], ['d', 'ᵈ'], ['e', 'ᵉ'], ['f', 'ᶠ'], ['g', 'ᵍ'], ['h', 'ʰ'], ['i', 'ⁱ'], ['j', 'ʲ'],
  ['k', 'ᵏ'], ['l', 'ˡ'], ['m', 'ᵐ'], ['n', 'ⁿ'], ['o', 'ᵒ'], ['p', 'ᵖ'], ['r', 'ʳ'], ['s', 'ˢ'], ['t', 'ᵗ'], ['u', 'ᵘ'],
  ['v', 'ᵛ'], ['w', 'ʷ'], ['x', 'ˣ'], ['y', 'ʸ'], ['z', 'ᶻ'],
])

const SUBSCRIPT = tableFrom([
  ['0', '₀'], ['1', '₁'], ['2', '₂'], ['3', '₃'], ['4', '₄'], ['5', '₅'], ['6', '₆'], ['7', '₇'], ['8', '₈'], ['9', '₉'],
  ['a', 'ₐ'], ['e', 'ₑ'], ['h', 'ₕ'], ['i', 'ᵢ'], ['j', 'ⱼ'], ['k', 'ₖ'], ['l', 'ₗ'], ['m', 'ₘ'], ['n', 'ₙ'], ['o', 'ₒ'],
  ['p', 'ₚ'], ['r', 'ᵣ'], ['s', 'ₛ'], ['t', 'ₜ'], ['u', 'ᵤ'], ['v', 'ᵥ'], ['x', 'ₓ'],
])

const substitute = (table) => (text) => Array.from(text, (character) => table[character] ?? character).join('')

const FLIP_LETTERS = zipTable(codes([
  0x0250, 0x0071, 0x0254, 0x0070, 0x01dd, 0x025f, 0x0183, 0x0265, 0x1d09, 0x027e, 0x029e, 0x006c,
  0x026f, 0x0075, 0x006f, 0x0064, 0x0062, 0x0279, 0x0073, 0x0287, 0x006e, 0x028c, 0x028d, 0x0078, 0x028e, 0x007a,
]))
const FLIP_DIGITS = codes([0x0030, 0x0196, 0x1105, 0x0190, 0x3123, 0x03db, 0x0039, 0x3125, 0x0038, 0x0036])
const FLIP_PUNCTUATION = tableFrom([['.', '˙'], [',', "'"], ['!', '¡'], ['?', '¿'], ['(', ')'], [')', '('], ['[', ']'], [']', '['], ['{', '}'], ['}', '{'], ['"', ',,'], ["'", '‘']])

function flip(text) {
  const turned = Array.from(text.toLowerCase(), (character) => {
    const value = character.codePointAt(0)
    if (value >= 48 && value <= 57) return FLIP_DIGITS[value - 48]
    return FLIP_LETTERS[character] ?? FLIP_PUNCTUATION[character] ?? character
  })
  return turned.reverse().join('')
}

const fullwidth = (text) => Array.from(text, (character) => {
  const value = character.codePointAt(0)
  if (character === ' ') return code(0x3000)
  return value >= 0x21 && value <= 0x7e ? code(value + 0xfee0) : character
}).join('')

const ZALGO_ABOVE = codes([0x0301, 0x0300, 0x0302, 0x0303, 0x0305, 0x0306, 0x0307, 0x0308, 0x030a, 0x033d, 0x031b, 0x20d9])
const ZALGO_BELOW = codes([0x0316, 0x0317, 0x0318, 0x031c, 0x0323, 0x0324, 0x0325, 0x032e, 0x0330, 0x0333, 0x033a, 0x0348])
const ZALGO_MID = codes([0x0319, 0x031d, 0x0320, 0x0321, 0x0322, 0x0336, 0x0337, 0x0338])

/** Deterministic glitching, so the same input always copies out the same string. */
function zalgo(depth) {
  return (text) => Array.from(text, (character) => {
    if (/\s/.test(character)) return character
    const seed = character.codePointAt(0)
    const marks = (pool, count, salt) => Array.from({ length: count }, (_, index) => pool[(seed + index * salt) % pool.length]).join('')
    return `${marks(ZALGO_ABOVE, depth.above, 7)}${character}${marks(ZALGO_MID, depth.mid, 5)}${marks(ZALGO_BELOW, depth.below, 11)}`
  }).join('')
}

/** `H e l l o` — put something between every character. */
function joinWith(separator) {
  return (text) => Array.from(text).join(separator)
}

/** Dot or rule separators inside a word, a clear gap between words. */
function joinWithinWords(separator, wordSeparator) {
  return (text) => text.split(/\s+/).filter(Boolean).map((word) => Array.from(word).join(separator)).join(wordSeparator)
}

const snake = (text) => text.trim().toLowerCase().replace(/\s+/g, '_')

/** Frame an already-transformed string, and stay empty when there is nothing to frame. */
function framed(inner, prefix, suffix) {
  return (text) => (text ? `${prefix}${inner(text)}${suffix}` : '')
}

const emojiWrap = (left, right) => surround(`${left} `, ` ${right}`)

export const styleCategories = [
  { id: 'all', label: 'All Styles' },
  { id: 'fancy', label: 'Fancy' },
  { id: 'cute', label: 'Cute' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'aesthetic', label: 'Aesthetic' },
  { id: 'gothic', label: 'Gothic' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'emoji', label: 'Emoji Decorated' },
]

export const textStyles = [
  ...MATH_FONTS.map((font) => ({ id: font.id, name: font.name, category: 'fancy', transform: mathFont(font.id) })),
  { id: 'circled', name: 'Circled', category: 'fancy', transform: (text) => mapCharacters(text, { lower: 0x24d0, upper: 0x24b6, digits: CIRCLED_DIGITS }) },
  { id: 'parenthesized', name: 'Parenthesized', category: 'fancy', transform: (text) => mapCharacters(text.toLowerCase(), { lower: 0x249c, digits: PAREN_DIGITS }) },
  { id: 'small-caps', name: 'Small Caps', category: 'fancy', transform: alphabetMap(SMALL_CAPS, 'flat') },
  { id: 'superscript', name: 'Superscript', category: 'fancy', transform: substitute(SUPERSRIPT) },
  { id: 'subscript', name: 'Subscript', category: 'fancy', transform: substitute(SUBSCRIPT) },
  { id: 'fullwidth', name: 'Fullwidth', category: 'fancy', transform: fullwidth },
  { id: 'flip', name: 'Upside Down', category: 'fancy', transform: flip },

  { id: 'underline', name: 'Underline', category: 'fancy', transform: (text) => overlay(text, code(0x0332)) },
  { id: 'double-underline', name: 'Double Underline', category: 'fancy', transform: (text) => overlay(text, code(0x0333)) },
  { id: 'wavy-underline', name: 'Squiggly Line', category: 'fancy', transform: (text) => overlay(text, code(0x0330)) },
  { id: 'overline', name: 'Overline', category: 'fancy', transform: (text) => overlay(text, code(0x0305)) },
  { id: 'strikethrough', name: 'Strikethrough', category: 'fancy', transform: (text) => overlay(text, code(0x0336)) },
  { id: 'slashed', name: 'Slashed Out', category: 'fancy', transform: (text) => overlay(text, code(0x0338)) },
  { id: 'dotted', name: 'Dotted', category: 'fancy', transform: (text) => overlay(text, code(0x0307)) },
  { id: 'greek', name: 'Greek', category: 'fancy', transform: alphabetMap(GREEK) },
  { id: 'cyrillic', name: 'Slavic', category: 'fancy', transform: alphabetMap(CYRILLIC) },
  { id: 'cherokee', name: 'Cherokee', category: 'fancy', transform: alphabetMap(CHEROKEE) },

  { id: 'wings', name: '꧁ Wings ꧂', category: 'cute', transform: surround('꧁', '꧂') },
  { id: 'heart-line', name: 'Heart Beat', category: 'cute', transform: eachWith('♡') },
  { id: 'kawaii', name: 'Kawaii Face', category: 'cute', transform: surround('꒰ᐢ ', ' ᐢ꒱') },
  { id: 'soft-point', name: 'Soft Point', category: 'cute', transform: surround('˗ˏˋ ', ' ˎˊ˗') },
  { id: 'bow', name: 'Ribbon Bow', category: 'cute', transform: surround('ʚɞ ', ' ʚɞ') },
  { id: 'flower-chain', name: 'Flower Chain', category: 'cute', transform: eachWith('✿') },
  { id: 'music-note', name: 'Music Notes', category: 'cute', transform: surround('♩♪♫ ', ' ♫♪♩') },
  { id: 'soft-wave', name: 'Soft Wave', category: 'cute', transform: surround('·.¸¸.·♩♪♋ ', ' ♋♪♩·¸¸.·') },
  { id: 'star-string', name: 'String of Stars', category: 'cute', transform: surround('★彡[', ']彡★') },
  { id: 'pink-heart', name: 'Pink Heart', category: 'cute', transform: surround('💗 ', ' 💗') },

  { id: 'glitch-light', name: 'Glitch Light', category: 'gaming', transform: zalgo({ above: 1, mid: 0, below: 1 }) },
  { id: 'glitch-heavy', name: 'Glitch Heavy', category: 'gaming', transform: zalgo({ above: 2, mid: 1, below: 2 }) },
  { id: 'corrupt', name: 'Corrupted', category: 'gaming', transform: zalgo({ above: 3, mid: 2, below: 3 }) },
  { id: 'clan-tag', name: 'Clan Tag', category: 'gaming', transform: framed((text) => mapCharacters(text.toUpperCase(), { upper: 0x1d5d4 }), '【', '】') },
  { id: 'sniper', name: 'Sniper', category: 'gaming', transform: surround('▄︻̷̷┻═━一 ', ' 一━═┻̷̷︻▄') },
  { id: 'spectrum', name: 'Spectrum Bars', category: 'gaming', transform: surround('▁▂▄▆█ ', ' █▆▄▂▁') },
  { id: 'crossed-out', name: 'Denied', category: 'gaming', transform: (text) => overlay(mapCharacters(text, { lower: 0x1d5ee, upper: 0x1d5d4 }), code(0x0336)) },
  { id: 'neon-grid', name: 'Neon Grid', category: 'gaming', transform: framed((text) => mapCharacters(text, { lower: 0x1d5ba, upper: 0x1d5a0 }), '⌜', '⌟') },
  { id: 'toxic', name: 'Toxic', category: 'gaming', transform: eachWith('☣') },

  { id: 'vaporwave', name: 'Vaporwave', category: 'aesthetic', transform: framed(fullwidth, '『', '』') },
  { id: 'aesthetic-star', name: 'Star Dust', category: 'aesthetic', transform: surround('⋆｡˚ ', ' ˚｡⋆') },
  { id: 'aesthetic-halo', name: 'Halo', category: 'aesthetic', transform: surround('˖° ', ' °˖') },
  { id: 'aesthetic-moon', name: 'Night Bloom', category: 'aesthetic', transform: surround('☾⋆ ', ' ⋆☽') },
  { id: 'aesthetic-wave', name: 'Slow Wave', category: 'aesthetic', transform: surround('〜 ', ' 〜') },
  { id: 'aesthetic-quote', name: 'Soft Quote', category: 'aesthetic', transform: framed(mathFont('fraktur'), '❝ ', ' ❞') },
  { id: 'aesthetic-cloud', name: 'Cloud Nine', category: 'aesthetic', transform: surround('☁ ', ' ☁') },
  { id: 'aesthetic-floral', name: 'Pressed Flower', category: 'aesthetic', transform: eachWith('❧') },
  { id: 'aesthetic-blossom', name: 'Blossom Trail', category: 'aesthetic', transform: eachWith('❀') },
  { id: 'aesthetic-orbit', name: 'Orbit', category: 'aesthetic', transform: eachWith('⋆') },

  { id: 'runic', name: 'Runic', category: 'gothic', transform: alphabetMap(RUNIC, 'flat') },
  { id: 'blackletter', name: 'Blackletter', category: 'gothic', transform: mathFont('fraktur-bold') },
  { id: 'gothic-cross', name: 'Crusader', category: 'gothic', transform: framed(mathFont('fraktur-bold'), '✠ ', ' ✠') },
  { id: 'gothic-dagger', name: 'Dagger Row', category: 'gothic', transform: eachWith('†') },
  { id: 'gothic-altar', name: 'Altar', category: 'gothic', transform: surround('✟ ', ' ✟') },
  { id: 'gothic-skull', name: 'Skull & Bones', category: 'gothic', transform: surround('☠ ', ' ☠') },
  { id: 'gothic-ankh', name: 'Ankh', category: 'gothic', transform: eachWith('☥') },
  { id: 'gothic-fleur', name: 'Fleur-de-lis', category: 'gothic', transform: surround('⚜ ', ' ⚜') },
  { id: 'gothic-spade', name: 'Spade Court', category: 'gothic', transform: eachWith('♠') },

  { id: 'lowercase', name: 'All Lowercase', category: 'minimal', transform: (text) => text.toLowerCase() },
  { id: 'spaced', name: 'Air Spacing', category: 'minimal', transform: joinWith(' ') },
  { id: 'dot-between', name: 'Dot Between', category: 'minimal', transform: joinWithinWords(' · ', '   ') },
  { id: 'rule-around', name: 'Fine Rule', category: 'minimal', transform: surround('─ ', ' ─') },
  { id: 'slash-wrap', name: 'Slash Wrap', category: 'minimal', transform: surround('/ ', ' /') },
  { id: 'bar-wrap', name: 'Sidebar', category: 'minimal', transform: surround('│ ', ' │') },
  { id: 'dash-around', name: 'Long Dash', category: 'minimal', transform: surround('— ', ' —') },
  { id: 'snake-case', name: 'snake_case', category: 'minimal', transform: snake },

  { id: 'corner', name: 'Corner Brackets', category: 'symbols', transform: surround('「', '」') },
  { id: 'lenticular', name: 'Block Brackets', category: 'symbols', transform: surround('【', '】') },
  { id: 'double-angle', name: 'Double Angle', category: 'symbols', transform: surround('《', '》') },
  { id: 'angle', name: 'Angle Brackets', category: 'symbols', transform: surround('⟨', '⟩') },
  { id: 'box-lines', name: 'Box Lines', category: 'symbols', transform: surround('▐▀▀ ', ' ▄▌') },
  { id: 'symbol-arrows', name: 'Arrow Lead', category: 'symbols', transform: eachWith('➤') },
  { id: 'symbol-triangles', name: 'Triangle Row', category: 'symbols', transform: eachWith('▲') },
  { id: 'symbol-asterisk', name: 'Asterisk Flare', category: 'symbols', transform: eachWith('✳') },
  { id: 'symbol-diamond', name: 'Diamond Dot', category: 'symbols', transform: eachWith('◈') },
  { id: 'symbol-moon', name: 'Half Moon', category: 'symbols', transform: surround('☽ ', ' ☾') },
  { id: 'symbol-music', name: 'Music Score', category: 'symbols', transform: eachWith('♬') },
  { id: 'symbol-braille', name: 'Braille Frame', category: 'symbols', transform: surround('⣿⣿ ', ' ⣿⣿') },

  { id: 'lightning', name: 'Lightning', category: 'emoji', transform: eachWith('⚡') },
  { id: 'red-heart', name: 'Red Hearts', category: 'emoji', transform: eachWith('❤') },
  { id: 'star-glow', name: 'Glowing Stars', category: 'emoji', transform: eachWith('✧') },
  { id: 'diamond-set', name: 'Diamonds', category: 'emoji', transform: eachWith('♦') },
  { id: 'snowfall', name: 'Snowfall', category: 'emoji', transform: eachWith('❅') },
  { id: 'rose-drop', name: 'Rose', category: 'emoji', transform: eachWith('🌹') },
  { id: 'fire', name: 'Fire', category: 'emoji', transform: surround('', ' 🔥') },
  { id: 'crown', name: 'Crown', category: 'emoji', transform: emojiWrap('👑', '👑') },
  { id: 'celebrate', name: 'Celebration', category: 'emoji', transform: emojiWrap('🎉', '🎉') },
  { id: 'love-you', name: 'Love', category: 'emoji', transform: emojiWrap('💖', '💯') },
  { id: 'party-sparkle', name: 'Sparkle Party', category: 'emoji', transform: emojiWrap('✨', '🌟') },
  { id: 'gaming-life', name: 'Gamer', category: 'emoji', transform: emojiWrap('🎮', '🕹') },
]
