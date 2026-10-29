import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './VideoDownloader.css';
import {
  THUMBNAILS,
  classify,
  createDownload,
  fetchThumbnail,
  fetchYouTubeMeta,
  formatBytes,
  formatClock,
  probeFile,
  safeName,
  saveBlob,
} from './VideoDownloader.js';

let seq = 0;
const nextId = () => `vd${(seq += 1)}`;

function Section({ title, children }) {
  return (
    <div className="vd-card">
      <h4 className="vd-kicker">{title}</h4>
      {children}
    </div>
  );
}

export default function VideoDownloader() {
  const [tab, setTab] = useState('file');

  // --- direct link state ---
  const [link, setLink] = useState('');
  const [checking, setChecking] = useState(false);
  const [facts, setFacts] = useState(null);
  const [linkError, setLinkError] = useState('');

  // --- youtube state ---
  const [ytLink, setYtLink] = useState('');
  const [ytBusy, setYtBusy] = useState(false);
  const [yt, setYt] = useState(null);
  const [ytError, setYtError] = useState('');
  const [ytNote, setYtNote] = useState('');
  const [thumbBusy, setThumbBusy] = useState('');

  // --- queue ---
  const [items, setItems] = useState([]);
  const controllers = useRef(new Map());
  useEffect(() => () => { controllers.current.forEach((c) => c.cancel()); }, []);

  const patch = useCallback((id, part) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...(typeof part === 'function' ? part(it) : part) } : it)));
  }, []);

  const enqueue = useCallback(async (url, known) => {
    const info = known || null;
    const id = nextId();
    const name = info?.name || safeName(decodeURIComponent((url.split('?')[0].split('/').pop() || 'video')));
    const item = {
      id,
      url,
      name,
      type: info?.type || '',
      total: info?.size ?? null,
      received: 0,
      percent: null,
      speed: 0,
      state: 'queued',
      message: '',
      blob: null,
    };
    setItems((list) => [item, ...list]);

    const controller = createDownload(url, {
      onProgress: (p) => patch(id, { received: p.received, total: p.total ?? item.total, percent: p.percent, speed: p.speed, state: p.state }),
      onState: (s) => patch(id, { state: s }),
      onDone: ({ blob, size, total }) => {
        patch(id, { blob, state: 'done', percent: 1, total: total ?? size, received: size, message: '' });
        void saveBlob(blob, name).then((how) => {
          if (how === 'dismissed') patch(id, { message: 'Picker cancelled — use Save again below.' });
        });
        controllers.current.delete(id);
      },
      onError: (reason) => {
        patch(id, { state: 'error', message: reason.message });
        controllers.current.delete(id);
      },
      resumable: info?.resumable === true,
    });
    controllers.current.set(id, controller);
    controller.start();
  }, [patch]);

  const checkLink = useCallback(async () => {
    setLinkError('');
    setFacts(null);
    const value = link.trim();
    if (!value) { setLinkError('Paste a link first.'); return; }
    if (classify(value).kind === 'youtube') {
      setLinkError('That is a YouTube link — use the YouTube tab. It gives the record and thumbnail, not the footage.');
      return;
    }
    setChecking(true);
    try {
      const info = await probeFile(value);
      setFacts(info);
    } catch (reason) {
      setLinkError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setChecking(false);
    }
  }, [link]);

  const lookUp = useCallback(async () => {
    setYtError('');
    setYtNote('');
    setYt(null);
    const value = ytLink.trim();
    if (!value) { setYtError('Paste a YouTube link first.'); return; }
    const kind = classify(value);
    if (kind.kind !== 'youtube') { setYtError('That link does not point at a YouTube video.'); return; }
    setYtBusy(true);
    try {
      setYt(await fetchYouTubeMeta(value));
    } catch (reason) {
      setYtError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setYtBusy(false);
    }
  }, [ytLink]);

  const grabThumb = useCallback(async (rendition) => {
    if (!yt) return;
    setThumbBusy(rendition.id);
    setYtError('');
    try {
      const got = await fetchThumbnail(yt.videoId, rendition.id);
      if (!got) { setYtNote(`YouTube has no ${rendition.label} rendition for this video — try another size.`); return; }
      const how = await saveBlob(got.blob, got.name);
      setYtNote(how === 'dismissed' ? 'Save picker cancelled.' : `${rendition.label} thumbnail saved (${formatBytes(got.size)}).`);
    } catch (reason) {
      setYtError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setThumbBusy('');
    }
  }, [yt]);

  const copy = useCallback(async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      setYtNote(done);
    } catch {
      setYtNote('The browser blocked the clipboard. Select the link and copy it by hand.');
    }
  }, []);

  return (
    <div className="vd">
      <div className="vd-main">
        <Section title="Download">
          <div className="vd-tabs">
            <button type="button" className={`vd-tab${tab === 'file' ? ' on' : ''}`} onClick={() => setTab('file')}>Direct file link</button>
            <button type="button" className={`vd-tab${tab === 'youtube' ? ' on' : ''}`} onClick={() => setTab('youtube')}>YouTube link</button>
          </div>

          {tab === 'file' ? (
            <>
              <div className="vd-row">
                <input
                  className="vd-input"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void checkLink(); }}
                  placeholder="https://example.com/clips/my-video.mp4"
                  spellCheck={false}
                />
                <button type="button" className="vd-btn" onClick={() => void checkLink()} disabled={checking}>
                  {checking ? 'Checking…' : 'Check link'}
                </button>
                <button type="button" className="vd-btn primary" onClick={() => { void enqueue(facts?.url || link.trim(), facts); setTab('file'); }} disabled={!link.trim()}>
                  Download
                </button>
              </div>
              {facts && (
                <>
                  <div className="vd-facts">
                    <div className="vd-fact"><span>File</span><b>{facts.name}</b></div>
                    <div className="vd-fact"><span>Size</span><b>{facts.knownSize ? formatBytes(facts.size) : 'Unknown'}</b></div>
                    <div className="vd-fact"><span>Type</span><b>{facts.type || 'unknown'}</b></div>
                    <div className="vd-fact"><span>Resume</span><b>{facts.resumable ? 'Supported' : 'Restart only'}</b></div>
                  </div>
                  <p className="vd-note">The host answered, so this link will download. Press <strong>Download</strong> to save it.</p>
                </>
              )}
              {linkError && <p className="vd-err" role="alert">{linkError}</p>}
              <p className="vd-note">
                Works with any file URL whose host allows cross-origin reads — your own uploads, a CDN
                export, a screen-recording link. Progress, pause and resume are real: a paused download
                continues from the byte it stopped on when the host supports ranges.
              </p>
            </>
          ) : (
            <>
              <div className="vd-row">
                <input
                  className="vd-input"
                  value={ytLink}
                  onChange={(e) => setYtLink(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void lookUp(); }}
                  placeholder="https://www.youtube.com/watch?v=…"
                  spellCheck={false}
                />
                <button type="button" className="vd-btn primary" onClick={() => void lookUp()} disabled={ytBusy || !ytLink.trim()}>
                  {ytBusy ? 'Looking up…' : 'Look up'}
                </button>
              </div>
              {yt && (
                <div className="vd-meta">
                  <img className="vd-thumb" src={yt.thumbnail} alt="" />
                  <div>
                    <h3 className="vd-title">{yt.title}</h3>
                    <p className="vd-by">{yt.author ? `by ${yt.author}` : 'Channel name not published'}</p>
                    <span className="vd-id">video id · {yt.videoId}</span>
                    <div className="vd-actions">
                      {THUMBNAILS.map((r) => (
                        <button key={r.id} type="button" className="vd-btn sm" onClick={() => void grabThumb(r)} disabled={thumbBusy === r.id}>
                          {thumbBusy === r.id ? 'Saving…' : `Save ${r.label}`}
                        </button>
                      ))}
                      <button type="button" className="vd-btn sm" onClick={() => void copy(yt.watchUrl, 'Video link copied.')}>Copy video link</button>
                      <Link className="vd-btn sm primary" to="/shorts">Open Shorts maker</Link>
                    </div>
                  </div>
                </div>
              )}
              {ytError && <p className="vd-err" role="alert">{ytError}</p>}
              {ytNote && <p className="vd-ok" role="status">{ytNote}</p>}
              <p className="vd-note">
                <strong>What this saves from a YouTube link.</strong> The record YouTube publishes —
                title, channel, thumbnail at every size it offers — plus a timestamped share link.
                {' '}
                <strong>The footage itself is not downloadable here.</strong> YouTube protects its stream
                URLs, and defeating that takes a server running a rip service, which is outside both
                what a browser can do and what this app should do.
              </p>
              <ul className="vd-list">
                <li>Own the file? Put it under <strong>Direct file link</strong> and it downloads at full quality.</li>
                <li>Need a clip from a YouTube video? <Link to="/shorts">the Shorts maker</Link> reframes it to 9:16 and records a clean short.</li>
                <li>Need the video file? Use the uploader&rsquo;s own download (YouTube Premium, Studio export) or ask for permission.</li>
              </ul>
            </>
          )}
        </Section>

        <Section title="How a download runs">
          <p className="vd-note" style={{ marginTop: 0 }}>
            One request, streamed in chunks, counted as it arrives — the numbers in the queue are bytes
            received over the wire, not a guess. Nothing is uploaded, no key is used, no server is
            involved: the file goes straight from the host to your machine.
          </p>
        </Section>
      </div>

      <aside className="vd-side">
        <Section title={`Queue (${items.length})`}>
          {items.length === 0 ? (
            <p className="vd-empty">Nothing queued. Paste a link above and press Download.</p>
          ) : (
            <div className="vd-queue">
              {items.map((it) => (
                <div key={it.id} className={`vd-item${it.state === 'error' ? ' err' : ''}${it.state === 'done' ? ' done' : ''}`}>
                  <div className="vd-itemHead">
                    <span className="vd-itemName">{it.name}</span>
                    <span className="vd-state">{it.state === 'queued' ? 'starting' : it.state}</span>
                  </div>
                  <div className={`vd-bar${it.percent === null && (it.state === 'running' || it.state === 'queued') ? ' indeterminate' : ''}`}>
                    <i style={{ width: `${Math.round((it.percent ?? (it.state === 'done' ? 1 : 0)) * 100)}%` }} />
                  </div>
                  <div className="vd-stats">
                    <span>{formatBytes(it.received)}{it.total ? ` / ${formatBytes(it.total)}` : ''}</span>
                    {it.state === 'running' && <span>{formatBytes(it.speed)}/s</span>}
                    {it.state === 'running' && it.percent !== null && it.speed > 0 && it.total && <span>{formatClock((it.total - it.received) / it.speed)} left</span>}
                    {it.state === 'done' && <span>{formatBytes(it.received)} saved</span>}
                  </div>
                  {it.message && <p className={`vd-itemMsg${it.state === 'error' ? ' bad' : ''}`}>{it.message}</p>}
                  <div className="vd-itemActions">
                    {it.state === 'running' && <button type="button" className="vd-btn sm" onClick={() => controllers.current.get(it.id)?.pause()}>Pause</button>}
                    {it.state === 'paused' && <button type="button" className="vd-btn sm primary" onClick={() => controllers.current.get(it.id)?.resume()}>Resume</button>}
                    {it.state === 'done' && it.blob && (
                      <button type="button" className="vd-btn sm" onClick={() => void saveBlob(it.blob, it.name)}>Save again</button>
                    )}
                    {(it.state === 'error' || it.state === 'canceled') && (
                      <button type="button" className="vd-btn sm" onClick={() => void enqueue(it.url, { name: it.name, type: it.type, size: it.total })}>Retry</button>
                    )}
                    {(it.state === 'running' || it.state === 'paused') && (
                      <button type="button" className="vd-btn sm" onClick={() => controllers.current.get(it.id)?.cancel()}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Limits, stated plainly">
          <p className="vd-note" style={{ marginTop: 0 }}>
            A host that does not send cross-origin permission cannot be read by any web page, and this
            one tells you so instead of showing a fake progress bar. YouTube, Google Drive and most
            streaming sites fall in that group — use their own download button.
          </p>
          <p className="vd-note">
            Big files are held in memory before saving, so keep downloads under a few hundred MB.
          </p>
        </Section>
      </aside>
    </div>
  );
}
