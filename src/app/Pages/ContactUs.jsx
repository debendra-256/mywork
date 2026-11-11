import React, { useState } from 'react'
import {
  Mail,
  HelpCircle,
  Wrench,
  Lightbulb,
  Code2,
  Briefcase,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  FileText,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'General Enquiries',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submissionResult, setSubmissionResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCopyMessage = async () => {
    if (!submissionResult?.entry) return
    const e = submissionResult.entry
    const summary = `Name: ${e.name}\nEmail: ${e.email}\nPhone: ${e.phone || 'N/A'}\nCategory: ${e.category}\nSubject: ${e.subject}\n\nMessage:\n${e.message}`
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const handleReset = () => {
    setSubmissionResult(null)
    setStatus({ type: '', message: '' })
    setForm({
      name: '',
      email: '',
      phone: '',
      category: 'General Enquiries',
      subject: '',
      message: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: 'error', message: 'Please enter your name, email, and message.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contact form.')
      }

      setSubmissionResult(data)
      setStatus({
        type: 'success',
        message: data.mailDispatched
          ? `Thank you! Your message has been sent directly to ${data.recipient || 'imgmojo@gmail.com'}.`
          : `Thank you! Your inquiry was recorded successfully in the local inbox.`,
      })
    } catch (err) {
      // Fallback: If server API is unavailable in static deployment, provide direct mailto / gmail fallback
      const targetEmail = 'imgmojo@gmail.com'
      const mailtoSubject = encodeURIComponent(`[ImgMojo ${form.category}] ${form.subject || 'Website Message'}`)
      const mailtoBody = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || 'N/A'}\nCategory: ${form.category}\n\nMessage:\n${form.message}`
      )
      const fallbackResult = {
        success: true,
        mailDispatched: false,
        recipient: targetEmail,
        gmailComposeUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${mailtoSubject}&body=${mailtoBody}`,
        mailtoUrl: `mailto:${targetEmail}?subject=${mailtoSubject}&body=${mailtoBody}`,
        entry: { ...form },
      }
      setSubmissionResult(fallbackResult)
      setStatus({
        type: 'success',
        message: 'Your message is prepared! Click below to send directly via Gmail or your mail app.',
      })
    } finally {
      setSubmitting(false)
    }
  }

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

        {/* CONTACT FORM SECTION */}
        <section className="simple-section">
          <h2>Send Us a Message</h2>
          <p>Fill out the details below and we will receive your enquiry directly at <strong>imgmojo@gmail.com</strong>.</p>

          <div className="contact-form-wrap">
            {submissionResult ? (
              <div className="contact-success-card">
                <div className="contact-success-header">
                  <div className="contact-success-icon">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3>Message Received!</h3>
                    <p className="contact-success-sub">
                      {submissionResult.mailDispatched
                        ? `An email has been delivered to ${submissionResult.recipient || 'imgmojo@gmail.com'}.`
                        : `Your message has been saved to the local inbox (data/contact-inbox.json).`}
                    </p>
                  </div>
                </div>

                <div className="contact-summary-box">
                  <div className="summary-row">
                    <span className="summary-label">Sender:</span>
                    <span className="summary-val">{submissionResult.entry?.name} ({submissionResult.entry?.email})</span>
                  </div>
                  {submissionResult.entry?.phone && (
                    <div className="summary-row">
                      <span className="summary-label">Phone:</span>
                      <span className="summary-val">{submissionResult.entry.phone}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span className="summary-label">Category:</span>
                    <span className="summary-val">{submissionResult.entry?.category}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Subject:</span>
                    <span className="summary-val"><strong>{submissionResult.entry?.subject}</strong></span>
                  </div>
                  <div className="summary-msg">
                    <span className="summary-label">Message:</span>
                    <p>{submissionResult.entry?.message}</p>
                  </div>
                </div>

                <div className="contact-delivery-options">
                  <p className="contact-delivery-title">
                    <strong>Want to send directly from your personal email?</strong>
                  </p>
                  <div className="contact-action-buttons">
                    {submissionResult.gmailComposeUrl && (
                      <a
                        href={submissionResult.gmailComposeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="contact-btn-gmail"
                      >
                        <ExternalLink size={16} /> Send via Gmail (1-Click)
                      </a>
                    )}
                    {submissionResult.mailtoUrl && (
                      <a
                        href={submissionResult.mailtoUrl}
                        className="contact-btn-mailto"
                      >
                        <Mail size={16} /> Open Mail Client
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="contact-btn-copy"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="contact-btn-reset"
                    >
                      <RotateCcw size={16} /> Send Another Message
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                {status.message && (
                  <div className={`contact-alert ${status.type === 'success' ? 'success' : 'error'}`}>
                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{status.message}</span>
                  </div>
                )}

                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="name">
                      <User size={15} /> Your Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="email">
                      <Mail size={15} /> Your Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="phone">
                      <Phone size={15} /> Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="category">
                      <FileText size={15} /> Enquiry Type
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="General Enquiries">General Enquiries</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Suggestions & Feedback">Suggestions &amp; Feedback</option>
                      <option value="Software Development">Software Development Request</option>
                      <option value="Business & Partnership">Business &amp; Partnership</option>
                    </select>
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="subject">
                    <FileText size={15} /> Subject <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is your message regarding?"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="message">
                    <MessageSquare size={15} /> Message Details <span className="req">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Provide any details, tool names, or questions..."
                    required
                  />
                </div>

                <div className="contact-form-actions">
                  <button
                    type="submit"
                    className="contact-send-btn"
                    disabled={submitting}
                  >
                    <Send size={16} />
                    <span>{submitting ? 'Sending Message…' : 'Send Message to ImgMojo'}</span>
                  </button>

                  <div className="contact-mailto-hint">
                    <span>Direct email: </span>
                    <a href="mailto:imgmojo@gmail.com">imgmojo@gmail.com</a>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>

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
            <p style={{ margin: 0, color: '#475569' }}>
              We review every email and aim to reply within 24 to 48 hours during business days. For urgent technical issues with one of our tools, please include the tool name and details in your subject line for faster support.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
