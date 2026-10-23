export const COPY_VERSION = 3;
export const MAX_COPY_BYTES = 32 * 1024 * 1024;

type SavedProfile = { id: string; name: string; age: 'little' | 'big'; look: Record<string, unknown> } & Record<string, unknown>;
export type SaveCopy = {
  app: 'sparkle-valley'; v: 3; saved: number; device: string;
  settings: Record<string, unknown>; profiles: SavedProfile[]; farm: Record<string, unknown>;
};

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
const safeKeys = (value: unknown, depth = 0): boolean => {
  if (depth > 30) return false;
  if (Array.isArray(value)) return value.every(item => safeKeys(item, depth + 1));
  if (!object(value)) return true;
  return Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && safeKeys(item, depth + 1));
};

export function readSaveCopy(text: string): SaveCopy {
  if (new TextEncoder().encode(text).length > MAX_COPY_BYTES) throw new Error('too large');
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error('invalid JSON'); }
  if (!object(data) || !safeKeys(data) || data.app !== 'sparkle-valley' || data.v !== COPY_VERSION ||
      typeof data.saved !== 'number' || !Number.isFinite(data.saved) || data.saved <= 0 || data.saved > Date.now() + 864e5 ||
      typeof data.device !== 'string' || !/^(?:[a-z0-9]{12})?$/.test(data.device) ||
      !object(data.settings) || !object(data.farm) || !Array.isArray(data.profiles) || data.profiles.length > 6) throw new Error('invalid copy');
  if (!data.profiles.every((profile: any) => {
    if (!object(profile) || typeof profile.id !== 'string' || !profile.id || typeof profile.name !== 'string' ||
        !['little', 'big'].includes(String(profile.age)) || !object(profile.look)) return false;
    for (const key of ['leafies', 'shrines', 'towers', 'discovered', 'inv', 'levels', 'wins', 'quests', 'dishes', 'stats']) {
      if (profile[key] !== undefined && !object(profile[key])) return false;
    }
    if (profile.owned !== undefined && (!object(profile.owned) ||
        (profile.owned.hats !== undefined && !strings(profile.owned.hats)) ||
        (profile.owned.gliders !== undefined && (!Array.isArray(profile.owned.gliders) || !profile.owned.gliders.every(n => typeof n === 'number'))))) return false;
    if (profile.stickers !== undefined && !Array.isArray(profile.stickers)) return false;
    if (profile.album !== undefined && !Array.isArray(profile.album)) return false;
    return true;
  })) throw new Error('invalid profile');
  if (typeof data.farm.coins !== 'number' || !Number.isFinite(data.farm.coins) || !Array.isArray(data.farm.plots) ||
      !object(data.farm.seeds) || !object(data.farm.basket)) throw new Error('invalid farm');
  return {
    app: 'sparkle-valley', v: COPY_VERSION, saved: data.saved, device: data.device,
    settings: data.settings, profiles: data.profiles, farm: data.farm
  };
}
