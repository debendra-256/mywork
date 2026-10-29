const entry = (id, name, width, height) => ({
  id: `tpl_${id}`,
  name,
  src: `/templates/${id}.png`,
  width,
  height,
  aspect: width / height,
  page: true,
})

export const POSTER_TEMPLATES = [
  entry('lotus-classic', 'Lotus Classic', 503, 612),
  entry('lotus-sweep', 'Lotus Sweep', 504, 612),
  entry('lotus-wave', 'Lotus Wave', 503, 517),
  entry('lotus-dots', 'Lotus Dots', 504, 517),
  entry('lotus-banner', 'Lotus Banner', 1020, 376),
  entry('lotus-parliament', 'Lotus Parliament', 504, 608),
  entry('hand-tricolour', 'Hand Tricolour', 505, 608),
  entry('broom-blue', 'Broom Blue', 504, 533),
  entry('clock-green', 'Clock Green', 505, 533),
  entry('hammer-red', 'Hammer Red', 1020, 363),
]

const logo = (id, name, size) => ({
  id: `logo_${id}`,
  name,
  src: `/templates/logos/logo-${id}.png`,
  width: size,
  height: size,
  aspect: 1,
  logo: true,
})

export const POSTER_LOGOS = [
  logo('lotus', 'Lotus', 134),
  logo('hand', 'Hand', 147),
  logo('broom', 'Broom', 149),
  logo('clock', 'Clock', 145),
  logo('hammer', 'Hammer & Sickle', 155),
]
