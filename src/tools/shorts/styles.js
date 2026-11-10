const CSS = `
/* Sync theme canvas on tool-page wrapper */
html[data-scheme='dark'] .tool-page:has(.sc-page) {
  --canvas: #07060e;
  background: var(--canvas);
}

.detail-shell.tool-page:has(.sc-page) {
  background: var(--canvas, #f4f2fb);
}

.sc-page {
  --sc-brand: var(--brand, #6d28d9);
  --sc-brand-dark: var(--brand-dark, #5b21b6);
  --sc-brand-ink: var(--brand-ink, #4c1d95);
  --sc-brand-soft: var(--brand-soft, #f1eafe);
  --sc-brand-softer: var(--brand-softer, #f8f5ff);
  --sc-brand-line: var(--brand-line, #ddd0fa);
  --sc-brand-glow: var(--brand-glow, rgba(124, 58, 237, 0.22));
  --sc-accent-theme: var(--accent, #a855f7);
  --sc-accent-2: var(--accent-2, #ec4899);
  --sc-canvas: var(--canvas, #f4f2fb);
  --sc-paper: var(--paper, #ffffff);
  --sc-surface: var(--surface, #faf8ff);
  --sc-ink: var(--ink, #1d192b);
  --sc-ink-soft: var(--ink-soft, #393252);
  --sc-muted: var(--muted, #6e6786);
  --sc-faint: var(--faint, #9c94b4);
  --sc-line: var(--line, #e9e4f5);
  --sc-line-strong: var(--line-strong, #d8cfee);
  --sc-shadow: var(--shadow, 0 14px 36px rgba(76, 29, 149, 0.08));
  --sc-btn-grad: linear-gradient(135deg, var(--sc-accent-theme) 0%, var(--sc-brand) 55%, var(--sc-brand-dark) 100%);

  min-height: calc(100vh - 74px);
  background:
    radial-gradient(circle at 12% 18%, var(--sc-brand-soft) 0%, transparent 42%),
    radial-gradient(circle at 88% 22%, var(--sc-brand-soft) 0%, transparent 45%),
    var(--sc-canvas);
  color: var(--sc-ink);
  font-family: "Plus Jakarta Sans", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: background-color 0.25s ease, color 0.25s ease;
}

html[data-scheme='dark'] .sc-page {
  --sc-paper: rgba(20, 16, 36, 0.92);
  --sc-surface: rgba(29, 23, 52, 0.88);
  --sc-line: rgba(168, 85, 247, 0.18);
  --sc-line-strong: rgba(168, 85, 247, 0.34);
  --sc-brand-soft: rgba(139, 92, 246, 0.16);
  --sc-brand-softer: rgba(139, 92, 246, 0.09);
  --sc-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
}

.sc-page *,
.sc-page *::before,
.sc-page *::after {
  box-sizing: border-box;
}

/* =========================================
   TOP FULL-WIDTH HERO BANNER
   ========================================= */
.sc-hero {
  position: relative;
  width: 100%;
  padding: 8px clamp(18px, 2.5vw, 36px);
  min-height: 52px;
  background: linear-gradient(100deg, var(--sc-brand) 0%, var(--sc-brand-dark) 36%, #241354 76%, #451284 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  overflow: hidden;
  box-shadow: 0 6px 22px var(--sc-brand-glow);
}

html[data-theme='ocean-cyan'] .sc-hero {
  background: linear-gradient(100deg, #0284c7 0%, #0891b2 38%, #0c3547 78%, #0e5466 100%);
}

html[data-theme='sunset-gradient'] .sc-hero {
  background: linear-gradient(100deg, #ea580c 0%, #db2777 42%, #3b102b 80%, #631542 100%);
}

.sc-hero-wave {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.45;
}

.sc-hero-left {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sc-hero-yt-icon {
  width: 40px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(145deg, #ff2a2a 0%, #e10600 100%);
  box-shadow: 0 5px 14px rgba(225, 6, 0, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.35);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #ffffff;
}

.sc-hero-yt-icon svg {
  width: 17px;
  height: 17px;
}

.sc-hero-copy {
  min-width: 0;
}

.sc-hero-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sc-hero-title {
  margin: 0;
  font-size: clamp(16px, 1.45vw, 20px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #ffffff;
}

.sc-hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  backdrop-filter: blur(6px);
  white-space: nowrap;
}

.sc-hero-sub {
  margin: 2px 0 0;
  font-size: clamp(11px, 0.85vw, 12.5px);
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.3;
}

.sc-hero-features {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.sc-hero-feat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.sc-hero-feat:first-child {
  border-left: none;
}

.sc-hero-feat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
}

.sc-hero-feat:nth-child(2) .sc-hero-feat-icon,
.sc-hero-feat:nth-child(3) .sc-hero-feat-icon,
.sc-hero-feat:nth-child(4) .sc-hero-feat-icon {
  color: rgba(255, 255, 255, 0.92);
}

/* =========================================
   MAIN 3-COLUMN WORKSPACE
   ========================================= */
.sc-body {
  display: grid;
  grid-template-columns: 324px minmax(0, 1fr) 324px;
  gap: 14px;
  padding: 10px clamp(14px, 2vw, 26px) 10px;
  max-width: 1540px;
  width: 100%;
  margin: 0 auto;
  align-items: start;
}

.sc-side {
  background: var(--sc-paper);
  border: 1px solid var(--sc-line);
  border-radius: 18px;
  box-shadow: var(--sc-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sc-sidebody {
  padding: 14px 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.sc-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sc-section + .sc-section {
  padding-top: 11px;
  border-top: 1px solid var(--sc-line);
}

.sc-sec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--sc-ink);
  letter-spacing: -0.01em;
}

.sc-sec-head-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--sc-brand-soft);
  color: var(--sc-brand);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-sub-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sc-ink-soft);
  margin: 0;
}

.sc-sub-label svg {
  color: var(--sc-brand);
  flex-shrink: 0;
}

/* Source Mode Toggle Buttons */
.sc-source-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sc-source-tab {
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  padding: 10px 10px;
  border-radius: 11px;
  border: 1px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink-soft);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.sc-source-tab:hover {
  border-color: var(--sc-brand);
  color: var(--sc-brand);
}

.sc-source-tab.on {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 6px 16px var(--sc-brand-glow);
}

/* URL Input Row */
.sc-url-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sc-field-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--sc-ink-soft);
}

.sc-url-group {
  display: flex;
  align-items: center;
  gap: 7px;
}

.sc-url-input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.sc-url-input-icon {
  position: absolute;
  left: 10px;
  color: var(--sc-muted);
  display: inline-flex;
  pointer-events: none;
}

.sc-input {
  width: 100%;
  font: inherit;
  font-size: 12.5px;
  color: var(--sc-ink);
  background: var(--sc-surface);
  border: 1px solid var(--sc-line-strong);
  border-radius: 10px;
  padding: 9px 10px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.sc-url-input-wrap .sc-input {
  padding-left: 31px;
}

.sc-input:focus,
.sc-textarea:focus {
  outline: none;
  border-color: var(--sc-brand);
  box-shadow: 0 0 0 3px var(--sc-brand-soft);
  background: var(--sc-paper);
}

.sc-load-btn {
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  padding: 9px 15px;
  border-radius: 10px;
  border: none;
  background: var(--sc-btn-grad);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--sc-brand-glow);
  transition: transform 0.15s ease, opacity 0.15s ease;
  flex-shrink: 0;
}

.sc-load-btn:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

/* Clip Length Pills */
.sc-len-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 5px;
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: 12px;
}

.sc-len-pill {
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--sc-ink-soft);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sc-len-pill:hover {
  color: var(--sc-brand);
}

.sc-len-pill.on {
  background: var(--sc-btn-grad);
  color: #ffffff;
  box-shadow: 0 4px 10px var(--sc-brand-glow);
}

.sc-start-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}

.sc-start-input {
  width: 88px !important;
  text-align: center;
  font-weight: 700;
}

/* Frame & Style Cards */
.sc-style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sc-style-card {
  position: relative;
  font: inherit;
  padding: 13px 10px 11px;
  border-radius: 13px;
  border: 1.5px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink-soft);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: all 0.18s ease;
}

.sc-style-card:hover {
  border-color: var(--sc-brand);
}

.sc-style-card.on {
  border-color: var(--sc-brand);
  background: var(--sc-brand-softer);
  color: var(--sc-brand-ink);
  box-shadow: 0 4px 14px var(--sc-brand-glow);
}

html[data-scheme='dark'] .sc-style-card.on {
  color: #ffffff;
}

.sc-style-card-title {
  font-size: 12.5px;
  font-weight: 700;
}

.sc-check-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--sc-btn-grad);
  color: #ffffff;
  display: grid;
  place-items: center;
  box-shadow: 0 3px 8px var(--sc-brand-glow);
  border: 2px solid var(--sc-paper);
}

/* Primary Generate CTA Button */
.sc-generate-btn {
  width: 100%;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  padding: 13px 18px;
  border-radius: 13px;
  border: none;
  background: var(--sc-btn-grad);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 20px var(--sc-brand-glow);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.sc-generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 11px 24px var(--sc-brand-glow);
}

/* Studio Advanced / Captions Drawer */
.sc-adv-toggle {
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sc-muted);
  background: var(--sc-surface);
  border: 1px dashed var(--sc-line-strong);
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  transition: all 0.15s ease;
}

.sc-adv-toggle:hover {
  color: var(--sc-brand);
  border-color: var(--sc-brand);
}

.sc-adv-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: 11px;
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
}

.sc-textarea {
  width: 100%;
  font: inherit;
  font-size: 12px;
  line-height: 1.45;
  color: var(--sc-ink);
  background: var(--sc-paper);
  border: 1px solid var(--sc-line-strong);
  border-radius: 9px;
  padding: 8px 10px;
  min-height: 62px;
  resize: vertical;
}

.sc-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--sc-muted);
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sc-chiprow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sc-chip {
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sc-ink-soft);
  background: var(--sc-paper);
  border: 1px solid var(--sc-line-strong);
  border-radius: 999px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sc-chip:hover {
  border-color: var(--sc-brand);
  color: var(--sc-brand);
}

.sc-chip.on {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #ffffff;
}

.sc-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--sc-paper);
  box-shadow: 0 0 0 1px var(--sc-line-strong);
  cursor: pointer;
  padding: 0;
}

.sc-swatch.on {
  box-shadow: 0 0 0 2px var(--sc-brand);
}

/* Loaded Video Metadata */
.sc-videoMeta {
  display: flex;
  gap: 9px;
  align-items: center;
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: 11px;
  padding: 7px 9px;
}

.sc-videoMeta img {
  width: 64px;
  height: 38px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--sc-line);
  flex-shrink: 0;
}

.sc-videoMeta div {
  min-width: 0;
}

.sc-videoMeta strong {
  display: block;
  font-size: 12px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--sc-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-videoMeta span {
  font-size: 11px;
  color: var(--sc-muted);
}

.sc-thumbfile {
  width: 44px;
  height: 38px;
  border-radius: 6px;
  background: var(--sc-brand-soft);
  color: var(--sc-brand);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Generated Clips List */
.sc-clipList {
  max-height: 265px;
  overflow-y: auto;
  padding-right: 2px;
}

.sc-clipList::-webkit-scrollbar {
  width: 6px;
}

.sc-clipList::-webkit-scrollbar-thumb {
  background: var(--sc-line-strong);
  border-radius: 4px;
}

.sc-clips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sc-clip {
  display: flex;
  gap: 6px;
  align-items: stretch;
  text-align: left;
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: 11px;
  padding: 6px 6px 6px 8px;
  transition: all 0.15s ease;
}

.sc-clip:hover {
  border-color: var(--sc-brand);
}

.sc-clip.on {
  border-color: var(--sc-brand);
  background: var(--sc-brand-softer);
  box-shadow: 0 0 0 1px var(--sc-brand) inset;
}

.sc-clipMain {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 9px;
  align-items: center;
  text-align: left;
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

.sc-thumb {
  position: relative;
  width: 44px;
  height: 64px;
  border-radius: 7px;
  overflow: hidden;
  background: #0b0f14;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.sc-thumb i {
  position: absolute;
  left: 3px;
  top: 3px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 5px;
  background: rgba(11, 15, 20, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  font-style: normal;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.sc-clipMain div {
  min-width: 0;
}

.sc-clip strong {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sc-ink);
}

.sc-clipMain span {
  font-size: 10.5px;
  color: var(--sc-muted);
}

.sc-clipDl {
  flex-shrink: 0;
  width: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font: inherit;
  font-size: 9px;
  font-weight: 700;
  color: var(--sc-brand);
  background: var(--sc-brand-soft);
  border: 1px solid var(--sc-brand-line);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sc-clipDl:hover:not(:disabled) {
  background: var(--sc-brand);
  color: #fff;
  border-color: var(--sc-brand);
}

.sc-clipDl:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* =========================================
   CENTER STAGE & 9:16 PHONE PREVIEW
   ========================================= */
.sc-stage {
  position: relative;
  min-width: 0;
  background: var(--sc-paper);
  border: 1px solid var(--sc-line);
  border-radius: 18px;
  box-shadow: var(--sc-shadow);
  padding: 12px 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  overflow: visible;
}

.sc-stage-glow {
  position: absolute;
  width: 380px;
  height: 380px;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, var(--sc-brand-soft) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.sc-stage-center {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  flex: 0 0 auto;
}

.sc-phone-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sc-phone.is-dragover {
  outline: 3px dashed var(--sc-brand);
  outline-offset: 4px;
}

.sc-panSurface {
  position: absolute;
  inset: 0;
  z-index: 4;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.sc-panSurface:active,
.sc-panSurface.is-panning {
  cursor: grabbing;
}

.sc-panGrid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.28) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.28) 1px, transparent 1px);
  background-size: 33.333% 33.333%;
  box-shadow: inset 0 0 0 2px rgba(168, 85, 247, 0.75);
}

.sc-panHintBar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--sc-surface);
  border: 1px solid var(--sc-line-strong);
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sc-muted);
  box-shadow: 0 4px 12px rgba(24, 13, 54, 0.05);
}

.sc-panHintBar svg {
  color: var(--sc-brand);
  flex-shrink: 0;
}

.sc-panResetBtn {
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  color: var(--sc-brand);
  background: var(--sc-brand-soft);
  border: 1px solid var(--sc-brand-line);
  border-radius: 999px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sc-panResetBtn:hover {
  background: var(--sc-brand);
  color: #ffffff;
}

.sc-phone {
  position: relative;
  container-type: inline-size;
  width: min(248px, 28vw, calc((100vh - 280px) * 0.5625));
  min-width: 196px;
  aspect-ratio: 9 / 16;
  background: #0b0f14;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(24, 13, 54, 0.22);
  border: 2px solid var(--sc-paper);
}

.sc-phone.is-live {
  position: fixed;
  inset: 0;
  z-index: 9999;
  margin: auto;
  width: min(100vw, calc(100vh * 0.5625));
  height: min(100vh, calc(100vw * 1.777778));
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: #000;
}

.sc-phone.is-live .sc-ytLayer,
.sc-phone.is-quiet .sc-ytLayer {
  pointer-events: none;
}

.sc-wash {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: #000;
}

.sc-fullClose {
  position: fixed;
  top: 14px;
  right: 16px;
  z-index: 10002;
  display: flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: rgba(11, 15, 20, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
}

.sc-fullClose:hover {
  background: var(--sc-brand);
  border-color: var(--sc-brand);
}

.sc-fullBar {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 10002;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(11, 15, 20, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.sc-fullBar .sc-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

.sc-fullBar .sc-btn.primary {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #fff;
}

.sc-fullBar .sc-time {
  color: #e2e8f0;
  background: transparent;
  border: none;
  padding: 0 8px 0 4px;
}

.sc-playerBox {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0b0f14;
}

.sc-ytLayer {
  position: absolute;
  overflow: hidden;
}

.sc-ytHost,
.sc-ytHost iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.sc-blurBg,
.sc-blurVid {
  position: absolute;
  inset: -12%;
  width: 124%;
  height: 124%;
  object-fit: cover;
  background-size: cover;
  background-position: center;
  filter: blur(26px) saturate(1.1);
  opacity: 0.8;
}

.sc-srcVid {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #0b0f14;
}

.sc-hook {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 4.5%;
  color: #fff;
  font-size: 6.8cqw;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-transform: uppercase;
  text-shadow: 0 0.3em 0.8em rgba(0, 0, 0, 0.75);
  pointer-events: none;
  overflow-wrap: break-word;
}

.sc-cap {
  position: absolute;
  left: 8%;
  right: 8%;
  color: #fff;
  font-size: 8.2cqw;
  font-weight: 800;
  text-align: center;
  line-height: 1.18;
  text-transform: uppercase;
  background: rgba(11, 15, 20, 0.8);
  border: 0.35cqw solid rgba(255, 255, 255, 0.18);
  border-radius: 2.4cqw;
  padding: 1.6cqw 2.8cqw;
  pointer-events: none;
  text-shadow: 0 0.1em 0.4em rgba(0, 0, 0, 0.65);
  overflow-wrap: break-word;
  animation: sc-pop 0.16s ease-out;
}

@keyframes sc-pop {
  from {
    opacity: 0.4;
    transform: scale(0.93);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.sc-cover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--sc-cover-h, 22%);
  pointer-events: none;
  z-index: 2;
  backdrop-filter: blur(3.4cqw) saturate(0.95);
  -webkit-backdrop-filter: blur(3.4cqw) saturate(0.95);
  -webkit-mask-image: linear-gradient(transparent, #000 24%);
  mask-image: linear-gradient(transparent, #000 24%);
  background: linear-gradient(transparent, rgba(11, 15, 20, 0.28) 38%, rgba(11, 15, 20, 0.56));
}

.sc-cover.top {
  bottom: auto;
  top: 0;
  -webkit-mask-image: linear-gradient(#000 76%, transparent);
  mask-image: linear-gradient(#000 76%, transparent);
  background: linear-gradient(rgba(11, 15, 20, 0.56), rgba(11, 15, 20, 0.28) 62%, transparent);
}

.sc-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.35cqw;
  min-height: 3px;
  background: rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

.sc-progress i {
  display: block;
  height: 100%;
  background: var(--sc-accent, var(--sc-brand));
  transition: width 0.1s linear;
}

/* Scenic Idle Preview inside Phone Frame when no video is loaded */
.sc-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(18, 28, 52, 0.18) 0%, rgba(12, 16, 28, 0.1) 55%, rgba(6, 8, 15, 0.82) 100%),
    url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80") center / cover no-repeat;
  color: #ffffff;
  padding: 20px;
  text-align: center;
}

.sc-empty-play {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: rgba(15, 18, 28, 0.56);
  border: 2px solid rgba(255, 255, 255, 0.85);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
  transition: transform 0.18s ease, background 0.18s ease;
}

.sc-empty-play:hover {
  transform: scale(1.06);
  background: var(--sc-brand);
}

.sc-empty-hint {
  margin-top: 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
  max-width: 210px;
}

.sc-empty-hud {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sc-empty-bar {
  position: relative;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
}

.sc-empty-bar-fill {
  width: 24%;
  height: 100%;
  border-radius: 999px;
  background: #ffffff;
  position: relative;
}

.sc-empty-bar-dot {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
}

.sc-empty-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 700;
  color: #ffffff;
}

.sc-empty-controls-left,
.sc-empty-controls-right {
  display: flex;
  align-items: center;
  gap: 7px;
}

/* Aspect Ratio Cards floating next to the phone */
.sc-aspect-rail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sc-aspect-card {
  width: 68px;
  padding: 10px 6px;
  border-radius: 14px;
  border: 1.5px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink-soft);
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  box-shadow: 0 6px 16px rgba(24, 13, 54, 0.06);
  transition: all 0.18s ease;
}

.sc-aspect-card:hover {
  border-color: var(--sc-brand);
  transform: translateY(-1px);
}

.sc-aspect-card.on {
  border-color: var(--sc-brand);
  background: var(--sc-brand-softer);
  color: var(--sc-brand);
  box-shadow: 0 8px 20px var(--sc-brand-glow);
}

.sc-aspect-ratio {
  font-size: 11.5px;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 2px;
}

.sc-aspect-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--sc-muted);
}

.sc-aspect-card.on .sc-aspect-name {
  color: var(--sc-brand);
}

/* Transport Controls Row */
.sc-transport {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.sc-btn {
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--sc-ink-soft);
  background: var(--sc-surface);
  border: 1px solid var(--sc-line-strong);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.16s ease;
}

.sc-btn:hover:not(:disabled) {
  border-color: var(--sc-brand);
  color: var(--sc-brand);
  background: var(--sc-brand-softer);
}

.sc-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sc-btn.primary {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 5px 14px var(--sc-brand-glow);
}

.sc-btn.primary:hover:not(:disabled) {
  opacity: 0.95;
  color: #ffffff;
}

.sc-btn.block {
  width: 100%;
  border-radius: 12px;
  padding: 11px 14px;
}

.sc-res-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  font-weight: 700;
  color: var(--sc-ink-soft);
  background: var(--sc-surface);
  border: 1px solid var(--sc-line-strong);
  border-radius: 999px;
  padding: 7px 13px;
}

.sc-hd-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1.5px solid var(--sc-brand);
  color: var(--sc-brand);
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1.1;
}

/* Filmstrip Timeline Scrubber Card */
.sc-timelineWrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 580px;
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: 16px;
  padding: 10px 14px 12px;
  box-shadow: 0 6px 18px rgba(24, 13, 54, 0.05);
}

.sc-tlHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--sc-ink-soft);
  font-variant-numeric: tabular-nums;
}

.sc-tlDuration {
  color: var(--sc-ink);
  font-weight: 800;
}

.sc-timeline {
  position: relative;
  height: 52px;
  border-radius: 11px;
  border: 2px solid var(--sc-brand);
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.14) 0px,
      rgba(255, 255, 255, 0.14) 1px,
      transparent 1px,
      transparent 38px
    ),
    #0b0f14;
  background-size: auto, cover;
  background-position: center;
  cursor: pointer;
  overflow: visible;
  box-shadow: 0 4px 12px var(--sc-brand-glow);
}

.sc-tlHandle {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 12px;
  border-radius: 6px;
  background: var(--sc-btn-grad);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 4;
}

.sc-tlHandle::after {
  content: "";
  width: 2px;
  height: 14px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.9);
}

.sc-tlHandle.left {
  left: -4px;
}

.sc-tlHandle.right {
  right: -4px;
}

.sc-tlClip {
  position: absolute;
  top: 3px;
  bottom: 3px;
  background-color: rgba(124, 58, 237, 0.42);
  background-size: cover;
  background-position: center;
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  border-radius: 7px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 4px;
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
  z-index: 2;
}

.sc-tlClip:hover {
  transform: translateY(-2px);
  border-color: #fbbf24;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  z-index: 5;
}

.sc-tlClip.on {
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px var(--sc-brand), 0 4px 12px rgba(124, 58, 237, 0.55);
  z-index: 4;
}

.sc-tlClipBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(11, 15, 20, 0.82);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1.1;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.sc-tlClip.on .sc-tlClipBadge {
  background: var(--sc-btn-grad);
}

.sc-tlClipTime {
  font-size: 8.5px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(11, 15, 20, 0.72);
  border-radius: 3px;
  padding: 0 3px;
  align-self: flex-end;
  pointer-events: none;
  white-space: nowrap;
}

/* Floating Frame Preview Popup on Timeline Hover */
.sc-tlPreviewPop {
  position: absolute;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  width: 112px;
  background: rgba(15, 13, 28, 0.96);
  border: 1.5px solid rgba(255, 255, 255, 0.28);
  border-radius: 11px;
  padding: 5px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.48);
  pointer-events: none;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: sc-pop 0.12s ease-out;
}

.sc-tlPreviewPop::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(15, 13, 28, 0.96);
}

.sc-tlPreviewImg {
  width: 100%;
  aspect-ratio: 9 / 16;
  max-height: 142px;
  border-radius: 7px;
  background: #0b0f14 center / cover no-repeat;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.sc-tlPreviewTag {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--sc-btn-grad);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 800;
}

.sc-tlPreviewMeta {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  line-height: 1.2;
}

.sc-tlPreviewMeta strong {
  font-size: 10.5px;
  font-weight: 800;
  color: #ffffff;
}

.sc-tlPreviewMeta span {
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.72);
  font-variant-numeric: tabular-nums;
}

.sc-tlHead {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 3px;
  border-radius: 3px;
  background: #ffffff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.65);
  pointer-events: none;
  z-index: 6;
}

/* Subtitle Removal Grid */
.sc-subrem-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.sc-subrem-btn {
  position: relative;
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  padding: 8px 8px;
  border-radius: 10px;
  border: 1.5px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink-soft);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.15s ease;
  text-align: center;
}

.sc-subrem-btn:hover {
  border-color: var(--sc-brand);
  color: var(--sc-brand);
}

.sc-subrem-btn.on {
  background: var(--sc-brand-softer);
  border-color: var(--sc-brand);
  color: var(--sc-brand-ink);
  box-shadow: 0 3px 10px var(--sc-brand-glow);
}

html[data-scheme='dark'] .sc-subrem-btn.on {
  color: #ffffff;
}

/* =========================================
   RIGHT PANEL: EXPORT & DOWNLOAD
   ========================================= */
.sc-res-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 8px;
}

.sc-res-card {
  position: relative;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 8px;
  border-radius: 11px;
  border: 1.5px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink-soft);
  cursor: pointer;
  text-align: center;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.sc-res-card:hover {
  border-color: var(--sc-brand);
}

.sc-res-card.on {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 6px 16px var(--sc-brand-glow);
}

.sc-outputs-stack {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.sc-output-btn {
  width: 100%;
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  padding: 11px 14px;
  border-radius: 11px;
  border: 1px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.16s ease;
}

.sc-output-btn:hover:not(:disabled) {
  border-color: var(--sc-brand);
  color: var(--sc-brand);
  background: var(--sc-brand-softer);
}

.sc-output-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sc-output-btn.primary {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 7px 18px var(--sc-brand-glow);
  font-size: 13px;
  font-weight: 800;
}

.sc-output-btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  color: #ffffff;
}

.sc-take-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sc-take-card {
  position: relative;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 8px;
  border-radius: 11px;
  border: 1.5px solid var(--sc-line-strong);
  background: var(--sc-surface);
  color: var(--sc-ink-soft);
  cursor: pointer;
  text-align: center;
  transition: all 0.16s ease;
}

.sc-take-card:hover:not(:disabled) {
  border-color: var(--sc-brand);
}

.sc-take-card.on {
  background: var(--sc-btn-grad);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 6px 16px var(--sc-brand-glow);
}

.sc-err {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #b4232a;
  background: #fdf1f1;
  border: 1px solid #f3d3d5;
  border-radius: 10px;
  padding: 8px 10px;
}

.sc-ok {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--sc-brand-ink);
  background: var(--sc-brand-soft);
  border: 1px solid var(--sc-brand-line);
  border-radius: 10px;
  padding: 8px 10px;
}

html[data-scheme='dark'] .sc-ok {
  color: #ffffff;
}

.sc-note {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--sc-muted);
}

/* Jobs Progress List & Prominent Reel Progress Bar */
.sc-reelProgressCard {
  width: 100%;
  max-width: 580px;
  background: var(--sc-surface);
  border: 1.5px solid var(--sc-brand);
  border-radius: 15px;
  padding: 11px 14px;
  box-shadow: 0 8px 24px var(--sc-brand-glow);
  display: flex;
  flex-direction: column;
  gap: 7px;
  z-index: 2;
  animation: sc-pop 0.2s ease-out;
}

.sc-reelProgressCard.is-done {
  border-color: #10b981;
  box-shadow: 0 8px 22px rgba(16, 185, 129, 0.16);
}

.sc-reelProgressTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sc-reelProgressTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--sc-ink);
}

.sc-reelSpinner {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2.5px solid var(--sc-brand-line);
  border-top-color: var(--sc-brand);
  animation: sc-spin 0.75s linear infinite;
  flex-shrink: 0;
}

@keyframes sc-spin {
  to {
    transform: rotate(360deg);
  }
}

.sc-reelDoneDot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #10b981;
  color: #ffffff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.sc-reelProgressRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-reelPercent {
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  font-weight: 800;
  color: #ffffff;
  background: var(--sc-btn-grad);
  padding: 2px 9px;
  border-radius: 999px;
}

.sc-reelProgressCard.is-done .sc-reelPercent {
  background: #10b981;
}

.sc-reelProgressTrack {
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: var(--sc-line);
  overflow: hidden;
}

.sc-reelProgressFill {
  height: 100%;
  border-radius: 999px;
  background:
    linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.22) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.22) 50%,
      rgba(255, 255, 255, 0.22) 75%,
      transparent 75%,
      transparent
    ),
    var(--sc-btn-grad);
  background-size: 20px 20px, 100% 100%;
  animation: sc-stripes 0.8s linear infinite;
  transition: width 0.12s linear;
}

.sc-reelProgressCard.is-done .sc-reelProgressFill {
  background: #10b981;
  animation: none;
}

@keyframes sc-stripes {
  from {
    background-position: 0 0, 0 0;
  }
  to {
    background-position: 20px 0, 0 0;
  }
}

.sc-reelProgressSub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--sc-muted);
  font-variant-numeric: tabular-nums;
}

.sc-jobs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sc-job {
  border: 1px solid var(--sc-line);
  border-radius: 11px;
  padding: 8px 10px;
  background: var(--sc-surface);
}

.sc-jobHead {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.sc-jobHead b {
  font-size: 11.5px;
  color: var(--sc-ink);
}

.sc-jobBar {
  height: 5px;
  border-radius: 3px;
  background: var(--sc-line);
  overflow: hidden;
  margin: 6px 0;
}

.sc-jobBar i {
  display: block;
  height: 100%;
  background: var(--sc-btn-grad);
}

.sc-jobFoot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--sc-muted);
}

.sc-job a {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sc-brand);
  text-decoration: none;
}

.sc-job.err {
  border-color: #f3d3d5;
  background: #fdf1f1;
}

/* =========================================
   BOTTOM 4-FEATURE BAR
   ========================================= */
.sc-feature-strip {
  max-width: 1540px;
  width: 100%;
  margin: 2px auto 0;
  padding: 12px clamp(14px, 2.2vw, 30px) 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.sc-feat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px;
  border-right: 1px solid var(--sc-line-strong);
}

.sc-feat-item:last-child {
  border-right: none;
}

.sc-feat-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--sc-brand-soft);
  color: var(--sc-brand);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.sc-feat-icon.amber {
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
}

.sc-feat-text strong {
  display: block;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--sc-ink);
  line-height: 1.25;
}

.sc-feat-text span {
  display: block;
  font-size: 12px;
  color: var(--sc-muted);
  margin-top: 2px;
}

/* =========================================
   SEO CONTENT SECTION (HOW-TO & FAQ)
   ========================================= */
.sc-seo-wrap {
  max-width: 1480px;
  width: 100%;
  margin: 0 auto 42px;
  padding: 0 clamp(14px, 2.2vw, 30px);
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.sc-seo-card {
  background: var(--sc-paper);
  border: 1px solid var(--sc-line);
  border-radius: 22px;
  padding: clamp(20px, 2.6vw, 34px);
  box-shadow: var(--sc-shadow);
}

.sc-seo-title {
  margin: 0 0 8px;
  font-size: clamp(19px, 1.9vw, 24px);
  font-weight: 800;
  color: var(--sc-ink);
  text-align: center;
  letter-spacing: -0.02em;
}

.sc-seo-sub {
  margin: 0 auto 22px;
  max-width: 680px;
  text-align: center;
  font-size: 13.5px;
  color: var(--sc-muted);
  line-height: 1.55;
}

.sc-steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.sc-step-card {
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sc-step-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--sc-btn-grad);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px var(--sc-brand-glow);
}

.sc-step-card h3 {
  margin: 4px 0 0;
  font-size: 14.5px;
  font-weight: 800;
  color: var(--sc-ink);
}

.sc-step-card p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--sc-muted);
}

.sc-faq-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.sc-faq-item {
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: 14px;
  padding: 16px 18px;
}

.sc-faq-item h3 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 800;
  color: var(--sc-ink);
}

.sc-faq-item p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--sc-muted);
}

/* =========================================
   RESPONSIVE BREAKPOINTS
   ========================================= */
@media (max-width: 1220px) {
  .sc-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 20px;
  }

  .sc-hero-features {
    flex-wrap: wrap;
    gap: 8px;
  }

  .sc-hero-feat {
    border-left: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    padding: 4px 12px;
  }

  .sc-body {
    grid-template-columns: 1fr 1fr;
  }

  .sc-stage {
    grid-column: 1 / -1;
    order: -1;
  }

  .sc-feature-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .sc-feat-item {
    border-right: none;
    background: var(--sc-paper);
    border: 1px solid var(--sc-line);
    border-radius: 14px;
    justify-content: flex-start;
    padding: 12px 16px;
  }

  .sc-steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 780px) {
  .sc-body {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .sc-stage-center {
    flex-direction: column;
    gap: 12px;
  }

  .sc-aspect-rail {
    flex-direction: row;
    justify-content: center;
  }

  .sc-phone {
    width: min(280px, 78vw);
  }

  .sc-feature-strip {
    grid-template-columns: 1fr;
    padding: 8px 12px 18px;
  }

  .sc-steps-grid,
  .sc-faq-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function injectShortsStyles() {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('style[data-shortscreator]');
  if (!el) {
    el = document.createElement('style');
    el.setAttribute('data-shortscreator', '');
    document.head.appendChild(el);
  }
  if (el.textContent !== CSS) {
    el.textContent = CSS;
  }
}
