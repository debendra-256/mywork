import React, { useEffect, useState } from 'react'
import {
  Camera,
  Clock,
  Globe,
  HardDriveDownload,
  Lock,
  Mail,
  Mic,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import './PrivacyPolicy.css'

const TOC_ITEMS = [
  { id: 'pp-sec-1', num: '01', label: 'About ImgMojo' },
  { id: 'pp-sec-2', num: '02', label: 'Information We Collect' },
  { id: 'pp-sec-3', num: '03', label: 'Camera, Mic & Screen Permissions' },
  { id: 'pp-sec-4', num: '04', label: 'How We Use Your Information' },
  { id: 'pp-sec-5', num: '05', label: 'Cookies & Tracking Technologies' },
  { id: 'pp-sec-6', num: '06', label: 'Google AdSense & Advertising' },
  { id: 'pp-sec-7', num: '07', label: 'Third-Party Services & Sharing' },
  { id: 'pp-sec-8', num: '08', label: 'File Processing and Storage' },
  { id: 'pp-sec-9', num: '09', label: 'Data Security' },
  { id: 'pp-sec-10', num: '10', label: 'Data Retention and Deletion' },
  { id: 'pp-sec-11', num: '11', label: 'Account Info & Deletion' },
  { id: 'pp-sec-12', num: '12', label: "Children's Privacy" },
  { id: 'pp-sec-13', num: '13', label: 'Your Privacy Rights' },
  { id: 'pp-sec-14', num: '14', label: 'Third-Party Websites & Services' },
  { id: 'pp-sec-15', num: '15', label: 'Changes to This Privacy Policy' },
  { id: 'pp-sec-16', num: '16', label: 'Contact Us' },
]

export default function PrivacyPolicy() {
  const [activeId, setActiveId] = useState('pp-sec-1')

  useEffect(() => {
    const canonicalUrl = 'https://www.imgmojo.com/privacy'
    let canonical = document.querySelector('link[rel="canonical"]')

    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }

    canonical.setAttribute('href', canonicalUrl)

    return () => {
      canonical?.remove()
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const offset = 150
      let current = TOC_ITEMS[0].id
      for (const item of TOC_ITEMS) {
        const el = document.getElementById(item.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= offset) {
            current = item.id
          }
        }
      }
      setActiveId(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToSection = (id) => {
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="pp-page">
      {/* HERO BANNER */}
      <header className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-top">
            <span className="pp-kicker">
              <ShieldCheck size={14} /> PRIVACY &amp; DATA PROTECTION CENTER
            </span>
            <span className="pp-updated-pill">
              <Clock size={13} /> Last Updated: November 17, 2026
            </span>
          </div>

          <h1>Privacy Policy</h1>

          <div className="pp-hero-intro">
            <p>
              Welcome to ImgMojo (
              <a href="https://www.imgmojo.com/">https://www.imgmojo.com/</a>). Your privacy is
              important to us.
            </p>
            <p>
              This Privacy Policy explains how ImgMojo collects, accesses, uses, processes, stores,
              shares, and protects information when you visit or use our website, Android
              application, and online tools.
            </p>
            <p>
              This policy applies to all ImgMojo services, including image editing, image
              compression, file conversion, QR code generation, screen recording, PDF utilities,
              video tools, and other digital services.
            </p>
            <div className="pp-hero-ack">
              By accessing or using ImgMojo, you acknowledge that you have read this Privacy Policy.
            </div>
          </div>

          {/* QUICK HIGHLIGHTS */}
          <div className="pp-trust-strip">
            <div className="pp-trust-pill">
              <span className="pp-trust-pill-icon">
                <ShieldCheck size={18} />
              </span>
              <div>
                <strong>No Data Selling</strong>
                <span>We never sell personal info</span>
              </div>
            </div>
            <div className="pp-trust-pill">
              <span className="pp-trust-pill-icon">
                <Lock size={18} />
              </span>
              <div>
                <strong>No Account Needed</strong>
                <span>Public tools work instantly</span>
              </div>
            </div>
            <div className="pp-trust-pill">
              <span className="pp-trust-pill-icon">
                <HardDriveDownload size={18} />
              </span>
              <div>
                <strong>Web &amp; Android App</strong>
                <span>Unified transparent policy</span>
              </div>
            </div>
            <div className="pp-trust-pill">
              <span className="pp-trust-pill-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>User-Controlled</strong>
                <span>Explicit device permissions</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TWO-COLUMN INTERACTIVE LAYOUT */}
      <div className="pp-layout">
        {/* STICKY TABLE OF CONTENTS */}
        <aside className="pp-toc" aria-label="Privacy Policy Sections">
          <p className="pp-toc-title">On This Page (16 Sections)</p>
          <ul className="pp-toc-list">
            {TOC_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`pp-toc-link ${activeId === item.id ? 'is-active' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <span className="pp-toc-num">{item.num}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN CONTENT CARDS */}
        <div className="pp-content">
          {/* 1. ABOUT IMGMOJO */}
          <section className="pp-card" id="pp-sec-1">
            <div className="pp-card-head">
              <span className="pp-sec-badge">01</span>
              <h2>1. About ImgMojo</h2>
            </div>
            <p>
              ImgMojo is a digital platform providing free online tools and utilities that help
              users perform everyday digital tasks.
            </p>
            <p>Our services include:</p>
            <ul className="pp-list">
              <li>Image editing, resizing, compression, and conversion.</li>
              <li>Video editing and processing tools.</li>
              <li>Screen recording and audio recording functionality.</li>
              <li>PDF utilities and document processing.</li>
              <li>QR code generation.</li>
              <li>Other online tools and digital services.</li>
            </ul>
            <p>
              ImgMojo is accessible through its website and, where available, its Android
              application.
            </p>
            <div className="pp-meta-row">
              <span className="pp-meta-chip">
                <Globe size={15} /> Website:{' '}
                <a href="https://www.imgmojo.com/">https://www.imgmojo.com/</a>
              </span>
              <span className="pp-meta-chip">
                <Mail size={15} /> Privacy Contact:{' '}
                <a href="mailto:Imgmojo@gmail.com">Imgmojo@gmail.com</a>
              </span>
            </div>
          </section>

          {/* 2. INFORMATION WE COLLECT */}
          <section className="pp-card" id="pp-sec-2">
            <div className="pp-card-head">
              <span className="pp-sec-badge">02</span>
              <h2>2. Information We Collect</h2>
            </div>
            <p>
              We may collect or access certain information when you visit or use ImgMojo.
            </p>

            <div className="pp-subgrid">
              <div className="pp-subcard">
                <h3>2.1 Personal Information</h3>
                <p>
                  We do not require users to create an account to access our publicly available
                  tools.
                </p>
                <p>
                  However, we may collect personal information when you voluntarily contact us
                  through email or other communication channels.
                </p>
                <p>This information may include:</p>
                <ul className="pp-list">
                  <li>Name.</li>
                  <li>Email address.</li>
                  <li>Information included in your messages.</li>
                  <li>Other information you voluntarily provide.</li>
                </ul>
                <p>
                  If account registration or additional account-based services are introduced, the
                  information associated with those services will be handled in accordance with
                  this Privacy Policy and any applicable additional disclosures.
                </p>
              </div>

              <div className="pp-subcard">
                <h3>2.2 Non-Personal and Technical Information</h3>
                <p>
                  We or our service providers may automatically collect certain technical
                  information, including:
                </p>
                <ul className="pp-list">
                  <li>IP address.</li>
                  <li>Browser type and version.</li>
                  <li>Device type and model.</li>
                  <li>Operating system and version.</li>
                  <li>App version and device-related technical information.</li>
                  <li>Pages or tools accessed.</li>
                  <li>Date and time of visits.</li>
                  <li>Referring website addresses.</li>
                  <li>Diagnostic, performance, and crash information, where applicable.</li>
                </ul>
                <p>
                  This information may be used to maintain, secure, analyse, and improve our
                  services.
                </p>
              </div>

              <div className="pp-subcard">
                <h3>2.3 Uploaded Files and User Content</h3>
                <p>
                  When you use ImgMojo tools, you may select or upload files such as:
                </p>
                <ul className="pp-list">
                  <li>Images and photographs.</li>
                  <li>Videos and audio recordings.</li>
                  <li>PDF documents.</li>
                  <li>Other supported file formats.</li>
                </ul>
                <p>
                  Depending on the specific tool, files may be processed directly on your device or
                  browser, through our servers, or through third-party service providers.
                </p>
                <p>
                  We access or process uploaded content only as necessary to provide the
                  functionality requested by the user.
                </p>
                <p>
                  Users should avoid uploading confidential, sensitive, or personally identifiable
                  documents unless they understand how the relevant tool processes those files.
                </p>
              </div>
            </div>
          </section>

          {/* 3. CAMERA, MICROPHONE, AND SCREEN RECORDING PERMISSIONS */}
          <section className="pp-card" id="pp-sec-3">
            <div className="pp-card-head">
              <span className="pp-sec-badge">03</span>
              <h2>3. Camera, Microphone, and Screen Recording Permissions</h2>
            </div>
            <p>
              Certain ImgMojo features may require access to device hardware or Android operating
              system capabilities.
            </p>
            <p>
              These permissions are requested only when required for the relevant functionality.
            </p>

            <div className="pp-subgrid">
              <div className="pp-subcard">
                <h3>
                  <Camera size={17} /> 3.1 Camera Access
                </h3>
                <p>
                  If you use a feature that requires camera functionality, ImgMojo may request
                  camera permission.
                </p>
                <p>Camera access may be used for:</p>
                <ul className="pp-list">
                  <li>Capturing photographs.</li>
                  <li>Recording videos.</li>
                  <li>Camera-based recording features.</li>
                  <li>Other camera-related functionality offered by the application.</li>
                </ul>
                <p>
                  Camera access is subject to the permissions granted by the user and the
                  applicable operating system controls.
                </p>
              </div>

              <div className="pp-subcard">
                <h3>
                  <Mic size={17} /> 3.2 Microphone Access
                </h3>
                <p>
                  ImgMojo may request microphone permission when you use audio or video recording
                  functionality.
                </p>
                <p>Microphone access may be used for:</p>
                <ul className="pp-list">
                  <li>Recording voice or audio.</li>
                  <li>Adding microphone audio to screen recordings.</li>
                  <li>Recording audio alongside camera video.</li>
                  <li>Other audio-related features.</li>
                </ul>
                <p>
                  The microphone is accessed only when the relevant feature is activated and the
                  necessary permission has been granted.
                </p>
              </div>

              <div className="pp-subcard">
                <h3>
                  <MonitorPlay size={17} /> 3.3 Screen Recording and Screen Capture
                </h3>
                <p>
                  ImgMojo may provide screen recording functionality that allows users to capture
                  their device screen.
                </p>
                <p>When using this feature:</p>
                <ul className="pp-list pp-list-single">
                  <li>The application may request Android&apos;s screen-capture permission.</li>
                  <li>
                    Screen recording starts only after the user initiates the recording process and
                    grants the required operating system permission.
                  </li>
                  <li>
                    Users may be able to record selected screen content, depending on the Android
                    version and available functionality.
                  </li>
                  <li>
                    Audio recording may be available depending on device capabilities and user
                    permissions.
                  </li>
                  <li>
                    Recorded content may contain information visible on the user&apos;s screen,
                    including notifications or other personal information.
                  </li>
                  <li>
                    Users should avoid recording or sharing confidential information without
                    appropriate authorisation.
                  </li>
                </ul>
                <p>
                  Screen recordings are processed and stored according to the functionality of the
                  particular tool. Where a recording is uploaded to our servers or a third-party
                  provider, the applicable processing and retention practices described in this
                  policy apply.
                </p>
                <p>
                  Users can control or revoke applicable permissions through their Android device
                  settings.
                </p>
              </div>
            </div>
          </section>

          {/* 4. HOW WE USE YOUR INFORMATION */}
          <section className="pp-card" id="pp-sec-4">
            <div className="pp-card-head">
              <span className="pp-sec-badge">04</span>
              <h2>4. How We Use Your Information</h2>
            </div>
            <p>We may use collected information for the following purposes:</p>
            <ul className="pp-list pp-list-single">
              <li>To operate and maintain the ImgMojo website and application.</li>
              <li>
                To provide image, video, audio, file conversion, and other requested tools.
              </li>
              <li>To process uploaded files and generate requested outputs.</li>
              <li>To respond to questions, feedback, and support requests.</li>
              <li>To understand how visitors use our services.</li>
              <li>To monitor website and application performance.</li>
              <li>To diagnose technical problems and prevent misuse.</li>
              <li>To improve features, functionality, and user experience.</li>
              <li>To maintain security and prevent fraudulent or unauthorised activities.</li>
              <li>
                To display advertisements and measure advertising performance, where applicable.
              </li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
            <div className="pp-callout">
              <ShieldCheck size={18} />
              <span>We do not sell personal information to third parties.</span>
            </div>
          </section>

          {/* 5. COOKIES AND TRACKING TECHNOLOGIES */}
          <section className="pp-card" id="pp-sec-5">
            <div className="pp-card-head">
              <span className="pp-sec-badge">05</span>
              <h2>5. Cookies and Tracking Technologies</h2>
            </div>
            <p>
              ImgMojo may use cookies, pixels, local storage, and similar technologies to improve
              website functionality and user experience.
            </p>
            <p>These technologies may be used to:</p>
            <ul className="pp-list">
              <li>Remember user preferences.</li>
              <li>Understand website traffic and visitor behaviour.</li>
              <li>Analyse website and tool performance.</li>
              <li>Support advertising services.</li>
              <li>Maintain security and prevent misuse.</li>
            </ul>
            <p>
              Users can manage or disable cookies through their browser settings. Disabling certain
              cookies may affect some website functionality.
            </p>
            <p>
              The use of similar technologies within the Android application, where applicable,
              depends on the services and software development kits integrated into the
              application.
            </p>
          </section>

          {/* 6. GOOGLE ADSENSE AND THIRD-PARTY ADVERTISING */}
          <section className="pp-card" id="pp-sec-6">
            <div className="pp-card-head">
              <span className="pp-sec-badge">06</span>
              <h2>6. Google AdSense and Third-Party Advertising</h2>
            </div>
            <p>
              We may use third-party advertising services, including Google AdSense, to display
              advertisements on our website.
            </p>
            <p>
              Google and its advertising partners may use cookies or similar technologies to serve
              advertisements based on a user&apos;s visits to this website or other websites.
            </p>
            <p>
              Users may receive personalised or non-personalised advertisements depending on
              applicable settings, consent, and regional requirements.
            </p>
            <p>
              If advertising services or advertising SDKs are integrated into our Android
              application, those services may collect or process certain device or usage
              information to deliver and measure advertisements.
            </p>
            <p>
              The actual data collection and sharing practices depend on the advertising services
              implemented in the relevant product.
            </p>
            <p>
              For more information about how Google uses data, please visit:{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://policies.google.com/technologies/partner-sites
              </a>
            </p>
            <p>
              You can manage Google&apos;s advertising personalisation preferences here:{' '}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://adssettings.google.com/
              </a>
            </p>
          </section>

          {/* 7. THIRD-PARTY SERVICES AND DATA SHARING */}
          <section className="pp-card" id="pp-sec-7">
            <div className="pp-card-head">
              <span className="pp-sec-badge">07</span>
              <h2>7. Third-Party Services and Data Sharing</h2>
            </div>
            <p>
              ImgMojo may use third-party service providers to support its website and application
              functionality.
            </p>
            <p>These services may include:</p>
            <ul className="pp-list">
              <li>Website hosting and infrastructure providers.</li>
              <li>Cloud storage and file-processing providers.</li>
              <li>Analytics and performance monitoring services.</li>
              <li>Advertising networks.</li>
              <li>Security and fraud-prevention services.</li>
              <li>Other technical service providers.</li>
            </ul>
            <p>
              Depending on the functionality used, certain technical information, usage
              information, or uploaded content may be processed by these providers.
            </p>
            <p>
              Third-party providers may process information according to their own privacy policies
              and contractual arrangements with ImgMojo.
            </p>
            <p>
              We aim to limit information shared with service providers to what is necessary for
              providing or supporting the relevant services.
            </p>
            <div className="pp-callout">
              <ShieldCheck size={18} />
              <span>We do not sell personal information to third parties.</span>
            </div>
            <p style={{ marginTop: '14px' }}>
              Our website or application may also contain links to external websites. ImgMojo is
              not responsible for the privacy practices or content of external websites. Users
              should review the privacy policies of those services independently.
            </p>
          </section>

          {/* 8. FILE PROCESSING AND STORAGE */}
          <section className="pp-card" id="pp-sec-8">
            <div className="pp-card-head">
              <span className="pp-sec-badge">08</span>
              <h2>8. File Processing and Storage</h2>
            </div>
            <p>
              Some ImgMojo tools allow users to upload, process, edit, convert, or download images,
              videos, audio recordings, and documents.
            </p>
            <p>Depending on the specific tool:</p>
            <ul className="pp-list pp-list-single">
              <li>
                Files may be processed directly within the user&apos;s browser or on their device.
              </li>
              <li>Files may be temporarily transmitted to our servers for processing.</li>
              <li>Files may be processed using third-party service providers.</li>
              <li>Generated files may be made available for download.</li>
              <li>
                Temporary files may be retained for the period necessary to provide the requested
                functionality.
              </li>
            </ul>
            <p>The exact processing and storage arrangements may differ between tools.</p>
            <p>
              Users should review any tool-specific notices provided before uploading files.
            </p>
            <p>
              We do not intend to use private user-uploaded content for unrelated purposes such as
              advertising or public distribution.
            </p>
          </section>

          {/* 9. DATA SECURITY */}
          <section className="pp-card" id="pp-sec-9">
            <div className="pp-card-head">
              <span className="pp-sec-badge">09</span>
              <h2>9. Data Security</h2>
            </div>
            <p>
              We take reasonable technical and organisational measures to protect information
              against unauthorised access, misuse, alteration, loss, or disclosure.
            </p>
            <p>Depending on the services involved, these measures may include:</p>
            <ul className="pp-list">
              <li>Secure HTTPS connections.</li>
              <li>Access restrictions.</li>
              <li>Security monitoring.</li>
              <li>Appropriate infrastructure and application safeguards.</li>
              <li>Measures designed to protect stored and transmitted information.</li>
            </ul>
            <p>
              However, no method of internet transmission or electronic storage is completely
              secure. Therefore, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 10. DATA RETENTION AND DELETION */}
          <section className="pp-card" id="pp-sec-10">
            <div className="pp-card-head">
              <span className="pp-sec-badge">10</span>
              <h2>10. Data Retention and Deletion</h2>
            </div>
            <p>
              We retain information only for as long as reasonably necessary to fulfil the purposes
              described in this Privacy Policy, provide our services, maintain security, resolve
              disputes, and comply with applicable legal obligations.
            </p>
            <p>
              The retention period may vary depending on the type of information and the
              functionality used.
            </p>
            <p>For uploaded files:</p>
            <ul className="pp-list pp-list-single">
              <li>
                Files processed locally on a user&apos;s device generally remain under the
                user&apos;s device storage controls.
              </li>
              <li>
                Files processed through our servers or third-party providers may be retained for
                the period necessary to complete the requested processing and any applicable
                operational requirements.
              </li>
              <li>Users should download any generated files they wish to retain.</li>
            </ul>
            <p>
              Users may contact us to request the deletion of personal information where
              applicable.
            </p>
            <p>
              Requests will be reviewed and handled in accordance with applicable laws and
              legitimate data-retention requirements.
            </p>
          </section>

          {/* 11. ACCOUNT INFORMATION AND ACCOUNT DELETION */}
          <section className="pp-card" id="pp-sec-11">
            <div className="pp-card-head">
              <span className="pp-sec-badge">11</span>
              <h2>11. Account Information and Account Deletion</h2>
            </div>
            <p>
              ImgMojo currently provides publicly available tools without requiring users to create
              an account.
            </p>
            <p>
              If account registration or account-based services are introduced in the future, users
              will be informed about the applicable account information and associated data
              practices.
            </p>
            <p>
              Where account creation is supported, users will be provided with an appropriate
              method to request account deletion and deletion of associated personal information,
              subject to applicable legal retention requirements.
            </p>
            <p>
              Users may also contact us at{' '}
              <a href="mailto:Imgmojo@gmail.com">Imgmojo@gmail.com</a> regarding privacy or data
              deletion requests.
            </p>
          </section>

          {/* 12. CHILDREN'S PRIVACY */}
          <section className="pp-card" id="pp-sec-12">
            <div className="pp-card-head">
              <span className="pp-sec-badge">12</span>
              <h2>12. Children&apos;s Privacy</h2>
            </div>
            <p>
              ImgMojo provides general-purpose digital tools and is not specifically designed to
              collect personal information from children.
            </p>
            <p>
              We do not knowingly collect personal information from children in violation of
              applicable privacy laws.
            </p>
            <p>
              If you believe a child has provided personal information to us, please contact us so
              that we can review the matter and take appropriate action.
            </p>
          </section>

          {/* 13. YOUR PRIVACY RIGHTS */}
          <section className="pp-card" id="pp-sec-13">
            <div className="pp-card-head">
              <span className="pp-sec-badge">13</span>
              <h2>13. Your Privacy Rights</h2>
            </div>
            <p>
              Depending on your location and applicable laws, you may have rights regarding your
              personal information, including:
            </p>
            <ul className="pp-list pp-list-single">
              <li>Requesting access to personal information we hold about you.</li>
              <li>Requesting correction of inaccurate information.</li>
              <li>Requesting deletion of personal information where applicable.</li>
              <li>Withdrawing consent where processing is based on consent.</li>
              <li>Managing cookie and advertising preferences.</li>
              <li>Requesting information about how your data is processed or shared.</li>
            </ul>
            <p>
              To exercise applicable privacy rights, please contact us using the details provided
              below.
            </p>
          </section>

          {/* 14. THIRD-PARTY WEBSITES AND SERVICES */}
          <section className="pp-card" id="pp-sec-14">
            <div className="pp-card-head">
              <span className="pp-sec-badge">14</span>
              <h2>14. Third-Party Websites and Services</h2>
            </div>
            <p>
              Our website and application may contain links to third-party websites, tools, or
              services.
            </p>
            <p>
              When you access third-party services, their own terms, privacy policies, and
              data-handling practices apply.
            </p>
            <p>
              ImgMojo does not control the privacy practices of external websites or services and
              encourages users to review their respective privacy policies.
            </p>
          </section>

          {/* 15. CHANGES TO THIS PRIVACY POLICY */}
          <section className="pp-card" id="pp-sec-15">
            <div className="pp-card-head">
              <span className="pp-sec-badge">15</span>
              <h2>15. Changes to This Privacy Policy</h2>
            </div>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              website, Android application, services, legal requirements, or privacy practices.
            </p>
            <p>
              Any updates will be published on this page along with the revised Last Updated date.
            </p>
            <p>We encourage users to review this page periodically.</p>
          </section>

          {/* 16. CONTACT US */}
          <section className="pp-card" id="pp-sec-16">
            <div className="pp-card-head">
              <span className="pp-sec-badge">16</span>
              <h2>16. Contact Us</h2>
            </div>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or the
              handling of your personal information, please contact us:
            </p>
            <div className="pp-meta-row">
              <span className="pp-meta-chip">
                <Globe size={15} /> Website:{' '}
                <a href="https://www.imgmojo.com/">https://www.imgmojo.com/</a>
              </span>
              <span className="pp-meta-chip">
                <Mail size={15} /> Email:{' '}
                <a href="mailto:Imgmojo@gmail.com">Imgmojo@gmail.com</a>
              </span>
            </div>
            <p style={{ marginTop: '14px' }}>
              We will make reasonable efforts to respond to privacy-related enquiries.
            </p>
          </section>

          {/* END OF PRIVACY POLICY */}
          <div className="pp-end-banner">
            <strong>End of Privacy Policy</strong>
            <span>ImgMojo – Simple Tools. Smart Solutions. Free for Everyone.</span>
          </div>
        </div>
      </div>
    </main>
  )
}
