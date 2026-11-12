import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Globe } from 'lucide-react'
import './AboutUs.css'

export default function PrivacyPolicy() {
    useEffect(() => {
    const canonicalUrl = 'https://www.imgmojo.com/privacy';

    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', canonicalUrl);

    return () => {
      canonical?.remove();
    };
  }, []);
  return (
    <main className="simple-page">
      <div className="simple-container">
        {/* PAGE HEADER */}
        <header className="simple-header">
          <h1>Privacy Policy</h1>
          <span className="simple-last-updated">Last Updated: November 11, 2026</span>
          <p className="simple-lead">
            Welcome to ImgMojo (<a href="https://www.imgmojo.com/" style={{ color: '#2563eb', textDecoration: 'none' }}>https://www.imgmojo.com/</a>). Your privacy is important to us.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, and protect information when you visit or use our website and online tools.
          </p>
          <p style={{ marginTop: '10px' }}>
            By accessing ImgMojo, you agree to the practices described in this Privacy Policy.
          </p>
        </header>

        {/* 1. ABOUT IMGMOJO */}
        <section className="simple-section">
          <h2>1. About ImgMojo</h2>
          <p>
            ImgMojo is a software platform that provides free online tools to help users perform everyday digital tasks, including image editing, image compression, file conversion, QR code generation, screen recording, PDF utilities, and other online services.
          </p>
          <p>
            Our goal is to make useful digital tools accessible to everyone.
          </p>
        </section>

        {/* 2. INFORMATION WE COLLECT */}
        <section className="simple-section">
          <h2>2. Information We Collect</h2>
          <p>We may collect certain types of information when you visit or use our website.</p>

          <h3 className="simple-subhead">Personal Information</h3>
          <p>
            We do not require users to create an account to access our publicly available tools. However, we may collect personal information when you voluntarily contact us through email or other communication channels.
          </p>
          <p>This information may include:</p>
          <ul className="simple-bullet-list">
            <li>Name</li>
            <li>Email address</li>
            <li>Information included in your message</li>
            <li>Any other details you voluntarily provide</li>
          </ul>

          <h3 className="simple-subhead">Non-Personal Information</h3>
          <p>We may automatically collect certain technical information, including:</p>
          <ul className="simple-bullet-list">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Operating system</li>
            <li>Pages visited</li>
            <li>Date and time of visits</li>
            <li>Referring website addresses</li>
          </ul>
          <p>This information helps us understand website usage and improve our services.</p>
        </section>

        {/* 3. HOW WE USE YOUR INFORMATION */}
        <section className="simple-section">
          <h2>3. How We Use Your Information</h2>
          <p>We may use collected information for the following purposes:</p>
          <ul className="simple-bullet-list">
            <li>To operate and maintain our website.</li>
            <li>To improve the performance and functionality of our online tools.</li>
            <li>To respond to questions, feedback, and support requests.</li>
            <li>To understand how visitors use our website.</li>
            <li>To monitor website performance and prevent misuse.</li>
            <li>To improve user experience.</li>
            <li>To display advertisements and measure advertising performance where applicable.</li>
          </ul>
          <div className="simple-highlight-box">
            <p><strong>We do not sell personal information to third parties.</strong></p>
          </div>
        </section>

        {/* 4. COOKIES AND TRACKING TECHNOLOGIES */}
        <section className="simple-section">
          <h2>4. Cookies and Tracking Technologies</h2>
          <p>ImgMojo may use cookies and similar technologies to improve website functionality and user experience.</p>
          <p>Cookies may be used to:</p>
          <ul className="simple-bullet-list">
            <li>Remember user preferences.</li>
            <li>Understand website traffic and visitor behaviour.</li>
            <li>Analyse website performance.</li>
            <li>Support advertising services.</li>
          </ul>
          <p>
            You can manage or disable cookies through your browser settings. Disabling certain cookies may affect some website functionality.
          </p>
        </section>

        {/* 5. GOOGLE ADSENSE AND THIRD-PARTY ADVERTISING */}
        <section className="simple-section">
          <h2>5. Google AdSense and Third-Party Advertising</h2>
          <p>
            We may use third-party advertising services, including Google AdSense, to display advertisements on our website.
          </p>
          <p>
            Google and its advertising partners may use cookies or similar technologies to serve advertisements based on a user's visits to this website or other websites.
          </p>
          <p>
            Users may receive personalised or non-personalised advertisements depending on applicable settings, consent, and regional requirements.
          </p>
          <p>
            Google uses advertising technologies to help deliver and measure advertisements.
          </p>
          <p>
            For more information about how Google uses data, please visit:{' '}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
            >
              https://policies.google.com/technologies/partner-sites
            </a>
          </p>
          <p>
            You can manage Google's advertising personalisation preferences here:{' '}
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb' }}
            >
              https://adssettings.google.com/
            </a>
          </p>
        </section>

        {/* 6. THIRD-PARTY SERVICES AND LINKS */}
        <section className="simple-section">
          <h2>6. Third-Party Services and Links</h2>
          <p>
            Our website may contain links to third-party websites or use third-party services to support certain functionalities.
          </p>
          <p>
            These services may have their own privacy policies and data-handling practices.
          </p>
          <p>
            ImgMojo is not responsible for the privacy practices or content of external websites. We encourage users to review the privacy policies of any third-party services they access.
          </p>
        </section>

        {/* 7. FILE UPLOADS AND ONLINE TOOLS */}
        <section className="simple-section">
          <h2>7. File Uploads and Online Tools</h2>
          <p>
            Some ImgMojo tools allow users to upload, process, edit, or convert files such as images and documents.
          </p>
          <p>
            Depending on the specific tool, files may be processed directly in your browser or through our servers or third-party service providers.
          </p>
          <p>
            We aim to handle uploaded files only as necessary to provide the requested functionality. Users should avoid uploading confidential, sensitive, or personally identifiable documents unless they understand how the relevant tool processes those files.
          </p>
          <p>
            Please refer to the individual tool's functionality for further details about file processing and storage.
          </p>
        </section>

        {/* 8. DATA SECURITY */}
        <section className="simple-section">
          <h2>8. Data Security</h2>
          <p>
            We take reasonable measures to protect our website and the information users provide against unauthorised access, misuse, alteration, or disclosure.
          </p>
          <p>
            However, no method of internet transmission or electronic storage is completely secure. Therefore, we cannot guarantee absolute security.
          </p>
        </section>

        {/* 9. CHILDREN'S PRIVACY */}
        <section className="simple-section">
          <h2>9. Children's Privacy</h2>
          <p>
            ImgMojo provides general-purpose online tools and is not specifically designed to collect personal information from children.
          </p>
          <p>
            We do not knowingly collect personal information from children in violation of applicable privacy laws. If you believe a child has provided personal information to us, please contact us so that we can review the matter.
          </p>
        </section>

        {/* 10. YOUR PRIVACY RIGHTS */}
        <section className="simple-section">
          <h2>10. Your Privacy Rights</h2>
          <p>Depending on your location and applicable laws, you may have rights regarding your personal information, including:</p>
          <ul className="simple-bullet-list">
            <li>Requesting access to personal information we hold about you.</li>
            <li>Requesting correction of inaccurate information.</li>
            <li>Requesting deletion of your personal information where applicable.</li>
            <li>Withdrawing consent where processing is based on consent.</li>
            <li>Managing cookie and advertising preferences.</li>
          </ul>
          <p>
            To exercise applicable privacy rights, please contact us using the email address below.
          </p>
        </section>

        {/* 11. CHANGES TO THIS PRIVACY POLICY */}
        <section className="simple-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our website, services, legal requirements, or privacy practices.
          </p>
          <p>
            Any updates will be published on this page along with the revised Last Updated date.
          </p>
          <p>We encourage visitors to review this page periodically.</p>
        </section>

        {/* 12. CONTACT US */}
        <section className="simple-section">
          <h2>12. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
          <div className="simple-highlight-box">
            <p>
              <Globe size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Website:{' '}
              <a href="https://www.imgmojo.com/" style={{ color: '#2563eb' }}>
                https://www.imgmojo.com/
              </a>
            </p>
            <p>
              <Mail size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Email:{' '}
              <a href="mailto:Imgmojo@gmail.com" style={{ color: '#2563eb', fontWeight: 600 }}>
                Imgmojo@gmail.com
              </a>
            </p>
            <p style={{ marginTop: '10px' }}>
              We will make reasonable efforts to respond to privacy-related enquiries.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <section className="simple-footer-card">
          <div className="simple-tagline">
            <strong>ImgMojo – Simple Tools. Smart Solutions. Free for Everyone.</strong>
          </div>
        </section>
      </div>
    </main>
  )
}
