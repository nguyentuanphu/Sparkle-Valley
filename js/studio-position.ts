// Stable Studio anchors survive a map change. Legacy coordinates require the matching map stamp.
import { anchorOf } from './content/map.js';
export function studioPosition(value: unknown, legacyOnMap: boolean): { x: number, z: number } | null {
  if (!value || typeof value !== 'object') return null;
  const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  if ('place' in value || 'off' in value) {
    if (!('place' in value) || typeof value.place !== 'string' || !('off' in value) || !Array.isArray(value.off) || value.off.length !== 2 || !value.off.every(finite)) return null;
    const anchor = anchorOf(value.place);
    return anchor ? { x: anchor[0] + value.off[0], z: anchor[1] + value.off[1] } : null;
  }
  return legacyOnMap && 'x' in value && 'z' in value && finite(value.x) && finite(value.z) ? { x: value.x, z: value.z } : null;
}
