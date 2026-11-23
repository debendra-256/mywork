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
  logo('samajsevi', 'निर्दलीय / समाजसेवी', 147),
  logo('bjp', 'BJP (Lotus)', 147),
  logo('inc', 'INC (Hand)', 147),
  logo('jdu', 'JDU (Arrow)', 147),
  logo('jmm', 'JMM (Bow & Arrow)', 147),
  logo('aap', 'AAP (Broom)', 147),
  logo('rjd', 'RJD (Lantern)', 147),
  logo('sp', 'SP (Bicycle)', 147),
  logo('ajsu', 'AJSU (Banana)', 147),
  logo('iyc', 'IYC (Youth Congress)', 147),
  logo('bjym', 'BJYM', 147),
  logo('ljp', 'LJP (Helicopter)', 147),
  logo('rlsp', 'RLSP (Ceiling Fan)', 147),
  logo('ham', 'HAM (Kadahi)', 147),
  logo('rld', 'RLD (Hand Pump)', 147),
  logo('apnadal', 'Apna Dal (Cup & Saucer)', 147),
  logo('bsp', 'BSP (Elephant)', 147),
  logo('aimim', 'AIMIM (Kite)', 147),
  logo('jansuraj', 'Jan Suraaj (School Bag)', 147),
  logo('rlp', 'RLP (Water Bottle)', 147),
  logo('abvp', 'ABVP', 147),
  logo('asp', 'ASP (Kettle)', 147),
  logo('gfp', 'GFP (Coconut)', 147),
  logo('inld', 'INLD (Spectacles)', 147),
  logo('mns', 'MNS (Train)', 147),
  logo('ncp', 'NCP (Clock)', 147),
  logo('nsui', 'NSUI', 147),
  logo('sad', 'SAD (Scales)', 147),
  logo('shivsena', 'Shiv Sena (Bow & Arrow)', 147),
  logo('tmc', 'TMC (Twin Flowers)', 147),
  logo('ysr', 'YSR (Fan)', 147),
  logo('conch', 'BJD (Conch)', 147),
  logo('hammer', 'CPI-M (Hammer & Sickle)', 147)
]
