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
    if (Object.keys(x).length) out.releases[id] = x;
  }
  for (const [id, f] of Object.entries((b && b.festivals) || {})) {
    if (!ID.test(id) || !f || typeof f !== 'object') continue;
    const x = {}; if (typeof f.on === 'boolean') x.on = f.on; if (DATE.test(f.date || '') || MD.test(f.date || '')) x.date = f.date;
    const bu = int(f.buildup, 60); if (bu != null && f.buildup !== '' && f.buildup != null) x.buildup = bu;
    if (Object.keys(x).length) out.festivals[id] = x;
  }
  return out;
}
// (round R privacy, 9 Oct) what every device gets from /api/live: the rules and when they changed, never who changed them
export const publicLive = v => { const o = { releases: (v && v.releases) || {}, festivals: (v && v.festivals) || {} }; if (v && v.at) o.at = v.at; return o; };
export const readLive = async S => (await S.get('live', { type: 'json' }).catch(() => null)) || { releases: {}, festivals: {} };
export const saveLive = async (S, body, by) => { const v = { ...cleanLive(body), at: new Date().toISOString(), by: String(by || '').slice(0, 40) }; await S.setJSON('live', v); return v; };
