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
  camSpeed: 1
}, store.get(KEY_SETTINGS, {}));
export const saveSettings = () => store.set(KEY_SETTINGS, settings);

export const OUTFITS = [
  { id: 'tunic', color: '#3d7fd6', trim: '#f2d16b' },   // blue explorer tunic
  { id: 'aodai', color: '#e8435a', trim: '#ffd84a' },   // áo dài
  { id: 'dress', color: '#ff7eb8', trim: '#ffffff' },
  { id: 'overalls', color: '#5bbf6a', trim: '#f2d16b' },
  { id: 'hoodie', color: '#9a6bff', trim: '#ffffff' },
  { id: 'sunny', color: '#ffb52e', trim: '#d9502b' }
];
export const HATS = ['none', 'nonla', 'cap', 'crown', 'bunny', 'flower'];
export const HAIR = ['#1d1412', '#3b2618', '#6b4226', '#c98b4a', '#e8c26a', '#a8432a'];
export const SKIN = ['#ffe3d1', '#f6c7a5', '#e0aa80', '#b47a55', '#7a4e33'];
export const HAIRSTYLES = ['short', 'buns', 'long', 'spiky'];
export const GLIDERS = ['#e7c37a', '#ff7eb8', '#5fd3ff', '#8be07a', '#b48cff'];

function newProfile(i) {
  return {
    id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
    name: i === 0 ? 'Bé Na' : 'Bé Bin',
    photo: null,
    look: { outfit: i === 0 ? 'aodai' : 'tunic', hat: i === 0 ? 'flower' : 'nonla', hair: HAIR[0], hairStyle: i === 0 ? 'buns' : 'short', skin: SKIN[1], glider: 0 },
    created: Date.now()
  };
}
export function normalizeProfile(p) {
  const d = {
    wallet: 30,                 // money in "xu": 1 xu = 10c (AUD) = 2.000đ (VND)
    hearts: 3, staminaMax: 1, orbs: 0, leafies: {}, shrines: {}, towers: {}, discovered: {},
    inv: { apple: 3, rice: 2 }, owned: { hats: ['none'], gliders: [0] },
    stickers: [], levels: {}, quests: {}, glider: false, album: [],
    pos: null, dishes: {}, stats: { games: 0, steps: 0 }
  };
  const o = Object.assign({}, d, p);
  for (const k of ['leafies', 'shrines', 'towers', 'discovered', 'inv', 'levels', 'quests', 'dishes', 'stats']) o[k] = Object.assign({}, d[k], p[k] || {});
  o.owned = Object.assign({ hats: ['none'], gliders: [0] }, p.owned || {});
  if (!o.owned.hats.includes(o.look.hat)) o.owned.hats.push(o.look.hat);
  if (!Array.isArray(o.stickers)) o.stickers = [];
  if (!Array.isArray(o.album)) o.album = [];
  return o;
}

export let profiles = store.get(KEY_PROFILES, null);
if (!Array.isArray(profiles) || !profiles.length) profiles = [newProfile(0), newProfile(1)];
profiles = profiles.map(normalizeProfile);

let saveTimer = null;
export function saveProfiles(now) {
  clearTimeout(saveTimer);
  const go = () => {
    if (store.set(KEY_PROFILES, profiles)) return;
    // Out of room: drop the oldest album photos and try again.
    for (const p of profiles) if (p.album.length) p.album.shift();
    store.set(KEY_PROFILES, profiles);
  };
  if (now) go(); else saveTimer = setTimeout(go, 800);
}
export function addProfile() { const p = normalizeProfile(newProfile(profiles.length)); p.name = ''; profiles.push(p); return p; }
export function removeProfile(id) { const i = profiles.findIndex(p => p.id === id); if (i >= 0) profiles.splice(i, 1); saveProfiles(true); }

export function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'sparkle-valley', v: 2, settings, profiles }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'sparkle-valley-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data || data.app !== 'sparkle-valley' || !Array.isArray(data.profiles)) throw new Error('bad file');
  profiles.splice(0, profiles.length, ...data.profiles.map(normalizeProfile));
  Object.assign(settings, data.settings || {});
  saveSettings(); saveProfiles(true);
}
