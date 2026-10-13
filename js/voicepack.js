// The voice pack downloading to the device (split from js/voice.js in round R item 12, so it is fetched only when the
// download starts, not before the title screen: PERF-001). js/voice.js starts it once the pack's list has arrived.
import { settings, saveSettings, profiles } from './state.js';
import { events } from './core/events.js';
import { T } from './i18n.js';

let PACK = null, packEmit = e => { }, hereArea = () => null;
// Keep the pack on the device by itself: a few seconds after the game opens (every time it opens), the voice cache is
// checked against the list, and any file not there yet (first visit, a new pack, or a phone that cleared space) is
// downloaded quietly. A small bar shows it (js/packbar.js); every line then plays with the recorded voice, offline too.
// (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") only the
// languages this family's children hear are downloaded; a small core (the start, home, Làng Sen, the menus, the Simple
// screen, the commonest game lines) comes first on any connection, then on Wi-Fi the rest area by area (voices/areas.json,
// made by tools/make-voice-pack.mjs): the place the child is in, the places they have been, games, stories, festivals,
// the other places. On mobile data a grown-up is asked first (press and hold); the answer is kept, and Grown-ups can
// change it. A line not downloaded yet still plays its recording from the internet (and is kept).
export function startPack(pack, emit, here) {
  PACK = pack; packEmit = emit; hereArea = here;
  // (an address that can't keep files, like http://192.168.… on a phone: the voices still play, from the internet)
  if (!('caches' in window)) { setTimeout(() => packEmit({ state: 'nostore', total: packFiles().length }), 3000); return; }
  if (settings.autoPack === false) return;
  setTimeout(() => { checkPack().catch(() => { }); }, 6000);
  let againT = 0; const again = () => { clearTimeout(againT); againT = setTimeout(() => checkPack().catch(() => { }), 1500); };
  addEventListener('online', again);
  try { const c = navigator.connection; if (c && c.addEventListener) c.addEventListener('change', again); } catch (e) { } // (onto Wi-Fi: the rest goes on)
  events.on('LanguageChanged', again); // (a new language, or both spoken: its core, then its areas)
  events.on('SettingsChanged', again);
}
// the languages this device's children hear: the game's language, and the other one too when both are spoken
export const packLangs = () => { const L = [settings.lang === 'vi' ? 'vi' : 'en']; if (settings.bilingual) L.push(L[0] === 'vi' ? 'en' : 'vi'); return L; };
// 'wifi', 'mobile' or 'off'. iPhones, iPads and most computers can't tell: a computer counts as Wi-Fi (or a cable), a
// phone or tablet as mobile data, so a grown-up is asked once (owner, 10 Oct)
export function packNet() {
  if (navigator.onLine === false) return 'off';
  const c = navigator.connection, t = c && c.type;
  if (c && c.saveData) return 'mobile';
  if (t === 'wifi' || t === 'ethernet') return 'wifi';
  if (t === 'cellular' || t === 'wimax' || t === 'bluetooth') return 'mobile';
  let touch = false; try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) { }
  return touch ? 'mobile' : 'wifi';
}
// may the rest (beyond the core) download now? On Wi-Fi yes; on mobile data only once a grown-up said yes
const mayFetchRest = () => packNet() === 'wifi' || settings.packCell === true;
// a grown-up's answer to "download the rest on mobile data?": yes (kept), or not now (asked again in a week)
export function allowMobilePack(yes) {
  if (yes) { settings.packCell = true; delete settings.packAskAt; } else { settings.packCell = false; settings.packAskAt = Date.now(); }
  saveSettings(); if (yes) checkPack().catch(() => { });
}
const askDue = () => settings.packCell !== true && (settings.packCell !== false || Date.now() - (settings.packAskAt || 0) > 7 * 864e5);
let AREAS = null, areasTried = null;
const loadAreas = () => areasTried || (areasTried = fetch('voices/areas.json').then(r => r.ok ? r.json() : null).then(j => { AREAS = j && j.groups ? j : null; }).catch(() => { }).finally(() => { if (!AREAS) areasTried = null; })); // (tried again next time if it failed)
let groupOfHash = null;
// which area each line downloads with; a line not listed (added later in Studio) goes with 'world'. With no areas list
// (an older pack) everything is the core, as before.
function groupOf(h) {
  if (!AREAS) return 'core';
  if (!groupOfHash) { groupOfHash = new Map(); for (const [g, hs] of Object.entries(AREAS.groups)) for (const x of String(hs).split(' ')) if (x) groupOfHash.set(x, g); }
  return groupOfHash.get(h) || 'world';
}
const NOT_PLACES = ['core', 'games', 'stories', 'festivals', 'world'];
// the order the areas download in: the core, where the child is, where the children have been, the games, stories and
// festivals, the other places, and last the lines that belong nowhere in particular
export function packOrder() {
  const all = AREAS ? Object.keys(AREAS.groups) : ['core'], out = [], add = g => { if (all.includes(g) && !out.includes(g)) out.push(g); };
  add('core'); const here = hereArea(); if (here) add(here);
  const seen = {}; for (const p of profiles || []) for (const k of Object.keys((p && p.visited) || {})) seen[k] = (seen[k] || 0) + 1;
  Object.keys(seen).sort((a, b) => seen[b] - seen[a]).forEach(add);
  ['games', 'stories', 'festivals'].forEach(add);
  all.filter(g => !NOT_PLACES.includes(g)).forEach(add); add('world'); all.forEach(add);
  return out;
}
let checking = false;
// (battery round, owner 12 Oct AEDT: "my phone gets very hot") the download is spread out: nothing while the valley is
// being built (the busiest seconds of a start), then 6 files at a time with a short rest between (longer once the small
// core is in), so the phone's radio and processor are never kept flat out
const PACK_REST = { core: 150, rest: 400 };
const valleyBuilt = async () => { for (let i = 0; i < 240 && !(window.__sv && window.__sv.bootTimes); i++) await new Promise(r => setTimeout(r, 500)); };
const rest = ms => new Promise(r => setTimeout(r, ms));
async function checkPack() {
  if (checking || !PACK) return; checking = true;
  try {
    await valleyBuilt();
    const cache = await caches.open('sv-voices');
    // (round O, owner: "does it load the voice pack every time? it should be once, unless there are new voices") once
    // the whole pack is on the device, a start only looks at 16 files picked at random, says nothing and downloads
    // nothing; the full check (listing every file) runs only for a new pack, or when a file has gone missing
    const quick = async list => { const pick = list.length <= 64 ? list : Array.from({ length: 16 }, () => list[Math.floor(Math.random() * list.length)]); return (await Promise.all(pick.map(u => cache.match(u).then(Boolean)))).every(Boolean); };
    if (packIsSaved() && await quick(packFiles())) { packEmit({ state: 'ready', quiet: true, known: true, total: packFiles().length }); return; }
    await loadAreas();
    // a pack made by area whose list could not be fetched (a bad connection): nothing is downloaded until it can be,
    // so a phone on mobile data never takes the whole pack by mistake
    if (PACK.areas && !AREAS) return;
    const order = packOrder(), core = packFiles(['core']);
    // only the core is wanted for now (mobile data, no yes yet) and it is all here: nothing to show, maybe a question
    if (!mayFetchRest() && settings.packCore === packSig() + '|' + packLangs().join('') && await quick(core)) { packEmit({ state: 'ready', quiet: true, known: true, core: true, total: core.length }); askRest().catch(() => { }); return; }
    const have = new Set((await cache.keys()).map(r => r.url)), abs = u => new URL(u, location.href).href;
    const missingOf = gs => packFiles(gs).filter(u => !have.has(abs(u)));
    const want = mayFetchRest() ? order : ['core'];
    // (r63, owner: the bar showed 108 %) the files to fetch are fixed now: a language or setting changed while it runs
    // (both languages switched on, say) used to add files to an area's list that the total never counted
    const pending = new Set(missingOf(want));
    let total = pending.size, done = 0;
    if (!total) { donePack(want); packEmit({ state: 'ready', quiet: true, total: packFiles(want).length, core: want.length === 1 }); if (want.length === 1) askRest().catch(() => { }); return; }
    if (navigator.onLine === false) { packEmit({ state: 'waiting', left: total }); return; }
    packEmit({ state: 'loading', done, total });
    // one area at a time, the next chosen again after each (the child may have walked somewhere new meanwhile)
    const left = new Set(want);
    while (left.size) {
      const g = packOrder().find(x => left.has(x)) || [...left][0]; left.delete(g);
      if (g !== 'core' && !mayFetchRest()) break; // (left the Wi-Fi: the rest waits)
      const miss = missingOf([g]).filter(u => pending.has(u));
      for (let i = 0; i < miss.length; i += 6) {
        await Promise.all(miss.slice(i, i + 6).map(async u => { try { const r = await fetch(u); if (r.ok) { await cache.put(u, r); have.add(abs(u)); pending.delete(u); done = Math.min(total, done + 1); } } catch (e) { } }));
        packEmit({ state: 'loading', done, total, area: g });
        if (navigator.onLine === false) { packEmit({ state: 'waiting', left: total - done }); return; } // goes on when the internet is back
        await rest(g === 'core' ? PACK_REST.core : PACK_REST.rest);
      }
      if (g === 'core' && !missingOf(['core']).length) settings.packCore = packSig() + '|' + packLangs().join('');
    }
    if (!missingOf(want).length) { donePack(want); packEmit({ state: 'ready', core: want.length === 1 }); if (want.length === 1) askRest().catch(() => { }); }
    else if (!mayFetchRest() && !missingOf(['core']).length) { saveSettings(); packEmit({ state: 'ready', core: true }); askRest().catch(() => { }); }
    else packEmit({ state: 'waiting', left: missingOf(want).length });
  } finally { checking = false; }
}
function donePack(want) {
  if (want.length === 1) settings.packCore = packSig() + '|' + packLangs().join('');
  else { settings.packSaved = packSig(); settings.packLangs = packLangs().join(''); settings.packCore = packSig() + '|' + packLangs().join(''); }
  saveSettings();
}
// the whole pack is here for these languages (a device that saved it before round R item 12 kept every language)
const packIsSaved = () => settings.packSaved === packSig() && (!settings.packLangs || packLangs().every(L => settings.packLangs.includes(L)));
// on mobile data with the core done: ask a grown-up about the rest (js/packbar.js shows the question)
async function askRest() {
  if (mayFetchRest() || !askDue() || packNet() === 'off') return;
  const rest = packOrder().filter(g => g !== 'core'); if (!rest.length) return;
  // how much is still to come (a device that kept an older pack has most of it already)
  const all = packFiles(rest); if (!all.length) return;
  const have = new Set((await (await caches.open('sv-voices')).keys()).map(r => r.url)), miss = all.filter(u => !have.has(new URL(u, location.href).href)).length;
  if (!miss) return;
  let bytes = 0; for (const g of rest) for (const L of packLangs().concat(['zh', 'hi'])) bytes += (AREAS && AREAS.size && AREAS.size[g] && AREAS.size[g][L]) || 0;
  packEmit({ state: 'ask', mb: Math.max(1, Math.round(bytes * miss / all.length / 1048576)) });
}
const packSig = () => Object.keys(PACK.lines).length + ':' + (PACK.version || 1) + ':' + (PACK.made || '');
// the files of the pack in these areas (all areas when none are named), in the children's own languages (Chinese and
// Hindi only come with the places and games that speak them)
function packFiles(groups) {
  const urls = [], langs = ['en', 'vi', 'zh', 'hi'], mine = packLangs(), want = groups && new Set(groups);
  // (round R) which language each line is in: `other` lists the lines that are not English, space-separated per
  // language (half the size of the old `langOf`, which named every line's language; older packs still have that)
  const other = new Map(); for (const [L, hs] of Object.entries(PACK.other || {})) for (const h of String(hs).split(' ')) if (h) other.set(h, L);
  const langOf = h => (PACK.langOf && PACK.langOf[h]) || other.get(h) || (PACK.other ? 'en' : null);
  for (const [h, slots] of Object.entries(PACK.lines)) {
    if (want && !want.has(groupOf(h))) continue;
    const L1 = langOf(h);
    for (const s of slots) for (const L of L1 ? [L1] : langs) if (!(L === 'en' || L === 'vi') || mine.includes(L)) urls.push(`voices/${L}/${s}/${h}.mp3`);
  }
  const first = 'voices/' + mine[0] + '/'; urls.sort((a, b) => b.startsWith(first) - a.startsWith(first));
  return urls;
}
// Download every file of the pack so it plays with no internet (Grown-ups → "Save voices for offline")
export async function savePackOffline(progress) {
  if (!PACK) return 0; const urls = packFiles();
  let n = 0; const cache = await caches.open('sv-voices');
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(urls.slice(i, i + 6).map(async u => { if (await cache.match(u)) { n++; return; } try { const r = await fetch(u); if (r.ok) { await cache.put(u, r); n++; } } catch (e) { } }));
    progress && progress(Math.min(urls.length, i + 6), urls.length);
  }
  return n;
}

// (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") the core voices
// are on the device; on mobile data the rest waits for a grown-up: a small card asks, and Yes needs a press and hold so
// a little one can't say yes by accident. Not now asks again in a week; Grown-ups → voices can change it any time.
let card = null;
export function askCard(mb) {
  if (card) return;
  card = document.createElement('div'); card.className = 'packask'; card.setAttribute('role', 'dialog');
  card.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 76px);transform:translateX(-50%);z-index:70;width:min(360px,calc(100% - 32px));box-sizing:border-box;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 6px 24px rgba(60,30,90,.25);color:#3a2a20;font:600 14px/1.35 var(--font);text-align:center';
  const p = document.createElement('p'); p.style.margin = '0 0 10px';
  p.textContent = T(`Download the rest of the voices on mobile data? About ${mb} MB. On Wi-Fi they download by themselves.`, `Tải phần giọng đọc còn lại bằng dữ liệu di động? Khoảng ${mb} MB. Khi có Wi-Fi giọng đọc tự tải.`);
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
  const btn = (text, bg) => { const b = document.createElement('button'); b.type = 'button'; b.style.cssText = `position:relative;overflow:hidden;min-height:48px;min-width:120px;flex:1 1 130px;padding:6px 12px;border:0;border-radius:12px;font:700 14px/1.2 var(--font);color:#fff;background:${bg};touch-action:none`; b.innerHTML = '<span style="position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.35)"></span><span style="position:relative"></span>'; b.lastChild.textContent = text; return b; };
  const yes = btn(T('Grown-ups: hold for Yes', 'Người lớn: giữ để đồng ý'), 'var(--purple, #8a5cf6)'), no = btn(T('Not now', 'Để sau'), '#9a8aa8');
  const fill = yes.firstChild; let t = 0;
  const stop = () => { clearTimeout(t); fill.style.transition = 'none'; fill.style.width = '0'; };
  yes.addEventListener('pointerdown', ev => { ev.preventDefault(); fill.style.transition = 'width 1.2s linear'; fill.style.width = '100%'; t = setTimeout(() => { close(); allowMobilePack(true); }, 1200); });
  for (const k of ['pointerup', 'pointerleave', 'pointercancel']) yes.addEventListener(k, stop);
  yes.addEventListener('contextmenu', ev => ev.preventDefault());
  no.onclick = () => { close(); allowMobilePack(false); };
  row.append(yes, no); card.append(p, row); document.body.appendChild(card);
}
const close = () => { if (card) { card.remove(); card = null; } };
