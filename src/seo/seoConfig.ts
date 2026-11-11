/**
 * Centralized SEO Configuration for ImgMojo
 * Defines metadata, Open Graph, Twitter Cards, and Schema.org Structured Data
 * for all tools, routes, and public pages.
 */

export interface SeoMetadata {
  title: string
  description: string
  keywords: string
  canonical: string
  author?: string
  robots?: string
  ogType?: 'website' | 'article'
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogImageWidth?: string
  ogImageHeight?: string
  ogImageAlt?: string
  twitterCard?: 'summary_large_image' | 'summary'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  schema?: Record<string, unknown>
}

const BASE_URL = 'https://www.imgmojo.com'
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/imgmojo-og.png`
const DEFAULT_AUTHOR = 'ImgMojo'
const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large'

export const SEO_CONFIG: Record<string, SeoMetadata> = {
  // HOMEPAGE
  home: {
    title: 'ImgMojo – Free Online Image, Video, PDF & QR Code Tools, Screen Recording',
    description:
      'ImgMojo provides free online tools for everyone. Compress images, edit PDFs, create QR codes, create video to shorts and reels, provide free screen recording application, convert videos and use powerful utilities easily.',
    keywords:
      'ImgMojo, Img Mojo, free online tools, image tools, image compressor, image resizer, image converter, video tools, video converter, video to MP3, screen recorder, PDF tools, PDF editor, PDF converter, QR code generator, online utilities, free web tools, photo editor online, free image compressor, online file converter',
    canonical: `${BASE_URL}/`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'ImgMojo – Free Online Tools for Everyone',
    ogDescription:
      'Create, edit, compress and convert images, videos and PDFs. Generate QR codes, create shorts, and explore free online tools with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    ogImageAlt: 'ImgMojo – Free Online Image, Video, PDF & QR Code Tools',
    twitterCard: 'summary_large_image',
    twitterTitle: 'ImgMojo – Free Online Tools',
    twitterDescription: 'Free online image, video, PDF, QR code, screen recording and utility tools.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // QR CODE GENERATOR
  'qr-code': {
    title: 'Free QR Code Generator Online – Create Custom QR Codes | ImgMojo',
    description:
      'Create free QR codes online with ImgMojo. Generate QR codes for URLs, text, Wi-Fi and more. Customize your QR code and download it instantly.',
    keywords:
      'QR code generator, create QR code online, free QR code maker, custom QR code with logo, URL to QR code, Wi-Fi QR code generator, vCard QR code, location QR code, SVG QR code download, ImgMojo',
    canonical: `${BASE_URL}/qr-code`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Free QR Code Generator Online | ImgMojo',
    ogDescription:
      'Generate custom QR codes for websites, text and Wi-Fi. Create and download QR codes online with ImgMojo.',
    ogImage: `${BASE_URL}/images/qr-code-generator-og.png`,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    ogImageAlt: 'ImgMojo Free Online QR Code Generator',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Free QR Code Generator Online | ImgMojo',
    twitterDescription: 'Create, customize and download free QR codes online with ImgMojo.',
    twitterImage: `${BASE_URL}/images/qr-code-generator-og.png`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Free QR Code Generator Online',
      url: `${BASE_URL}/qr-code`,
      description:
        'Create free QR codes online with ImgMojo. Generate QR codes for URLs, text, Wi-Fi and more. Customize your QR code and download it instantly.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // YOUTUBE TO SHORTS MAKER
  shorts: {
    title: 'YouTube to Shorts Maker Online – Create 9:16 Viral Shorts & Reels | ImgMojo',
    description:
      'Convert YouTube videos into viral 9:16 vertical shorts, reels, and TikToks online. Auto-reframe highlights, trim clips, and download in HD with ImgMojo.',
    keywords:
      'YouTube to shorts, create shorts online, youtube shorts maker, youtube to reels, vertical video maker, 9:16 crop online, convert youtube to tiktok, free shorts creator, ImgMojo shorts',
    canonical: `${BASE_URL}/shorts`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'YouTube to Shorts Maker Online | ImgMojo',
    ogDescription:
      'Convert YouTube videos into viral 9:16 vertical shorts, reels, and TikToks. Download in HD with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo YouTube to Shorts Maker',
    twitterCard: 'summary_large_image',
    twitterTitle: 'YouTube to Shorts Maker Online | ImgMojo',
    twitterDescription: 'Create viral 9:16 vertical YouTube Shorts and Reels online for free.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'YouTube to Shorts Maker',
      url: `${BASE_URL}/shorts`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // CREATE POSTER
  poster: {
    title: 'Free Online Poster Maker – Design Custom Posters & Banners | ImgMojo',
    description:
      'Design stunning posters, banners, flyers and promotional graphics online for free. Custom fonts, layouts, stickers, and high-resolution exports.',
    keywords:
      'poster maker, free poster creator, design posters online, banner maker, flyer design, event poster, typography poster, ImgMojo poster',
    canonical: `${BASE_URL}/poster`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Free Online Poster Maker | ImgMojo',
    ogDescription: 'Design custom posters, flyers, and banners online for free with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Free Online Poster Maker',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Free Online Poster Maker | ImgMojo',
    twitterDescription: 'Create custom posters, flyers, and social banners online with ImgMojo.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Free Online Poster Maker',
      url: `${BASE_URL}/poster`,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // COLLAGE STUDIO
  collage: {
    title: 'Photo & Video Editor Online – Free Collage Studio | ImgMojo',
    description:
      'Combine photos and videos into artistic grids, layouts, and stories. Free online collage maker with custom borders, filters, and instant exports.',
    keywords:
      'collage maker, photo collage online, video collage studio, photo grid maker, combine photos, picture collage, ImgMojo collage',
    canonical: `${BASE_URL}/collage`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Photo & Video Editor Online – Collage Studio | ImgMojo',
    ogDescription: 'Create photo and video collages online for free with ImgMojo Collage Studio.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Photo & Video Collage Studio',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Photo & Video Editor Online | ImgMojo',
    twitterDescription: 'Combine photos and videos into beautiful grid collages online.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Photo and Video Collage Studio',
      url: `${BASE_URL}/collage`,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // COMPRESS IMAGE
  'compress-image': {
    title: 'Free Image Compressor Online – Compress JPG, PNG & WebP | ImgMojo',
    description:
      'Compress images up to 90% without losing quality. Fast client-side batch compression for PNG, JPEG, and WebP with 100% privacy on your device.',
    keywords:
      'image compressor, compress image online, reduce image size, shrink photo, compress jpg, png compressor, webp optimizer, lossless image compress, ImgMojo compress',
    canonical: `${BASE_URL}/compress-image`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Free Image Compressor Online | ImgMojo',
    ogDescription: 'Compress images up to 90% without quality loss. Fast, free and private with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Free Online Image Compressor',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Free Image Compressor Online | ImgMojo',
    twitterDescription: 'Shrink image file sizes without quality loss online.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Smart Image Compressor',
      url: `${BASE_URL}/compress-image`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // WATERMARK REMOVER
  'watermark-remover': {
    title: 'Free Watermark Remover Online – AI Image Inpainting | ImgMojo',
    description:
      'Remove watermarks, logos, timestamps, and text from photos online for free. Smart AI neural inpainting seamlessly reconstructs backgrounds.',
    keywords:
      'watermark remover, remove watermark from photo, erase logo online, image inpainting, photo cleanup, remove text from image, ImgMojo watermark remover',
    canonical: `${BASE_URL}/watermark-remover`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Free Watermark Remover Online | ImgMojo',
    ogDescription: 'Remove watermarks, stamps, and text from photos with AI inpainting on ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Free Watermark Remover Online',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Free Watermark Remover Online | ImgMojo',
    twitterDescription: 'Erase watermarks, logos, and timestamps cleanly with AI inpainting.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AI Watermark Remover',
      url: `${BASE_URL}/watermark-remover`,
      applicationCategory: 'GraphicsApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // REMOVE OBJECT
  'remove-object': {
    title: 'Remove Object from Image Online – AI Magic Eraser | ImgMojo',
    description:
      'Erase unwanted people, photobombers, objects, and blemishes from photos online in seconds. Free AI object eraser running directly in your browser.',
    keywords:
      'remove object from photo, magic eraser online, erase photobomber, remove blemishes, ai object removal, erase unwanted items, ImgMojo remove object',
    canonical: `${BASE_URL}/remove-object`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Remove Object from Image Online – Magic Eraser | ImgMojo',
    ogDescription: 'Erase unwanted people, blemishes, and objects from photos online with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo AI Magic Object Eraser',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Remove Object from Image Online | ImgMojo',
    twitterDescription: 'Erase unwanted photobombers and objects from your photos cleanly.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AI Object Remover',
      url: `${BASE_URL}/remove-object`,
      applicationCategory: 'GraphicsApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // PASSPORT PHOTO MAKER
  'passport-photo': {
    title: 'Passport Photo Maker Online – Biometric Visa & ID Photos | ImgMojo',
    description:
      'Create official biometric passport, visa, and ID photos online. Automatic background removal, official standard country dimensions (US, UK, EU, India), and print sheets.',
    keywords:
      'passport photo maker, visa photo online, biometric id photo, passport photo background removal, 2x2 photo creator, 35x45 mm passport photo, ImgMojo passport photo',
    canonical: `${BASE_URL}/passport-photo`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Passport Photo Maker Online | ImgMojo',
    ogDescription: 'Generate compliant biometric passport, visa, and ID photos online with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Biometric Passport Photo Maker',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Passport Photo Maker Online | ImgMojo',
    twitterDescription: 'Create compliant biometric passport and visa photos online.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Biometric Passport Photo Maker',
      url: `${BASE_URL}/passport-photo`,
      applicationCategory: 'PhotographyApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // AI PROMPT GENERATOR
  'prompt-generator': {
    title: 'AI Prompt Generator – Craft Midjourney, Flux & ChatGPT Prompts | ImgMojo',
    description:
      'Generate high-converting, photorealistic AI prompts for Midjourney, Flux, Gemini, and ChatGPT. Explore creative styles, lighting recipes, and prompt ideas.',
    keywords:
      'AI prompt generator, midjourney prompt maker, chatgpt prompts, flux prompt generator, photo prompt ideas, generative ai prompts, ImgMojo prompt generator',
    canonical: `${BASE_URL}/prompt-generator`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'AI Prompt Generator Online | ImgMojo',
    ogDescription: 'Generate photorealistic and creative prompts for Midjourney, Flux, and ChatGPT.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo AI Prompt Generator',
    twitterCard: 'summary_large_image',
    twitterTitle: 'AI Prompt Generator | ImgMojo',
    twitterDescription: 'Generate creative and high-converting prompts for modern AI models.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'AI Prompt Generator',
      url: `${BASE_URL}/prompt-generator`,
      applicationCategory: 'GenerativeAiApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // SCREEN RECORDER
  'screen-recorder': {
    title: 'Free Online Screen Recorder – Record Screen & Audio with No Watermark | ImgMojo',
    description:
      'Record your screen, application window, or browser tab with microphone audio online. 100% free, no time limits, and no watermark on your device.',
    keywords:
      'screen recorder online, free screen recorder, record screen no watermark, browser screen capture, video recorder with mic, record screen without download, ImgMojo screen recorder',
    canonical: `${BASE_URL}/screen-recorder`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Free Online Screen Recorder | ImgMojo',
    ogDescription: 'Record screen and microphone audio in HD without watermarks on ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Free Online Screen Recorder',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Free Online Screen Recorder | ImgMojo',
    twitterDescription: 'Record your browser screen and audio in full HD for free.',
    twitterImage: DEFAULT_OG_IMAGE,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Online Screen Recorder',
      url: `${BASE_URL}/screen-recorder`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },

  // FAKECHAT
  fakechat: {
    title: 'Fake Chat Generator Online – WhatsApp & iMessage Mockups | ImgMojo',
    description:
      'Create realistic WhatsApp, iMessage, and social chat conversation mockups online. Customize profiles, timestamps, messages, and export HD screenshots.',
    keywords:
      'fake chat generator, fake whatsapp chat, imessage mockup, fake message creator, chat screenshot generator, social mockup, ImgMojo fakechat',
    canonical: `${BASE_URL}/fakechat`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Fake Chat Generator Online | ImgMojo',
    ogDescription: 'Generate realistic WhatsApp and iMessage chat screenshots online with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Fake Chat Generator',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Fake Chat Generator | ImgMojo',
    twitterDescription: 'Create custom social chat mockups and conversation screenshots.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // EMOJI TEXT
  'emoji-text': {
    title: 'Emoji Text Generator – Convert Text to Emoji Art Online | ImgMojo',
    description:
      'Transform words and names into creative emoji art, text patterns, and stylish fonts online. Copy and share directly on WhatsApp, Instagram, and TikTok.',
    keywords:
      'emoji text generator, text to emoji, emoji font maker, emoji art, whatsapp emoji text, stylish font generator, ImgMojo emoji text',
    canonical: `${BASE_URL}/emoji-text`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Emoji Text Generator Online | ImgMojo',
    ogDescription: 'Convert any text into stunning emoji art patterns online with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Emoji Text Generator',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Emoji Text Generator | ImgMojo',
    twitterDescription: 'Convert text to emoji art patterns and stylish font decorations.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // MINDCLOUD
  mindcloud: {
    title: 'Word Cloud & Mind Map Maker Online – Free Visual Studio | ImgMojo',
    description:
      'Generate dynamic interactive word clouds and mind maps online. Customize palettes, fonts, shapes, and export high-resolution vector images.',
    keywords:
      'word cloud generator, mind map maker, tag cloud creator, word art online, text cloud, ImgMojo mindcloud',
    canonical: `${BASE_URL}/mindcloud`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Word Cloud & Mind Map Maker Online | ImgMojo',
    ogDescription: 'Create interactive word clouds and visual mind maps online with ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Word Cloud & Mind Map Maker',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Word Cloud & Mind Map Maker | ImgMojo',
    twitterDescription: 'Create beautiful word clouds and mind maps online for free.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // DIGITAL STORE
  store: {
    title: 'Digital Store – Software Licenses & Practical Guides | ImgMojo',
    description:
      'Browse and purchase premium tools, lifetime license keys, and practical guides directly from ImgMojo Creator Studio.',
    keywords:
      'digital store, software licenses, practical guides, developer tools, premium unlock, ImgMojo store',
    canonical: `${BASE_URL}/store`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Digital Store | ImgMojo',
    ogDescription: 'Software licenses and practical guides on ImgMojo.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'ImgMojo Digital Store',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Digital Store | ImgMojo',
    twitterDescription: 'Software licenses and practical digital guides.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // CONTACT US
  contact: {
    title: 'Contact Us – Get in Touch with the ImgMojo Team | ImgMojo',
    description:
      'Have questions, tool suggestions, bug reports, or custom software development inquiries? Contact the ImgMojo team directly.',
    keywords:
      'contact ImgMojo, customer support, tool feedback, software development inquiries, ImgMojo email',
    canonical: `${BASE_URL}/contact`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Contact Us | ImgMojo',
    ogDescription: 'Send inquiries, suggestions, or support requests to the ImgMojo team.',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Contact ImgMojo',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Contact Us | ImgMojo',
    twitterDescription: 'Get in touch with the ImgMojo team.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // ABOUT US
  about: {
    title: 'About Us – Discover ImgMojo & Our Creative Mission | ImgMojo',
    description:
      "Learn about ImgMojo's mission to build fast, free, and privacy-first online tools for media creators, editors, and students worldwide.",
    keywords: 'about ImgMojo, creative tools platform, free online utilities, privacy first media tools',
    canonical: `${BASE_URL}/about`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'About Us | ImgMojo',
    ogDescription: "Discover ImgMojo's mission to build free, fast, and privacy-first online tools.",
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'About ImgMojo',
    twitterCard: 'summary_large_image',
    twitterTitle: 'About Us | ImgMojo',
    twitterDescription: 'Discover our mission to build fast, free, privacy-first tools.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // PRIVACY POLICY
  privacy: {
    title: 'Privacy Policy – Your Privacy & On-Device Security | ImgMojo',
    description:
      'Learn how ImgMojo protects your data with on-device processing and client-side execution. Read our full privacy policy.',
    keywords: 'privacy policy, on-device processing, data security, ImgMojo privacy',
    canonical: `${BASE_URL}/privacy`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Privacy Policy | ImgMojo',
    ogDescription: 'Read the official ImgMojo Privacy Policy.',
    ogImage: DEFAULT_OG_IMAGE,
    twitterCard: 'summary',
    twitterTitle: 'Privacy Policy | ImgMojo',
    twitterDescription: 'Learn how your data is protected on ImgMojo.',
    twitterImage: DEFAULT_OG_IMAGE,
  },

  // TERMS OF SERVICE
  terms: {
    title: 'Terms of Service – Usage Guidelines & Conditions | ImgMojo',
    description:
      "Review the terms and conditions for using ImgMojo's free online tools, digital store, and services.",
    keywords: 'terms of service, user conditions, ImgMojo legal terms',
    canonical: `${BASE_URL}/terms`,
    author: DEFAULT_AUTHOR,
    robots: DEFAULT_ROBOTS,
    ogType: 'website',
    ogTitle: 'Terms of Service | ImgMojo',
    ogDescription: "Review the terms and conditions for using ImgMojo's services.",
    ogImage: DEFAULT_OG_IMAGE,
    twitterCard: 'summary',
    twitterTitle: 'Terms of Service | ImgMojo',
    twitterDescription: 'Official terms and conditions for ImgMojo.',
    twitterImage: DEFAULT_OG_IMAGE,
  },
}
