let injected = false;

const CSS = `
.sc-page{min-height:calc(100vh - 74px);background:#f5f6f8;color:#1c2025;box-sizing:border-box}
.sc-page *{box-sizing:border-box}
.sc-body{display:flex;gap:16px;padding:16px 22px;max-width:1520px;margin:0 auto;align-items:flex-start}
.sc-side{width:326px;flex-shrink:0;background:#fff;border:1px solid #e8eaed;border-radius:16px;box-shadow:0 8px 25px #17251c08;display:flex;flex-direction:column;max-height:calc(100vh - 106px);position:sticky;top:90px}
.sc-sidehead{padding:12px 16px;border-bottom:1px solid #eef1ee;font-size:13px;font-weight:700;color:#2e4435;display:flex;align-items:center;gap:7px}
.sc-sidebody{overflow-y:auto;padding:14px 16px 18px;display:flex;flex-direction:column;gap:16px}
.sc-sidebody::-webkit-scrollbar{width:8px}
.sc-sidebody::-webkit-scrollbar-thumb{background:#d9e2da;border-radius:4px}
.sc-h4{margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#87909a}
.sc-note{margin:6px 0 0;font-size:11.5px;line-height:1.5;color:#87909a}
.sc-stage{flex:1;min-width:0;background:#fff;border:1px solid #e8eaed;border-radius:16px;box-shadow:0 8px 25px #17251c08;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:calc(100vh - 106px)}
.sc-input,.sc-select{width:100%;font:inherit;font-size:13px;color:#1c2025;background:#fbfcfd;border:1px solid #dfe3e8;border-radius:9px;padding:8px 10px}
.sc-input:focus,.sc-select:focus,.sc-textarea:focus{outline:none;border-color:#07864f;background:#fff}
.sc-textarea{width:100%;font:inherit;font-size:13px;line-height:1.5;color:#1c2025;background:#fbfcfd;border:1px solid #dfe3e8;border-radius:9px;padding:8px 10px;min-height:78px;resize:vertical}
.sc-label{display:block;font-size:11px;font-weight:700;color:#87909a;margin:0 0 5px;text-transform:uppercase;letter-spacing:.06em}
.sc-stack{display:flex;flex-direction:column;gap:8px}
.sc-row{display:flex;gap:7px;align-items:center}
.sc-chiprow{display:flex;flex-wrap:wrap;gap:6px}
.sc-chip{font:inherit;font-size:12px;font-weight:600;color:#41504a;background:#fff;border:1px solid #dfe3e8;border-radius:999px;padding:6px 11px;cursor:pointer;transition:.15s}
.sc-chip:hover{border-color:#b9c6bd}
.sc-chip.on{background:#07864f;border-color:#07864f;color:#fff}
.sc-btn{font:inherit;font-size:12.5px;font-weight:600;color:#2e4435;background:#fff;border:1px solid #dfe3e8;border-radius:9px;padding:8px 11px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:.15s}
.sc-btn:hover{border-color:#c3ccc5;background:#f7f9f7}
.sc-btn:disabled{opacity:.5;cursor:not-allowed}
.sc-btn.primary{background:#07864f;border-color:#07864f;color:#fff}
.sc-btn.primary:hover{background:#087447;border-color:#08744f}
.sc-btn.block{width:100%}
.sc-swatch{width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #dfe3e8;cursor:pointer;padding:0}
.sc-swatch.on{box-shadow:0 0 0 2px #07864f}
.sc-err{margin:8px 0 0;font-size:12px;line-height:1.5;color:#b4232a;background:#fdf1f1;border:1px solid #f3d3d5;border-radius:9px;padding:8px 10px}
.sc-ok{margin:8px 0 0;font-size:12px;line-height:1.5;color:#1f6a45;background:#f0f8f3;border:1px solid #cfe8da;border-radius:9px;padding:8px 10px}
.sc-videoMeta{display:flex;gap:9px;align-items:center;margin-top:9px;background:#f7f9f8;border:1px solid #e8ede9;border-radius:11px;padding:8px}
.sc-videoMeta img{width:74px;height:42px;object-fit:cover;border-radius:6px;background:#dfe3e8;flex-shrink:0}
.sc-videoMeta div{min-width:0}
.sc-videoMeta strong{display:block;font-size:12px;line-height:1.35;font-weight:700;color:#2e4435;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-videoMeta span{font-size:11px;color:#87909a}
.sc-thumbfile{width:46px;height:42px;border-radius:6px;background:#e8ede9;color:#87909a;font-size:9px;font-weight:800;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc-phone{position:relative;container-type:inline-size;width:min(430px,42vw,calc((100vh - 290px) * 0.5625));aspect-ratio:9 / 16;background:#0b0f14;border-radius:22px;overflow:hidden;box-shadow:0 18px 40px #17251c2e;border:1px solid #dfe3e8}
.sc-phone.is-live{position:fixed;inset:0;z-index:80;margin:auto;width:min(100vw,calc(100vh * 0.5625));height:auto;border:0;border-radius:0;box-shadow:none;background:#000}
.sc-phone.is-live .sc-ytLayer{pointer-events:none}
.sc-phone.is-quiet .sc-ytLayer{pointer-events:none}
.sc-wash{position:fixed;inset:0;z-index:79;background:#000}
.sc-fullClose{position:fixed;top:14px;right:16px;z-index:82;display:flex;align-items:center;gap:6px;font:inherit;font-size:12px;font-weight:700;color:#fff;background:#0b0f14b8;border:1px solid #ffffff2e;border-radius:999px;padding:7px 13px;cursor:pointer}
.sc-fullClose:hover{background:#07864f;border-color:#07864f}
.sc-fullBar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:82;display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0b0f14d9;border:1px solid #ffffff26;border-radius:999px;box-shadow:0 12px 30px #0006}
.sc-fullBar .sc-btn{background:#ffffff14;color:#fff;border-color:#ffffff2e}
.sc-fullBar .sc-btn.primary{background:#07864f;border-color:#07864f;color:#fff}
.sc-fullBar .sc-time{color:#c9d3cd;padding:0 8px 0 4px}
.sc-playerBox{position:absolute;inset:0;overflow:hidden;background:#0b0f14}
.sc-ytLayer{position:absolute;overflow:hidden}
.sc-ytHost,.sc-ytHost iframe{width:100%;height:100%;border:0;display:block}
.sc-blurBg,.sc-blurVid{position:absolute;inset:-12%;width:124%;height:124%;object-fit:cover;background-size:cover;background-position:center;filter:blur(26px) saturate(1.1);opacity:.8}
.sc-srcVid{position:absolute;width:100%;height:100%;object-fit:cover;background:#0b0f14}
.sc-hook{position:absolute;left:7%;right:7%;top:4.5%;color:#fff;font-size:6.8cqw;font-weight:800;text-align:center;letter-spacing:.01em;line-height:1.2;text-transform:uppercase;text-shadow:0 .3em .8em #000b;pointer-events:none;overflow-wrap:break-word}
.sc-cap{position:absolute;left:8%;right:8%;color:#fff;font-size:8.2cqw;font-weight:800;text-align:center;line-height:1.18;text-transform:uppercase;background:#0b0f14cc;border:.35cqw solid #ffffff28;border-radius:2.4cqw;padding:1.6cqw 2.8cqw;pointer-events:none;text-shadow:0 .1em .4em #000a;overflow-wrap:break-word;animation:sc-pop .16s ease-out}
@keyframes sc-pop{from{opacity:.4;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.sc-cover{position:absolute;left:0;right:0;bottom:0;height:21%;pointer-events:none;backdrop-filter:blur(2.6cqw) saturate(.92);-webkit-backdrop-filter:blur(2.6cqw) saturate(.92);-webkit-mask-image:linear-gradient(#00000000,#000 26%);mask-image:linear-gradient(#00000000,#000 26%);background:linear-gradient(#0b0f1400,#0b0f1430 42%,#0b0f146b)}
.sc-progress{position:absolute;left:0;right:0;bottom:0;height:.35cqw;min-height:3px;background:#ffffff38;pointer-events:none}
.sc-progress i{display:block;height:100%;background:var(--sc-accent,#07864f);transition:width .1s linear}
.sc-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;color:#c3ccd6;font-size:12.5px;text-align:center;padding:24px}
.sc-transport{display:flex;flex-wrap:wrap;gap:7px;align-items:center;justify-content:center}
.sc-timelineWrap{width:100%;max-width:540px}
.sc-timeline{position:relative;height:34px;background:#f2f5f3;border:1px solid #e2e7e3;border-radius:9px;cursor:ew-resize;overflow:hidden}
.sc-tlClip{position:absolute;top:5px;bottom:5px;background:#cfe8da;border-radius:4px;pointer-events:none}
.sc-tlClip.on{background:#07864f}
.sc-tlHead{position:absolute;top:0;bottom:0;width:2px;background:#1c2025;pointer-events:none}
.sc-tlScale{display:flex;justify-content:space-between;gap:8px;margin-top:5px;font-size:10.5px;color:#87909a}
.sc-time{font-variant-numeric:tabular-nums;font-size:12px;font-weight:700;color:#41504a;background:#f2f5f3;border:1px solid #e2e7e3;border-radius:8px;padding:6px 9px}
.sc-clips{display:flex;flex-direction:column;gap:7px}
.sc-clip{display:flex;gap:6px;align-items:stretch;text-align:left;background:#fff;border:1px solid #dfe3e8;border-radius:11px;padding:7px 7px 7px 9px;transition:.15s}
.sc-clip:hover{border-color:#b9c6bd}
.sc-clip.on{border-color:#07864f;background:#f2faf6;box-shadow:0 0 0 1px #07864f inset}
.sc-clipMain{flex:1;min-width:0;display:flex;gap:9px;align-items:center;text-align:left;font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.sc-thumb{position:relative;width:46px;height:82px;border-radius:7px;overflow:hidden;background:#dfe3e8 url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="46" height="82"><rect width="46" height="82" fill="%23dfe3e8"/></svg>') center/cover;flex-shrink:0}
.sc-thumb i{position:absolute;inset:0;background:#0b0f145c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-style:normal}
.sc-clipMain div{min-width:0}
.sc-clip strong{display:block;font-size:12px;font-weight:700;color:#2e4435}
.sc-clipMain span{font-size:11px;color:#87909a}
.sc-clipDl{flex-shrink:0;width:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:inherit;font-size:9.5px;font-weight:700;letter-spacing:.01em;color:#07864f;background:#f3faf6;border:1px solid #d5e7dc;border-radius:9px;cursor:pointer;transition:.15s}
.sc-clipDl:hover:not(:disabled){background:#07864f;color:#fff;border-color:#07864f}
.sc-clipDl:disabled{opacity:.45;cursor:not-allowed}
.sc-jobs{display:flex;flex-direction:column;gap:8px}
.sc-job{border:1px solid #e6eae7;border-radius:11px;padding:8px 10px;background:#fafbfa}
.sc-jobHead{display:flex;justify-content:space-between;gap:8px;align-items:center}
.sc-jobHead b{font-size:12px;color:#2e4435}
.sc-jobBar{height:5px;border-radius:3px;background:#e6eae7;overflow:hidden;margin:7px 0}
.sc-jobBar i{display:block;height:100%;background:#07864f}
.sc-jobFoot{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;color:#87909a}
.sc-job a{font-size:11.5px;font-weight:700;color:#07864f;text-decoration:none}
.sc-job.err{border-color:#f3d3d5;background:#fdf1f1}
.sc-clipList{max-height:calc(100vh - 300px);overflow-y:auto;padding-right:2px}
.sc-clipList::-webkit-scrollbar{width:8px}
.sc-clipList::-webkit-scrollbar-thumb{background:#d9e2da;border-radius:4px}
@media (max-width:1180px){.sc-body{flex-wrap:wrap}.sc-side,.sc-right{width:calc(50% - 8px);position:static;max-height:none}.sc-stage{width:100%;order:3;min-height:0}}
@media (max-width:760px){.sc-body{padding:12px}.sc-side,.sc-right{width:100%}.sc-phone{width:min(300px,72vw,calc((100vh - 260px) * 0.5625))}}
`;

export function injectShortsStyles() {
  if (injected || typeof document === 'undefined') return;
  if (document.querySelector('style[data-shortscreator]')) { injected = true; return; }
  const el = document.createElement('style');
  el.setAttribute('data-shortscreator', '');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}
