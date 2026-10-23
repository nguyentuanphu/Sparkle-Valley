export const COPY_VERSION = 3;
export const MAX_COPY_BYTES = 32 * 1024 * 1024;
import type { Profile, Farm, Settings } from '../types/save.js';

export type SaveCopy = {
  app: 'sparkle-valley'; v: 3; saved: number; device: string;
  settings: Settings; profiles: Profile[]; farm: Farm;
};

const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const finiteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function readSaveCopy(text: string): SaveCopy {
  if (new TextEncoder().encode(text).length > MAX_COPY_BYTES) throw new Error('too large');
  let data: any; try { data = JSON.parse(text); } catch { throw new Error('invalid JSON'); }
  if (!object(data) || data.app !== 'sparkle-valley' || data.v !== COPY_VERSION || !finiteNum(data.saved) ||
      typeof data.device !== 'string' || !/^(?:[a-z0-9]{12})?$/.test(data.device) || !object(data.settings) ||
      !Array.isArray(data.profiles) || !object(data.farm)) throw new Error('invalid copy');
  return data as SaveCopy;
}
