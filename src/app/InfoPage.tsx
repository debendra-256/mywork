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
          'Welcome to ImgMojo.com, a software platform focused on building simple, useful, and accessible online tools for everyone.',
          'At ImgMojo, our goal is to make everyday digital tasks easier by providing free, easy-to-use online tools that help individuals, students, professionals, creators, and businesses save time and work more efficiently.',
        ],
      },
      {
        heading: 'What We Do',
        paragraphs: [
          'We develop and provide a growing collection of online tools designed to solve everyday digital needs. Our tools cover different categories, including:',
        ],
        bullets: [
          'Image Tools: Resize, compress, convert, and edit images.',
          'QR Code Tools: Generate QR codes for links, text, and other purposes.',
          'PDF Tools: Simplify common PDF-related tasks.',
          'Screen Recording: Record screen activities for tutorials, presentations, and demonstrations.',
          'Other Online Utilities: Explore useful tools that make everyday digital work simpler.',
        ],
      },
      {
        paragraphs: [
          'We continuously work to improve our existing tools and introduce new features based on user needs.',
        ],
      },
      {
        heading: 'Our Mission',
        paragraphs: [
          'Our mission is to make useful technology accessible to everyone. We believe that essential online utilities should be simple, convenient, and affordable.',
          'That is why we aim to make our tools free to use, without creating unnecessary barriers for users.',
        ],
      },
      {
        heading: 'Software Development Services',
        paragraphs: [
          'In addition to developing our own online tools, we also undertake small-scale software development projects.',
          'We welcome opportunities to work with individuals, startups, and small businesses on website development, custom software solutions, and other practical technology requirements.',
          'We believe every idea deserves an opportunity to grow, regardless of its size.',
        ],
      },
      {
        heading: 'Our Commitment',
        paragraphs: [
          'We are committed to:',
        ],
        bullets: [
          'Providing useful and accessible online tools.',
          'Continuously improving website functionality and user experience.',
          'Making our tools easy to understand and operate.',
          'Maintaining transparency about our services and offerings.',
          'Respecting user privacy and working towards a safe browsing experience.',
        ],
      },
      {
        heading: 'Get in Touch',
        paragraphs: [
          'We value feedback, suggestions, and collaboration opportunities. If you have questions about our tools, want to suggest a new feature, or need help with a small software development project, we would be happy to hear from you.',
          'Thank you for visiting ImgMojo! Our goal is simple: to make everyday digital work easier for everyone.',
          'ImgMojo – Simple Tools. Smart Solutions. Free for Everyone.',
        ],
      },
    ],
    cta: { label: 'Contact ImgMojo', subject: 'Hello ImgMojo' },
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        paragraphs: [
          'Last Updated: November 11, 2026',
          'Welcome to ImgMojo (https://www.imgmojo.com/). Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect information when you visit or use our website and online tools.',
          'By accessing ImgMojo, you agree to the practices described in this Privacy Policy.',
        ],
      },
      {
        heading: '1. About ImgMojo',
        paragraphs: [
          'ImgMojo is a software platform that provides free online tools to help users perform everyday digital tasks, including image editing, image compression, file conversion, QR code generation, screen recording, PDF utilities, and other online services.',
          'Our goal is to make useful digital tools accessible to everyone.',
        ],
      },
      {
        heading: '2. Information We Collect',
        paragraphs: [
          'We may collect certain types of information when you visit or use our website.',
          'Personal Information: We do not require users to create an account to access our publicly available tools. However, we may collect personal information when you voluntarily contact us through email or other communication channels.',
        ],
        bullets: [
          'Name, email address, message contents, and any other details you voluntarily provide.',
          'Non-Personal Technical Information: IP address, browser type and version, device information, operating system, pages visited, date and time of visits, and referring website addresses.',
        ],
      },
      {
        heading: '3. How We Use Your Information',
        paragraphs: [
          'We may use collected information to operate and maintain our website, improve tools performance, respond to support requests, understand usage, monitor security, and display advertising where applicable.',
          'We do not sell personal information to third parties.',
        ],
      },
      {
        heading: '4. Cookies and Tracking Technologies',
        paragraphs: [
          'ImgMojo may use cookies and similar technologies to remember user preferences, understand traffic, analyse performance, and support advertising services. You can manage or disable cookies through your browser settings.',
        ],
      },
      {
        heading: '5. Google AdSense and Third-Party Advertising',
        paragraphs: [
          'We may use third-party advertising services, including Google AdSense. Google and its partners may use cookies to serve ads based on visits to this or other websites. Learn more at https://policies.google.com/technologies/partner-sites and manage ad settings at https://adssettings.google.com/.',
        ],
      },
      {
        heading: '6. Third-Party Services and Links',
        paragraphs: [
          'Our website may contain links to third-party services that have their own privacy policies. ImgMojo is not responsible for the privacy practices of external sites.',
        ],
      },
      {
        heading: '7. File Uploads and Online Tools',
        paragraphs: [
          'Some tools allow users to process or convert files. Depending on the tool, processing occurs directly in your browser or through servers. We handle uploaded files only as necessary to provide the functionality.',
        ],
      },
      {
        heading: '8. Data Security & Children’s Privacy',
        paragraphs: [
          'We take reasonable measures to protect our website and data, though no internet transmission is 100% secure. ImgMojo is not designed to collect personal information from children.',
        ],
      },
      {
        heading: '9. Your Privacy Rights & Contact',
        paragraphs: [
          'Depending on your location, you may request access, correction, or deletion of your personal data, or manage cookie preferences.',
          'For any questions or requests, contact us at: Email: Imgmojo@gmail.com | Website: https://www.imgmojo.com/',
        ],
      },
    ],
    cta: { label: 'Email Imgmojo@gmail.com', subject: 'Privacy Policy Inquiry' },
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
        heading: "We'd Love to Hear From You!",
        paragraphs: [
          'Thank you for visiting ImgMojo. We value your feedback and are always happy to hear from our users.',
          "Whether you have a question about one of our free online tools, want to report a technical issue, suggest a new feature, or discuss a small software development project, we're here to help.",
        ],
      },
      {
        heading: 'How Can We Help You?',
        bullets: [
          '1. General Enquiries: Have questions about ImgMojo or any of the tools available on our website? Feel free to contact us.',
          '2. Technical Support: Experiencing an issue while using one of our tools? Let us know what happened, which tool you were using, and any relevant details so we can investigate.',
          "3. Suggestions & Feedback: Have an idea for a new tool or a suggestion to improve an existing feature? We'd love to hear from you.",
          '4. Software Development Enquiries: We also welcome small-scale software development projects, website development requests, and custom software requirements from individuals, startups, and businesses.',
          '5. Business & Partnership Enquiries: For business collaborations, partnerships, and other professional enquiries, please get in touch.',
        ],
      },
      {
        heading: 'Get in Touch',
        paragraphs: [
          'Email: Imgmojo@gmail.com',
          'For any questions, feedback, technical support, or business enquiries, please email us. We aim to review incoming messages and respond as soon as reasonably possible.',
        ],
      },
      {
        heading: 'Thank You!',
        paragraphs: [
          'We appreciate your interest in ImgMojo. Your feedback and support motivate us to build better, simpler, and more accessible online tools.',
          'ImgMojo – Simple Tools. Smart Solutions. Free for Everyone.',
        ],
      },
    ],
    cta: { label: 'Email Imgmojo@gmail.com', subject: 'Contact ImgMojo' },
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