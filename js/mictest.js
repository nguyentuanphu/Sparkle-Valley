// (Round V, owner 13 Oct: the iPhone microphone does nothing in Friends and in voice control, with no call anywhere)
// A microphone test for grown-ups, in Friends, that works without a room: it says on screen exactly what the device
// answers (where the game runs, the permission, the microphone's answer with its error name, a sound bar, and voice
// control), so the owner can read one line back instead of guessing. Nothing is recorded or sent anywhere.
import { T } from './i18n.js';
import { settings } from './state.js';
import { modal, toast } from './ui.js';
import { Net } from './net.js';
import { micMode } from './audio.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function where() {
  const ua = navigator.userAgent, ios = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const v = (ua.match(/OS (\d+)_(\d+)/) || [])[0];
  const app = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches ? T('Home Screen app', 'ứng dụng trên Màn hình chính')
    : /CriOS/.test(ua) ? 'Chrome' : /FxiOS/.test(ua) ? 'Firefox' : /EdgiOS|Edg\//.test(ua) ? 'Edge' : /Safari/.test(ua) && !/Chrome|Chromium/.test(ua) ? 'Safari' : /Chrome/.test(ua) ? 'Chrome' : T('other browser', 'trình duyệt khác');
  return (ios ? (v ? 'iOS ' + v.slice(3).replace('_', '.') : 'iOS') + ' · ' : '') + app + (window.isSecureContext ? '' : ' · ' + T('not secure (no https)', 'không an toàn (không https)'));
}

export function openMicTest() {
  const m = modal('mictest', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>🎙️ ${T('Microphone test', 'Thử micrô')}</h2>
    <p class="note">${T('For grown-ups: this shows what the phone or tablet answers. Nothing is recorded.', 'Cho người lớn: màn hình này cho biết máy trả lời gì. Không ghi âm gì cả.')}</p>
    <ul class="mt-lines"><li data-k="where"></li><li data-k="perm"></li><li data-k="mic"></li><li data-k="voice"></li></ul>
    <div class="mt-bar" aria-hidden="true"><i></i></div>
    <div class="actions center"><button class="btn big primary" data-mic>🎙️ ${T('Test the microphone', 'Thử micrô')}</button><button class="btn big" data-voice>🗣️ ${T('Test voice control', 'Thử điều khiển bằng giọng nói')}</button></div>
    <div class="actions center"><button class="btn" data-copy>📋 ${T('Copy the answers', 'Sao chép kết quả')}</button></div>`);
  const line = (k, txt) => { const li = m.querySelector(`[data-k="${k}"]`); li.innerHTML = txt; };
  const bar = m.querySelector('.mt-bar i');
  let stream = null, own = false, ctx = null, raf = 0, rec = null;
  const stop = () => { micMode('test', false); cancelAnimationFrame(raf); try { ctx && ctx.close(); } catch (e) { } ctx = null; if (own && stream) stream.getTracks().forEach(t => t.stop()); stream = null; try { rec && rec.abort(); } catch (e) { } rec = null; };
  m.querySelector('.x').onclick = () => { stop(); m.close(); };
  line('where', '📱 ' + esc(where()));
  line('perm', '🔒 ' + T('Permission: …', 'Quyền: …'));
  line('mic', '🎙️ ' + T('Microphone: not tried yet', 'Micrô: chưa thử'));
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  line('voice', '🗣️ ' + (SR ? T('Voice control: available, not tried yet', 'Điều khiển bằng giọng nói: có, chưa thử') : T('Voice control: this browser has none', 'Điều khiển bằng giọng nói: trình duyệt này không có')));
  const perm = async () => {
    try { const p = await navigator.permissions.query({ name: 'microphone' }); const say = { granted: T('allowed', 'cho phép'), denied: T('blocked (a grown-up allows it in Settings)', 'bị chặn (người lớn bật trong Cài đặt)'), prompt: T('will ask', 'sẽ hỏi') }[p.state] || p.state; line('perm', '🔒 ' + T('Permission: ', 'Quyền: ') + esc(say) + ` <small>(${esc(p.state)})</small>`); }
    catch (e) { line('perm', '🔒 ' + T('Permission: this browser does not say', 'Quyền: trình duyệt không cho biết')); }
  };
  perm();
  m.querySelector('[data-mic]').onclick = () => {
    stop();
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) { line('mic', '🎙️ ' + T('Microphone: this browser cannot use one (getUserMedia missing)', 'Micrô: trình duyệt này không dùng được (thiếu getUserMedia)')); return; }
    line('mic', '🎙️ ' + T('Microphone: asking… (tap Allow)', 'Micrô: đang xin… (chạm Cho phép)'));
    const t0 = Date.now(), slow = setTimeout(() => { if (!stream) line('mic', '🎙️ ' + T('Microphone: no answer from the device after 10 seconds', 'Micrô: máy chưa trả lời sau 10 giây') + ' <small>(pending)</small>'); }, 10000);
    // a microphone the game already has and that still works is used as it is (a second one can switch it off on iPhone)
    micMode('test', true);   // iPhone never asks in its play-only sound mode (audio.js)
    const got = Net.micLive ? Promise.resolve(Net.mic) : md.getUserMedia({ audio: true, video: false });
    own = !Net.micLive;
    got.then(s => {
      clearTimeout(slow); stream = s; const t = s.getAudioTracks()[0];
      line('mic', '🎙️ ' + T('Microphone: ON', 'Micrô: ĐÃ BẬT') + ` <small>(${esc(t ? t.label || 'audio' : 'no track')} · ${esc(t ? t.readyState : '')}${t && t.muted ? ' · muted' : ''} · ${Date.now() - t0} ms)</small> · ` + T('speak: the bar moves', 'nói thử: thanh sẽ chạy'));
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.resume && ctx.resume();
        const an = ctx.createAnalyser(); an.fftSize = 256; ctx.createMediaStreamSource(s).connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const tick = () => { an.getByteTimeDomainData(buf); let mx = 0; for (const v of buf) mx = Math.max(mx, Math.abs(v - 128)); bar.style.width = Math.min(100, mx * 1.6) + '%'; raf = requestAnimationFrame(tick); };
        tick();
      } catch (e) { }
      perm();
    }, e => {
      clearTimeout(slow);
      const name = (e && e.name) || 'Error', why = {
        NotAllowedError: T('blocked. A grown-up allows it: Settings → Safari → Microphone → Ask or Allow; in Safari also tap “aA” → Website Settings → Microphone → Allow; check Screen Time → Content & Privacy → Microphone too', 'bị chặn. Người lớn bật: Cài đặt → Safari → Micrô → Hỏi hoặc Cho phép; trong Safari chạm “aA” → Cài đặt trang web → Micrô → Cho phép; xem cả Thời gian sử dụng → Nội dung & Quyền riêng tư → Micrô'),
        NotReadableError: T('another app or call is using it', 'một ứng dụng hoặc cuộc gọi khác đang dùng'), AbortError: T('the device stopped it', 'máy đã dừng'),
        NotFoundError: T('no microphone found', 'không thấy micrô'), SecurityError: T('not allowed on this page', 'trang này không được phép')
      }[name] || T('did not work', 'không được');
      line('mic', '🎙️ ' + T('Microphone: ', 'Micrô: ') + esc(why) + ` <small>(${esc(name)}${e && e.message ? ': ' + esc(e.message) : ''})</small>`);
      perm();
    });
  };
  m.querySelector('[data-voice]').onclick = () => {
    if (!SR) return;
    try { rec && rec.abort(); } catch (e) { }
    micMode('test', true);
    const r = rec = new SR(); r.lang = settings.lang === 'vi' ? 'vi-VN' : 'en-AU'; r.interimResults = true; r.continuous = false;
    let heard = '', err = '';
    line('voice', '🗣️ ' + T('Voice control: listening… say “hello”', 'Điều khiển bằng giọng nói: đang nghe… nói “xin chào”'));
    r.onresult = e => { heard = [...e.results].map(x => x[0].transcript).join(''); line('voice', '🗣️ ' + T('Voice control: heard “', 'Điều khiển bằng giọng nói: nghe được “') + esc(heard) + '”'); };
    r.onerror = e => { err = e.error || 'error'; };
    r.onend = () => { if (rec === r) rec = null; if (!heard) line('voice', '🗣️ ' + T('Voice control: ', 'Điều khiển bằng giọng nói: ') + (err ? T('did not work', 'không được') + ` <small>(${esc(err)})</small>` : T('heard nothing', 'không nghe thấy gì'))); };
    try { r.start(); } catch (e) { line('voice', '🗣️ ' + T('Voice control: could not start', 'Điều khiển bằng giọng nói: không bắt đầu được') + ` <small>(${esc(e && e.name)})</small>`); }
    setTimeout(() => { try { r.stop(); } catch (e) { } }, 7000);
  };
  m.querySelector('[data-copy]').onclick = async () => {
    const txt = [...m.querySelectorAll('.mt-lines li')].map(li => li.textContent).join('\n');
    try { await navigator.clipboard.writeText(txt); toast(T('Copied', 'Đã sao chép')); } catch (e) { toast(T('Could not copy: take a screenshot instead', 'Không sao chép được: hãy chụp màn hình nhé')); }
  };
  return m;
}
