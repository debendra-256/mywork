const CSS = `
/* Hide outer scrollbars on dark/themed tool page wrapper and sync theme canvas */
html[data-scheme='dark'] .tool-page:has(.cj-page) {
  --canvas: #07060e;
  background: var(--canvas);
}

.detail-shell.tool-page:has(.cj-page) {
  background: var(--canvas, #f5f3fb);
}

.cj-page {
  --cj-brand: var(--brand, #6d28d9);
  --cj-brand-dark: var(--brand-dark, #5b21b6);
  --cj-brand-ink: var(--brand-ink, #4c1d95);
  --cj-brand-soft: var(--brand-soft, #f1eafe);
  --cj-brand-softer: var(--brand-softer, #f8f4ff);
  --cj-brand-line: var(--brand-line, #ded0f9);
  --cj-brand-glow: var(--brand-glow, rgba(124, 58, 237, 0.2));
  --cj-accent: var(--accent, #a855f7);
  --cj-accent-2: var(--accent-2, #ec4899);
  --cj-canvas: var(--canvas, #f4f1fb);
  --cj-paper: var(--paper, #ffffff);
  --cj-surface: var(--surface, #faf8fe);
  --cj-ink: var(--ink, #1d1a2b);
  --cj-ink-soft: var(--ink-soft, #3a3450);
  --cj-muted: var(--muted, #6e6785);
  --cj-faint: var(--faint, #9b93b3);
  --cj-line: var(--line, #e9e4f5);
  --cj-line-strong: var(--line-strong, #d9d0ee);
  --cj-shadow: var(--shadow, 0 14px 36px rgba(76, 29, 149, 0.08));
  --cj-slot-empty: #eeebfa;
  --cj-slot-border: #dad2f3;

  min-height: calc(100vh - 74px);
  background: var(--cj-canvas);
  color: var(--cj-ink);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: background-color 0.25s ease, color 0.25s ease;
}

html[data-scheme='dark'] .cj-page {
  --cj-slot-empty: #21193c;
  --cj-slot-border: #382a63;
}

html[data-theme='ocean-cyan'] .cj-page {
  --cj-slot-empty: #e3f4f9;
  --cj-slot-border: #bce3ef;
}

html[data-theme='sunset-gradient'] .cj-page {
  --cj-slot-empty: #ffefe5;
  --cj-slot-border: #f8d2be;
}

.cj-page *,
.cj-page *::before,
.cj-page *::after {
  box-sizing: border-box;
}

/* =========================================
   TOP FULL-WIDTH HERO BANNER
   ========================================= */
.cj-hero {
  position: relative;
  width: 100%;
  padding: 6px clamp(18px, 2.5vw, 36px);
  min-height: 48px;
  background: linear-gradient(100deg, var(--cj-brand) 0%, var(--cj-brand-dark) 38%, #23154f 78%, #3c1278 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  overflow: hidden;
  box-shadow: 0 6px 22px var(--cj-brand-glow);
}

html[data-theme='ocean-cyan'] .cj-hero {
  background: linear-gradient(100deg, #0ea5e9 0%, #0891b2 40%, #0c3547 80%, #0f4c5c 100%);
}

html[data-theme='sunset-gradient'] .cj-hero {
  background: linear-gradient(100deg, #f97316 0%, #db2777 45%, #3b102b 82%, #59143a 100%);
}

.cj-hero-wave {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.32;
}

.cj-hero-left {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.cj-hero-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #ffffff;
}

.cj-hero-icon svg {
  width: 19px;
  height: 19px;
}

.cj-hero-copy {
  min-width: 0;
}

.cj-hero-copy h1 {
  margin: 0;
  font-size: clamp(16px, 1.45vw, 20px);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: #ffffff;
}

.cj-hero-copy p {
  margin: 1px 0 0;
  font-size: clamp(11px, 0.88vw, 12px);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.25;
}

.cj-hero-badges {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.cj-hero-badge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 14px;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
}

.cj-hero-badge-item:last-child {
  border-right: none;
  padding-right: 0;
}

.cj-hero-badge-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  display: grid;
  place-items: center;
  color: #ffd6a5;
  flex-shrink: 0;
}

.cj-hero-badge-icon svg {
  width: 14px;
  height: 14px;
}

.cj-hero-badge-text {
  display: flex;
  flex-direction: column;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.15;
  color: rgba(255, 255, 255, 0.94);
  white-space: nowrap;
}

/* =========================================
   MAIN 3-COLUMN WORKSPACE
   ========================================= */
.cj-body {
  display: grid;
  grid-template-columns: 344px minmax(0, 1fr) 320px;
  gap: 16px;
  padding: 10px 18px 14px;
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  align-items: stretch;
  flex: 1;
}

/* =========================================
   LEFT & RIGHT SIDEBAR CARDS
   ========================================= */
.cj-side {
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  border-radius: 20px;
  box-shadow: var(--cj-shadow);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
  min-height: 500px;
  max-height: 740px;
  position: sticky;
  top: 78px;
  overflow: hidden;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

/* Left Sidebar Top Navigation Tabs */
.cj-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  padding: 8px 6px;
  border-bottom: 1px solid var(--cj-line);
  background: var(--cj-paper);
  flex-shrink: 0;
  width: 100%;
}

.cj-tab {
  flex: 1 1 auto;
  min-width: 0;
  height: 32px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--cj-ink-soft);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.cj-tab svg {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
}

.cj-tab:hover:not(.is-active) {
  background: var(--cj-brand-softer);
  color: var(--cj-brand);
}

.cj-tab.is-active {
  background: var(--btn-primary, linear-gradient(135deg, var(--cj-brand), var(--cj-brand-dark)));
  color: #ffffff;
  box-shadow: 0 4px 12px var(--cj-brand-glow);
}

/* Section subheader inside Left Sidebar */
.cj-subhead-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.cj-subhead-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 750;
  color: var(--cj-ink);
  letter-spacing: -0.01em;
}

.cj-box-filter {
  height: 30px;
  padding: 0 24px 0 11px;
  border-radius: 999px;
  border: 1px solid var(--cj-line-strong);
  background: var(--cj-surface);
  color: var(--cj-ink-soft);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 650;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e6785' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.cj-box-filter:focus {
  border-color: var(--cj-brand);
}

.cj-sidehead {
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--cj-line);
  font-size: 15px;
  font-weight: 750;
  color: var(--cj-ink);
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
}

.cj-sidehead svg {
  color: var(--cj-brand);
  flex-shrink: 0;
}

.cj-sidebody {
  overflow-y: auto;
  padding: 14px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
}

.cj-sidebody::-webkit-scrollbar {
  width: 6px;
}

.cj-sidebody::-webkit-scrollbar-track {
  background: transparent;
}

.cj-sidebody::-webkit-scrollbar-thumb {
  background: var(--cj-line-strong);
  border-radius: 999px;
}

.cj-h4 {
  margin: 0 0 9px;
  font-size: 12.5px;
  font-weight: 750;
  color: var(--cj-ink);
  letter-spacing: -0.01em;
}

/* =========================================
   TEMPLATE THUMBNAIL GRID (3 COLUMNS)
   ========================================= */
.cj-tplgrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 10px;
}

.cj-tplitem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.cj-tplthumb {
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  display: block;
  background: var(--cj-surface);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  padding: 0;
  overflow: visible;
  transition: all 0.16s ease;
}

.cj-tplthumb-inner {
  position: absolute;
  inset: 4px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--cj-surface);
}

.cj-tplthumb:hover {
  border-color: var(--cj-brand-line);
  transform: translateY(-1px);
}

.cj-tplthumb.on {
  border-color: var(--cj-brand);
  background: var(--cj-brand-softer);
  box-shadow: 0 6px 16px var(--cj-brand-glow);
}

.cj-tplcheck {
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: 3;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: var(--cj-brand);
  color: #ffffff;
  border: 2px solid var(--cj-paper);
  display: grid;
  place-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.cj-tplcell {
  position: absolute;
  background: #c7cedb;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

html[data-scheme='dark'] .cj-tplcell {
  background: #383059;
}

.cj-tplthumb.on .cj-tplcell {
  background: var(--cj-brand);
}

.cj-tplname {
  display: block;
  width: 100%;
  font-size: 11px;
  font-weight: 650;
  color: var(--cj-ink-soft);
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cj-tplitem.is-selected .cj-tplname {
  color: var(--cj-brand-dark);
  font-weight: 750;
}

/* =========================================
   CENTER STAGE COLUMN (TOOLBAR + CANVAS + MEDIA BAR)
   ========================================= */
.cj-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  height: calc(100vh - 140px);
  min-height: 500px;
  max-height: 740px;
}

/* Top Floating Toolbar */
.cj-toolbar {
  flex-shrink: 0;
  width: 100%;
  max-width: 720px;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  box-shadow: var(--cj-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.cj-tool-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.cj-tool-iconbtn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--cj-line);
  background: var(--cj-surface);
  color: var(--cj-ink-soft);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cj-tool-iconbtn svg {
  width: 13px;
  height: 13px;
}

.cj-tool-iconbtn:hover {
  border-color: var(--cj-brand-line);
  color: var(--cj-brand);
  background: var(--cj-brand-softer);
}

.cj-tool-pill {
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--cj-line);
  background: var(--cj-surface);
  color: var(--cj-ink-soft);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 650;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cj-tool-pill svg {
  width: 12.5px;
  height: 12.5px;
}

.cj-tool-pill:hover {
  border-color: var(--cj-brand-line);
  color: var(--cj-brand);
  background: var(--cj-brand-softer);
}

.cj-tool-pill.is-active {
  border-color: var(--cj-brand);
  background: var(--cj-brand-soft);
  color: var(--cj-brand-dark);
}

.cj-toolbar-ratio {
  height: 28px;
  padding: 0 24px 0 10px;
  border-radius: 7px;
  border: 1px solid var(--cj-line);
  background: var(--cj-surface);
  color: var(--cj-ink);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235b5472' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.cj-toolbar-ratio:focus {
  border-color: var(--cj-brand);
}

/* Main Stage & Canvas Frame */
.cj-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
}

.cj-stage::before {
  content: "";
  position: absolute;
  width: min(500px, 85%);
  height: min(500px, 85%);
  border-radius: 50%;
  background: radial-gradient(circle, var(--cj-brand-glow) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.cj-canvasWrap {
  position: relative;
  z-index: 1;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 22px;
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  box-shadow: 0 18px 44px rgba(35, 20, 80, 0.11), 0 4px 12px rgba(35, 20, 80, 0.04);
}

.cj-canvas {
  display: block;
  height: clamp(310px, calc(100vh - 305px), 495px);
  width: auto;
  max-width: min(100%, 700px);
  max-height: calc(100vh - 305px);
  border-radius: 14px;
  background: #ffffff;
}

.cj-overlay {
  position: absolute;
  inset: 10px;
}

.cj-slotcell {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  cursor: pointer;
}

.cj-slotcell.is-empty:not(.shape-heart):not(.shape-poly) {
  background: var(--cj-slot-empty);
  border: 1.5px solid var(--cj-slot-border);
}

.cj-slotcell:hover {
  border-color: var(--cj-brand-line);
}

.cj-slotcell.sel {
  border-color: var(--cj-brand);
  box-shadow: 0 0 0 3px var(--cj-brand-glow);
}

.cj-slotadd {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--cj-ink-soft);
  border-radius: 12px;
  padding: 8px;
  transition: all 0.15s ease;
}

.cj-slotadd-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.8px solid var(--cj-brand-ink);
  color: var(--cj-brand-ink);
  display: grid;
  place-items: center;
  font-size: 19px;
  font-weight: 600;
  line-height: 1;
  background: rgba(255, 255, 255, 0.55);
  transition: transform 0.15s ease, background 0.15s ease;
}

.cj-slotadd-label {
  font-size: 13px;
  font-weight: 650;
  color: var(--cj-ink-soft);
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}

.cj-slotadd:hover .cj-slotadd-circle {
  transform: scale(1.07);
  background: var(--cj-brand);
  border-color: var(--cj-brand);
  color: #ffffff;
}

.cj-swapbtn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: rgba(255, 255, 255, 0.92);
  color: #332c47;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.16);
  display: grid;
  place-items: center;
}

.cj-swapbtn:hover {
  background: #ffffff;
  color: var(--cj-brand);
  border-color: var(--cj-brand-line);
}

.cj-slotnum {
  position: absolute;
  bottom: 9px;
  left: 9px;
  min-width: 22px;
  height: 20px;
  font-size: 11px;
  font-weight: 750;
  color: #ffffff;
  background: #5b4d87;
  padding: 0 7px;
  border-radius: 6px;
  display: inline-grid;
  place-items: center;
  pointer-events: none;
}

.cj-stage-tip {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin: 5px 0 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--cj-muted);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.cj-stage-tip svg {
  color: var(--cj-brand);
  flex-shrink: 0;
}

/* Bottom Media Strip Bar */
.cj-media-bar {
  flex-shrink: 0;
  width: 100%;
  max-width: 720px;
  padding: 7px 12px;
  border-radius: 16px;
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  box-shadow: var(--cj-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cj-add-media-btn {
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  border: none;
  background: var(--btn-primary, linear-gradient(135deg, var(--cj-brand), var(--cj-brand-dark)));
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 750;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 6px 16px var(--cj-brand-glow);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cj-add-media-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.cj-media-thumbs {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 0;
  scrollbar-width: none;
}

.cj-media-thumbs::-webkit-scrollbar {
  display: none;
}

.cj-media-thumb {
  width: 58px;
  height: 52px;
  border-radius: 10px;
  border: 2px solid var(--cj-line);
  overflow: hidden;
  padding: 0;
  background: var(--cj-surface);
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.cj-media-thumb:hover {
  transform: translateY(-2px);
  border-color: var(--cj-brand);
}

.cj-media-thumb img,
.cj-media-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cj-upload-tile-btn {
  height: 52px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1.5px solid var(--cj-line-strong);
  background: var(--cj-surface);
  color: var(--cj-ink);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.cj-upload-tile-btn:hover {
  border-color: var(--cj-brand);
  background: var(--cj-brand-softer);
  color: var(--cj-brand-dark);
}

/* =========================================
   RIGHT SIDEBAR: EXPORT & SAVE
   ========================================= */
.cj-quality-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.cj-quality-pill {
  height: 38px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1.5px solid var(--cj-line);
  background: var(--cj-surface);
  color: var(--cj-ink-soft);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.cj-quality-pill:hover:not(.on) {
  border-color: var(--cj-brand-line);
  background: var(--cj-brand-softer);
}

.cj-quality-pill.on {
  border-color: var(--cj-brand);
  background: var(--btn-primary, linear-gradient(135deg, var(--cj-brand), var(--cj-brand-dark)));
  color: #ffffff;
  box-shadow: 0 5px 14px var(--cj-brand-glow);
}

.cj-crown {
  color: #f59e0b;
  font-size: 13px;
  line-height: 1;
}

/* Export Size Select Box */
.cj-export-size-box {
  position: relative;
  height: 44px;
  border-radius: 12px;
  border: 1.5px solid var(--cj-line);
  background: var(--cj-surface);
  display: flex;
  align-items: center;
  transition: border-color 0.16s ease;
}

.cj-export-size-box:hover {
  border-color: var(--cj-brand-line);
}

.cj-export-size-icon {
  position: absolute;
  left: 12px;
  color: var(--cj-ink-soft);
  pointer-events: none;
  display: inline-flex;
}

.cj-export-size-select {
  width: 100%;
  height: 100%;
  padding: 0 32px 0 38px;
  border: none;
  background: transparent;
  color: var(--cj-ink);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235b5472' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.cj-export-size-select option {
  background: var(--cj-paper);
  color: var(--cj-ink);
}

/* Create Buttons */
.cj-export-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.cj-export-btn {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 750;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.cj-export-btn-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cj-export-btn.is-primary {
  border: none;
  background: linear-gradient(90deg, var(--cj-brand) 0%, var(--cj-brand-dark) 55%, #3b0ca3 100%);
  color: #ffffff;
  box-shadow: 0 8px 20px var(--cj-brand-glow);
}

.cj-export-btn.is-primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.cj-export-btn.is-secondary {
  border: 1.5px solid var(--cj-brand-line);
  background: var(--cj-brand-softer);
  color: var(--cj-ink);
}

.cj-export-btn.is-secondary:hover {
  border-color: var(--cj-brand);
  background: var(--cj-brand-soft);
  transform: translateY(-1px);
}

.cj-export-btn-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--cj-brand);
  color: #ffffff;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
}

.cj-info-callout {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--cj-brand-softer);
  border: 1px solid var(--cj-brand-line);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--cj-ink-soft);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.5;
}

.cj-info-callout svg {
  color: var(--cj-brand);
  flex-shrink: 0;
  margin-top: 1px;
}

/* =========================================
   SHARED CONTROLS & EXISTING CLASSES
   ========================================= */
.cj-chiprow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cj-chip {
  background: var(--cj-surface);
  border: 1px solid var(--cj-line);
  color: var(--cj-ink-soft);
  padding: 5px 11px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 650;
  transition: all 0.14s ease;
}

.cj-chip:hover {
  border-color: var(--cj-brand-line);
  color: var(--cj-brand);
}

.cj-chip.on {
  background: var(--cj-brand);
  border-color: var(--cj-brand);
  color: #ffffff;
}

.cj-swrow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cj-sw {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid var(--cj-line-strong);
  cursor: pointer;
  padding: 0;
  transition: all 0.14s ease;
}

.cj-sw.on {
  border-color: var(--cj-brand);
  box-shadow: 0 0 0 2px var(--cj-brand-glow);
}

.cj-btn {
  background: var(--cj-surface);
  border: 1px solid var(--cj-line-strong);
  color: var(--cj-ink-soft);
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 650;
  transition: all 0.15s ease;
}

.cj-btn:hover {
  border-color: var(--cj-brand);
  color: var(--cj-brand);
  background: var(--cj-brand-softer);
}

.cj-btn.primary {
  background: var(--btn-primary, var(--cj-brand));
  border-color: var(--cj-brand);
  color: #ffffff;
}

.cj-btn.primary:hover {
  filter: brightness(1.05);
  color: #ffffff;
}

.cj-btn.wide {
  width: 100%;
}

.cj-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cj-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cj-sliderRow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--cj-ink-soft);
  margin-top: 6px;
}

.cj-sliderRow label {
  width: 52px;
  flex-shrink: 0;
}

.cj-sliderRow input[type=range] {
  flex: 1;
  accent-color: var(--cj-brand);
  cursor: pointer;
}

.cj-sliderRow .cj-val {
  width: 36px;
  text-align: right;
  font-weight: 700;
  color: var(--cj-ink);
  font-variant-numeric: tabular-nums;
}

.cj-note {
  font-size: 11.5px;
  color: var(--cj-muted);
  line-height: 1.5;
  margin: 6px 0 0;
}

.cj-fileinfo {
  font-size: 12px;
  color: var(--cj-ink-soft);
  background: var(--cj-surface);
  border: 1px solid var(--cj-line);
  border-radius: 8px;
  padding: 7px 10px;
  word-break: break-all;
  max-height: 64px;
  overflow-y: auto;
}

.cj-err {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #dc2626;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
}

.cj-sizetag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--cj-brand-soft);
  border: 1px solid var(--cj-brand-line);
  color: var(--cj-brand-dark);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}

.cj-job {
  border: 1px solid var(--cj-line);
  border-radius: 12px;
  padding: 10px;
  margin-top: 8px;
  background: var(--cj-surface);
}

.cj-jobtop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--cj-ink);
}

.cj-jobmeta {
  font-size: 11px;
  color: var(--cj-muted);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cj-bar {
  height: 6px;
  background: var(--cj-line);
  border-radius: 999px;
  margin-top: 8px;
  overflow: hidden;
}

.cj-barfill {
  height: 100%;
  background: var(--btn-primary, linear-gradient(90deg, var(--cj-brand), var(--cj-accent)));
  border-radius: 999px;
  transition: width 0.2s linear;
}

.cj-pct {
  font-size: 13px;
  font-weight: 700;
  color: var(--cj-brand);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cj-blocker {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 10, 30, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.cj-blockcard {
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  border-radius: 18px;
  box-shadow: 0 18px 60px rgba(15, 23, 42, 0.35);
  padding: 24px;
  width: min(420px, 92vw);
}

.cj-blocktitle {
  margin: 0;
  font-size: 15px;
  font-weight: 750;
  color: var(--cj-ink);
}

.cj-blockmeta {
  font-size: 12px;
  color: var(--cj-muted);
  margin: 6px 0 10px;
}

.cj-blockrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

.cj-jobacts {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.cj-jobacts .cj-btn {
  padding: 5px 10px;
  font-size: 12px;
}

.cj-jobacts a.cj-btn {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.cj-jobvid {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--cj-line);
  margin-top: 8px;
  max-height: 220px;
}

.cj-fitrow {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.cj-fitrow .cj-chip {
  flex: 1;
  text-align: center;
}

.cj-nudgerow {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.cj-nudgerow .cj-btn {
  flex: 1;
  padding: 6px 0;
  text-align: center;
  font-size: 13px;
}

.cj-badge {
  display: inline-block;
  background: var(--cj-brand-soft);
  border: 1px solid var(--cj-brand-line);
  color: var(--cj-brand-dark);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Premium & Shape Specific Rules */
.cj-tplthumb.premium {
  border-color: #e6d3ac;
}

.cj-tplthumb.premium:hover {
  border-color: #d9a441;
}

.cj-tplthumb.premium.on {
  border-color: var(--cj-brand);
}

.pj-autumn .cj-tplthumb-inner {
  background: linear-gradient(160deg, #fdf3e3, #f4d9b4);
}

.pj-christmas .cj-tplthumb-inner {
  background: linear-gradient(160deg, #143528, #0d2018);
}

.pj-fathers .cj-tplthumb-inner {
  background: linear-gradient(160deg, #e9edf4, #d3dbea);
}

.pj-autumn .cj-tplcell {
  background: #e0a35a;
}

.pj-christmas .cj-tplcell {
  background: #3f7d5d;
}

.pj-fathers .cj-tplcell {
  background: #7d8cab;
}

.cj-tplthumb.on.pj-autumn .cj-tplcell {
  background: #d9731f;
}

.cj-tplthumb.on.pj-christmas .cj-tplcell {
  background: #4caf7d;
}

.cj-tplthumb.on.pj-fathers .cj-tplcell {
  background: #5b7bc0;
}

.cj-slotcell.shape-heart {
  border-color: transparent;
  border-radius: 0;
}

.cj-slotcell.shape-heart:hover {
  border-color: transparent;
}

.cj-slotcell.shape-heart.sel {
  border-color: transparent;
  box-shadow: none;
}

.cj-slotshape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.cj-slotshape path {
  fill: none;
  stroke: var(--cj-brand);
  stroke-opacity: 0.55;
  stroke-width: 1.6;
  stroke-dasharray: 6 5;
  vector-effect: non-scaling-stroke;
  transition: stroke 0.12s;
}

.cj-slotcell.shape-heart:hover .cj-slotshape path {
  stroke-opacity: 0.85;
}

.cj-slotcell.shape-heart.sel .cj-slotshape path {
  stroke: var(--cj-brand);
  stroke-opacity: 1;
  stroke-width: 2.4;
  stroke-dasharray: none;
}

.cj-slotcell.shape-heart .cj-slotadd {
  border-radius: 0;
  background: none;
}

.cj-slotcell.shape-heart .cj-swapbtn {
  top: 14%;
  right: 14%;
}

.cj-slotcell.shape-heart .cj-slotnum {
  left: 50%;
  transform: translateX(-50%);
}

.cj-tplheart {
  background: none !important;
  overflow: visible;
}

.cj-tplheart path {
  fill: #c7cedb;
}

.cj-tplthumb.on .cj-tplheart path {
  fill: var(--cj-brand);
}

.cj-slotcell.shape-poly {
  border-color: transparent;
  border-radius: 0;
  pointer-events: none;
}

.cj-slotcell.shape-poly:hover {
  border-color: transparent;
}

.cj-slotcell.shape-poly.sel {
  border-color: transparent;
  box-shadow: none;
}

.cj-slotcell.shape-poly .cj-slotshape polygon {
  fill: none;
  stroke: var(--cj-brand);
  stroke-opacity: 0.5;
  stroke-width: 1.6;
  stroke-dasharray: 6 5;
  vector-effect: non-scaling-stroke;
  transition: stroke 0.12s;
}

.cj-slotcell.shape-poly.sel .cj-slotshape polygon {
  stroke: var(--cj-brand);
  stroke-opacity: 1;
  stroke-width: 2.4;
  stroke-dasharray: none;
}

.cj-slotcell.shape-poly .cj-slotadd,
.cj-slotcell.shape-poly .cj-swapbtn {
  inset: auto;
  pointer-events: auto;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.cj-slotcell.shape-poly .cj-slotadd-label {
  display: none;
}

.cj-slotcell.shape-poly .cj-swapbtn {
  font-size: 13px;
}

.cj-slotcell.shape-poly .cj-slotadd {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.16);
}

.cj-slotcell.shape-poly .cj-slotnum {
  left: auto;
  bottom: auto;
  transform: translate(-50%, -50%);
}

.cj-tplpoly {
  background: none !important;
  border-radius: 0;
  overflow: visible;
}

.cj-tplpoly polygon {
  fill: #c7cedb;
}

.cj-tplthumb.on .cj-tplpoly polygon {
  fill: var(--cj-brand);
}

.pj-hearts .cj-tplthumb-inner {
  background: linear-gradient(160deg, #fdf3f5, #f6d9e0);
}

.pj-hearts .cj-tplcell,
.pj-hearts .cj-tplheart path {
  background: #e294a7;
  fill: #e294a7;
}

.cj-tplthumb.on.pj-hearts .cj-tplcell,
.cj-tplthumb.on.pj-hearts .cj-tplheart path {
  background: #c65f7d;
  fill: #c65f7d;
}

.cj-grip {
  position: absolute;
  z-index: 3;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--cj-brand);
  background: #ffffff;
  color: var(--cj-brand);
  font-size: 12px;
  line-height: 1;
  cursor: move;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
  transform: translate(-50%, -50%);
}

.cj-grip-size {
  border-radius: 8px 8px 8px 3px;
  cursor: nwse-resize;
}

.cj-textcell {
  position: absolute;
  z-index: 2;
  border: 1.5px dashed transparent;
  border-radius: 6px;
  cursor: move;
}

.cj-textcell:hover {
  border-color: var(--cj-brand-line);
}

.cj-textcell.sel {
  border-color: var(--cj-brand);
  background: var(--cj-brand-glow);
}

.cj-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--cj-line-strong);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
  font-size: 13px;
  color: var(--cj-ink);
  background: var(--cj-surface);
  resize: vertical;
}

.cj-textarea:focus {
  outline: none;
  border-color: var(--cj-brand);
  box-shadow: 0 0 0 3px var(--cj-brand-glow);
}

.cj-fieldRow {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.cj-field {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cj-fieldLabel {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--cj-muted);
}

.cj-select,
.cj-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--cj-line-strong);
  border-radius: 8px;
  padding: 6px 8px;
  font: inherit;
  font-size: 13px;
  color: var(--cj-ink);
  background: var(--cj-surface);
}

.cj-select:focus,
.cj-input:focus {
  outline: none;
  border-color: var(--cj-brand);
  box-shadow: 0 0 0 3px var(--cj-brand-glow);
}

.cj-fontpreview {
  display: block;
  margin-top: 6px;
  padding: 7px 9px;
  border: 1px dashed var(--cj-line-strong);
  border-radius: 8px;
  background: var(--cj-surface);
  font-size: 15px;
  line-height: 1.3;
  color: var(--cj-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cj-colorRow {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--cj-line-strong);
  border-radius: 8px;
  padding: 4px 6px;
  background: var(--cj-surface);
}

.cj-colorInput {
  width: 26px;
  height: 22px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.cj-hexval {
  font-size: 11px;
  color: var(--cj-ink-soft);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cj-range {
  flex: 1;
  min-width: 0;
  accent-color: var(--cj-brand);
}

.cj-add-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.cj-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border-radius: 10px;
  border: 1px solid var(--cj-line);
  background: var(--cj-surface);
  font-size: 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--cj-ink-soft);
  cursor: pointer;
  transition: all 0.18s ease;
}

.cj-add-btn:hover {
  border-color: var(--cj-brand);
  color: var(--cj-brand);
  transform: translateY(-1px);
}

.cj-banner-glyph {
  display: inline-block;
  width: 18px;
  height: 10px;
  border: 1.4px solid currentColor;
  border-radius: 3px;
}

.cj-card-glyph {
  display: inline-block;
  width: 17px;
  height: 11px;
  border: 1.4px solid currentColor;
  border-radius: 3px;
  background: linear-gradient(currentColor, currentColor) 50% 32%/52% 1.6px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 68%/78% 1.6px no-repeat;
}

.cj-card-glyph--contact {
  background: linear-gradient(currentColor, currentColor) 50% 30%/44% 1.4px no-repeat,
    linear-gradient(currentColor, currentColor) 50% calc(100% - 2px)/100% 2px no-repeat;
}

.cj-line-glyph {
  width: 18px;
  height: 2px;
  background: currentColor;
}

.cj-circle-glyph {
  width: 14px;
  height: 14px;
  border: 1.4px solid currentColor;
  border-radius: 50%;
}

.cj-arch-glyph {
  width: 14px;
  height: 16px;
  border: 1.4px solid currentColor;
  border-radius: 50% 50% 0 0 / 55% 55% 0 0;
}

.cj-hint {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--cj-muted);
}

.cj-elcell {
  position: absolute;
  z-index: 2;
  border: 1.5px dashed transparent;
  border-radius: 6px;
  cursor: move;
}

.cj-elcell:hover {
  border-color: var(--cj-brand-line);
}

.cj-elcell.sel {
  border-color: var(--cj-brand);
  box-shadow: 0 0 0 2px var(--cj-brand-glow);
}

.cj-elcell-tag {
  position: absolute;
  top: -18px;
  left: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--cj-brand-dark);
  background: var(--cj-brand-soft);
  border: 1px solid var(--cj-brand-line);
  border-radius: 5px;
  padding: 1px 5px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}

.cj-elcell:hover .cj-elcell-tag,
.cj-elcell.sel .cj-elcell-tag {
  opacity: 1;
}

/* =========================================
   BELOW-THE-FOLD: SEO TUTORIAL & FAQ
   ========================================= */
.cj-below-fold {
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: clamp(28px, 4.5vh, 52px) clamp(18px, 2.5vw, 32px) clamp(44px, 6vh, 72px);
  display: flex;
  flex-direction: column;
  gap: clamp(36px, 5vh, 56px);
  border-top: 1px solid var(--cj-line);
}

.cj-section-header {
  max-width: 720px;
  margin: 0 auto clamp(24px, 3.2vh, 34px);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.cj-section-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 13px;
  border-radius: 999px;
  background: var(--cj-brand-soft);
  border: 1px solid var(--cj-brand-line);
  color: var(--cj-brand-dark);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.cj-section-title {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--cj-ink);
  line-height: 1.2;
}

.cj-section-subtitle {
  margin: 0;
  font-size: clamp(13.5px, 1.1vw, 15.5px);
  font-weight: 500;
  color: var(--cj-muted);
  line-height: 1.55;
}

.cj-tutorial-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 22px);
}

.cj-tutorial-card {
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--cj-shadow);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.cj-tutorial-card:hover {
  transform: translateY(-4px);
  border-color: var(--cj-brand-line);
  box-shadow: 0 20px 44px var(--cj-brand-glow);
}

.cj-tutorial-media {
  position: relative;
  border-radius: 14px;
  background: var(--cj-brand-softer);
  border: 1px solid var(--cj-brand-line);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--cj-brand-dark);
}

.cj-tutorial-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--cj-paper);
  border: 1px solid var(--cj-brand-line);
  color: var(--cj-brand-dark);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.cj-tutorial-svg,
.cj-faq-svg {
  width: 100%;
  height: auto;
  max-height: 145px;
  display: block;
}

.cj-illus-card {
  fill: var(--cj-paper);
  stroke: var(--cj-line);
  stroke-width: 1.5;
}

.cj-illus-slot {
  fill: var(--cj-brand-soft);
  stroke: var(--cj-brand-line);
  stroke-width: 1.3;
}

.cj-illus-slot-active {
  fill: var(--cj-brand);
}

.cj-illus-pill {
  fill: var(--cj-surface);
  stroke: var(--cj-line);
  stroke-width: 1.2;
}

.cj-illus-pill-active {
  fill: var(--cj-brand-soft);
  stroke: var(--cj-brand);
  stroke-width: 1.5;
}

.cj-illus-bar {
  fill: var(--cj-line-strong);
}

.cj-illus-bar-brand {
  fill: var(--cj-brand);
}

.cj-illus-accent {
  fill: var(--cj-accent);
}

.cj-tutorial-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cj-tutorial-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 750;
  color: var(--cj-ink);
  line-height: 1.35;
}

.cj-tutorial-card-desc {
  margin: 0;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--cj-muted);
  line-height: 1.55;
}

/* FAQ Section */
.cj-faq-section {
  background: var(--cj-paper);
  border: 1px solid var(--cj-line);
  border-radius: 24px;
  padding: clamp(24px, 3.6vh, 40px);
  box-shadow: var(--cj-shadow);
}

.cj-faq-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.3fr);
  gap: clamp(24px, 3vw, 44px);
  align-items: start;
}

.cj-faq-aside {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.cj-faq-aside .cj-section-title,
.cj-faq-aside .cj-section-subtitle {
  text-align: left;
}

.cj-faq-illustration-card {
  width: 100%;
  margin-top: 8px;
  padding: 16px;
  border-radius: 18px;
  background: var(--cj-brand-softer);
  border: 1px solid var(--cj-brand-line);
  color: var(--cj-brand-dark);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cj-faq-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cj-faq-highlights span {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--cj-paper);
  border: 1px solid var(--cj-brand-line);
  color: var(--cj-ink-soft);
  font-size: 11.5px;
  font-weight: 700;
}

.cj-faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cj-faq-item {
  border-radius: 14px;
  border: 1.5px solid var(--cj-line);
  background: var(--cj-surface);
  overflow: hidden;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.cj-faq-item.is-open {
  border-color: var(--cj-brand);
  background: var(--cj-paper);
  box-shadow: 0 8px 24px var(--cj-brand-glow);
}

.cj-faq-question {
  width: 100%;
  padding: 16px 18px;
  border: none;
  background: transparent;
  color: var(--cj-ink);
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
}

.cj-faq-chevron {
  flex-shrink: 0;
  color: var(--cj-brand);
  transition: transform 0.2s ease;
}

.cj-faq-item.is-open .cj-faq-chevron {
  transform: rotate(180deg);
}

.cj-faq-answer {
  padding: 0 18px 16px;
}

.cj-faq-answer p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--cj-muted);
  line-height: 1.6;
}

/* =========================================
   RESPONSIVE BREAKPOINTS
   ========================================= */
@media (max-width: 1260px) {
  .cj-hero-badges {
    display: none;
  }

  .cj-body {
    grid-template-columns: 320px minmax(0, 1fr) 295px;
    gap: 14px;
    padding: 10px 14px 16px;
  }

  .cj-tutorial-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .cj-body {
    grid-template-columns: 1fr;
  }

  .cj-side {
    width: 100%;
    height: auto;
    min-height: 0;
    max-height: none;
    position: static;
  }

  .cj-center {
    height: auto;
    max-height: none;
    min-height: 0;
    order: -1;
  }

  .cj-canvasWrap,
  .cj-canvas {
    max-height: 68vh;
  }

  .cj-faq-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cj-hero {
    padding: 12px 16px;
  }

  .cj-toolbar {
    justify-content: center;
  }

  .cj-canvas {
    height: auto;
    width: 100%;
    max-height: 68vh;
  }

  .cj-media-bar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .cj-slotadd-label {
    font-size: 10.5px;
    white-space: normal;
  }

  .cj-tutorial-grid {
    grid-template-columns: 1fr;
  }
}
`;

export function injectCollageStyles() {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('style[data-collagestudio]');
  if (!el) {
    el = document.createElement('style');
    el.setAttribute('data-collagestudio', '');
    document.head.appendChild(el);
  }
  if (el.textContent !== CSS) {
    el.textContent = CSS;
  }
}
