// The family's own content pack, made with Sparkle Studio on the grown-up's computer (studio/): content/custom.json,
// published with the game. Read once at start (offline it comes from the saved copy). Everything in it is optional:
//   message  { en, vi }                  a note from the grown-ups, shown once a day when the children start playing
//   names    { id: { en, vi } }          default names for villagers (a name changed on the device still wins)
//   faces    { id: { photo, skin } }     default photo faces (photo = 'content/faces/….jpg'; a face set on the device wins)
//   tales    [ { id, flag, en, vi, pages: [[pictures, en, vi], …] } ]   the family's own stories (Stories shelf)
//   quiz     [ { q: [en, vi], pic, answers: [[en, vi], …], right } ]   the Family Quiz game (Learning shelf)
//   defaults { restMins }                a starting value for settings the device hasn't chosen yet
//   ads      { enabled, perDay, items }  the family's own ads (js/ads.js); nothing shows unless enabled is true
//   activities { id: { area, little, hide } }   the Simple screen's areas: move a game, open it to under-5s, hide it (js/content/activities.js)
//   music    [ { id, file, en, vi, tags } ]   the family's recordings (round N; file = 'content/music/….mp3'; tags: lullaby, tet, midautumn, christmas, diwali, ausday, vn, kids)
//   album    [ { id, photo, en, vi, place } ]   family photos that become postcards (js/familycards.js; photo = 'content/album/….jpg')
//   releases { id: { on, start, days, newDays } }   Sparkle Studio's Ra mắt (Releases) page (round R): see liveRule below
//   festivals { id: { on, date, buildup } }          Sparkle Studio's Festivals page (round R): see js/festivals.js
//   features { id: true|false }           things in the valley switched on or off from Studio (owner, round R: kept in the game,
//                                         shown only when switched on). powerPoles: Phố Hai Quê's power poles and wires (off)
let data = {};
try {
  const r = await fetch('content/custom.json', { cache: 'no-cache' });
  if (r.ok) data = await r.json();
} catch (e) { /* offline and never saved: no content pack */ }
export const CUSTOM = data && typeof data === 'object' ? data : {};
const str = v => typeof v === 'string' ? v.slice(0, 600) : '';
// only well-formed pieces are used, so a hand-edited file can't break the game
export const customTales = () => (Array.isArray(CUSTOM.tales) ? CUSTOM.tales : []).filter(t => t && t.id && Array.isArray(t.pages) && t.pages.length)
  .map(t => ({ id: 'my_' + String(t.id).replace(/[^\w-]/g, '').slice(0, 30), flag: str(t.flag) || '💛', en: str(t.en) || 'Our story', vi: str(t.vi) || 'Truyện của nhà mình', pages: t.pages.filter(p => Array.isArray(p)).map(p => [str(p[0]) || '📖', str(p[1]), str(p[2]) || str(p[1])]) }));
export const customQuiz = () => (Array.isArray(CUSTOM.quiz) ? CUSTOM.quiz : []).filter(q => q && Array.isArray(q.q) && Array.isArray(q.answers) && q.answers.length >= 2 && q.right >= 0 && q.right < q.answers.length)
  .map(q => ({ q: [str(q.q[0]), str(q.q[1]) || str(q.q[0])], pic: str(q.pic), answers: q.answers.map(a => [str(a[0]), str(a[1]) || str(a[0])]), right: q.right | 0 }));
export const customAlbum = () => (Array.isArray(CUSTOM.album) ? CUSTOM.album : []).filter(x => x && typeof x.photo === 'string' && /^content\/album\/[\w.-]+\.jpg$/.test(x.photo))
  .slice(0, 60).map(x => ({ id: String(x.id || x.photo).replace(/[^\w-]/g, '').slice(0, 30) || 'photo', photo: x.photo, en: str(x.en).slice(0, 120), vi: str(x.vi).slice(0, 120) || str(x.en).slice(0, 120), place: /^[a-z]{2,16}$/.test(x.place || '') ? x.place : 'home' }));
export const customName = id => { const n = CUSTOM.names && CUSTOM.names[id]; return n && typeof n === 'object' ? n : null; };
export const customFace = id => { const f = CUSTOM.faces && CUSTOM.faces[id]; return f && typeof f.photo === 'string' && /^content\/faces\/[\w.-]+\.(jpg|jpeg|png)$/.test(f.photo) ? f : null; };
// ---------- Releases and festivals, live from the website (round R, owner: "instant, no deploy") ----------
// Sparkle Studio's Ra mắt (Releases) and Festivals pages save to the website (Netlify Blobs, /api/live). The game asks
// for them when it opens, without waiting (a slow or missing connection never delays the start), keeps a copy for
// offline days, and uses the copy straight away next time; festivals change as soon as the answer arrives.
// A release rule: { on: true|false, start: 'YYYY-MM-DD' (from this day), days: N (on for N days only), newDays: N (a
// "New" badge and a "New!" moment for N days) }. A rule from the website wins over one in content/custom.json.
// (Switching something off never takes away what a child already has: games played and places found stay theirs.)
const LIVE_KEY = 'sv2_live', liveFns = [];
let LIVE = {}; try { LIVE = JSON.parse(localStorage.getItem(LIVE_KEY) || '{}') || {}; } catch (e) { LIVE = {}; }
export const onLive = f => liveFns.push(f);
if (typeof fetch === 'function' && typeof location !== 'undefined' && /^https?:/.test(location.protocol) && !/\/studio\//.test(location.pathname) && document.title !== 'Sparkle Studio') {   // (the game only, not Studio's pages that borrow its modules)
  fetch('api/live', { cache: 'no-store' }).then(r => r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null).then(j => {
    if (!j || typeof j !== 'object') return; const was = JSON.stringify(LIVE); LIVE = j;
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(j)); } catch (e) { }
    if (JSON.stringify(j) !== was) liveFns.forEach(f => { try { f(); } catch (e) { } });
  }).catch(() => { });
}
const pick = (kind, id) => { const a = LIVE[kind] && LIVE[kind][id], b = CUSTOM[kind] && CUSTOM[kind][id]; return a && typeof a === 'object' ? a : b && typeof b === 'object' ? b : null; };
export const liveRule = id => pick('releases', id);
export const festivalRule = id => pick('festivals', id);
const DAY = 864e5, dayOf = s => { const d = new Date(String(s) + 'T00:00:00'); return isNaN(d) ? null : d; };
// is a release on today? (def: what it is when Studio never set it)
export function releaseOn(id, def = true, now = new Date()) {
  const r = liveRule(id); if (!r) return def;
  if (r.on === false) return false;
  const st = r.start && dayOf(r.start);
  if (st && now < st) return false;
  if (st && r.days > 0 && now >= new Date(+st + r.days * DAY)) return false;
  return r.on === true ? true : def;
}
// a "New" badge: within newDays of its start (or of the day it was switched on)
export function releaseNew(id, now = new Date()) {
  const r = liveRule(id); if (!r || !(r.newDays > 0) || !releaseOn(id, true, now)) return false;
  const st = dayOf(r.start || r.since); return !!st && now >= st && now < new Date(+st + r.newDays * DAY);
}
// a valley thing switched on or off in Studio (a release rule, or CUSTOM.features), or its default when Studio never set it
export const featureOn = (id, def = true) => { if (liveRule(id)) return releaseOn(id, def); const f = CUSTOM.features; return f && typeof f[id] === 'boolean' ? f[id] : def; };
