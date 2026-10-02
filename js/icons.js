// Sparkle Valley's own picture icons: chunky rounded shapes with a soft dark outline, in the game's
// colours, so the buttons look like they belong to the valley (and not like phone emoji).
const O = '#3b2a4f', W = 'stroke="' + O + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const svg = body => `<svg class="ico" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
export const ICONS = {
  games: svg(`<rect x="5" y="15" width="38" height="22" rx="11" fill="#ff7eb8" ${W}/><path d="M15 21v10M10 26h10" ${W} fill="none"/><circle cx="31" cy="23" r="3" fill="#ffd23f" ${W}/><circle cx="37" cy="29" r="3" fill="#5fd3ff" ${W}/><path d="M24 6l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#ffd23f" ${W}/>`),
  map: svg(`<path d="M6 12l11-4 14 4 11-4v28l-11 4-14-4-11 4z" fill="#a8e6a1" ${W}/><path d="M17 8v28M31 12v28" ${W} fill="none"/><path d="M24 16c-4 0-6 3-6 6 0 4 6 10 6 10s6-6 6-10c0-3-2-6-6-6z" fill="#ff5f7e" ${W}/><circle cx="24" cy="22" r="2" fill="#fff"/>`),
  bag: svg(`<path d="M14 16c0-6 4-9 10-9s10 3 10 9" fill="none" ${W}/><rect x="8" y="15" width="32" height="27" rx="10" fill="#ffb347" ${W}/><rect x="15" y="27" width="18" height="10" rx="4" fill="#ffd98a" ${W}/><path d="M24 18l1.6 3 3.4.4-2.5 2.3.7 3.3-3.2-1.7-3.2 1.7.7-3.3-2.5-2.3 3.4-.4z" fill="#fff" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>`),
  ask: svg(`<rect x="17" y="6" width="14" height="22" rx="7" fill="#c8b6ff" ${W}/><path d="M11 22c0 7 6 12 13 12s13-5 13-12M24 34v7M17 42h14" fill="none" ${W}/>`),
  talk: svg(`<path d="M8 10h32a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H22l-9 8v-8H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="#7fd8ff" ${W}/><circle cx="16" cy="21.5" r="2.4" fill="${O}"/><circle cx="24" cy="21.5" r="2.4" fill="${O}"/><circle cx="32" cy="21.5" r="2.4" fill="${O}"/>`),
  call: svg(`<path d="M14 6l6 8-4 4c2 5 6 9 11 11l4-4 8 6-3 6c-14 0-28-14-28-28z" fill="#5fd36a" ${W}/>`),
  callOff: svg(`<path d="M14 6l6 8-4 4c2 5 6 9 11 11l4-4 8 6-3 6c-14 0-28-14-28-28z" fill="#cfcfd8" ${W}/><path d="M8 8l32 32" ${W}/>`),
  music: svg(`<path d="M18 34V10l20-4v24" fill="none" ${W}/><ellipse cx="13" cy="35" rx="6" ry="5" fill="#ff7eb8" ${W}/><ellipse cx="33" cy="31" rx="6" ry="5" fill="#ffd23f" ${W}/>`),
  sound: svg(`<path d="M7 18h8l10-8v28l-10-8H7z" fill="#ffd23f" ${W}/><path d="M31 17c3 3 3 11 0 14M36 12c6 6 6 18 0 24" fill="none" ${W}/>`),
  soundOff: svg(`<path d="M7 18h8l10-8v28l-10-8H7z" fill="#cfcfd8" ${W}/><path d="M32 18l10 12M42 18L32 30" fill="none" ${W}/>`),
  run: svg(`<path d="M8 30c0-6 4-10 8-12l6 4 8-2 8 6c3 2 4 5 3 8H10a2 2 0 0 1-2-2z" fill="#5fd3ff" ${W}/><path d="M8 34h33" ${W}/><path d="M4 18h7M2 24h6M5 12h6" fill="none" stroke="#ff9f43" stroke-width="3" stroke-linecap="round"/>`),
  jump: svg(`<path d="M24 6l12 13h-7v10h-10V19h-7z" fill="#c8b6ff" ${W}/><path d="M14 36c3-3 6 3 10 0s7 3 10 0M14 42c3-3 6 3 10 0s7 3 10 0" fill="none" stroke="#ff7eb8" stroke-width="3" stroke-linecap="round"/>`),
  zoomIn: svg(`<circle cx="21" cy="21" r="13" fill="#fff6d8" ${W}/><path d="M31 31l10 10" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M21 15v12M15 21h12" ${W}/>`),
  zoomOut: svg(`<circle cx="21" cy="21" r="13" fill="#fff6d8" ${W}/><path d="M31 31l10 10" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M15 21h12" ${W}/>`),
  gear: svg(`<path d="M24 8l3 4 5-1 1 5 5 1-1 5 4 3-4 3 1 5-5 1-1 5-5-1-3 4-3-4-5 1-1-5-5-1 1-5-4-3 4-3-1-5 5-1 1-5 5 1z" fill="#ffd23f" ${W}/><circle cx="24" cy="24" r="5" fill="#fff" ${W}/>`),
  info: svg(`<circle cx="24" cy="24" r="19" fill="#5fd3ff" ${W}/><circle cx="24" cy="15" r="3" fill="${O}"/><path d="M24 22v13" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`)
};
