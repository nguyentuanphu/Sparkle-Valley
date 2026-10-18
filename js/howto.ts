// The instruction words stay synchronous for offline villager replies. Rendering loads on demand.
import { T } from './i18n.js';
import { GAMES } from './games/registry.js';
import type { HowToOptions } from './howto-registry.js';
export { HOWTO } from './howto-registry.js';
const FLAG_WORDS = { au: ['From Australia', 'Từ nước Úc'], vn: ['From Vietnam', 'Từ Việt Nam'], both: ['From Vietnam & Australia', 'Từ Việt Nam và Úc'] };
export const originLabel = id => { const o = GAMES[id] && GAMES[id].origin; return o ? T(FLAG_WORDS[o][0], FLAG_WORDS[o][1]) : ''; };
let request = 0;
export async function openHowTo(id, options: HowToOptions = {}) {
  const ticket = ++request;
  try {
    await GAMES[id]?.load?.();
    const m = await import('./howto-player.js');
    if (ticket === request) return m.openHowTo(id, options);
  } catch (e) { window.svModuleGone?.(e); options.onClose?.(); }
}
