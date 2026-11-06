const flourishPaths = `
  <path d="M50 88V22"/>
  <path d="M50 52C38 52 26 44 20 30C34 30 46 38 50 52Z" fill="COLOR" fill-opacity=".18"/>
  <path d="M50 52C62 52 74 44 80 30C66 30 54 38 50 52Z" fill="COLOR" fill-opacity=".18"/>
  <path d="M50 44C42 36 40 22 44 10C54 18 56 32 50 44Z" fill="COLOR" fill-opacity=".18"/>
  <path d="M50 70C40 70 30 64 26 54C38 56 46 62 50 70Z" fill="COLOR" fill-opacity=".18"/>
  <path d="M50 70C60 70 70 64 74 54C62 56 54 62 50 70Z" fill="COLOR" fill-opacity=".18"/>
  <circle cx="50" cy="88" r="3.2" fill="COLOR" stroke="none"/>
`

export const bannerFlourishSvg = (color = '#c9a227', opacity = 1) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" opacity="${opacity}">
  <g fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
    ${flourishPaths.replaceAll('COLOR', color)}
  </g>
</svg>`
