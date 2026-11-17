import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Facebook,
  Flame,
  Gift,
  Heart,
  Instagram,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { appConfig } from '../config/app.config'

const SCROLL_TRIGGER_PX = 280

export function SocialFollowPopup() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const hasTriggeredRef = useRef(false)

  const instagramUsername = appConfig.community.instagramUsername || 'imgmojo'
  const instagramUrl =
    appConfig.community.instagramUrl || `https://www.instagram.com/${instagramUsername}/`
  const facebookUrl = appConfig.community.facebookUrl || 'https://www.facebook.com/imgmojo'

  const isExcludedRoute = pathname.startsWith('/admin') || pathname.startsWith('/login')

  useEffect(() => {
    if (isExcludedRoute) return

    const checkScroll = () => {
      if (hasTriggeredRef.current) return
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0

      if (scrollTop >= SCROLL_TRIGGER_PX) {
        hasTriggeredRef.current = true
        setClosing(false)
        setOpen(true)
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true })
    document.addEventListener('scroll', checkScroll, { passive: true, capture: true })

    return () => {
      window.removeEventListener('scroll', checkScroll)
      document.removeEventListener('scroll', checkScroll, { capture: true })
    }
  }, [isExcludedRoute])

  const handleClose = () => {
    setClosing(true)
    window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
      setMinimized(true)
    }, 240)
  }

  const handleReopen = () => {
    setMinimized(false)
    setClosing(false)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (isExcludedRoute) return null

  return (
    <>
      {/* Minimized Floating Trigger Pill after dismissal */}
      {minimized && !open && (
        <button
          type="button"
          className="sfp-Launcher"
          onClick={handleReopen}
          aria-label="Follow us on Instagram and Facebook"
          title="Follow us on Instagram & Facebook"
        >
          <span className="sfp-LauncherIcons">
            <span className="sfp-LauncherIcon sfp-LauncherInsta">
              <Instagram size={13} />
            </span>
            <span className="sfp-LauncherIcon sfp-LauncherFb">
              <Facebook size={13} />
            </span>
          </span>
          <span className="sfp-LauncherText">Follow Us</span>
        </button>
      )}

      {/* Main Scroll Popup Modal */}
      {open && (
        <div
          className={`sfp-Overlay ${closing ? 'is-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sfp-dialog-title"
          onClick={handleClose}
        >
          <div
            className={`sfp-Modal ${closing ? 'is-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Glow Auras */}
            <span className="sfp-Glow sfp-GlowInsta" aria-hidden="true" />
            <span className="sfp-Glow sfp-GlowFb" aria-hidden="true" />

            {/* Close Button */}
            <button
              type="button"
              className="sfp-CloseBtn"
              onClick={handleClose}
              aria-label="Close popup"
            >
              <X size={17} />
            </button>

            {/* Decorative Top Visual Banner */}
            <div className="sfp-Banner">
              <div className="sfp-BannerMesh" aria-hidden="true" />

              {/* Floating Orbiting Social Avatars */}
              <div className="sfp-AvatarCluster">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sfp-OrbitBadge sfp-OrbitInsta"
                  aria-label="Instagram"
                >
                  <Instagram size={22} />
                  <span className="sfp-MicroFloat sfp-MicroHeart">
                    <Heart size={10} fill="currentColor" />
                  </span>
                </a>

                <div className="sfp-CenterBrand">
                  <img
                    src="/images/imgmojo-mark.png"
                    alt={appConfig.appName}
                    className="sfp-BrandLogo"
                  />
                  <span className="sfp-VerifiedTick" title="Verified Community">
                    <BadgeCheck size={16} />
                  </span>
                </div>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sfp-OrbitBadge sfp-OrbitFb"
                  aria-label="Facebook"
                >
                  <Facebook size={22} />
                  <span className="sfp-MicroFloat sfp-MicroSparkle">
                    <Sparkles size={10} />
                  </span>
                </a>
              </div>

              <span className="sfp-CommunityPill">
                <span className="sfp-PulseDot" />
                JOIN OUR CREATIVE COMMUNITY
              </span>
            </div>

            {/* Copy & Social Action Cards */}
            <div className="sfp-Body">
              <h2 id="sfp-dialog-title" className="sfp-Title">
                Follow Us on{' '}
                <span className="sfp-GradientInsta">Instagram</span> &amp;{' '}
                <span className="sfp-GradientFb">Facebook</span>
              </h2>
              <p className="sfp-Subtitle">
                Get daily viral AI prompts, trending poster templates, reels tutorials &amp;
                exclusive free drops straight in your feed.
              </p>

              <div className="sfp-Cards">
                {/* Instagram Card */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sfp-Card sfp-CardInsta"
                >
                  <div className="sfp-CardIcon sfp-IconInsta">
                    <Instagram size={24} />
                  </div>
                  <div className="sfp-CardInfo">
                    <div className="sfp-CardNameRow">
                      <strong>Instagram</strong>
                      <span className="sfp-HandleTag">@{instagramUsername}</span>
                      <BadgeCheck size={14} className="sfp-CardVerified" />
                    </div>
                    <span className="sfp-CardDesc">
                      Daily viral AI prompts, Reels &amp; design ideas
                    </span>
                  </div>
                  <span className="sfp-FollowBtn sfp-BtnInsta">
                    <span>Follow</span>
                    <ArrowUpRight size={15} />
                  </span>
                </a>

                {/* Facebook Card */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sfp-Card sfp-CardFb"
                >
                  <div className="sfp-CardIcon sfp-IconFb">
                    <Facebook size={24} />
                  </div>
                  <div className="sfp-CardInfo">
                    <div className="sfp-CardNameRow">
                      <strong>Facebook</strong>
                      <span className="sfp-HandleTag">@{appConfig.community.facebookPageId || 'imgmojo'}</span>
                      <BadgeCheck size={14} className="sfp-CardVerified" />
                    </div>
                    <span className="sfp-CardDesc">
                      Community updates, creative tips &amp; freebies
                    </span>
                  </div>
                  <span className="sfp-FollowBtn sfp-BtnFb">
                    <span>Follow</span>
                    <ArrowUpRight size={15} />
                  </span>
                </a>
              </div>

              {/* Perks Strip */}
              <div className="sfp-Perks">
                <span className="sfp-PerkItem">
                  <Flame size={13} className="sfp-PerkIconFlame" />
                  Daily Viral Prompts
                </span>
                <span className="sfp-PerkItem">
                  <Gift size={13} className="sfp-PerkIconGift" />
                  Free Templates
                </span>
                <span className="sfp-PerkItem">
                  <Star size={13} className="sfp-PerkIconStar" />
                  Creator Tutorials
                </span>
              </div>

              <button
                type="button"
                className="sfp-DismissLink"
                onClick={handleClose}
              >
                Maybe later, continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
