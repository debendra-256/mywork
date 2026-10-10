let injected = false;

const CSS = `
.cj-page{min-height:calc(100vh - 74px);background:#f5f6f8;color:#1c2025;box-sizing:border-box}
.cj-page *{box-sizing:border-box}
.cj-body{display:flex;gap:16px;padding:16px 22px;max-width:1500px;margin:0 auto;align-items:flex-start}
.cj-side{width:320px;flex-shrink:0;background:#fff;border:1px solid #e8eaed;border-radius:16px;box-shadow:0 8px 25px #17251c08;display:flex;flex-direction:column;max-height:calc(100vh - 106px);position:sticky;top:90px}
.cj-sidehead{padding:12px 16px;border-bottom:1px solid #eef1ee;font-size:13px;font-weight:700;color:#2e4435}
.cj-sidebody{overflow-y:auto;padding:14px 16px 18px;display:flex;flex-direction:column;gap:16px}
.cj-sidebody::-webkit-scrollbar{width:8px}
.cj-sidebody::-webkit-scrollbar-thumb{background:#d9e2da;border-radius:4px}
.cj-h4{margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#87909a}
.cj-stage{flex:1;background:#fff;border:1px solid #e8eaed;border-radius:16px;box-shadow:0 8px 25px #17251c08;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:calc(100vh - 106px)}
.cj-canvasWrap{position:relative;max-width:100%;max-height:calc(100vh - 168px);display:flex;border-radius:8px}
.cj-canvas{display:block;max-width:100%;max-height:calc(100vh - 168px);width:auto;height:auto;border-radius:8px;box-shadow:0 6px 28px rgba(15,23,42,.10);background:#fff}
.cj-overlay{position:absolute;inset:0}
.cj-slotcell{position:absolute;border:2px solid transparent;border-radius:10px;transition:border-color .12s;cursor:pointer}
.cj-slotcell:hover{border-color:rgba(10,159,98,.35)}
.cj-slotcell.sel{border-color:#0a9f62;box-shadow:0 0 0 3px rgba(10,159,98,.18)}
.cj-slotadd{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#94a3a0;font-size:26px;border-radius:10px}
.cj-slotadd:hover{color:#07864f;background:rgba(7,134,79,.06)}
.cj-swapbtn{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:8px;border:1px solid rgba(15,23,42,.15);background:rgba(255,255,255,.92);color:#45534a;cursor:pointer;font-size:13px;line-height:1;box-shadow:0 1px 4px rgba(15,23,42,.18)}
.cj-swapbtn:hover{background:#fff;color:#07864f;border-color:#7fcfa4}
.cj-slotnum{position:absolute;bottom:6px;left:8px;font-size:10px;font-weight:700;color:rgba(255,255,255,.85);background:rgba(15,23,42,.35);padding:1px 6px;border-radius:5px;pointer-events:none}
.cj-tplgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.cj-tplthumb{position:relative;aspect-ratio:1;width:100%;display:block;background:#f4f6f4;border:1.5px solid #e8eaed;border-radius:8px;cursor:pointer;padding:0;overflow:hidden;transition:.12s}
.cj-tplthumb:hover{border-color:#7fcfa4}
.cj-tplthumb.on{border-color:#0a9f62;box-shadow:0 0 0 2px rgba(10,159,98,.2)}
.cj-tplcell{position:absolute;background:#cdd7d1;border-radius:2px}
.cj-tplthumb.on .cj-tplcell{background:#4bbd85}
.cj-tplname{display:block;font-size:10px;color:#77847a;text-align:center;margin-top:3px;height:13px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cj-chiprow{display:flex;flex-wrap:wrap;gap:6px}
.cj-chip{background:#fff;border:1px solid #dee7e1;color:#536057;padding:5px 10px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;transition:.12s}
.cj-chip:hover{border-color:#7fcfa4}
.cj-chip.on{background:#07864f;border-color:#07864f;color:#fff}
.cj-swrow{display:flex;gap:8px;flex-wrap:wrap}
.cj-sw{width:28px;height:28px;border-radius:8px;border:1.5px solid #dee7e1;cursor:pointer;padding:0;transition:.12s}
.cj-sw.on{border-color:#0a9f62;box-shadow:0 0 0 2px rgba(10,159,98,.25)}
.cj-btn{background:#fff;border:1px solid #dce7df;color:#45534a;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:.15s}
.cj-btn:hover{border-color:#7fcfa4;color:#087447}
.cj-btn.primary{background:#07864f;border-color:#07864f;color:#fff}
.cj-btn.primary:hover{background:#087447}
.cj-btn.wide{width:100%}
.cj-btn:disabled{opacity:.5;cursor:not-allowed}
.cj-row{display:flex;gap:8px;flex-wrap:wrap}
.cj-sliderRow{display:flex;align-items:center;gap:10px;font-size:12px;color:#536057;margin-top:6px}
.cj-sliderRow label{width:52px;flex-shrink:0}
.cj-sliderRow input[type=range]{flex:1;accent-color:#07864f}
.cj-sliderRow .cj-val{width:34px;text-align:right;font-variant-numeric:tabular-nums}
.cj-note{font-size:11px;color:#7d8880;line-height:1.5;margin:6px 0 0}
.cj-fileinfo{font-size:12px;color:#536057;background:#f8faf8;border:1px solid #e8eaed;border-radius:8px;padding:7px 10px;word-break:break-all;max-height:64px;overflow-y:auto}
.cj-err{background:#fdecec;border:1px solid #f5c2c2;color:#b42323;font-size:12px;padding:8px 10px;border-radius:8px}
.cj-result{width:100%;border-radius:8px;border:1px solid #e8eaed;margin-top:8px}
.cj-empty{display:flex;flex-direction:column;align-items:center;gap:12px;color:#7d8880;text-align:center;padding:40px}
.cj-empty h3{margin:0;color:#25332b;font-size:17px}
.cj-drop{border:2px dashed #cdead9;border-radius:12px}
.cj-sep{border:none;border-top:1px solid #eef1ee;margin:2px 0}
.cj-sizetag{display:inline-flex;align-items:center;gap:6px;background:#edf8f1;border:1px solid #cdead9;color:#087447;font-size:12px;font-weight:700;padding:5px 10px;border-radius:8px;margin-top:8px;font-variant-numeric:tabular-nums}
.cj-job{border:1px solid #e8eaed;border-radius:10px;padding:10px;margin-top:8px;background:#fbfdfb}
.cj-jobtop{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:12px;font-weight:700;color:#25332b}
.cj-jobmeta{font-size:11px;color:#7d8880;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.cj-bar{height:6px;background:#e4ece6;border-radius:999px;margin-top:8px;overflow:hidden}
.cj-barfill{height:100%;background:linear-gradient(90deg,#27c47c,#0a9f62);border-radius:999px;transition:width .2s linear}
.cj-pct{font-size:13px;font-weight:700;color:#087447;font-variant-numeric:tabular-nums;white-space:nowrap}
.cj-blocker{position:fixed;inset:0;z-index:1000;background:rgba(23,37,28,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}
.cj-blockcard{background:#fff;border-radius:16px;box-shadow:0 18px 60px rgba(15,23,42,.35);padding:24px;width:min(420px,92vw)}
.cj-blocktitle{margin:0;font-size:15px;font-weight:700;color:#1c2025}
.cj-blockmeta{font-size:12px;color:#7d8880;margin:6px 0 10px}
.cj-blockrow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
.cj-jobacts{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.cj-jobacts .cj-btn{padding:5px 10px;font-size:12px}
.cj-jobacts a.cj-btn{text-decoration:none;display:inline-flex;align-items:center}
.cj-jobvid{width:100%;border-radius:8px;border:1px solid #e8eaed;margin-top:8px;max-height:220px}
.cj-fitrow{display:flex;gap:6px;margin-top:8px}
.cj-fitrow .cj-chip{flex:1;text-align:center}
.cj-nudgerow{display:flex;gap:6px;margin-top:8px}
.cj-nudgerow .cj-btn{flex:1;padding:6px 0;text-align:center;font-size:13px}
.cj-badge{display:inline-block;background:#e0f4e6;border:1px solid #bfe4c8;color:#147a3e;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
.cj-tplthumb.premium{border-color:#e6d3ac}
.cj-tplthumb.premium:hover{border-color:#d9a441}
.cj-tplthumb.premium.on{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.22)}
.pj-autumn{background:linear-gradient(160deg,#fdf3e3,#f4d9b4)}
.pj-christmas{background:linear-gradient(160deg,#143528,#0d2018)}
.pj-fathers{background:linear-gradient(160deg,#e9edf4,#d3dbea)}
.pj-autumn .cj-tplcell{background:#e0a35a}
.pj-christmas .cj-tplcell{background:#3f7d5d}
.pj-fathers .cj-tplcell{background:#7d8cab}
.cj-tplthumb.on.pj-autumn .cj-tplcell{background:#d9731f}
.cj-tplthumb.on.pj-christmas .cj-tplcell{background:#4caf7d}
.cj-tplthumb.on.pj-fathers .cj-tplcell{background:#5b7bc0}
@media (max-width:1150px){.cj-body{flex-direction:column}.cj-side{width:100%;max-height:none;position:static}.cj-stage{min-height:420px;width:100%}}
`;

export function injectCollageStyles() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-collagestudio', '');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}
