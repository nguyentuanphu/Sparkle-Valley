// Unlocking rule and progress calculation for r90 (owner, 23 Oct 2026 AEDT)
// Existing games and tales are the first set. New r90 entries are the second set.
import { GAME_INFO } from './activities.js';

export const FIRST_SET_GAMES: Record<string, string[]> = {};
for (const [id, info] of Object.entries(GAME_INFO)) {
  const area = info[0];
  (FIRST_SET_GAMES[area] ||= []).push(id);
}

export const FIRST_SET_TALES: Record<string, string[]> = {
  '🇻🇳': ['banhchung', 'sontinh', 'rongtien', 'thanhgiong', 'hoguom', 'caytre', 'duahau', 'caykhe', 'tamcam', 'sodua', 'thachsanh', 'chucuoi', 'cockien', 'vusua', 'baluoiriu', 'quabau', 'thayboi', 'nhacmeo', 'ongtao', 'cachep'],
  '🇦🇺': ['tiddalik', 'rainbowserpent', 'emu', 'dotkangaroo', 'birdcolours', 'magicpudding'],
  '🇨🇳': ['change', 'greatrace', 'maliang', 'weaver', 'nian', 'kongrong'],
  '🇮🇳': ['monkey', 'crow', 'lionrabbit', 'ganesha', 'bluejackal', 'elephantmice']
};

export const FIRST_SET_TALES_WORLD: string[] = [];

export type ProgressItem = { id: string, n: number };
export type Progress = { done: number, need: number, perGame: ProgressItem[] };

function firstSet(type: 'game' | 'tale', areaOrShelf: string): string[] {
  if (type === 'game') return FIRST_SET_GAMES[areaOrShelf] || [];
  return areaOrShelf === 'world' ? FIRST_SET_TALES_WORLD : FIRST_SET_TALES[areaOrShelf] || [];
}

export function progressOf(profile: Record<string, any>, type: 'game' | 'tale', areaOrShelf: string): Progress {
  const ids = firstSet(type, areaOrShelf);
  if (profile.unlockAll || profile.admin || ids.length === 0) return { done: 3, need: 3, perGame: [] };
  const wins = profile.wins || {};
  const reads = profile.taleReads || {};
  const perGame = ids.map(id => {
    const legacyRead = profile.tales && profile.tales[id] ? 1 : 0;
    const n = type === 'game' ? Math.min(3, Math.max(0, Number(wins[id] || 0))) : Math.min(3, Math.max(0, Number(reads[id] || legacyRead)));
    return { id, n };
  });
  const done = perGame.every(item => item.n >= 3) ? 3 : Math.min(2, Math.min(...perGame.map(item => item.n)));
  return { done, need: 3, perGame };
}

export function isOpen(profile: Record<string, any>, id: string, type: 'game' | 'tale', areaOrShelf: string): boolean {
  if (profile.unlockAll || profile.admin) return true;
  const ids = firstSet(type, areaOrShelf);
  return ids.length === 0 || ids.includes(id) || progressOf(profile, type, areaOrShelf).done >= 3;
}
