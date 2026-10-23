// (r89) first-party visit counts for the standalone family website (/home), only after a grown-up says yes, and never
// inside the game's floating view (a child's device). The page itself is tools/build-website.mts's; the counting is
// home/analytics.ts, the same allowlisted events netlify/functions/parent-analytics.mts accepts. No names, family
// content, typed text or full addresses are sent.
import { consent, setConsent, startAnalytics, track } from './analytics.js';

const embedded = new URLSearchParams(location.search).get('embed') === '1' && window.parent !== window;
const vi = () => document.documentElement.lang === 'vi';
declare global { interface Window { svWebsitePlay?: () => void } }

function ask() {
  const b = document.createElement('aside'); b.className = 'consent-banner';
  const draw = () => {
    b.innerHTML = `<p>${vi() ? 'Cho phép trang web đếm lượt xem (không có tên, nội dung gia đình hay chữ đã gõ)? Có thể tắt bất cứ lúc nào.' : 'Allow this website to count visits (no names, family content or typed text)? You can turn it off at any time.'}</p>`
      + `<div class="consent-actions"><button class="pill consent-no">${vi() ? 'Không' : 'No thanks'}</button><button class="pill dark consent-yes">${vi() ? 'Cho phép' : 'Allow'}</button></div>`;
    b.querySelector<HTMLButtonElement>('.consent-no')!.onclick = () => { setConsent('no'); b.remove(); };
    b.querySelector<HTMLButtonElement>('.consent-yes')!.onclick = () => { setConsent('yes'); b.remove(); startAnalytics('/'); };
  };
  draw(); new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  const st = document.createElement('style');
  st.textContent = '.consent-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:560px;margin:0 auto;padding:14px 16px;border-radius:20px;background:#fff;box-shadow:0 12px 40px #3b2a4f33;display:flex;gap:12px;align-items:center;flex-wrap:wrap}.consent-banner p{margin:0;flex:1 1 240px;font-size:15px}.consent-actions{display:flex;gap:8px}.consent-actions .pill{min-height:44px}';
  document.head.append(st); document.body.append(b);
}

if (!embedded) {
  window.svWebsitePlay = () => track('play_conversion', '/');
  const c = consent();
  if (c === 'yes') startAnalytics('/'); else if (c === null) ask();
}
