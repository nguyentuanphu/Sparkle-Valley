export const COPY_VERSION = 3;
export const MAX_COPY_BYTES = 32 * 1024 * 1024;
import type { Profile, Farm, Settings } from '../types/save.js';

export type SaveCopy = {
  app: 'sparkle-valley'; v: 3; saved: number; device: string;
  settings: Settings; profiles: Profile[]; farm: Farm;
};

const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(i => typeof i === 'string');
const finiteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function safeKeys(v: unknown, depth = 0): boolean {
  if (depth > 30) return false;
  if (Array.isArray(v)) return v.every(i => safeKeys(i, depth + 1));
  if (!object(v)) return true;
  return Object.entries(v).every(([k, val]) => !['__proto__', 'constructor', 'prototype'].includes(k) && safeKeys(val, depth + 1));
}

function validProfile(p: unknown): p is Profile {
  if (!object(p) || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' ||
      !['little', 'big'].includes(String(p.age)) || !object(p.look)) return false;
  for (const k of ['leafies', 'shrines', 'towers', 'discovered', 'inv', 'levels', 'wins', 'quests', 'dishes', 'stats']) {
    if (p[k] !== undefined && !object(p[k])) return false;
  }
  if (p.owned !== undefined && (!object(p.owned) ||
      (p.owned.hats !== undefined && !strings(p.owned.hats)) ||
      (p.owned.gliders !== undefined && (!Array.isArray(p.owned.gliders) || !p.owned.gliders.every(finiteNum))))) return false;
  if (p.stickers !== undefined && !Array.isArray(p.stickers)) return false;
  if (p.album !== undefined && !Array.isArray(p.album)) return false;
  return true;
}

function validFarm(f: unknown): f is Farm {
  return object(f) && finiteNum(f.coins) && Array.isArray(f.plots) && object(f.seeds) && object(f.basket);
}

export function readSaveCopy(text: string): SaveCopy {
  if (new TextEncoder().encode(text).length > MAX_COPY_BYTES) throw new Error('too large');
  let data: any; try { data = JSON.parse(text); } catch { throw new Error('invalid JSON'); }
  if (!object(data) || !safeKeys(data) || data.app !== 'sparkle-valley' || data.v !== COPY_VERSION ||
      !finiteNum(data.saved) || data.saved <= 0 || data.saved > Date.now() + 864e5 ||
      typeof data.device !== 'string' || !/^(?:[a-z0-9]{12})?$/.test(data.device) ||
      !object(data.settings) || !object(data.farm) || !Array.isArray(data.profiles) || data.profiles.length > 6) throw new Error('invalid copy');
  if (!data.profiles.every(validProfile)) throw new Error('invalid profile');
  if (!validFarm(data.farm)) throw new Error('invalid farm');
  return data as SaveCopy;
}
