import { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react'

const HOME_FAQS = [
  {
    q: 'How does ImgMojo protect my data and image privacy?',
    a: 'ImgMojo is engineered with a strict client-side first architecture. Your photos, documents, and screen recordings are processed directly in your browser memory using HTML5 Canvas and WebAssembly. Your files are never uploaded to remote servers, stored in external databases, or shared with third parties.',
  },
  {
    q: 'Are all tools on ImgMojo 100% free with no hidden charges?',
    a: 'Yes, every single utility on ImgMojo—including image compression, format conversion, resizing, QR code creation, passport photo generation, and full screen recording—is completely free to use. There are no credit card requirements, trials, or hidden subscriptions.',
  },
  {
    q: 'Do ImgMojo tools add watermarks to exported files?',
    a: 'No. ImgMojo exports all processed images, converted formats, custom QR codes, and screen recordings completely watermark-free at full original quality.',
  },
  {
    q: 'Can I use images, QR codes, and videos created on ImgMojo for commercial purposes?',
    a: 'Absolutely. Any media, QR code, or screen recording processed or generated using ImgMojo is 100% yours to use for personal, academic, client, and commercial projects without attribution requirements.',
  },
  {
    q: 'Which image and video formats are supported?',
    a: 'We support all major modern formats including JPEG, PNG, WebP, AVIF, SVG, BMP, GIF, WebM, and MP4. You can convert between lossy and lossless formats with custom compression and transparency options.',
  },
  {
    q: 'Do I need to install any browser extensions or desktop apps?',
    a: 'No installation is needed. ImgMojo runs natively in any standard web browser across Windows, macOS, Linux, Android, and iOS devices with instant zero-install performance.',
  },
]

export function LandingEditorial() {
  const [openFaq, setOpenFaq] = useState<number>(0)

  return (
    <section className="landing-editorial" aria-label="About ImgMojo Digital Utilities">
      {/* Editorial Header */}
      <div className="landing-editorial-hero">
        <span className="landing-editorial-badge">
          <ShieldCheck size={14} />
          <span>Privacy-First Digital Platform</span>
        </span>
        <h2>Professional Online Tools. Free, Fast &amp; 100% Client-Side.</h2>
        <p>
          ImgMojo is a modern suite of high-performance creative and technical utilities designed to simplify daily digital workflows. 
          Compress large photo libraries, convert file formats, generate scannable QR codes, prepare government-compliant passport photos, 
          and capture pristine screen recordings—completely inside your browser without uploading files to remote servers.
        </p>
      </div>

      {/* 4 Feature Value Pillars */}
      <div className="landing-features-grid">
        <article className="landing-feature-card">
          <div className="landing-feature-icon">
            <Lock size={22} />
          </div>
          <h3>100% In-Browser Privacy</h3>
          <p>
            Your personal photos, documents, and recordings never leave your device. All calculations, rendering, and compression run locally inside your browser memory using HTML5 Canvas and WebAssembly.
          </p>
        </article>

        <article className="landing-feature-card">
          <div className="landing-feature-icon">
            <Zap size={22} />
          </div>
          <h3>Zero Lag &amp; Instant Processing</h3>
          <p>
            No upload or download queues. Files are processed at native hardware speeds directly on your CPU/GPU, enabling instantaneous batch conversions, real-time image cropping, and immediate downloads.
          </p>
        </article>

        <article className="landing-feature-card">
          <div className="landing-feature-icon">
            <CheckCircle2 size={22} />
          </div>
          <h3>Free with No Watermarks</h3>
          <p>
            Every utility is completely free. We never inject forced watermarks, limit export resolutions, or lock essential tools behind paywalls or mandatory credit card registrations.
          </p>
        </article>

        <article className="landing-feature-card">
          <div className="landing-feature-icon">
            <SlidersHorizontal size={22} />
          </div>
          <h3>Universal Format Support</h3>
          <p>
            Seamlessly handle all standard formats: PNG, JPG/JPEG, WebP, AVIF, SVG, BMP, WebM, and MP4. Perfect for web developers, social media managers, photographers, and educators.
          </p>
        </article>
      </div>

      {/* 3-Step Workflow Guide */}
      <div className="landing-steps-section">
        <div className="landing-steps-header">
          <h3>How ImgMojo Works</h3>
          <p>Complete tasks in three simple steps with no software downloads.</p>
        </div>
        <div className="landing-steps-grid">
          <div className="landing-step-item">
            <div className="landing-step-num">1</div>
            <h4>Choose Your Utility</h4>
            <p>Select from our image processing tools, biometric photo creator, QR designer, or screen recorder from the top navigation.</p>
          </div>
          <div className="landing-step-item">
            <div className="landing-step-num">2</div>
            <h4>Customize &amp; Adjust</h4>
            <p>Drag and drop your file, configure parameters (dimensions, quality, background, logo, or audio source) with live instant previews.</p>
          </div>
          <div className="landing-step-item">
            <div className="landing-step-num">3</div>
            <h4>Export Instantly</h4>
            <p>Download your optimized, clean, high-resolution result directly to your storage in one click. Completely watermark-free.</p>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Section */}
      <div className="landing-faq-section">
        <div className="landing-faq-header">
          <h3>Frequently Asked Questions</h3>
          <p>Everything you need to know about ImgMojo tools, security, and licensing.</p>
        </div>
        <div className="landing-faq-list">
          {HOME_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={faq.q} className={`landing-faq-card ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="landing-faq-trigger"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="landing-faq-chevron" />
                </button>
                {isOpen && (
                  <div className="landing-faq-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
