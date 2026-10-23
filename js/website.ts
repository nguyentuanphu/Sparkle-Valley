// (r89, owner 23 Oct AEDT) the family website floating over the game, from the Welcome screen or from Settings, without
// leaving or restarting play (docs/website-review-20261023/RELEASE-HANDOFF.md). It is the real /home page (made by
// tools/build-website.mts) in a frame of its own, so its styles and scripts never touch the game, and the game tells it
// nothing but the language: no names, saves or play reports. The frame can only ask to close (Close, Back to game,
// Escape): any other message, or one from another page or window, is ignored. While it is open it is a window like any
// other (.modal), so the game is paused behind it, its taps and keys do not reach the game, and the time is not play.
// Loaded only when a grown-up taps Website (js/ui.ts), so it adds nothing to the start of the game.
import { T } from './i18n.js';
import { settings } from './state.js';
import { modal } from './popups.js';
import { SFX } from './audio.js';

type Opened = { close: () => void };
let open: Opened | null = null;

/** open the website floating over the screen; `after` runs once when it closes, then the opener gets the focus back */
export function openWebsite(opener?: Element | null, after?: () => void, section = ''): Opened {
  if (open) return open;
  const back = opener instanceof HTMLElement ? opener : document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const lang = settings.lang === 'vi' ? 'vi' : 'en', hash = /^[a-z0-9-]+$/.test(section) ? '#' + section : '';
  const m = modal('website', `<iframe class="site-frame" title="${T('Sparkle Valley website', 'Trang web Thung Lũng Lấp Lánh')}" src="/home/?embed=1&lang=${lang}${hash}"></iframe>
    <p class="site-wait">${T('Opening the website…', 'Đang mở trang web…')}</p>`);
  const frame = m.querySelector('.site-frame'), card = m.querySelector('.card');
  if (!(frame instanceof HTMLIFrameElement) || !(card instanceof HTMLElement)) throw Error('the website window was not made');
  card.setAttribute('aria-label', T('Sparkle Valley website', 'Trang web Thung Lũng Lấp Lánh'));
  frame.addEventListener('load', () => { m.classList.add('loaded'); try { frame.contentWindow?.focus(); } catch { /* the frame keeps its own focus */ } }, { once: true });
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const d: unknown = e.data;
    if (d && typeof d === 'object' && 'sv' in d && 'do' in d && d.sv === 'website' && (d.do === 'close' || d.do === 'play')) close();
  };
  // Escape while the game page itself has the focus (before the frame has loaded, or after a tap on the shell)
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  const close = () => {
    if (!open) return; open = null; SFX.tap();
    removeEventListener('message', onMessage); removeEventListener('keydown', onKey, true);
    m.close(); after?.(); back?.focus();
  };
  addEventListener('message', onMessage); addEventListener('keydown', onKey, true);
  open = { close }; return open;
}

