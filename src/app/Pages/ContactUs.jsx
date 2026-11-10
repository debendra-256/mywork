import React from 'react'
import {
  Mail,
  HelpCircle,
  Wrench,
  Lightbulb,
  Code2,
  Briefcase,
  ArrowRight,
} from 'lucide-react'
import './AboutUs.css'

const helpOptions = [
  {
    number: '1',
    icon: <HelpCircle size={22} />,
    title: 'General Enquiries',
    description: 'Have questions about ImgMojo or any of the tools available on our website? Feel free to contact us.',
  },
  {
    number: '2',
    icon: <Wrench size={22} />,
    title: 'Technical Support',
    description: 'Experiencing an issue while using one of our tools? Let us know what happened, which tool you were using, and any relevant details so we can investigate.',
  },
  {
    number: '3',
    icon: <Lightbulb size={22} />,
    title: 'Suggestions & Feedback',
    description: "Have an idea for a new tool or a suggestion to improve an existing feature? We'd love to hear from you.",
  },
  {
    number: '4',
    icon: <Code2 size={22} />,
    title: 'Software Development Enquiries',
    description: 'We also welcome small-scale software development projects, website development requests, and custom software requirements from individuals, startups, and businesses.',
  },
  {
    number: '5',
    icon: <Briefcase size={22} />,
    title: 'Business & Partnership Enquiries',
    description: 'For business collaborations, partnerships, and other professional enquiries, please get in touch.',
  },
]

export default function ContactUs() {
  return (
    <main className="simple-page">
      <div className="simple-container">
        {/* PAGE HEADER */}
        <header className="simple-header">
          <h1>Contact Us</h1>
          <p className="simple-lead">We'd Love to Hear From You!</p>
          <p>
            Thank you for visiting ImgMojo. We value your feedback and are always happy to hear from our users.
          </p>
          <p style={{ marginTop: '10px' }}>
            Whether you have a question about one of our free online tools, want to report a technical issue, suggest a new feature, or discuss a small software development project, we're here to help.
          </p>
        </header>

        {/* HOW CAN WE HELP YOU */}
        <section className="simple-section">
          <h2>How Can We Help You?</h2>

          <div className="simple-grid">
            {helpOptions.map((opt) => (
              <div className="simple-card" key={opt.number}>
                <div className="simple-card-icon">{opt.icon}</div>
                <div className="simple-card-body">
                  <h3>{opt.number}. {opt.title}</h3>
                  <p>{opt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GET IN TOUCH */}
        <section className="simple-section">
          <h2>Get in Touch</h2>
          <div className="simple-highlight-box">
            <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Email:{' '}
              <a
                href="mailto:Imgmojo@gmail.com"
                style={{ color: '#2563eb', textDecoration: 'none' }}
              >
                Imgmojo@gmail.com
              </a>
            </p>
            <p>
              For any questions, feedback, technical support, or business enquiries, please email us. We aim to review incoming messages and respond as soon as reasonably possible.
            </p>
            <div style={{ marginTop: '16px' }}>
              <a
                href="mailto:Imgmojo@gmail.com"
                className="simple-btn"
              >
                <Mail size={16} /> Send Email <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* THANK YOU FOOTER */}
        <section className="simple-footer-card">
          <h2>Thank You!</h2>
          <p>
            We appreciate your interest in ImgMojo. Your feedback and support motivate us to build better, simpler, and more accessible online tools.
          </p>
          <div className="simple-tagline">
            <strong>ImgMojo – Simple Tools. Smart Solutions. Free for Everyone.</strong>
          </div>
        </section>
      </div>
    </main>
  )
}
