const ALLDL = (u) => `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(u)}`;
const SMFAHIM = (u) => `https://www.smfahim.xyz/download/tiktok/v1?url=${encodeURIComponent(u)}`;

const urlInput = document.getElementById('urlInput');
const btn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const resultBox = document.getElementById('result');

function setStatus(m, t) { status.className = 'status' + (t ? ' ' + t : ''); status.textContent = m || ''; }
function setLoading(on) { btn.disabled = on; btn.innerHTML = on ? '<span class="spinner"></span>Processing…' : 'Download'; }
function clear() { resultBox.innerHTML = ''; setStatus(''); }
function escape(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }
function formatNum(n) { n = Number(n) || 0; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return n.toString(); }
function isValid(u) { return /tiktok\.com|vt\.tiktok|vm\.tiktok/i.test(u); }

function pickSmfahim(data) {
  const d = data?.data || data;
  return {
    noWm: d?.video?.noWatermark || d?.no_watermark || d?.nowm || d?.play || d?.hdplay || d?.video_hd || d?.url_no_watermark,
    wm: d?.video?.watermark || d?.watermark || d?.wmplay,
    audio: d?.music || d?.audio || d?.music_url || d?.music_info?.play || d?.music?.play,
    cover: d?.cover || d?.thumbnail || d?.video?.cover || d?.origin_cover,
    author: d?.author?.nickname || d?.author?.unique_id || d?.author?.name || (typeof d?.author === 'string' ? d.author : ''),
    title: d?.title || d?.desc || d?.description || '',
    stats: { plays: d?.play_count ?? d?.stats?.plays, likes: d?.digg_count ?? d?.stats?.likes, comments: d?.comment_count ?? d?.stats?.comments },
  };
}

async function fetchVideo(url) {
  const [a, s] = await Promise.allSettled([
    fetch(ALLDL(url)).then(r => r.json()).catch(() => null),
    fetch(SMFAHIM(url)).then(r => r.json()).catch(() => null),
  ]);
  const all = a.value;
  const sm = s.value ? pickSmfahim(s.value) : {};
  const result = {
    videoUrl: (all?.status && all?.data?.videoUrl) || sm.noWm || sm.wm,
    audioUrl: sm.audio,
    thumbnail: sm.cover,
    title: sm.title,
    author: sm.author,
    stats: sm.stats || {},
    platform: all?.data?.platform || 'TikTok',
  };
  if (!result.videoUrl) throw new Error('No video found');
  return result;
}

async function run() {
  const url = urlInput.value.trim();
  clear();
  if (!url) return setStatus('⚠️ Please enter a TikTok URL.', 'error');
  if (!isValid(url)) return setStatus('⚠️ Invalid TikTok URL.', 'error');

  setLoading(true); setStatus('⏳ Fetching video…');
  try {
    const m = await fetchVideo(url);
    console.log('TT result', m);

    let html = `<div class="result">`;
    if (m.platform) html += `<span class="platform-badge">🎵 ${escape(m.platform)}</span>`;
    html += `<video class="preview" src="${m.videoUrl}" ${m.thumbnail ? `poster="${m.thumbnail}"` : ''} controls preload="metadata" playsinline></video>`;
    if (m.author) html += `<div class="meta">@${escape(m.author || 'creator')}</div>`;
    if (m.title) html += `<div class="author">${escape(m.title)}</div>`;
    if (m.stats.plays || m.stats.likes) {
      html += `<div class="stats">
        ${m.stats.plays ? `<span>▶ ${formatNum(m.stats.plays)}</span>` : ''}
        ${m.stats.likes ? `<span>♥ ${formatNum(m.stats.likes)}</span>` : ''}
        ${m.stats.comments ? `<span>💬 ${formatNum(m.stats.comments)}</span>` : ''}
      </div>`;
    }
    html += `<a class="dl" href="${m.videoUrl}" download="tiktok.mp4" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
      Download Video (No Watermark)
    </a>`;
    if (m.audioUrl) html += `<a class="dl audio" href="${m.audioUrl}" download="tiktok-audio.mp3" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
      Download Audio (MP3)
    </a>`;
    html += `</div>`;

    resultBox.innerHTML = html;
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('❌ Failed to fetch video. Please try again.', 'error');
  } finally { setLoading(false); }
}

btn.addEventListener('click', run);
urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') run(); });
