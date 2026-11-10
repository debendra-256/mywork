
import React from "react";
import {
  Zap,
  ShieldCheck,
  Smile,
  Layers,
  Image,
  FileText,
  Video,
  Wrench,
  ArrowRight,
  Sparkles,
  Target,
  Heart,
} from "lucide-react";


import "./AboutUs.css";

const features = [
  {
    icon: <Zap />,
    title: "Fast & Efficient",
    description: "Complete your everyday tasks quickly with simple workflows.",
  },
  {
    icon: <Smile />,
    title: "Easy to Use",
    description: "A clean and intuitive experience designed for everyone.",
  },
  {
    icon: <ShieldCheck />,
    title: "Privacy Focused",
    description: "Your privacy matters. We aim to handle your files responsibly.",
  },
  {
    icon: <Layers />,
    title: "All-in-One Platform",
    description: "Access multiple useful tools from one convenient destination.",
  },
];

const tools = [
  {
    icon: <Image />,
    title: "Image Tools",
    description: "Compress, resize, crop, convert and optimize images.",
    color: "#7957ff",
  },
  {
    icon: <FileText />,
    title: "PDF Tools",
    description: "Edit, convert, merge and organize PDF documents.",
    color: "#ff5959",
  },
  {
    icon: <Video />,
    title: "Video Tools",
    description: "Explore useful utilities for everyday video tasks.",
    color: "#16a6a1",
  },
  {
    icon: <Wrench />,
    title: "Smart Utilities",
    description: "Discover calculators, converters and productivity tools.",
    color: "#ed9c31",
  },
];

export default function AboutUs() {
  return (
    <main className="about-page">

      {/* HERO SECTION */}
      <section className="about-hero">
        <div className="hero-content">
          <span className="hero-tag">
            <Sparkles size={15} /> Welcome to ImgMojo
          </span>

          <h1>
            Your Creativity.
            <br />
            Our Tools.
            <br />
            <span>Infinite Possibilities.</span>
          </h1>

          <p>
            Make images better. Make work easier.
            Make every digital moment creative.
            ImgMojo brings powerful online tools together
            in one simple destination.
          </p>

          <a href="/" className="about-btn">
            Explore Our Tools <ArrowRight size={18} />
          </a>

          <div className="hero-note">
            Simple tools. Smart solutions. Creative possibilities.
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-glow"></div>
          <img
            src="/images/imgmojo-monkey.png"
            alt="ImgMojo Monkey Mascot"
            className="hero-monkey"
          />

          <div className="floating-card card-one">
            <Image size={20} />
            <span>Image Tools</span>
          </div>

          <div className="floating-card card-two">
            <Zap size={20} />
            <span>Super Fast</span>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="about-intro section-container">
        <span className="section-label">WHO WE ARE</span>

        <h2>
          We make digital creativity
          <span> effortless.</span>
        </h2>

        <p>
          ImgMojo is an all-in-one online platform designed
          to make everyday digital tasks simple, fast and
          accessible. Whether you want to compress an image,
          resize a photo, convert file formats, edit PDFs or
          explore useful online utilities, ImgMojo brings
          everything together in one convenient place.
        </p>

        <p>
          No complicated software. No unnecessary steps.
          Just simple tools that get the job done.
        </p>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-heading">
            <span className="section-label">THE IMGMOJO DIFFERENCE</span>
            <h2>Why choose ImgMojo?</h2>
            <p>Everything you need for a smoother digital experience.</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="tools-section section-container">
        <div className="section-heading">
          <span className="section-label">WHAT WE OFFER</span>
          <h2>Everything in one place.</h2>
          <p>Explore tools designed to make your work easier.</p>
        </div>

        <div className="tools-grid">
          {tools.map((tool, index) => (
            <div className="tool-card" key={index}>
              <div
                className="tool-icon"
                style={{ color: tool.color }}
              >
                {tool.icon}
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="mission-section">
        <div className="section-container mission-grid">
          <div className="mission-card">
            <div className="mission-icon">
              <Target />
            </div>
            <span>OUR MISSION</span>
            <h2>Technology for everyone.</h2>
            <p>
              To empower creators, students, professionals
              and businesses with accessible digital tools
              that save time and improve productivity.
            </p>
          </div>

          <div className="mission-card vision-card">
            <div className="mission-icon">
              <Heart />
            </div>
            <span>OUR VISION</span>
            <h2>A world without digital complexity.</h2>
            <p>
              We envision a world where everyone can access
              powerful digital tools without technical
              complexity or expensive software.
            </p>
          </div>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="brand-section section-container">
        <span className="section-label">THE STORY BEHIND OUR NAME</span>

        <h2>
          Why the name <span>ImgMojo?</span>
        </h2>

        <div className="brand-story">
          <div>
            <h3>Img</h3>
            <p>Represents images, creativity and digital content.</p>
          </div>

          <div className="brand-plus">+</div>

          <div>
            <h3>Mojo</h3>
            <p>Represents magic, energy and the special touch that makes things happen.</p>
          </div>
        </div>

        <p className="brand-conclusion">
          Together, ImgMojo represents our belief that
          working with digital content should feel simple,
          enjoyable and a little magical!
        </p>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="cta-content">
          <Sparkles size={30} />
          <h2>Let's create something amazing!</h2>
          <p>
            Your everyday digital companion is just a click away.
          </p>
          <a href="/" className="cta-btn">
            Explore ImgMojo <ArrowRight size={18} />
          </a>
        </div>
      </section>

    </main>
  );
}
