import React from 'react'
import { Link } from 'react-router-dom'
import {
  Image,
  QrCode,
  FileText,
  Video,
  Wrench,
  Target,
  Code2,
  CheckCircle2,
  Mail,
  ArrowRight,
} from 'lucide-react'
import './AboutUs.css'

const categories = [
  {
    icon: <Image size={22} />,
    title: 'Image Tools',
    description: 'Resize, compress, convert, and edit images.',
  },
  {
    icon: <QrCode size={22} />,
    title: 'QR Code Tools',
    description: 'Generate QR codes for links, text, and other purposes.',
  },
  {
    icon: <FileText size={22} />,
    title: 'PDF Tools',
    description: 'Simplify common PDF-related tasks.',
  },
  {
    icon: <Video size={22} />,
    title: 'Screen Recording',
    description: 'Record screen activities for tutorials, presentations, and demonstrations.',
  },
  {
    icon: <Wrench size={22} />,
    title: 'Other Online Utilities',
    description: 'Explore useful tools that make everyday digital work simpler.',
  },
]

const commitments = [
  'Providing useful and accessible online tools.',
  'Continuously improving website functionality and user experience.',
  'Making our tools easy to understand and operate.',
  'Maintaining transparency about our services and offerings.',
  'Respecting user privacy and working towards a safe browsing experience.',
]

export default function AboutUs() {
  return (
    <main className="simple-page">
      <div className="simple-container">
        {/* PAGE HEADER */}
        <header className="simple-header">
          <h1>About Us</h1>
          <p className="simple-lead">
            Welcome to <strong>ImgMojo.com</strong>, a software platform focused on building simple, useful, and accessible online tools for everyone.
          </p>
          <p>
            At ImgMojo, our goal is to make everyday digital tasks easier by providing free, easy-to-use online tools that help individuals, students, professionals, creators, and businesses save time and work more efficiently.
          </p>
        </header>

        {/* WHAT WE DO */}
        <section className="simple-section">
          <h2>What We Do</h2>
          <p>
            We develop and provide a growing collection of online tools designed to solve everyday digital needs. Our tools cover different categories, including:
          </p>

          <div className="simple-grid">
            {categories.map((cat, idx) => (
              <div className="simple-card" key={idx}>
                <div className="simple-card-icon">{cat.icon}</div>
                <div className="simple-card-body">
                  <h3>{cat.title}</h3>
                  <p>{cat.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="simple-note">
            We continuously work to improve our existing tools and introduce new features based on user needs.
          </p>
        </section>

        {/* OUR MISSION */}
        <section className="simple-section">
          <h2>Our Mission</h2>
          <div className="simple-highlight-box">
            <p>
              Our mission is to make useful technology accessible to everyone. We believe that essential online utilities should be simple, convenient, and affordable.
            </p>
            <p>
              That is why we aim to make our tools free to use, without creating unnecessary barriers for users.
            </p>
          </div>
        </section>

        {/* SOFTWARE DEVELOPMENT SERVICES */}
        <section className="simple-section">
          <h2>Software Development Services</h2>
          <p>
            In addition to developing our own online tools, we also undertake small-scale software development projects.
          </p>
          <p>
            We welcome opportunities to work with individuals, startups, and small businesses on website development, custom software solutions, and other practical technology requirements.
          </p>
          <p className="simple-quote">
            We believe every idea deserves an opportunity to grow, regardless of its size.
          </p>
        </section>

        {/* OUR COMMITMENT */}
        <section className="simple-section">
          <h2>Our Commitment</h2>
          <p>We are committed to:</p>
          <ul className="simple-list">
            {commitments.map((item, idx) => (
              <li key={idx}>
                <CheckCircle2 size={18} className="simple-check-icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* GET IN TOUCH */}
        <section className="simple-section">
          <h2>Get in Touch</h2>
          <p>
            We value feedback, suggestions, and collaboration opportunities. If you have questions about our tools, want to suggest a new feature, or need help with a small software development project, we would be happy to hear from you.
          </p>
          <div className="simple-actions">
            <Link to="/contact" className="simple-btn">
              <Mail size={16} /> Contact Us <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* THANK YOU FOOTER */}
        <section className="simple-footer-card">
          <h2>Thank you for visiting ImgMojo!</h2>
          <p>Our goal is simple: to make everyday digital work easier for everyone.</p>
          <div className="simple-tagline">
            <strong>ImgMojo – Simple Tools. Smart Solutions. Free for Everyone.</strong>
          </div>
        </section>
      </div>
    </main>
  )
}
