/** Google's image proxy re-renders a Blogger cover at any width on request, so each surface can take the size it actually draws. */
const sizeDirective = /([/=])[swh]\d+(?![\w-])/i

export function imageAtWidth(url: string | undefined, width: number): string | undefined {
  return url?.replace(sizeDirective, `$1s${width}`)
}

const renditions = [320, 480, 640, 960, 1200]

/** Lets the browser choose a Blogger rendition for the space and pixel density, so retina screens stay sharp without phones downloading megabytes. */
export function responsiveImage(url: string | undefined, sizes: string): { src?: string; srcSet?: string; sizes?: string } {
  if (!url) return {}
  const directive = url.match(sizeDirective)?.[0]
  if (!directive) return { src: url }
  return {
    src: imageAtWidth(url, 640),
    srcSet: renditions.map((width) => `${imageAtWidth(url, width)} ${width}w`).join(', '),
    sizes,
  }
}
