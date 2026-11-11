import { Helmet } from 'react-helmet-async'
import { SEO_CONFIG, type SeoMetadata } from './seoConfig'

interface SeoHeadProps {
  toolId?: string
  pageKey?: string
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogImageAlt?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  robots?: string
  schema?: Record<string, unknown>
}

/**
 * Centralized SEO Head component using react-helmet-async.
 * Manages document title, meta tags, Open Graph, Twitter Cards,
 * canonical links, and Schema.org JSON-LD structured data.
 */
export function SeoHead({
  toolId,
  pageKey,
  title: overrideTitle,
  description: overrideDesc,
  keywords: overrideKeywords,
  canonical: overrideCanonical,
  ogTitle: overrideOgTitle,
  ogDescription: overrideOgDesc,
  ogImage: overrideOgImage,
  ogImageAlt: overrideOgImageAlt,
  twitterTitle: overrideTwTitle,
  twitterDescription: overrideTwDesc,
  twitterImage: overrideTwImage,
  robots: overrideRobots,
  schema: overrideSchema,
}: SeoHeadProps) {
  // Resolve base metadata from toolId, pageKey, or default home
  const key = toolId || pageKey || 'home'
  const base: SeoMetadata = SEO_CONFIG[key] || SEO_CONFIG.home

  const title = overrideTitle || base.title
  const description = overrideDesc || base.description
  const keywords = overrideKeywords || base.keywords
  const canonical = overrideCanonical || base.canonical
  const author = base.author || 'ImgMojo'
  const robots = overrideRobots || base.robots || 'index, follow, max-image-preview:large'
  const ogType = base.ogType || 'website'
  const ogTitle = overrideOgTitle || base.ogTitle || title
  const ogDescription = overrideOgDesc || base.ogDescription || description
  const ogImage = overrideOgImage || base.ogImage || 'https://www.imgmojo.com/images/imgmojo-og.png'
  const ogImageAlt = overrideOgImageAlt || base.ogImageAlt || title
  const ogWidth = base.ogImageWidth || '1200'
  const ogHeight = base.ogImageHeight || '630'
  const twitterCard = base.twitterCard || 'summary_large_image'
  const twitterTitle = overrideTwTitle || base.twitterTitle || ogTitle
  const twitterDescription = overrideTwDesc || base.twitterDescription || ogDescription
  const twitterImage = overrideTwImage || base.twitterImage || ogImage
  const schema = overrideSchema || base.schema

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="ImgMojo" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:width" content={ogWidth} />
      <meta property="og:image:height" content={ogHeight} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@imgmojo" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      <meta name="twitter:image" content={twitterImage} />

      {/* Schema.org Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  )
}
