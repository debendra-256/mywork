/**
 * VideoDownloader.js — every piece of logic behind the Video Downloader screen.
 *
 * Deliberately framework-free (no React, no imports) so the same file can be dropped into a plain
 * HTML page. What this module can honestly do: download any file URL whose host allows cross-origin
 * reads, with real progress, pause and resume; and read what YouTube publishes about a video
 * (oEmbed title/uploader/thumbnail). Pulling the footage out of YouTube is not one of them: those
 * streams are protected and only a server-side rip service defeats that, which is out of scope here.
 */

const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com', 'youtube-nocookie.com'];

const EXT_BY_TYPE = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/x-msvideo': '.avi',
  'video/mpeg': '.mpg',
  'video/mp2t': '.ts',
  'video/3gpp': '.3gp',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/json': '.json',
  'text/plain': '.txt',
  'text/vtt': '.vtt',
};

const THUMB_RENDITIONS = [
  { id: 'maxres', file: 'maxresdefault.jpg', label: 'Max (1280×720)' },
  { id: 'sd', file: 'sddefault.jpg', label: 'SD (640×480)' },
  { id: 'hq', file: 'hqdefault.jpg', label: 'HQ (480×360)' },
  { id: 'mq', file: 'mqdefault.jpg', label: 'MQ (320×180)' },
  { id: 'thumb', file: 'overturetime.jpg', label: 'Frame strip' },
];

/** Thumbnail renditions YouTube serves for every video; maxres is the one that sometimes 404s. */
export const THUMBNAILS = THUMB_RENDITIONS.filter((r) => r.id !== 'thumb');

/** Normalises anything that looks like a URL. */
export function toUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
}

/** 11-character video id from any YouTube shape of link, or null. */
export function parseYouTubeId(raw) {
  const u = toUrl(raw);
  if (!u) return null;
  if (!YT_HOSTS.includes(u.hostname)) return null;
  if (u.hostname === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  const v = u.searchParams.get('v');
  if (v && /^[\w-]{11}$/.test(v)) return v;
  const seg = u.pathname.split('/').filter(Boolean);
  const keyed = ['embed', 'shorts', 'live', 'v'];
  for (let i = 0; i < seg.length - 1; i += 1) {
    if (keyed.includes(seg[i]) && /^[\w-]{11}$/.test(seg[i + 1])) return seg[i + 1];
  }
  return null;
}

/** What kind of link did the user paste? Drives which panel is shown. */
export function classify(raw) {
  const u = toUrl(raw);
  if (!u) return { kind: 'invalid', url: null, videoId: null };
  const videoId = parseYouTubeId(u.href);
  if (videoId) return { kind: 'youtube', url: u, videoId };
  return { kind: 'file', url: u, videoId: null };
}

export function watchUrl(videoId, atSeconds) {
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  const t = Math.max(0, Math.round(Number(atSeconds) || 0));
  return t > 0 ? `${base}&t=${t}s` : base;
}

/**
 * The moment a YouTube link points at, from its `t`/`start`/`#t=` marker, in seconds or null.
 * Accepts plain seconds (90, 90s) and clock forms (1m30s, 1h2m3s).
 */
export function startSeconds(raw) {
  const u = toUrl(raw);
  if (!u) return null;
  const mark = u.searchParams.get('t') || u.searchParams.get('start') || u.hash.replace(/^#t=?/, '');
  if (!mark) return null;
  const clock = /^(\d+h)?(\d+m)?(\d+(?:\.\d+)?s?)$/i.exec(mark.trim());
  if (clock) {
    const [, h, m, s] = clock;
    return Number(h?.slice(0, -1) || 0) * 3600 + Number(m?.slice(0, -1) || 0) * 60 + parseFloat(s);
  }
  const plain = Number(mark);
  return Number.isFinite(plain) && plain >= 0 ? plain : null;
}

/** Strips anything that cannot live in a filename, keeps a sane length and one extension. */
export function safeName(name, contentType) {
  let s = String(name || 'video')
    .replace(/\.[^.]{1,5}$/, '')
    .replace(/[\u0000-\u001f\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) s = 'video';
  s = s.slice(0, 80).replace(/[ .]+$/, '');
  const ext = EXT_BY_TYPE[String(contentType || '').toLowerCase()] || guessExtFromName(name) || '';
  return `${s}${ext}`;
}

function guessExtFromName(name) {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(name || ''));
  return m ? `.${m[1].toLowerCase()}` : '';
}

/** Content-Disposition's filename / filename* parameter, if the host sent one. */
export function dispositionName(headerValue) {
  const h = String(headerValue || '');
  const star = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(h);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ''));
    } catch {
      /* fall through to the plain form */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(h);
  return plain ? plain[1].trim() : null;
}

export function formatBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return '--';
  if (v < 1024) return `${v} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  let x = v;
  do { x /= 1024; i += 1; } while (x >= 1024 && i < units.length - 1);
  return `${x >= 100 ? Math.round(x) : x.toFixed(1)} ${units[i]}`;
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * Two header-only requests tell us everything worth knowing: HEAD for the real size and name, and a
 * one-byte Range probe for whether the host honours resume. Hosts are free to hide `content-range`
 * from scripts, which is why the size is not read from the ranged reply.
 */
export async function probeFile(url) {
  const target = String(url || '').trim();
  if (!toUrl(target)) throw new Error('That is not a link I can read.');
  let head = null;
  try {
    head = await send('HEAD', target);
  } catch {
    head = null; // plenty of hosts refuse HEAD; the Range probe below still answers
  }
  try {
    const ranged = await send('GET', target, { Range: 'bytes=0-0' });
    const isRanged = ranged.status === 206;
    if (!head && !ranged.ok) throw new Error(`The host answered ${ranged.status} ${ranged.statusText || ''}`.trim());
    const pick = (key) => ranged.headers.get(key) || head?.headers.get(key) || null;
    const cr = /\/(\d+)\s*$/.exec(ranged.headers.get('content-range') || '');
    const declared = Number(head?.headers.get('content-length') || 0) || Number(cr?.[1] || 0) || 0;
    const size = declared > 1 ? declared : null;
    return {
      url: target,
      ok: true,
      type: (pick('content-type') || 'application/octet-stream').split(';')[0].trim(),
      size,
      knownSize: size !== null,
      resumable: isRanged || (pick('accept-ranges') || '').includes('bytes'),
      ranged: isRanged,
      name: dispositionName(pick('content-disposition'))
        || decodeURIComponent(new URL(target).pathname.split('/').filter(Boolean).pop() || 'video'),
    };
  } catch (reason) {
    throw new Error(explainFetchFailure(reason, target));
  }
}

/** A request that reads headers only — any body is cancelled straight away. */
async function send(method, url, headers) {
  const res = await fetch(url, { method, headers, mode: 'cors', credentials: 'omit' });
  res.body?.cancel?.();
  return res;
}

/** Turns the browser's useless "Failed to fetch" into the reason the user can act on. */
export function explainFetchFailure(reason, target) {
  const msg = reason instanceof Error ? reason.message : String(reason || '');
  if (/abort/i.test(msg)) return 'Cancelled.';
  if (/Failed to fetch|NetworkError|Load failed|CORS/i.test(msg)) {
    const host = (() => { try { return new URL(target).hostname; } catch { return 'that host'; } })();
    return `${host} does not allow a web page to read its files (no cross-origin permission), so no browser can download from it directly. Save it from that site's own page, or link a file from a host that allows it.`;
  }
  return msg || 'The download failed.';
}

/**
 * The downloader itself. Streams into memory in one pass, keeps what it received, and comes back for
 * the rest with a Range request when the host supports it — that is what pause/resume really is.
 */
export function createDownload(url, handlers = {}) {
  const { onProgress, onState, onDone, onError } = handlers;
  let ac = null;
  let state = 'idle';
  let received = 0;
  let total = null;
  let type = 'application/octet-stream';
  // A probe already proved the host answers Range requests, while the host itself may hide
  // `accept-ranges` from cross-origin scripts, so start from whatever the caller learned.
  let resumable = handlers.resumable === true;
  let parts = [];
  let blob = null;
  let settled = false;
  let startedAt = 0;
  let resumedAt = 0;
  let speed = 0;

  const emit = () => onProgress?.({
    received,
    total,
    speed,
    state,
    percent: total && total > 0 ? Math.min(1, received / total) : null,
    remaining: total && total > 0 ? Math.max(0, (total - received) / (speed || 1)) : null,
    elapsed: startedAt ? (Date.now() - startedAt) / 1000 + resumedAt : 0,
  });

  const setState = (s) => { state = s; onState?.(s); emit(); };

  async function run() {
    if (state === 'running' || settled) return;
    ac = new AbortController();
    // The controller this pass belongs to. A paused read can reject only after resume() has started
    // the next pass, and that late rejection must not be reported against the newer one.
    const mine = ac;
    startedAt = startedAt || Date.now();
    setState('running');
    try {
      const headers = resumable && received > 0 ? { Range: `bytes=${received}-` } : undefined;
      const res = await fetch(url, { headers, mode: 'cors', credentials: 'omit', signal: ac.signal });
      if (!res.ok && res.status !== 206) throw new Error(`The host answered ${res.status} ${res.statusText || ''}`.trim());
      // A host that ignores the Range request sends the whole file again. Keeping the partial bytes
      // would glue a duplicate onto the front, so drop them and take this reply as the start.
      if (headers && res.status !== 206) { parts = []; received = 0; resumable = false; }
      if (received === 0) {
        type = (res.headers.get('content-type') || type).split(';')[0].trim() || type;
        const cr = /\/(\d+)\s*$/.exec(res.headers.get('content-range') || '');
        if (res.status === 206 && cr) { total = Number(cr[1]); resumable = true; }
        else {
          const cl = Number(res.headers.get('content-length') || 0);
          if (cl > 0) total = cl;
          if ((res.headers.get('accept-ranges') || '').includes('bytes')) resumable = true;
        }
      }
      const reader = res.body?.getReader?.();
      if (!reader) {
        const buf = await res.arrayBuffer();
        parts.push(buf);
        received += buf.byteLength;
        emit();
      } else {
        let lastEmit = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          parts.push(value);
          received += value.byteLength;
          const now = Date.now();
          if (now - lastEmit > 120) {
            const secs = (now - startedAt) / 1000;
            speed = secs > 0 ? received / secs : 0;
            lastEmit = now;
            emit();
          }
        }
      }
      const secs = (Date.now() - startedAt) / 1000;
      speed = secs > 0 ? received / secs : speed;
      if (mine !== ac) return;
      settled = true;
      blob = new Blob(parts, { type });
      parts = [];
      setState('done');
      onDone?.({ blob, size: blob.size, total, type, speed });
    } catch (reason) {
      if (mine !== ac) return;
      if (state === 'paused') return;
      if (ac && ac.signal.aborted && state !== 'running') return;
      settled = true;
      setState('error');
      onError?.(new Error(explainFetchFailure(reason, url)));
    }
  }

  return {
    start: () => void run(),
    pause() {
      if (state !== 'running') return;
      setState('paused');
      resumedAt += startedAt ? (Date.now() - startedAt) / 1000 : 0;
      startedAt = 0;
      ac?.abort();
    },
    resume() {
      if (state !== 'paused') return;
      if (!resumable) { parts = []; received = 0; total = null; }
      settled = false;
      startedAt = 0;
      void run();
    },
    cancel() {
      if (settled || state === 'done') return;
      settled = true;
      ac?.abort();
      parts = [];
      blob = null;
      setState('canceled');
    },
    get state() { return state; },
    get blob() { return blob; },
    get type() { return type; },
    get received() { return received; },
    get total() { return total; },
  };
}

/**
 * Saves a blob. Uses the real Save-As picker where the browser offers one, otherwise the ordinary
 * download route. Returns 'saved' | 'downloaded' | 'dismissed' so the UI can say the right thing.
 */
export async function saveBlob(blob, filename) {
  const name = String(filename || 'video');
  if (window.showSaveFilePicker) {
    try {
      const ext = /\.([A-Za-z0-9]{1,5})$/.exec(name)?.[1] || 'bin';
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: name, accept: { [blob.type || 'application/octet-stream']: [`.${ext}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (reason) {
      if (reason && /AbortError/i.test(String(reason.name || reason))) return 'dismissed';
      /* any other picker failure falls through to the plain download */
    }
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60000);
  return 'downloaded';
}

/**
 * What YouTube publishes about a video, from its public oEmbed endpoint — title, uploader, thumbnail.
 * This is the documented embedding API, not a stream, so it needs no key and no server.
 */
export async function fetchYouTubeMeta(input) {
  const videoId = parseYouTubeId(input);
  if (!videoId) throw new Error('That link does not point at a YouTube video.');
  const watch = watchUrl(videoId);
  const share = watchUrl(videoId, startSeconds(input));
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`;  let res;
  try {
    res = await fetch(endpoint, { mode: 'cors', credentials: 'omit' });
  } catch {
    throw new Error('YouTube did not answer the metadata request. Check the connection and try again.');
  }
  // 400 is what oEmbed actually answers for an id it has no record for, alongside the 401/403/404 set.
  if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
    throw new Error('YouTube publishes no embed record for this video — it is private, age-restricted, or removed.');
  }
  if (!res.ok) throw new Error(`YouTube answered ${res.status} ${res.statusText || ''}`.trim());
  const data = await res.json();
  return {
    videoId,
    title: String(data.title || ''),
    author: String(data.author_name || ''),
    authorUrl: String(data.author_url || ''),
    thumbnail: String(data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
    width: Number(data.thumbnail_width) || null,
    height: Number(data.thumbnail_height) || null,
    watchUrl: share,
    embedUrl: String(data.url || `https://www.youtube.com/embed/${videoId}`),
  };
}

export function thumbnailUrl(videoId, renditionId) {
  const r = THUMBNAILS.find((x) => x.id === renditionId) || THUMBNAILS[2];
  return `https://i.ytimg.com/vi/${videoId}/${r.file}`;
}

/** Fetches one thumbnail rendition; maxres is missing on older videos, so callers must handle null. */
export async function fetchThumbnail(videoId, renditionId) {
  const url = thumbnailUrl(videoId, renditionId);
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) return null;
  const blob = await res.blob();
  // YouTube returns a small grey placeholder instead of a 404 when a rendition does not exist.
  if (blob.size < 1200) return null;
  return { blob, url, size: blob.size, name: safeName(`${videoId}-${renditionId}`, blob.type || 'image/jpeg') };
}
