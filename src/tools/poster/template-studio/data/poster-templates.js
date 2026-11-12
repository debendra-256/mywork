const entry = (id, name, width, height) => ({
  id: `tpl_${id}`,
  name,
  src: `/templates/${id}.png`,
  width,
  height,
  aspect: width / height,
  page: true,
})

export const POSTER_TEMPLATES = []

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
