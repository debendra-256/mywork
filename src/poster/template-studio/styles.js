export const css = `
.ts-nav, .ts-root {
  --ts-bg: #f6f0e3;
  --ts-bg-deep: #eee5d3;
  --ts-panel: #fffdf8;
  --ts-ink: #26261f;
  --ts-soft: #6f6d60;
  --ts-faint: #9b9587;
  --ts-line: #e7dfcf;
  --ts-line-strong: #d8ceba;
  --ts-accent: #6f7d5c;
  --ts-gold: #b08d57;
  --ts-danger: #a84b3f;
  --ts-font-ui: 'Segoe UI', 'Helvetica Neue', system-ui, -apple-system, sans-serif;
  --ts-font-display: 'Bodoni MT', Didot, 'Bodoni 72', 'Playfair Display', Georgia, serif;
}

.ts-nav *, .ts-menu, .ts-menu *, .ts-root *, .ts-root *::before, .ts-root *::after {
  box-sizing: border-box;
}

.ts-root {
  font-family: var(--ts-font-ui);
  color: var(--ts-ink);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.ts-root :where(button, input, select, textarea),
.ts-menu :where(button) {
  font-family: var(--ts-font-ui);
  font-size: 12px;
  color: inherit;
}

.ts-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.ts-root ::-webkit-scrollbar-thumb {
  background: rgba(120, 110, 85, 0.26);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
.ts-root ::-webkit-scrollbar-track { background: transparent; }
.ts-root ::selection { background: rgba(111, 125, 92, 0.22); }

@keyframes ts-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ts-rise {
  from { opacity: 0; transform: translateY(18px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ts-pop {
  from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes ts-toast {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* ---------- Header menu ---------- */
.ts-nav { position: relative; display: inline-flex; align-items: center; font-family: var(--ts-font-ui); }
.ts-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  padding: 8px 2px;
}
.ts-nav-btn svg { opacity: 0.65; transition: transform 0.25s ease; }
.ts-nav-btn.is-open svg { transform: rotate(180deg); }
.ts-nav-new {
  font-family: var(--ts-font-ui);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--ts-gold);
  color: #fffdf6;
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1.4;
}
.ts-menu {
  position: absolute;
  top: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  max-width: 88vw;
  background: var(--ts-panel);
  border: 1px solid var(--ts-line);
  border-radius: 18px;
  box-shadow: 0 40px 90px -24px rgba(35, 30, 18, 0.5), 0 2px 6px rgba(35, 30, 18, 0.08);
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 196px;
  gap: 20px;
  z-index: 2147482000;
  animation: ts-pop 0.18s ease both;
  text-align: left;
  color: var(--ts-ink);
}
.ts-menu-eyebrow {
  display: block;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ts-gold);
  margin-bottom: 12px;
}
.ts-menu-cats { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.ts-menu-cats button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  color: #4c4a3f;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
}
.ts-menu-cats button:hover { background: #f5eee1; color: var(--ts-ink); }
.ts-menu-count { font-size: 9px; color: #a09784; }
.ts-menu-all {
  width: 100%;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--ts-line-strong);
  background: #fbf6ec;
  color: var(--ts-ink);
  font-size: 11.5px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.ts-menu-all span { margin-left: auto; color: var(--ts-gold); }
.ts-menu-all:hover { background: #f5eee1; }
.ts-menu-foot { margin: 10px 2px 0; font-size: 9.5px; letter-spacing: 0.04em; color: #a09784; }
.ts-menu-feature {
  border-left: 1px solid var(--ts-line);
  padding-left: 20px;
  display: flex;
  flex-direction: column;
}
.ts-menu-preview {
  border: 0;
  padding: 9px;
  border-radius: 10px;
  background: linear-gradient(180deg, #f0e8d8, #e7dcc8);
  cursor: pointer;
  margin-bottom: 11px;
  box-shadow: 0 10px 24px -16px rgba(50, 40, 20, 0.55);
  transition: transform 0.25s ease;
}
.ts-menu-preview:hover { transform: translateY(-2px); }
.ts-menu-preview .ts-stage { width: 100%; }
.ts-menu-feature-meta { display: flex; flex-direction: column; gap: 3px; margin-bottom: 12px; }
.ts-menu-feature-meta b { font-family: var(--ts-font-display); font-weight: 500; font-size: 14px; color: var(--ts-ink); }
.ts-menu-feature-meta span { font-size: 9px; letter-spacing: 0.09em; text-transform: uppercase; color: var(--ts-faint); }
.ts-menu-cta {
  margin-top: auto;
  border: 0;
  background: var(--ts-ink);
  color: #f9f4e8;
  border-radius: 999px;
  padding: 10px 12px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.ts-menu-cta:hover { background: #373528; }

/* ---------- Studio shell ---------- */
.ts-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  background: rgba(24, 23, 18, 0.52);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(10px, 3vh, 30px) clamp(10px, 3vw, 40px);
  animation: ts-fade 0.22s ease both;
}
.ts-shell {
  position: relative;
  width: min(1440px, 96vw);
  height: min(940px, 94vh);
  background: var(--ts-bg);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 50px 140px -20px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  animation: ts-rise 0.34s cubic-bezier(0.2, 0.9, 0.25, 1) both;
}
.ts-topbar {
  flex: 0 0 auto;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 20px 0 22px;
  border-bottom: 1px solid var(--ts-line);
  background: linear-gradient(180deg, #fffdf8, #fbf7ee);
}
.ts-brand { display: flex; align-items: center; gap: 11px; min-width: 186px; }
.ts-mark {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--ts-line-strong);
  display: grid;
  place-items: center;
  font-family: var(--ts-font-display);
  font-size: 17px;
  color: var(--ts-gold);
  background: radial-gradient(circle at 30% 25%, #fff, #f4ecdd);
  box-shadow: inset 0 0 0 3px #fffdf8;
}
.ts-brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.ts-brand-text b { font-family: var(--ts-font-display); font-weight: 500; font-size: 16px; letter-spacing: 0.02em; }
.ts-brand-text em {
  font-style: normal;
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ts-faint);
  margin-top: 2px;
}
.ts-tabs { display: flex; gap: 3px; background: #f0e9db; border-radius: 999px; padding: 4px; }
.ts-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 8px 15px;
  font-size: 11.5px;
  letter-spacing: 0.03em;
  color: #6a6558;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ts-tab:hover { color: var(--ts-ink); }
.ts-tab.is-active {
  background: #fffdf8;
  color: var(--ts-ink);
  box-shadow: 0 1px 4px rgba(60, 50, 30, 0.14);
}
.ts-tab svg { opacity: 0.7; }
.ts-tab-badge {
  font-size: 8.5px;
  background: var(--ts-ink);
  color: #f8f3e8;
  min-width: 15px;
  height: 15px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  padding: 0 4px;
}
.ts-top-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.ts-top-note {
  font-size: 9.5px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ts-faint);
  margin-right: 8px;
}
.ts-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--ts-soft);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.ts-icon-btn:hover:not(:disabled) { background: #f1e9da; color: var(--ts-ink); }
.ts-icon-btn:disabled { opacity: 0.3; cursor: default; }
.ts-close { border: 1px solid var(--ts-line); background: #fffdf8; }
.ts-close:hover { background: #f4ecdd; }

/* ---------- Gallery ---------- */
.ts-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; background: var(--ts-bg); }
.ts-gallery {
  padding: 32px clamp(22px, 3.2vw, 46px) 52px;
  max-width: 1380px;
  margin: 0 auto;
}
.ts-gallery-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 24px;
}
.ts-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 9.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ts-gold);
  font-weight: 600;
  margin-bottom: 10px;
}
.ts-gallery-head h2 {
  margin: 0 0 8px;
  font-family: var(--ts-font-display);
  font-weight: 400;
  font-size: clamp(30px, 3.3vw, 45px);
  line-height: 1.04;
  letter-spacing: -0.01em;
  color: var(--ts-ink);
}
.ts-gallery-head p { margin: 0; max-width: 570px; font-size: 12.5px; line-height: 1.7; color: var(--ts-soft); }
.ts-search { flex: 0 0 auto; position: relative; display: flex; align-items: center; }
.ts-search svg { position: absolute; left: 14px; color: var(--ts-faint); pointer-events: none; }
.ts-search input {
  width: 238px;
  border: 1px solid var(--ts-line-strong);
  background: #fffdf9;
  border-radius: 999px;
  padding: 11px 16px 11px 38px;
  font-size: 12px;
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.ts-search input:focus { border-color: var(--ts-accent); box-shadow: 0 0 0 3px rgba(111, 125, 92, 0.14); }
.ts-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--ts-line);
  margin-bottom: 26px;
}
.ts-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(255, 253, 248, 0.7);
  font-size: 11.5px;
  color: var(--ts-soft);
  cursor: pointer;
  transition: all 0.18s ease;
}
.ts-chip:hover { border-color: var(--ts-line-strong); color: var(--ts-ink); }
.ts-chip.is-active { background: var(--ts-ink); color: #f8f3e8; border-color: var(--ts-ink); }
.ts-chip-count { font-size: 9.5px; opacity: 0.6; }
.ts-grid { columns: 4 226px; column-gap: 22px; }
.ts-card { break-inside: avoid; margin: 0 0 26px; cursor: pointer; outline: none; }
.ts-card-frame {
  position: relative;
  border-radius: 10px;
  background: linear-gradient(180deg, #efe7d7, #e7dcc8);
  padding: 13px;
  box-shadow: 0 1px 2px rgba(50, 40, 20, 0.08), 0 12px 24px -22px rgba(50, 40, 20, 0.4);
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
}
.ts-card:hover .ts-card-frame,
.ts-card:focus-visible .ts-card-frame {
  transform: translateY(-5px);
  box-shadow: 0 26px 46px -24px rgba(50, 40, 20, 0.5), 0 2px 4px rgba(50, 40, 20, 0.08);
}
.ts-thumb { width: 100%; border-radius: 3px; box-shadow: 0 8px 20px -14px rgba(50, 40, 20, 0.45); }
.ts-card-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 253, 248, 0.92);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  color: var(--ts-gold);
  font-size: 8px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid rgba(176, 141, 87, 0.28);
}
.ts-card-badge--saved { color: var(--ts-accent); border-color: rgba(111, 125, 92, 0.3); }
.ts-card-ratio {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: rgba(60, 52, 38, 0.6);
  background: rgba(255, 253, 248, 0.78);
  padding: 3px 7px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.ts-card:hover .ts-card-ratio { opacity: 1; }
.ts-card-hover {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translate(-50%, 8px);
  opacity: 0;
  background: var(--ts-ink);
  color: #f8f3e8;
  font-size: 10.5px;
  letter-spacing: 0.02em;
  padding: 9px 16px;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 12px 26px -12px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.ts-card:hover .ts-card-hover { opacity: 1; transform: translate(-50%, 0); }
.ts-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 3px 0; }
.ts-card-meta h4 {
  margin: 0;
  font-family: var(--ts-font-display);
  font-weight: 500;
  font-size: 15.5px;
  letter-spacing: 0.01em;
  color: var(--ts-ink);
}
.ts-card-meta p {
  margin: 3px 0 0;
  font-size: 9px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ts-faint);
}
.ts-card-arrow { font-size: 15px; color: var(--ts-gold); opacity: 0; transform: translateX(-4px); transition: all 0.25s ease; }
.ts-card:hover .ts-card-arrow { opacity: 1; transform: translateX(0); }
.ts-card-delete {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--ts-line);
  background: rgba(255, 253, 248, 0.92);
  color: var(--ts-soft);
  display: grid;
  place-items: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}
.ts-card--saved:hover .ts-card-delete { opacity: 1; }
.ts-card-delete:hover { color: var(--ts-danger); border-color: rgba(168, 75, 63, 0.4); }
.ts-gallery-foot {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 34px;
  padding-top: 20px;
  border-top: 1px solid var(--ts-line);
  font-size: 9.5px;
  letter-spacing: 0.1em;
  color: var(--ts-faint);
  text-transform: uppercase;
}
.ts-gallery-admin {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ts-gold);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ts-gallery-admin:hover { color: var(--ts-ink); }
.ts-langbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 16px;
  border: 1px solid var(--ts-line);
  border-radius: 12px;
  background: linear-gradient(180deg, #fffdf8, #fbf7ee);
}
.ts-langbar-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ts-faint);
}
.ts-langbar-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.ts-langchip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--ts-line);
  background: #fffdf8;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 10.5px;
  color: var(--ts-soft);
  cursor: pointer;
  transition: all 0.18s ease;
}
.ts-langchip span { font-size: 8.5px; letter-spacing: 0.08em; opacity: 0.55; text-transform: uppercase; }
.ts-langchip:hover { border-color: var(--ts-line-strong); color: var(--ts-ink); }
.ts-langchip.is-active { background: var(--ts-ink); border-color: var(--ts-ink); color: #f8f3e8; }
.ts-langchip.is-active span { opacity: 0.7; }
.ts-langbar-note {
  margin-left: auto;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ts-faint);
}
.ts-lib-section { margin-top: 4px; }
.ts-lib-section + .ts-lib-section {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px dashed var(--ts-line-strong);
}
.ts-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 16px;
}
.ts-section-head h3 {
  margin: 4px 0 0;
  font-family: var(--ts-font-display);
  font-weight: 500;
  font-size: 22px;
  letter-spacing: 0.01em;
}
.ts-section-note {
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ts-faint);
}
.ts-card-badge--remote {
  color: var(--ts-accent);
  border-color: rgba(111, 125, 92, 0.32);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ts-card-lang {
  position: absolute;
  top: 20px;
  right: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(38, 38, 31, 0.82);
  color: #f8f3e8;
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
}
.ts-thumb--blank {
  aspect-ratio: 5 / 7;
  background: repeating-linear-gradient(135deg, #efe7d7 0 10px, #f6f0e3 10px 20px);
}
.ts-lib-note {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 11.5px;
}
.ts-lib-note--error {
  background: #fbf1ee;
  border: 1px solid rgba(168, 75, 63, 0.25);
  color: #7d352c;
}
.ts-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 9px 16px;
  font-size: 11.5px;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.ts-btn:disabled { opacity: 0.55; cursor: default; }
.ts-btn-ghost { background: transparent; border-color: var(--ts-line-strong); color: var(--ts-ink); }
.ts-btn-ghost:hover:not(:disabled) { background: #fffdf8; }
.ts-btn-primary { background: var(--ts-ink); color: #f9f4e8; box-shadow: 0 10px 20px -12px rgba(40, 36, 25, 0.8); }
.ts-btn-primary:hover:not(:disabled) { background: #363427; transform: translateY(-1px); }
.ts-btn-dark { background: var(--ts-ink); color: #f9f4e8; }
.ts-btn-dark:hover { background: #363427; }

.ts-empty { text-align: center; padding: 52px 20px; max-width: 440px; margin: 16px auto; }
.ts-empty-mark {
  width: 74px;
  height: 74px;
  margin: 0 auto 18px;
  color: var(--ts-gold);
  border: 1px solid var(--ts-line);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fffdf8;
}
.ts-empty-mark svg { width: 46px; height: 46px; }
.ts-empty h3 { font-family: var(--ts-font-display); font-size: 25px; font-weight: 400; margin: 0 0 8px; }
.ts-empty p { font-size: 12.5px; line-height: 1.7; color: var(--ts-soft); margin: 0 0 18px; }
.ts-empty--inline { padding: 36px 20px; }

/* ---------- Editor ---------- */
.ts-editor-root { flex: 1; display: flex; flex-direction: column; min-height: 0; background: var(--ts-bg); }
.ts-editor-bar { gap: 14px; }

.ts-editor-body { flex: 1; display: flex; align-items: stretch; min-height: 0; min-width: 0; }

.ts-toolbar-rail {
  position: relative;
  flex: none;
  width: 104px;
  display: flex;
  background: var(--ts-panel);
  border-right: 1px solid var(--ts-line);
}
.ts-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: 8px 5px;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
}
.ts-tool-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 7px 0;
  border-bottom: 1px solid var(--ts-line);
  flex: none;
}
.ts-tool-group:last-child { border-bottom: 0; }
.ts-tool-row {
  display: grid;
  grid-template-columns: repeat(3, 30px);
  justify-content: center;
  gap: 2px;
}
.ts-tool-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #4b4a42;
  cursor: pointer;
  flex: none;
}
.ts-tool-btn:hover:not(:disabled) { background: #f4efe3; }
.ts-tool-btn.is-on { background: rgba(111, 125, 92, 0.14); border-color: rgba(111, 125, 92, 0.36); }
.ts-tool-btn.is-active { background: var(--ts-accent); border-color: var(--ts-accent); color: #fff; }
.ts-tool-btn:disabled { opacity: 0.32; cursor: default; }
.ts-tool-label {
  font-size: 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
  color: #a19a87;
  white-space: nowrap;
}
.ts-tool-options-stack {
  position: absolute;
  top: 10px;
  left: calc(100% + 10px);
  z-index: 14;
  display: flex;
  flex-direction: column;
  gap: 11px;
  width: max-content;
  max-width: min(330px, calc(100vw - 150px));
  max-height: calc(100% - 20px);
  overflow-y: auto;
  padding: 12px 14px;
  background: #fbf8ef;
  border: 1px solid var(--ts-line);
  border-radius: 12px;
  box-shadow: 0 20px 46px -22px rgba(40, 30, 15, 0.45);
  scrollbar-width: thin;
}
.ts-tool-options {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
  font-size: 10px;
  color: #6f6a5c;
}
.ts-tool-options + .ts-tool-options { padding-top: 11px; border-top: 1px solid #efe7d8; }
.ts-tool-options-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b7463;
}
.ts-tool-option { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.ts-tool-option input[type="range"] { width: 104px; accent-color: var(--ts-accent); }
.ts-tool-option input[type="color"] {
  width: 28px;
  height: 21px;
  padding: 0;
  border: 1px solid var(--ts-line-strong);
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.ts-tool-scale {
  min-width: 30px;
  text-align: right;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  color: #9a9382;
}
.ts-tool-tip { color: #a19a87; font-size: 9px; white-space: normal; }
.ts-tool-actions { display: flex; align-items: center; gap: 8px; }
.ts-tool-reset { padding: 4px 10px; font-size: 10px; }

.ts-shape-svg,
.ts-ink-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  pointer-events: none;
}
.ts-ink-preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 40;
}
.ts-stage.is-brush,
.ts-stage.is-brush * { cursor: crosshair !important; }
.ts-stage.is-text-tool,
.ts-stage.is-text-tool * { cursor: text !important; }
.ts-stage.is-select-tool,
.ts-stage.is-select-tool * { cursor: crosshair !important; }
.ts-stage.is-select-tool { touch-action: none; }
.ts-marquee {
  position: absolute;
  z-index: 45;
  pointer-events: none;
  border: 1px dashed rgba(32, 28, 18, 0.85);
  background: rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}
.ts-lasso {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 45;
}
.ts-lasso polygon {
  fill: rgba(255, 255, 255, 0.18);
  stroke: rgba(32, 28, 18, 0.85);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
}
/* Paint's post-release selection: marching ants stay on the page. */
.ts-select-frame {
  z-index: 46;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(90deg, rgba(28, 24, 15, 0.92) 0 6px, rgba(255, 255, 255, 0.95) 6px 12px),
    repeating-linear-gradient(90deg, rgba(28, 24, 15, 0.92) 0 6px, rgba(255, 255, 255, 0.95) 6px 12px),
    repeating-linear-gradient(0deg, rgba(28, 24, 15, 0.92) 0 6px, rgba(255, 255, 255, 0.95) 6px 12px),
    repeating-linear-gradient(0deg, rgba(28, 24, 15, 0.92) 0 6px, rgba(255, 255, 255, 0.95) 6px 12px);
  background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  animation: ts-ants 0.6s linear infinite;
}
.ts-select-frame::after {
  content: '';
  position: absolute;
  inset: -3.5px;
  background-image:
    radial-gradient(circle, #fff 2.4px, rgba(28, 24, 15, 0.92) 2.4px 3.4px, transparent 3.4px),
    radial-gradient(circle, #fff 2.4px, rgba(28, 24, 15, 0.92) 2.4px 3.4px, transparent 3.4px),
    radial-gradient(circle, #fff 2.4px, rgba(28, 24, 15, 0.92) 2.4px 3.4px, transparent 3.4px),
    radial-gradient(circle, #fff 2.4px, rgba(28, 24, 15, 0.92) 2.4px 3.4px, transparent 3.4px);
  background-size: 8px 8px;
  background-position: 0 0, 100% 0, 0 100%, 100% 100%;
  background-repeat: no-repeat;
}
@keyframes ts-ants {
  to {
    background-position: 12px 0, -12px 100%, 0 -12px, 100% 12px;
  }
}
.ts-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  font-size: 11.5px;
  color: var(--ts-soft);
  cursor: pointer;
  padding: 8px 10px;
  margin-left: -6px;
  border-radius: 999px;
  transition: background 0.18s ease, color 0.18s ease;
  flex: 0 0 auto;
}
.ts-back:hover { background: #f1e9da; color: var(--ts-ink); }
.ts-bar-divider { width: 1px; height: 22px; background: var(--ts-line); flex: 0 0 auto; }
.ts-doc-meta { display: flex; flex-direction: column; min-width: 0; }
.ts-doc-name {
  border: 0;
  background: transparent;
  font-family: var(--ts-font-display);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.01em;
  padding: 2px 6px;
  margin-left: -6px;
  border-radius: 6px;
  outline: none;
  width: min(320px, 30vw);
  text-overflow: ellipsis;
}
.ts-doc-name:hover { background: #f5ede0; }
.ts-doc-name:focus { background: #fff; box-shadow: 0 0 0 1px var(--ts-line-strong); }
.ts-doc-sub {
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ts-faint);
  white-space: nowrap;
}
.ts-save-state.is-dirty { color: var(--ts-gold); }
.ts-history { display: flex; gap: 2px; padding: 2px; border-radius: 999px; background: #f2ebdc; }
.ts-history .ts-icon-btn { width: 28px; height: 28px; }
.ts-editor { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) 322px; min-height: 0; }
.ts-canvas-area {
  position: relative;
  min-width: 0;
  overflow: hidden;
  container-type: size;
  background: radial-gradient(130% 100% at 50% 0%, #f5efe3 0%, #e9e0cf 68%, #e2d7c2 100%);
}
.ts-canvas-scroll {
  position: absolute;
  inset: 0;
  padding: 12px;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ts-stage-shell {
  position: relative;
  flex: 0 0 auto;
  width: min(
    calc(100% * var(--ts-zoom, 1)),
    calc((100dvh - 140px) * var(--ts-ar, 0.714) * var(--ts-zoom, 1))
  );
  width: min(
    calc((100cqw - 24px) * var(--ts-zoom, 1)),
    calc((100cqh - 24px) * var(--ts-ar, 0.714) * var(--ts-zoom, 1))
  );
}
.ts-stage-shell > .ts-stage { width: 100%; height: 100%; }
.ts-stage {
  position: relative;
  width: 100%;
  container-type: inline-size;
  overflow: hidden;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 30px 70px -30px rgba(50, 40, 20, 0.55), 0 2px 6px rgba(50, 40, 20, 0.1);
  user-select: none;
  -webkit-user-select: none;
}
.ts-stage.is-preview { pointer-events: none; }
.ts-grain {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.55;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.05'/></svg>");
}
.ts-el { position: absolute; box-sizing: border-box; }
.ts-text { white-space: pre-wrap; overflow-wrap: break-word; word-break: break-word; }
.ts-text-bg {
  position: absolute;
  top: -0.16em;
  right: -0.4em;
  bottom: -0.16em;
  left: -0.4em;
  z-index: -1;
  pointer-events: none;
}
.ts-bg-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
}
.ts-bg-shade { position: absolute; inset: 0; pointer-events: none; }
.ts-stage.can-pan-bg { cursor: grab; }
.ts-stage.can-pan-bg:active { cursor: grabbing; }
.ts-ornament svg { display: block; width: 100%; height: auto; }
.ts-sticker { container-type: inline-size; }
.ts-sticker img { display: block; width: 100%; height: auto; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.ts-sticker-slot { position: absolute; display: flex; align-items: center; overflow: hidden; }
.ts-sticker-slot--text { font-weight: 600; line-height: 1.15; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
.ts-sticker-slot--text.is-empty {
  padding: 0.4cqw;
  border: 1px dashed rgba(110, 120, 112, 0.5);
  border-radius: 3px;
  color: rgba(60, 70, 64, 0.5) !important;
  font-size: max(6px, 2.4cqw) !important;
  text-align: center;
}
.ts-sticker-slot--image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ts-sticker-slot--image:not(.has-image) {
  border: 1px dashed rgba(37, 99, 235, 0.55);
  border-radius: 3px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  cursor: pointer;
}
.ts-slot-empty { display: grid; place-items: center; width: 100%; height: 100%; padding: 0.4cqw; font-size: max(6px, 2.2cqw); font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; text-align: center; }
.ts-slots { margin-top: 12px; }
.ts-slots .ts-subhead { display: block; margin-bottom: 8px; padding-top: 10px; }
.ts-slot { display: grid; gap: 7px; padding: 9px; margin-bottom: 8px; border: 1px solid var(--ts-line); border-radius: 10px; background: #fbfcfb; }
.ts-slot-head { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 10px; }
.ts-slot-head strong { overflow: hidden; color: var(--ts-ink); font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.ts-slot-kind { flex: none; padding: 2px 5px; border-radius: 4px; font-size: 8px; font-weight: 800; letter-spacing: 0.06em; }
.ts-slot-kind--text { background: #e6f7ee; color: #087447; }
.ts-slot-kind--image { background: #e8effd; color: #1d4ed8; }
.ts-slot-row { display: flex; align-items: center; gap: 6px; }
.ts-slot-size { display: flex; align-items: center; gap: 5px; flex: 1; color: #8a949d; font-size: 9px; font-weight: 700; }
.ts-slot-size input { flex: 1; accent-color: var(--ts-accent); }
.ts-slot-row .ts-seg { flex: none; }
.ts-slot-row .ts-seg button { min-width: 22px; padding: 4px 0; }
.ts-slot-lock { display: flex; flex-wrap: wrap; gap: 5px; margin: 1px 0 2px; }
.ts-slot-lock span { padding: 3px 7px; border: 1px solid #e7e2d6; border-radius: 999px; background: #faf7ee; color: #8b7f68; font-size: 8.5px; font-weight: 700; letter-spacing: .03em; }
.ts-slot-color { width: 26px; height: 24px; flex: none; padding: 0; border: 1px solid var(--ts-line); border-radius: 6px; background: #fff; cursor: pointer; }
.ts-slot-image { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.ts-slot-image img { width: 34px; height: 34px; flex: none; border: 1px solid var(--ts-line); border-radius: 6px; object-fit: cover; }
.ts-slot-image-empty { display: grid; place-items: center; width: 34px; height: 34px; flex: none; border: 1px dashed var(--ts-line-strong); border-radius: 6px; color: #a3adb6; font-size: 8px; text-align: center; }
.ts-mini-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 9px; border: 1px solid var(--ts-line-strong); border-radius: 7px; background: #fff; color: #35433b; font-size: 9.5px; font-weight: 700; cursor: pointer; }
.ts-mini-btn:hover { border-color: var(--ts-accent); color: #087447; }
.ts-mini-btn:disabled { opacity: .55; cursor: default; }
.ts-mini-btn--quiet { border-color: transparent; background: transparent; color: #98a1aa; }
.ts-social svg { display: block; width: 100%; height: auto; }
.ts-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5%;
  padding: 0 4%;
  overflow: hidden;
  user-select: none;
}
.ts-footer-item {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35em;
}
.ts-footer-item svg,
.ts-footer-item img {
  width: 1.5em;
  height: 1.5em;
  flex: none;
  display: block;
  object-fit: contain;
}
.ts-footer.is-selected .ts-footer-item { cursor: grab; touch-action: none; }
.ts-footer.is-selected .ts-footer-item:active { cursor: grabbing; }
.ts-footer-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.ts-resize {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--ts-accent);
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(40, 30, 10, 0.35);
  cursor: nwse-resize;
  z-index: 6;
  touch-action: none;
}
.ts-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}
.ts-banner-inner {
  position: absolute;
  inset: 0.34cqw;
  border: 1px solid transparent;
  border-radius: inherit;
  opacity: 0.7;
  pointer-events: none;
}
.ts-banner-ornament {
  position: absolute;
  top: 50%;
  height: 62%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.95;
}
.ts-banner-ornament svg { display: block; height: 100%; width: auto; }
.ts-banner-ornament--left { left: 2.2%; }
.ts-banner-ornament--right { right: 2.2%; transform: translateY(-50%) scaleX(-1); }
.ts-banner-text {
  position: relative;
  max-width: 100%;
  padding: 0 6%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
  outline: none;
}
.ts-banner.has-ornaments .ts-banner-text { padding: 0 15%; }
.ts-banner.is-editing { cursor: text; }
.ts-banner.is-editing .ts-banner-text { text-overflow: clip; }
.ts-banner-glyph {
  display: inline-block;
  width: 18px;
  height: 10px;
  border: 1.4px solid currentColor;
  border-radius: 3px;
}
.ts-layer-icon .ts-banner-glyph { width: 14px; height: 8px; border-width: 1.2px; border-radius: 2px; }
.ts-namecard {
  user-select: none;
  text-align: left;
}
.ts-namecard-sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ts-namecard-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 3cqw;
  padding: 2.6cqw 3cqw;
  box-sizing: border-box;
}
.ts-namecard-logo {
  flex: none;
  display: block;
  border-radius: 50%;
  overflow: hidden;
  background: #ffffff;
  border-style: solid;
  border-color: transparent;
  box-sizing: border-box;
}
.ts-namecard-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
.ts-namecard-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}
.ts-namecard.align-center .ts-namecard-copy { align-items: center; text-align: center; }
.ts-namecard.align-right .ts-namecard-copy { align-items: flex-end; text-align: right; }
.ts-namecard-name {
  max-width: 100%;
  line-height: 1.12;
  letter-spacing: 0.005em;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  outline: none;
}
.ts-namecard-title {
  max-width: 100%;
  margin-top: 0.55cqw;
  line-height: 1.3;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  outline: none;
}
.ts-namecard-socials {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5cqw 1.1cqw;
  max-width: 100%;
  margin-top: 1.05cqw;
}
.ts-namecard.align-center .ts-namecard-socials { justify-content: center; }
.ts-namecard.align-right .ts-namecard-socials { justify-content: flex-end; }
.ts-namecard-social { display: inline-flex; align-items: center; gap: 0.38cqw; min-width: 0; }
.ts-namecard-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 1.18em;
  height: 1.18em;
}
.ts-namecard-icon svg { display: block; width: 100%; height: 100%; }
.ts-namecard-handle { white-space: nowrap; outline: none; }
.ts-namecard-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5cqw;
  min-height: 4.6cqw;
  padding: 0.9cqw 3cqw;
  box-sizing: border-box;
}
.ts-namecard.align-center .ts-namecard-bar { justify-content: center; }
.ts-namecard.align-right .ts-namecard-bar { justify-content: flex-end; }
.ts-namecard-contact {
  display: inline-flex;
  align-items: center;
  gap: 0.8cqw;
  min-width: 0;
  max-width: 100%;
}
.ts-namecard-contact-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.18em;
  height: 1.18em;
}
.ts-namecard-contact-icon svg { display: block; width: 100%; height: 100%; }
.ts-namecard-contact-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  outline: none;
}
.ts-namecard.is-editing { cursor: text; }
.ts-card-glyph {
  display: inline-block;
  width: 17px;
  height: 11px;
  border: 1.4px solid currentColor;
  border-radius: 3px;
  background:
    linear-gradient(currentColor, currentColor) 50% 32% / 52% 1.6px no-repeat,
    linear-gradient(currentColor, currentColor) 50% 68% / 78% 1.6px no-repeat;
}
.ts-card-glyph--contact {
  background:
    linear-gradient(currentColor, currentColor) 50% 30% / 44% 1.4px no-repeat,
    linear-gradient(currentColor, currentColor) 50% calc(100% - 2px) / 100% 2px no-repeat;
}
.ts-layer-icon .ts-card-glyph { width: 14px; height: 9px; border-width: 1.2px; border-radius: 2px; }
.ts-photo { overflow: hidden; }.ts-photo img { width: 100%; height: 100%; display: block; object-fit: cover; transform-origin: center center; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.ts-photo-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9b8f7a;
  background: rgba(255, 255, 255, 0.42);
  border: 1px dashed rgba(120, 105, 80, 0.45);
}
.ts-photo-tint { position: absolute; inset: 0; pointer-events: none; }
.ts-photo.is-drop { outline: 2px dashed var(--ts-accent); outline-offset: 2px; }
.ts-photo-drop {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  border: 1.5px dashed rgba(255, 255, 255, 0.9);
  background: rgba(24, 20, 10, 0.55);
  color: #fff;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  pointer-events: none;
}
.ts-cutout { margin: 0 0 10px; }
.ts-fill-page { width: 100%; justify-content: center; margin: 2px 0 8px; }
.ts-cutout-btn { width: 100%; justify-content: center; margin-bottom: 8px; }
.ts-photo-actions { display: flex; gap: 8px; margin-bottom: 10px; }
.ts-photo-actions .ts-btn { flex: 1; justify-content: center; }
.ts-bg-replace { width: 100%; justify-content: center; margin-bottom: 10px; }
.ts-stage.is-interactive .ts-el { cursor: grab; }
.ts-stage.is-interactive .ts-el:active { cursor: grabbing; }
.ts-stage.is-interactive .ts-el:hover { outline: 1px dashed rgba(110, 100, 70, 0.35); outline-offset: 3px; }
.ts-stage.is-interactive .ts-el.is-selected {
  outline: 2px solid var(--ts-accent);
  outline-offset: 4px;
  box-shadow: 0 0 0 8px rgba(111, 125, 92, 0.18), 0 16px 32px -18px rgba(20, 30, 20, 0.6);
}
.ts-stage.is-interactive .ts-el.is-selected > .ts-resize { width: 18px; height: 18px; box-shadow: 0 0 0 3px rgba(111, 125, 92, 0.25), 0 2px 6px rgba(40, 30, 10, 0.45); }
.ts-stage.is-interactive .ts-text.is-editing {
  outline: 1.5px solid var(--ts-accent);
  outline-offset: 2px;
  background: rgba(255, 255, 255, 0.22);
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
  caret-color: currentColor;
}
.ts-zoom {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 253, 248, 0.9);
  border: 1px solid var(--ts-line);
  border-radius: 999px;
  padding: 4px;
  box-shadow: 0 10px 26px -18px rgba(50, 40, 20, 0.6);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  z-index: 4;
}
.ts-zoom button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  color: var(--ts-soft);
  cursor: pointer;
}
.ts-zoom button:hover { background: #f2ebdc; color: var(--ts-ink); }
.ts-zoom span { font-size: 10px; letter-spacing: 0.04em; min-width: 38px; text-align: center; color: var(--ts-soft); }
.ts-panel-toggle {
  position: absolute;
  right: 14px;
  bottom: 72px;
  z-index: 6;
  border: 1px solid var(--ts-line-strong);
  background: rgba(255, 253, 248, 0.94);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 10px;
  cursor: pointer;
  color: var(--ts-ink);
}
.ts-mobile-only { display: none; }

/* ---------- Inspector ---------- */
.ts-inspector {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--ts-panel);
  border-left: 1px solid var(--ts-line);
}
.ts-inspector-scroll { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
.ts-section { padding: 15px 18px 17px; border-bottom: 1px solid #efe7d8; }
.ts-section h3 {
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--ts-font-ui);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #948b78;
}
.ts-mini-actions { display: flex; gap: 2px; }
.ts-mini-actions .ts-icon-btn { width: 26px; height: 26px; }
.ts-hint { margin: 0; font-size: 11.5px; line-height: 1.65; color: var(--ts-faint); }
.ts-subhead {
  margin: 16px 0 10px;
  padding-top: 13px;
  border-top: 1px solid #efe7d8;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #948b78;
}
.ts-label { font-size: 9px; letter-spacing: 0.11em; text-transform: uppercase; color: #8d8471; }
.ts-field { margin-bottom: 12px; }
.ts-field:last-child { margin-bottom: 0; }
.ts-field--inline { display: flex; align-items: center; gap: 8px; }
.ts-field--inline .ts-label { min-width: 36px; flex: 0 0 auto; }
.ts-select {
  width: 100%;
  border: 1px solid var(--ts-line-strong);
  border-radius: 9px;
  background: #fffefb;
  padding: 8px 10px;
  font-size: 11px;
  outline: none;
  cursor: pointer;
}
.ts-field--inline .ts-select { width: auto; flex: 1; }
.ts-textarea {
  width: 100%;
  resize: vertical;
  min-height: 58px;
  border: 1px solid var(--ts-line-strong);
  border-radius: 10px;
  background: #fffefb;
  padding: 9px 11px;
  font-family: var(--ts-font-display);
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  margin-bottom: 12px;
}
.ts-textarea:focus { border-color: var(--ts-accent); box-shadow: 0 0 0 3px rgba(111, 125, 92, 0.12); }
.ts-seg { display: flex; gap: 2px; background: #f3ecde; border-radius: 9px; padding: 3px; flex: 1; }
.ts-seg button {
  flex: 1;
  border: 0;
  background: transparent;
  border-radius: 7px;
  padding: 6px 4px;
  font-size: 10.5px;
  color: #7c7565;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}
.ts-seg button:hover { color: var(--ts-ink); }
.ts-seg button.is-active { background: #fffdf8; color: var(--ts-ink); box-shadow: 0 1px 3px rgba(60, 50, 30, 0.16); }
.ts-toggle {
  border: 1px solid var(--ts-line-strong);
  background: #fffefb;
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 10px;
  color: #7c7565;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.ts-toggle.is-active { background: var(--ts-ink); color: #f8f3e8; border-color: var(--ts-ink); }
.ts-toggle--italic { font-family: Georgia, serif; font-style: italic; font-size: 12px; }
.ts-spacer { flex: 1; }
.ts-range { margin-bottom: 12px; }
.ts-range:last-child { margin-bottom: 0; }
.ts-range-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ts-value { font-size: 9.5px; color: var(--ts-faint); font-variant-numeric: tabular-nums; }
.ts-range input[type='range'] {
  width: 100%;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: #e6dcc8;
  border-radius: 999px;
  outline: none;
  accent-color: var(--ts-accent);
  cursor: pointer;
}
.ts-range input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fffdf8;
  border: 2px solid var(--ts-accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.ts-range input[type='range']::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fffdf8;
  border: 2px solid var(--ts-accent);
}
.ts-swatches { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
.ts-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
  cursor: pointer;
  position: relative;
  padding: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.ts-swatch:hover { transform: scale(1.1); }
.ts-swatch.is-active { box-shadow: 0 0 0 2px var(--ts-panel), 0 0 0 3.5px var(--ts-ink); }
.ts-swatch--none { background: #fff; overflow: hidden; }
.ts-swatch--none::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-top: 1.5px solid var(--ts-danger);
  transform: rotate(-45deg);
}
.ts-swatch--custom { overflow: hidden; }
.ts-swatch--custom::after {
  content: '+';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.45);
  background: rgba(255, 255, 255, 0.25);
  font-weight: 400;
}
.ts-swatch--custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.ts-swatch--more {
  background: conic-gradient(#f87171, #facc15, #4ade80, #38bdf8, #a78bfa, #f472b6, #f87171);
  overflow: hidden;
}
.ts-swatch--more::after {
  content: '';
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.18);
  inset: 0;
  margin: auto;
}
.ts-swatch--more.is-active { box-shadow: 0 0 0 2px var(--ts-panel), 0 0 0 3.5px var(--ts-ink); }
.ts-color-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 10px;
  background: #faf5ea;
  border: 1px solid #efe7d8;
}
.ts-color-chip {
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.ts-color-chip:hover { transform: scale(1.15); }
.ts-color-chip.is-active { box-shadow: 0 0 0 2px var(--ts-panel), 0 0 0 3.5px var(--ts-ink); }
.ts-palettes { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.ts-palette {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: #faf6ee;
  cursor: pointer;
  text-align: left;
  transition: all 0.16s ease;
  min-width: 0;
}
.ts-palette:hover { border-color: var(--ts-line-strong); }
.ts-palette.is-active { border-color: var(--ts-ink); background: #fffdf8; }
.ts-palette-dots { display: flex; flex: 0 0 auto; }
.ts-palette-dots i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: block;
  margin-left: -3px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.ts-palette-dots i:first-child { margin-left: 0; }
.ts-palette-name {
  font-size: 8.5px;
  letter-spacing: 0.02em;
  color: #7c7565;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ts-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ts-soft);
  cursor: pointer;
  margin: 8px 0 12px;
}
.ts-check input { accent-color: var(--ts-accent); width: 14px; height: 14px; }
.ts-add-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
.ts-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border-radius: 10px;
  border: 1px solid var(--ts-line);
  background: #fffefb;
  font-size: 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #7c7565;
  cursor: pointer;
  transition: all 0.18s ease;
}
.ts-add-btn:hover { border-color: var(--ts-accent); color: var(--ts-ink); transform: translateY(-1px); }
.ts-line-glyph { width: 18px; height: 2px; background: currentColor; }
.ts-circle-glyph { width: 14px; height: 14px; border: 1.4px solid currentColor; border-radius: 50%; }
.ts-arch-glyph { width: 14px; height: 16px; border: 1.4px solid currentColor; border-radius: 50% 50% 0 0 / 55% 55% 0 0; }
.ts-ornament-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
.ts-scanned-head { display: flex; align-items: center; justify-content: space-between; margin: 14px 0 6px; }
.ts-scanned-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.ts-scanned-chip {
  display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0;
  padding: 5px; border: 1px solid var(--ts-line); border-radius: 9px; background: #fffefb;
  color: #7c7565; font-size: 7.5px; letter-spacing: 0.04em; text-transform: uppercase;
  cursor: pointer; transition: all 0.18s ease;
}
.ts-scanned-chip:hover { border-color: var(--ts-accent); color: var(--ts-ink); transform: translateY(-1px); }
.ts-scanned-chip > span:last-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ts-scanned-thumb {
  width: 100%; height: 44px; display: grid; place-items: center; padding: 3px; border-radius: 6px;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #f1eee6 25%, transparent 25%),
    linear-gradient(-45deg, #f1eee6 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f1eee6 75%),
    linear-gradient(-45deg, transparent 75%, #f1eee6 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}
.ts-scanned-thumb img { max-width: 100%; max-height: 38px; object-fit: contain; display: block; }
.ts-template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.ts-template-chip {
  display: flex; flex-direction: column; gap: 5px; min-width: 0;
  padding: 5px; border: 1px solid var(--ts-line); border-radius: 9px; background: #fffefb;
  color: #7c7565; font-size: 7.5px; letter-spacing: 0.04em; text-transform: uppercase;
  cursor: pointer; transition: all 0.18s ease;
}
.ts-template-chip:hover { border-color: var(--ts-accent); color: var(--ts-ink); transform: translateY(-1px); }
.ts-template-chip > span:last-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ts-template-thumb {
  width: 100%; height: 72px; display: grid; place-items: center;
  padding: 3px; border-radius: 6px; background: #fff; overflow: hidden;
}
.ts-template-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }
.ts-logo-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
.ts-logo-chip {
  display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0;
  padding: 4px; border: 1px solid var(--ts-line); border-radius: 9px; background: #fffefb;
  color: #7c7565; font-size: 7px; letter-spacing: 0.03em; text-transform: uppercase;
  cursor: pointer; transition: all 0.18s ease;
}
.ts-logo-chip:hover { border-color: var(--ts-accent); color: var(--ts-ink); transform: translateY(-1px); }
.ts-logo-chip > span:last-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ts-logo-thumb {
  width: 100%; aspect-ratio: 1; display: grid; place-items: center;
  padding: 2px; border-radius: 50%; background: #f4f1e9;
}
.ts-logo-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }
.ts-layer-thumb { width: 14px; height: 14px; display: block; object-fit: contain; }
.ts-footer-presets { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px; }
.ts-footer-chip {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  border: 1px solid var(--ts-line);
  border-radius: 10px;
  background: #fffefb;
  font-size: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7c7565;
  cursor: grab;
  transition: all 0.18s ease;
}
.ts-footer-chip:hover { border-color: var(--ts-accent); color: var(--ts-ink); }
.ts-footer-chip:active { cursor: grabbing; }
.ts-footer-chip-preview {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 20px;
  width: 100%;
  padding: 0 4px;
}
.ts-footer-chip-preview svg { width: 8px; height: 8px; display: block; }
.ts-footer-chip-preview.is-blank { border: 1px solid var(--ts-line); border-radius: 2px; }
.ts-footer-glyph { width: 13px; height: 7px; border-radius: 2px; background: currentColor; display: block; }
.ts-footer-edit-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 2px 0 8px; }
.ts-footer-add { padding: 4px 8px; font-size: 10px; }
.ts-footer-editor { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.ts-footer-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--ts-line);
  border-radius: 10px;
  background: #faf6ee;
}
.ts-footer-edit-top { display: flex; align-items: center; gap: 6px; }
.ts-footer-edit-top .ts-select { flex: 1; padding: 6px 8px; font-size: 10.5px; }
.ts-footer-item-actions { display: flex; gap: 2px; }
.ts-footer-item-actions button {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--ts-line);
  border-radius: 6px;
  background: #fffefb;
  color: #7c7565;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ts-footer-item-actions button:disabled { opacity: 0.35; cursor: default; }
.ts-footer-item-actions button:hover:not(:disabled) { border-color: var(--ts-accent); color: var(--ts-ink); }
.ts-input {
  width: 100%;
  border: 1px solid var(--ts-line-strong);
  border-radius: 8px;
  background: #fffefb;
  padding: 7px 9px;
  font-size: 11px;
  outline: none;
}
.ts-input:focus { border-color: var(--ts-accent); box-shadow: 0 0 0 3px rgba(111, 125, 92, 0.12); }
.ts-footer-img-btn { width: 100%; justify-content: center; font-size: 10px; padding: 6px; }
.ts-ornament-chip {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid transparent;
  background: #faf6ee;
  padding: 6px;
  cursor: pointer;
  color: #8b816c;
  transition: all 0.18s ease;
}
.ts-ornament-chip:hover { background: #fffdf8; border-color: var(--ts-line-strong); color: var(--ts-gold); }
.ts-ornament-chip svg { width: 100%; height: 100%; }
.ts-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ts-faint);
  letter-spacing: 0;
  text-transform: none;
  font-size: 9.5px;
  font-weight: 400;
}
.ts-layers { display: flex; flex-direction: column; gap: 2px; }
.ts-layer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 10.5px;
  color: var(--ts-soft);
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
  outline: none;
}
.ts-layer:hover, .ts-layer:focus-visible { background: #f8f2e6; color: var(--ts-ink); }
.ts-layer.is-active { background: #f1ead9; color: var(--ts-ink); }
.ts-layer-icon { width: 16px; display: grid; place-items: center; color: #a89c82; flex: 0 0 auto; }
.ts-layer-icon .ts-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.ts-layer-icon .ts-square { width: 8px; height: 8px; border: 1.2px solid currentColor; }
.ts-layer-name { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ts-layer-actions { display: flex; gap: 1px; opacity: 0.55; transition: opacity 0.15s ease; }
.ts-layer:hover .ts-layer-actions, .ts-layer.is-active .ts-layer-actions { opacity: 1; }
.ts-layer-actions button {
  width: 20px;
  height: 20px;
  border: 0;
  background: transparent;
  border-radius: 4px;
  display: grid;
  place-items: center;
  color: var(--ts-faint);
  cursor: pointer;
  padding: 0;
}
.ts-layer-actions button:hover { background: #e9e0cc; color: var(--ts-ink); }
.ts-layer-actions button.ts-layer-delete:hover { background: #fde8e4; color: var(--ts-danger); }
.ts-layer-tools { display: flex; gap: 6px; margin-top: 8px; }
.ts-layer-tools button {
  flex: 1;
  padding: 6px 8px;
  border-radius: 7px;
  border: 1px solid #e9e0cc;
  background: #fffdf8;
  color: var(--ts-soft);
  font: inherit;
  font-size: 9.5px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}
.ts-layer-tools button:hover:not(:disabled) { background: #f1ead9; color: var(--ts-ink); }
.ts-layer-tools button:disabled { opacity: 0.45; cursor: default; }
.ts-inspector-foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-top: 1px solid var(--ts-line);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--ts-faint);
  background: #fbf6ec;
}
.ts-toast {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--ts-ink);
  color: #f9f4e8;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.02em;
  box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.6);
  z-index: 30;
  animation: ts-toast 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@media (max-width: 1120px) {
  .ts-editor { grid-template-columns: minmax(0, 1fr) 292px; }
  .ts-top-note { display: none; }
  .ts-grid { columns: 3 210px; }
}
@media (max-width: 900px) {
  .ts-backdrop { padding: 0; }
  .ts-shell { width: 100vw; height: 100dvh; border-radius: 0; }
  .ts-topbar { height: 60px; padding: 0 12px; gap: 10px; }
  .ts-brand { min-width: 0; }
  .ts-brand-text { display: none; }
  .ts-mark { width: 30px; height: 30px; font-size: 15px; }
  .ts-tab { padding: 7px 10px; font-size: 10.5px; }
  .ts-tabs { margin-left: 0; }
  .ts-gallery { padding: 22px 16px 40px; }
  .ts-gallery-head { flex-direction: column; align-items: stretch; gap: 14px; }
  .ts-gallery-head h2 { font-size: 30px; }
  .ts-search input { width: 100%; }
  .ts-grid { columns: 2 150px; column-gap: 14px; }
  .ts-card { margin-bottom: 18px; }
  .ts-card-hover { display: none; }
  .ts-card-meta h4 { font-size: 13.5px; }
  .ts-gallery-foot { flex-direction: column; gap: 6px; }
  .ts-editor { grid-template-columns: 1fr; position: relative; }
  .ts-inspector {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 52%;
    max-height: 460px;
    border-left: 0;
    border-top: 1px solid var(--ts-line);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -24px 60px -24px rgba(40, 30, 15, 0.45);
    z-index: 8;
    transition: transform 0.3s ease;
  }
  .ts-editor-root.panel-hidden .ts-inspector { transform: translateY(110%); }
  .ts-zoom { bottom: 14px; right: 12px; }
  .ts-mobile-only { display: grid; }
  .ts-download span { display: none; }
  .ts-doc-sub { display: none; }
  .ts-doc-meta { flex: 1 1 auto; overflow: hidden; }
  .ts-doc-name { width: 100%; font-size: 15px; text-overflow: ellipsis; }
  .ts-back span { display: none; }
  .ts-top-actions { gap: 4px; }
  .ts-editor-bar { gap: 8px; }
  .ts-toolbar-rail { width: 94px; }
  .ts-tool-row { grid-template-columns: repeat(3, 28px); }
  .ts-tool-btn { width: 28px; height: 28px; }
  .ts-btn { padding: 8px 12px; }
  .ts-menu { grid-template-columns: 1fr; width: min(560px, 92vw); }
  .ts-menu-feature { display: none; }
  .ts-panel-toggle { display: block; }
}
@media (max-width: 760px) {
  .ts-menu { position: fixed; top: 68px; left: 12px; right: 12px; width: auto; max-height: 72vh; overflow: auto; transform: none; animation: ts-fade 0.18s ease both; }
  .ts-menu-cats { grid-template-columns: 1fr 1fr; }
  .ts-toolbar-rail { width: 78px; }
  .ts-toolbar { padding: 5px 4px; }
  .ts-tool-group { padding: 5px 0; }
  .ts-tool-label { display: none; }
  .ts-tool-row { grid-template-columns: repeat(2, 28px); }
  .ts-tool-btn { width: 28px; height: 28px; }
  .ts-tool-options-stack { left: calc(100% + 6px); max-width: calc(100vw - 108px); }
  .ts-tool-option input[type="range"] { width: 70px; }
  .ts-tool-tip { display: none; }
}
@media (max-width: 560px) {
  .ts-editor-bar .ts-bar-divider { display: none; }
  .ts-editor-bar .ts-btn-primary { padding: 8px 10px; }
  .ts-editor-bar .ts-btn-primary span { display: none; }
  .ts-doc-name { font-size: 14px; }
  .ts-tab span { display: none; }
  .ts-tab svg { opacity: 0.8; }
  .ts-tab { gap: 0; }
  .ts-tab-badge { display: none; }
  .ts-grid { columns: 2 130px; column-gap: 12px; }
  .ts-card-frame { padding: 9px; }
  .ts-card-badge { top: 14px; left: 14px; font-size: 7px; }
  .ts-card-hover, .ts-card-ratio { display: none; }
  .ts-card-meta h4 { font-size: 12.5px; }
  .ts-card-meta p { font-size: 8px; }
  .ts-gallery-head h2 { font-size: 27px; }
  .ts-chips { gap: 5px; }
  .ts-chip { padding: 7px 11px; font-size: 10.5px; }
  .ts-canvas-scroll { padding: 10px; }
  .ts-inspector { height: 56%; }
  .ts-ornament-grid { grid-template-columns: repeat(5, 1fr); }
  .ts-palettes { grid-template-columns: 1fr; }
  .ts-langbar { padding: 8px 10px; gap: 8px; }
  .ts-langbar-note { display: none; }
  .ts-langchip { padding: 4px 8px; font-size: 10px; }
  .ts-section-head h3 { font-size: 19px; }
  .ts-card-lang { top: 14px; right: 14px; padding: 3px 6px; font-size: 7px; }
}
`
