// A copy of the children's progress (owner, 13 Oct AEDT): taken when a device becomes a tester, or before an auto play
// run when Studio says only auto play's progress goes back (the tester rule's `revert`), and put back when they stop
// being a tester, or when the run ends. It is put back in place: the game never restarts for it. Rewards stay (badges,
// stickers, the album, clothes, the look) and so does anything a grown-up set (name, age, photo, how hard): which
// fields, js/content/autoplay.js KEEP_FIELDS.
import { profiles, farm, saveProfiles, normalizeProfile } from './state.js';
import { keepRewards } from './content/autoplay.js';

const clone = v => JSON.parse(JSON.stringify(v));
export function takeCopy(key) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), profiles: clone(profiles || []), farm: clone(farm || {}) })); return true; } catch (e) { return false; }
}
export const hasCopy = key => { try { return !!localStorage.getItem(key); } catch (e) { return false; } };
export const dropCopy = key => { try { localStorage.removeItem(key); } catch (e) { } };
// G (optional): the game, so the heroes' hearts follow the put-back profiles
export function putCopyBack(key, G) {
  let c = null; try { c = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { c = null; }
  dropCopy(key);
  if (!c || !Array.isArray(c.profiles) || !profiles) return false;
  const old = new Map<string, Record<string, unknown>>(c.profiles.map((p: Record<string, unknown>) => [p.id, p]));
  // the same objects stay (the heroes and every window hold them): emptied and filled again
  for (const p of profiles) { const o = old.get(p.id); if (!o) continue; const m = normalizeProfile(keepRewards(o, p)); for (const k of Object.keys(p)) delete p[k]; Object.assign(p, m); }
  if (c.farm && farm) { for (const k of Object.keys(farm)) delete farm[k]; Object.assign(farm, c.farm); }
  saveProfiles(true);
  if (G && G.heroes) G.heroes.forEach(h => { if (h && h.profile) { h.hearts = h.profile.hearts; h.stamina = h.staminaMax; h.exhausted = false; } });
  return true;
}
