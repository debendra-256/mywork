import { Mail } from 'lucide-react'
import { appConfig } from '../config/app.config'

export type InfoKind = 'about' | 'privacy' | 'terms' | 'contact' | 'report-bug' | 'feature-request'

interface InfoSection {
  heading?: string
  paragraphs?: string[]
  bullets?: string[]
}

interface InfoContent {
  title: string
  sections: InfoSection[]
  cta?: { label: string; subject: string }
}

const content: Record<InfoKind, InfoContent> = {
  about: {
    title: 'About Us',
    sections: [
      {
        paragraphs: [
          'ImgMojo is a free collection of browser-based image tools and an AI prompt library. Compress, convert, edit and resize photos, build posters and passport photos, generate QR codes and more — without installing anything.',
          'Most tools run entirely on your device: your images are processed inside the browser and never uploaded to a server.',
        ],
      },
      {
        heading: 'What you find here',
        bullets: [
          'Image, video and file tools that work straight in your browser',
          'A searchable library of AI prompts for image generation',
          'A digital store with ready-made templates and PDFs',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Your files stay on your device',
        paragraphs: [
          'Image compression, conversion and editing happen locally in your browser. The files you select are never transmitted to ImgMojo or any third party.',
        ],
      },
      {
        heading: 'What we store',
        paragraphs: [
          'Saved prompts, collections, tool settings and theme choices are kept in your browser’s local storage so they survive reloads. Clearing this site’s browser data removes them.',
          'Creators who sign in keep a session token in their own browser; it is never shared with other visitors.',
        ],
      },
      {
        heading: 'Third-party services',
        paragraphs: [
          'Prompt and blog content may be loaded from Google Blogger, and optional analytics run only when configured for the site. Community links open external platforms that have their own privacy policies.',
        ],
      },
    ],
    cta: { label: 'Ask a privacy question', subject: 'Privacy question' },
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        heading: 'Using ImgMojo',
        paragraphs: [
          'ImgMojo is provided free of charge. You keep ownership of everything you create with the tools, and you are responsible for having the rights to any image or content you edit.',
        ],
      },
      {
        heading: 'Acceptable use',
        bullets: [
          'Do not use the service for unlawful content or to infringe anyone’s rights',
          'Do not attempt to disrupt, overload or reverse-abuse the site or its APIs',
          'Do not misrepresent ImgMojo output as endorsed by us',
        ],
      },
      {
        heading: 'No warranty',
        paragraphs: [
          'The service is provided “as is” without warranties of any kind. To the extent permitted by law, ImgMojo is not liable for losses arising from its use. Terms may be updated as the service evolves.',
        ],
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    sections: [
      {
        paragraphs: [
          'Questions, feedback or partnership ideas? Email us and we will reply as soon as we can.',
        ],
      },
    ],
    cta: { label: 'Email ImgMojo', subject: 'Hello ImgMojo' },
  },
  'report-bug': {
    title: 'Report a Bug',
    sections: [
      {
        paragraphs: ['Found something broken? Tell us what happened and we will fix it.'],
      },
      {
        heading: 'What helps us most',
        bullets: [
          'What you expected to happen, and what happened instead',
          'The steps to reproduce the problem',
          'Your browser and device, plus a screenshot if possible',
        ],
      },
    ],
    cta: { label: 'Report a bug', subject: 'Bug report' },
  },
  'feature-request': {
    title: 'Feature Request',
    sections: [
      {
        paragraphs: ['Missing a tool or an option you need? Tell us what you would like to see.'],
      },
      {
        heading: 'What helps us most',
        bullets: [
          'What you are trying to achieve',
          'How you handle it today',
          'Why it would matter to you or your work',
        ],
      },
    ],
    cta: { label: 'Request a feature', subject: 'Feature request' },
  },
}

export function InfoPage({ kind }: { kind: InfoKind }) {
  const page = content[kind]
  const email = appConfig.supportEmail
  const instagram = appConfig.community.instagramUsername
  return (
    <main className="info-page">
      <h1>{page.title}</h1>
      {page.sections.map((section, index) => (
        <section key={index}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
          {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
      ))}
      {kind === 'contact' && instagram && (
        <p>Prefer social? Message us on <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">Instagram (@{instagram})</a>.</p>
      )}
      {page.cta && email && (
        <a className="info-cta" href={`mailto:${email}?subject=${encodeURIComponent(page.cta.subject)}`}>
          <Mail size={15} />{page.cta.label}
        </a>
      )}
    </main>
  )
}