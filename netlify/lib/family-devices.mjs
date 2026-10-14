// Separate private collections. Device credentials are hashed; pairing needs approval on an existing device.
import { randomBytes, createHash } from 'node:crypto';
const secret = () => randomBytes(24).toString('base64url');
const hash = text => createHash('sha256').update(String(text)).digest('hex');
const ID = { test: value => typeof value === 'string' && /^[\p{L}\p{N} _.'-]{1,100}$/u.test(value) && !['__proto__','constructor','prototype'].includes(value) };
const text = value => String(value || '').trim().slice(0, 60);
const codeKey = code => 'pair/' + hash(String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
const error = (status, message) => Object.assign(new Error(message), { status });
export async function familyAction(S, action, body = {}, credential = '', now = Date.now()) {
  const read = key => S.get(key, { type: 'json' });
  const session = credential ? await read('session/' + hash(credential)) : null;
  let family = session ? await read('family/' + session.family) : null;
  const device = family?.devices.find(d => d.id === session?.device);
  const approved = !!(device && device.state === 'approved');
  const requireFamily = () => { if (!approved) throw error(403, 'device not approved'); };
  const save = () => S.setJSON('family/' + family.id, family);
  const newDevice = async (fid, label, state) => { const token = secret(), id = secret(); await S.setJSON('session/' + hash(token), { family: fid, device: id }); return { token, device: { id, label: text(label) || 'Family device', state, at: now } }; };
  if (action === 'create') {
    if (body.recovery) throw error(400, 'use recover');
    const id = secret(), recovery = secret(), d = await newDevice(id, body.label, 'approved');
    family = { id, recovery: hash(recovery), devices: [d.device], photos: {}, at: now };
    await save(); await S.setJSON('recovery/' + hash(recovery), { family: id }); return { family: id, token: d.token, recovery };
  }
  if (action === 'recover') {
    const found = typeof body.recovery === 'string' && body.recovery.length >= 24 ? await read('recovery/' + hash(body.recovery)) : null;
    family = found ? await read('family/' + found.family) : null;
    if (!family || family.recovery !== hash(body.recovery)) throw error(403, 'recovery key not accepted');
    if (family.devices.length >= 30) throw error(409, 'device limit');
    const d = await newDevice(family.id, body.label, 'approved'); family.devices.push(d.device); await save(); return { family: family.id, token: d.token };
  }
  if (action === 'join') {
    const pair = await read(codeKey(body.code));
    if (!pair || pair.expires <= now || pair.claimed) throw error(403, 'pairing code expired or used');
    family = await read('family/' + pair.family); if (!family || family.devices.length >= 30) throw error(409, 'device limit');
    const d = await newDevice(family.id, body.label, 'pending'); family.devices.push(d.device); pair.claimed = d.device.id;
    await save(); await S.setJSON(codeKey(body.code), pair); return { family: family.id, token: d.token, pending: true };
  }
  if (action === 'status') { if (!device || device.state === 'removed') throw error(403, 'device removed'); return { family: family.id, pending: !approved, devices: approved ? family.devices.map(({ id, label, state, at }) => ({ id, label, state, at })) : [], photos: approved ? Object.keys(family.photos) : [] }; }
  requireFamily();
  if (action === 'pair') {
    const code = randomBytes(8).toString('hex').toUpperCase(); await S.setJSON(codeKey(code), { family: family.id, expires: now + 10 * 60e3 }); return { code: code.match(/.{4}/g).join('-'), expires: now + 10 * 60e3 };
  }
  if (action === 'approve' || action === 'remove') {
    const target = family.devices.find(d => d.id === body.device); if (!target) throw error(404, 'device not found');
    if (action === 'approve' && target.state !== 'pending') throw error(409, 'device is not awaiting approval');
    if (action === 'remove' && target.state === 'approved' && family.devices.filter(d => d.state === 'approved').length === 1) throw error(409, 'keep one connected device or use the recovery key');
    target.state = action === 'approve' ? 'approved' : 'removed'; await save(); return { ok: true };
  }
  if (action === 'manifest' || action === 'export') return { family: family.id, format: 'sparkle-family-photos-v1', photos: Object.fromEntries(Object.entries(family.photos).map(([id, p]) => [id, { at: p.at }])) };
  if (action === 'get-photo') { if (!ID.test(body.npc || '') || !family.photos[body.npc]) throw error(404, 'photo not found'); return family.photos[body.npc]; }
  if (action === 'photo') {
    if (!ID.test(body.npc || '')) throw error(400, 'stable character id needed');
    if (body.remove) { delete family.photos[body.npc]; await save(); return { ok: true }; }
    if (typeof body.image !== 'string' || body.image.length > 450000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.image)) throw error(400, 'JPEG photo needed');
    if (!family.photos[body.npc] && Object.keys(family.photos).length >= 60) throw error(409, 'photo limit');
    family.photos[body.npc] = { image: body.image, at: now }; await save(); return { ok: true };
  }

  if (action === 'import') {
    if (body.format !== 'sparkle-family-photos-v1' || !body.photos || typeof body.photos !== 'object') throw error(400, 'family photo backup needed');
    const photos = {};
    for (const [id, p] of Object.entries(body.photos).slice(0, 60)) { if (!ID.test(id) || !p || typeof p.image !== 'string' || p.image.length > 450000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.image)) throw error(400, 'invalid photo backup'); photos[id] = { image: p.image, at: now }; }
    family.photos = photos; await save(); return { ok: true, count: Object.keys(photos).length };
  }
  throw error(404, 'unknown action');
}
