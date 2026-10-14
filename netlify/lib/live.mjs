// Releases and festival changes that reach the children's devices at once (round R, owner: "instant, no deploy").
// Sparkle Studio online saves them here (Netlify Blobs store "live", key "live"); the game reads them from /api/live.
// Only well-formed values are kept, so nothing odd can reach a device.
const ID = /^[\w-]{1,40}$/, DATE = /^\d{4}-\d\d-\d\d$/, MD = /^\d\d-\d\d$/;
const int = (v, max) => Number.isInteger(+v) && +v >= 0 ? Math.min(max, +v) : undefined;
export function cleanLive(b) {
  const out = { releases: {}, festivals: {} };
  for (const [id, r] of Object.entries((b && b.releases) || {})) {
    if (!ID.test(id) || !r || typeof r !== 'object') continue;
    const x = {}; if (typeof r.on === 'boolean') x.on = r.on; if (DATE.test(r.start || '')) x.start = r.start; if (DATE.test(r.since || '')) x.since = r.since;
    const d = int(r.days, 3650), n = int(r.newDays, 365); if (d) x.days = d; if (n) x.newDays = n;
    // (owner, 12 Oct) only on these devices (the game's player ids, as in the players report), e.g. the auto play check
    if (Array.isArray(r.devices)) { const dv = [...new Set(r.devices.filter(v => typeof v === 'string' && /^[a-z0-9]{12}$/.test(v)))].slice(0, 50); if (dv.length) x.devices = dv; }
    // (owner, 12 Oct: tester reports) each ticked device's level (auto reports only, or with the ladybird), and the
    // releases testers see early (sneak peeks)
    if (r.levels && typeof r.levels === 'object') { const lv = {}; for (const [d, v] of Object.entries(r.levels).slice(0, 50)) if (/^[a-z0-9]{12}$/.test(d) && (v === 'auto' || v === 'ladybird')) lv[d] = v; if (Object.keys(lv).length) x.levels = lv; }
    if (Array.isArray(r.peeks)) { const pk = [...new Set(r.peeks.filter(v => typeof v === 'string' && ID.test(v)))].slice(0, 20); if (pk.length) x.peeks = pk; }
    // (owner, 13 Oct AEDT) the tester rule: what goes back when someone stops being a tester (js/content/autoplay.js REVERT)
    if (['keep', 'autoplay', 'progress'].includes(r.revert)) x.revert = r.revert;
    if (r.policies && typeof r.policies === 'object') { const policies = {}; for (const [device, value] of Object.entries(r.policies).slice(0, 50)) { if (!/^[a-z0-9]{12}$/.test(device) || !value || typeof value !== 'object') continue; const p = {}; if (['keep', 'autoplay', 'progress'].includes(value.revert)) p.revert = value.revert; if (['x1', 'x2', 'x3', 'x5', 'watch', 'fast'].includes(value.speed)) p.speed = value.speed; if (typeof value.autoplay === 'boolean') p.autoplay = value.autoplay; if (Object.keys(p).length) policies[device] = p; } if (Object.keys(policies).length) x.policies = policies; }
    if (Object.keys(x).length) out.releases[id] = x;
  }
  for (const [id, f] of Object.entries((b && b.festivals) || {})) {
    if (!ID.test(id) || !f || typeof f !== 'object') continue;
    const x = {}; if (typeof f.on === 'boolean') x.on = f.on; if (DATE.test(f.date || '') || MD.test(f.date || '')) x.date = f.date;
    const bu = int(f.buildup, 60); if (bu != null && f.buildup !== '' && f.buildup != null) x.buildup = bu;
    // (owner, 13 Oct) how much it decorates: 1 (as before), 2, 3, 5 (the default, so not kept) or 7 times
    if ([1, 2, 3, 7].includes(+f.deco)) x.deco = +f.deco;
    if (Object.keys(x).length) out.festivals[id] = x;
  }
  return out;
}
// (round R privacy, 9 Oct) what every device gets from /api/live: the rules and when they changed, never who changed them
export const publicLive = v => { const o = { releases: (v && v.releases) || {}, festivals: (v && v.festivals) || {} }; if (v && v.at) o.at = v.at; return o; };
export const readLive = async S => (await S.get('live', { type: 'json' }).catch(() => null)) || { releases: {}, festivals: {} };
export const saveLive = async (S, body, by) => { const v = { ...cleanLive(body), at: new Date().toISOString(), by: String(by || '').slice(0, 40) }; await S.setJSON('live', v); return v; };
