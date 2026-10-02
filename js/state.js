// Settings, player profiles and saving. Everything lives in localStorage on this device;
// grown-ups can export/import a backup file to move progress between devices.
const KEY_SETTINGS = 'sv2_settings', KEY_PROFILES = 'sv2_profiles';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

export const settings = Object.assign({
  lang: 'en',            // 'en' | 'vi'
  currency: 'AUD',       // 'AUD' | 'VND'
  sound: true, music: true, voice: true,
  voiceEn: '', voiceVi: '',
  bilingual: false,      // speak the other language too, after a short pause
  alwaysDay: false,
  quality: 'auto',       // 'auto' | 'low' | 'high'
  camSpeed: 1,
  camMode: 'easy',       // 'easy' = fixed high view (best for little ones) | 'free' = drag to look around
  familyVoice: true,     // play the grown-up's recordings when there are some
  familyPitch: 0,        // speaking pitch matched to the recordings (0 = not set)
  voiceRate: 1, voicePitch: 1,
  tts: 'device',         // 'device' | 'eleven' | 'google': optional natural online voice with the grown-up's own key
  ttsKey: '', elevenVoice: '', googleVoiceEn: '', googleVoiceVi: '',
  voiceControl: true,    // show the 🎤 "talk to the game" button where speech recognition exists
  aiKey: '',             // optional Anthropic API key so villagers can chat freely (grown-ups only)
  aiOn: false
}, store.get(KEY_SETTINGS, {}));
export const saveSettings = () => store.set(KEY_SETTINGS, settings);

// Clothing: a style plus any colour. Dresses and shirt-and-shorts work for girls and boys alike.
export const STYLES = ['dress', 'shirt', 'aodai', 'tunic', 'overalls', 'hoodie'];
export const OUTFIT_COLORS = ['#ff5fa2', '#a66bff', '#3cc7e8', '#ffd23f', '#e8434a', '#5fd39a', '#ff9f43', '#3b6fe0', '#ffffff'];
export const HATS = ['none', 'crown', 'cap', 'bunny', 'flower', 'bow', 'nonla'];
export const BACKS = ['none', 'wings', 'cape'];
export const HAIR = ['#1d1412', '#3b2618', '#6b4226', '#c98b4a', '#e8c26a', '#a8432a'];
export const SKIN = ['#ffe3d1', '#f6c7a5', '#e0aa80', '#b47a55', '#7a4e33'];
export const HAIRSTYLES = ['buns', 'short', 'long', 'ponytail', 'spiky'];
export const GLIDERS = ['#e7c37a', '#ff7eb8', '#5fd3ff', '#8be07a', '#b48cff'];

function newProfile(i) {
  return {
    id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
    name: i === 0 ? 'Bé Na' : 'Bé Bin',
    photo: null,
    age: 'little',           // 'little' (under 5: everything spoken, can't lose) or 'big' (5 to 8: harder, real opponents)
    difficulty: 'easy',      // 'easy' | 'medium' | 'hard'
    look: { style: i === 0 ? 'dress' : 'shirt', color: i === 0 ? '#ff5fa2' : '#3b6fe0', hat: i === 0 ? 'bow' : 'cap', back: i === 0 ? 'wings' : 'cape', hair: HAIR[0], hairStyle: i === 0 ? 'buns' : 'short', skin: SKIN[1], glider: 0 },
    created: Date.now()
  };
}
export function normalizeProfile(p) {
  const d = {
    hearts: 3, staminaMax: 1, orbs: 0, leafies: {}, shrines: {}, towers: {}, discovered: {},
    inv: { apple: 3, rice: 2 }, owned: { hats: ['none'], gliders: [0] },
    stickers: [], levels: {}, wins: {}, quests: {}, glider: false, album: [],
    pos: null, dishes: {}, stats: { games: 0, steps: 0 }
  };
  const o = Object.assign({}, d, p);
  if (!o.age) o.age = 'little';
  if (!['easy', 'medium', 'hard'].includes(o.difficulty)) o.difficulty = o.age === 'big' ? 'medium' : 'easy';
  // older saves stored a fixed outfit; turn it into style + colour
  const L = o.look = Object.assign({ style: 'shirt', color: '#3b6fe0', hat: 'none', back: 'none', hair: HAIR[0], hairStyle: 'short', skin: SKIN[1], glider: 0 }, p.look || {});
  if (L.outfit) { L.style = { tunic: 'tunic', aodai: 'aodai', dress: 'dress', overalls: 'overalls', hoodie: 'hoodie', sunny: 'dress' }[L.outfit] || 'shirt'; L.color = { tunic: '#3d7fd6', aodai: '#e8435a', dress: '#ff7eb8', overalls: '#5bbf6a', hoodie: '#9a6bff', sunny: '#ffb52e' }[L.outfit] || L.color; delete L.outfit; }
  for (const k of ['leafies', 'shrines', 'towers', 'discovered', 'inv', 'levels', 'wins', 'quests', 'dishes', 'stats']) o[k] = Object.assign({}, d[k], p[k] || {});
  o.owned = Object.assign({ hats: ['none'], gliders: [0] }, p.owned || {});
  if (!o.owned.hats.includes(o.look.hat)) o.owned.hats.push(o.look.hat);
  if (!Array.isArray(o.stickers)) o.stickers = [];
  if (!Array.isArray(o.album)) o.album = [];
  return o;
}

export let profiles = store.get(KEY_PROFILES, null);
if (!Array.isArray(profiles) || !profiles.length) profiles = [newProfile(0), newProfile(1)];
profiles = profiles.map(normalizeProfile);

// ---------- the shared farm: coins, crops, animals, pets and daily jobs belong to everyone ----------
const KEY_FARM = 'sv2_farm';
export function newFarm(coins = 30) {
  return {
    coins,                       // money in "xu": 1 xu = 10c (AUD) = 2.000đ (VND)
    plots: Array.from({ length: 9 }, () => null),   // {crop, stage, wateredAt, growAt}
    seeds: { carrot: 99, strawberry: 2 },
    basket: {},                  // harvested and collected produce
    animals: [{ kind: 'chicken' }, { kind: 'cow' }], hay: 3, products: {}, lastProduce: Date.now(),
    pets: ['puppy'],
    jobs: { day: '', list: [] }, order: null
  };
}
export let farm = Object.assign(newFarm(), store.get(KEY_FARM, {}));
// carry over money from the first version of this build, where each child had a wallet
if (store.get(KEY_FARM, null) == null) { const w = profiles.reduce((a, p) => a + (p.wallet || 0), 0); if (w) farm.coins = w; }
export function resetFarm() { const keep = farm.coins; Object.assign(farm, newFarm(Math.min(keep, 30))); saveFarm(); }
export function saveFarm() { store.set(KEY_FARM, farm); }

let saveTimer = null;
export function saveProfiles(now) {
  clearTimeout(saveTimer);
  const go = () => {
    saveFarm();
    if (store.set(KEY_PROFILES, profiles)) return;
    // Out of room: drop the oldest album photos and try again.
    for (const p of profiles) if (p.album.length) p.album.shift();
    store.set(KEY_PROFILES, profiles);
  };
  if (now) go(); else saveTimer = setTimeout(go, 800);
}
export const MAX_KIDS = 6;
export function addProfile() { const p = normalizeProfile(newProfile(profiles.length)); p.name = ''; profiles.push(p); return p; }
export function removeProfile(id) { const i = profiles.findIndex(p => p.id === id); if (i >= 0) profiles.splice(i, 1); saveProfiles(true); }

// Saving a backup opens the phone's share sheet when it can, so a grown-up can put the file straight
// into Google Drive or iCloud Drive ("Save to Files"). Otherwise the file is downloaded.
// Resolves to 'shared', 'downloaded' or 'cancelled'.
export async function exportBackup({ share = true } = {}) {
  // Phones only allow some file types in the share sheet (not .json), so the backup is a plain .txt file.
  const name = 'sparkle-valley-backup-' + new Date().toISOString().slice(0, 10) + '.txt';
  const text = JSON.stringify({ app: 'sparkle-valley', v: 2, saved: Date.now(), settings, profiles, farm }, null, 1);
  const done = how => { settings.lastBackup = Date.now(); saveSettings(); return how; };
  if (share && navigator.canShare) {
    try {
      const file = new File([text], name, { type: 'text/plain' });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return done('shared'); }
    } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return done('downloaded');
}
// Days since the last backup (Infinity if never).
export const backupAge = () => settings.lastBackup ? (Date.now() - settings.lastBackup) / 864e5 : Infinity;
export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data || data.app !== 'sparkle-valley' || !Array.isArray(data.profiles)) throw new Error('bad file');
  profiles.splice(0, profiles.length, ...data.profiles.map(normalizeProfile));
  Object.assign(settings, data.settings || {});
  if (data.farm) Object.assign(farm, newFarm(), data.farm);
  saveSettings(); saveProfiles(true);
}
