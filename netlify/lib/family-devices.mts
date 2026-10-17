// @ts-check
// Separate private collections. Device credentials are hashed; pairing needs approval on an existing device.
import { randomBytes, createHash } from 'node:crypto';
import { readFamilyBackup } from '../../js/family-backup.js';
/**
 * @typedef {{ get(key: string, options?: { type: 'json' }): Promise<any>, setJSON(key: string, value: unknown): Promise<unknown>, delete(key: string): Promise<unknown>,
 *   list(options: { prefix: string, cursor?: string }): Promise<{ blobs: { key: string }[], cursor?: string }> }} Store  Netlify Blobs (or the tests' memory store)
 * @typedef {{ id: string, label: string, state: 'approved' | 'pending' | 'removed', at: number, pairKey?: string }} FamilyDevice
 * @typedef {{ id: string, recovery: string, at: number, devices: FamilyDevice[], photos: Record<string, { at: number }> }} Family
 * @typedef {{ family: string, device: string }} Session
 * @typedef {{ family: string, expires: number, claimed?: string }} Pairing
 * @typedef {Record<string, unknown>} Body  what the device sent: any field may be missing or of any kind
 */
/** @returns {string} */
const secret = () => randomBytes(24).toString('base64url');
/** @param {unknown} text @returns {string} */
const hash = text => createHash('sha256').update(String(text)).digest('hex');
const ID = { test: /** @param {unknown} value @returns {value is string} */ value => typeof value === 'string' && /^[\p{L}\p{N} _.'-]{1,100}$/u.test(value) && !['__proto__','constructor','prototype'].includes(value) };
/** @param {unknown} value */
const text = value => String(value || '').trim().slice(0, 60);
/** @param {unknown} code */
const codeKey = code => 'pair/' + hash(String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
/** @param {number} status @param {string} message */
const error = (status, message) => Object.assign(new Error(message), { status });
/** @param {Store} S @param {string} action @param {Body} [body] @param {string} [credential] @param {number} [now] */
export async function familyAction(S, action, body = {}, credential = '', now = Date.now()) {
  /** @param {string} key */
  const read = key => S.get(key, { type: 'json' });
  /** @param {string} prefix @returns {Promise<any[]>} */
  const records = async prefix => { /** @type {any[]} */ const out = []; /** @type {string | undefined} */ let cursor; do { const page = await S.list({ prefix, cursor }); for (const item of page.blobs) { const value = await read(item.key); if (value) out.push(value); } cursor = page.cursor; } while (cursor); return out; };
  /** @param {string} id @returns {Promise<Family | null>} */
  const loadFamily = async id => { const meta = await read('family/' + id); if (!meta) return null; const devices = await records('device/' + id + '/'), photos = await records('photo/' + id + '/'); return { ...meta, devices, photos: Object.fromEntries(photos.map(({ npc, ...photo }) => [npc, photo])) }; };
  /** @param {string} id @param {string} npc */
  const photoKey = (id, npc) => 'photo/' + id + '/' + hash(npc);
  /** @param {string} id @param {string} npc */
  const pictureKey = (id, npc) => 'picture/' + id + '/' + hash(npc);
  /** @type {Session | null} */
  const session = credential ? await read('session/' + hash(credential)) : null;
  let family = session ? await loadFamily(session.family) : null;
  const device = family?.devices.find(d => d.id === session?.device);
  const approved = !!(device && device.state === 'approved');
  /** @returns {Family} */
  const requireFamily = () => { if (!approved || !family) throw error(403, 'device not approved'); return family; };
  /** @param {Family} family */
  const save = family => S.setJSON('family/' + family.id, { id: family.id, recovery: family.recovery, at: family.at });
  /** @param {string} fid @param {unknown} label @param {FamilyDevice['state']} state @returns {Promise<{ token: string, device: FamilyDevice }>} */
  const newDevice = async (fid, label, state) => { const token = secret(), id = secret(); await S.setJSON('session/' + hash(token), { family: fid, device: id }); const device = { id, label: text(label) || 'Family device', state, at: now }; await S.setJSON('device/' + fid + '/' + id, device); return { token, device }; };
  if (action === 'create') {
    if (body.recovery) throw error(400, 'use recover');
    const id = secret(), recovery = secret(), d = await newDevice(id, body.label, 'approved');
    family = { id, recovery: hash(recovery), devices: [d.device], photos: {}, at: now };
    await save(family); await S.setJSON('recovery/' + hash(recovery), { family: id }); return { family: id, token: d.token, recovery };
  }
  if (action === 'recover') {
    const found = typeof body.recovery === 'string' && body.recovery.length >= 24 ? await read('recovery/' + hash(body.recovery)) : null;
    family = found ? await loadFamily(found.family) : null;
    if (!family || family.recovery !== hash(body.recovery)) throw error(403, 'recovery key not accepted');
    if (family.devices.filter(d=>d.state!=='removed').length >= 30) throw error(409, 'device limit');
    const d = await newDevice(family.id, body.label, 'approved'); family.devices.push(d.device); await save(family); return { family: family.id, token: d.token };
  }
  if (action === 'join') {
    const pair = await read(codeKey(body.code));
    if (!pair || pair.expires <= now || pair.claimed) throw error(403, 'pairing code expired or used');
    family = await loadFamily(pair.family); if (!family || family.devices.filter(d=>d.state!=='removed').length >= 30) throw error(409, 'device limit');
    const d = await newDevice(family.id, body.label, 'pending'); family.devices.push(d.device); d.device.pairKey = codeKey(body.code); await S.setJSON('device/' + family.id + '/' + d.device.id, d.device); pair.claimed = d.device.id;
    await save(family); await S.setJSON(codeKey(body.code), pair); return { family: family.id, token: d.token, pending: true };
  }
  if (action === 'status') { if (!family || !device || device.state === 'removed') throw error(403, 'device removed'); return { family: family.id, pending: !approved, devices: approved ? family.devices.map(({ id, label, state, at }) => ({ id, label, state, at })) : [], photos: approved ? Object.keys(family.photos) : [] }; }
  const F = requireFamily();
  // the fields a request names: text only (a character id is checked by ID before it is used)
  const npc = typeof body.npc === 'string' ? body.npc : '', from = typeof body.from === 'string' ? body.from : '', to = typeof body.to === 'string' ? body.to : '';
  if (action === 'pair') {
    const code = randomBytes(8).toString('hex').toUpperCase(); await S.setJSON(codeKey(code), { family: F.id, expires: now + 10 * 60e3 }); return { code: (code.match(/.{4}/g) || []).join('-'), expires: now + 10 * 60e3 };
  }
  if (action === 'approve' || action === 'remove') {
    const target = F.devices.find(d => d.id === body.device); if (!target) throw error(404, 'device not found');
    if (action === 'approve' && target.state !== 'pending') throw error(409, 'device is not awaiting approval');
    if (action === 'remove' && target.state === 'approved' && F.devices.filter(d => d.state === 'approved').length === 1) throw error(409, 'keep one connected device or use the recovery key');
    if (action === 'approve' && target.pairKey) { const pair = await read(target.pairKey); if (!pair || pair.claimed !== target.id || pair.expires <= now) throw error(409, 'pairing expired or replaced'); }
    target.state = action === 'approve' ? 'approved' : 'removed'; await S.setJSON('device/' + F.id + '/' + target.id, target); return { ok: true };
  }
  if (action === 'manifest' || action === 'export') return { family: F.id, format: 'sparkle-family-photos-v1', photos: Object.fromEntries(Object.entries(F.photos).map(([id, p]) => [id, { at: p.at }])) };
  if (action === 'get-photo') { if (!ID.test(npc) || !F.photos[npc]) throw error(404, 'photo not found'); return await read(pictureKey(F.id, npc)); }
  if (action === 'rebind') {
    if (!ID.test(from) || !ID.test(to) || !F.photos[from] || F.photos[to]) throw error(409, 'choose an unassigned photo and empty target');
    // (types, 15 Oct AEDT) a listed photo whose picture is missing is not copied as an empty picture
    const photo = await read(pictureKey(F.id, from)); if (!photo || typeof photo.image !== 'string') throw error(404, 'photo not found');
    await S.setJSON(pictureKey(F.id, to), { ...photo, at: now }); await S.setJSON(photoKey(F.id, to), { npc: to, at: now }); await S.delete(photoKey(F.id, from)); await S.delete(pictureKey(F.id, from)); return { ok: true };
  }
  if (action === 'photo') {
    if (!ID.test(npc)) throw error(400, 'stable character id needed');
    if (body.remove) { await S.delete(photoKey(F.id, npc)); await S.delete(pictureKey(F.id, npc)); return { ok: true }; }
    if (typeof body.image !== 'string' || body.image.length > 450000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.image)) throw error(400, 'JPEG photo needed');
    if (!F.photos[npc] && Object.keys(F.photos).length >= 60) throw error(409, 'photo limit');
    await S.setJSON(pictureKey(F.id, npc), { image: body.image, at: now }); await S.setJSON(photoKey(F.id, npc), { npc, at: now }); return { ok: true };
  }

  if (action === 'import') {
    const checked=readFamilyBackup(body,Object.keys(F.photos));
    if (checked.ok === false) throw error(checked.reason==='limit'?409:400, checked.reason==='limit'?'photo limit':'invalid photo backup');
    for (const [npc, photo] of checked.entries) { await S.setJSON(pictureKey(F.id, npc), {...photo,at:now}); await S.setJSON(photoKey(F.id, npc), { npc, at: now }); } return { ok: true, count: checked.entries.length };
  }
  throw error(404, 'unknown action');
}
