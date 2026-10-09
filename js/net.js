// Playing together from several devices: one device starts a room (a 4-digit code) and up to 5
// friends join it, peer-to-peer through the free PeerJS service. The room's starter passes messages
// between everyone, and everyone hears everyone through a live voice call.
// Friends: each device can have a friend code. If the grown-ups switch "friends can invite me" on, the
// game listens on that code while it is open, so a friend who is hosting a room can send an invite.
// Nothing goes through a server of ours: only names, outfits, positions and the player photos travel.
// When the direct link can't open (different networks, mobile data), the room carries on through the cloud
// relay (relay.js): encrypted messages through free public MQTT brokers. Voice needs the direct link or a
// TURN relay. Everyone pings everyone every 2 s, so the game can show each friend's signal and ping.
// Photos over the cloud relay get a second lock: each pair of players agrees a private key (ECDH), so someone
// who only listens on the brokers (even knowing the room code) can't open them. Anyone who really joins the
// room is a player and shows in the room list, where the room's starter can remove them (🚪).
// Knocking: a 4-digit room code is easy to guess, so a newcomer only knocks. The room's starter sees the
// newcomer's name and picture and taps "Let in" or "No thanks"; until then the newcomer gets nothing from the
// room (no names, no positions, no voices) and their own microphone stays off. Friends on the saved list
// (their friend code) come straight in without knocking.
import { settings } from './state.js';
import { Channel } from './relay.js';
import { checkMsg } from './netmsg.js';
const PREFIX = 'sparkle-valley-v2-';
export const MAX_ROOM = 6;
let loading = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve();
  if (!loading) loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/peerjs.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  return loading;
}
// How two devices find each other. STUN servers tell each device its public address, which is enough on
// most home Wi-Fi. When one friend is on mobile data or behind a strict router, the devices also need a
// relay (TURN) server to pass the game along. Free public relays are tried by default; a grown-up can paste
// their own relay in Grown-ups (a link from a free TURN service, or a turn: address with a name and password).
const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
// (the old free "Open Relay" TURN service now needs an account, so it is still tried but may not answer;
// the cloud relay below keeps the game working anyway, and a grown-up can add their own TURN for voice)
const PUBLIC_TURN = [{ urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }];
let fetched = null;
export async function iceServers() {
  const r = (settings.turnUrl || '').trim();
  if (/^https:\/\//i.test(r)) { // a link that hands out relay details (e.g. Metered's free plan)
    if (!fetched || fetched.url !== r) { try { const res = await fetch(r); const j = await res.json(); fetched = { url: r, list: Array.isArray(j) ? j : j.iceServers || [] }; } catch (e) { fetched = { url: r, list: [] }; } }
    if (fetched.list.length) return STUN.concat(fetched.list);
  } else if (/^turns?:/i.test(r)) return STUN.concat([{ urls: r.split(/[\s,]+/).filter(Boolean), username: settings.turnUser || '', credential: settings.turnPass || '' }]);
  // the family's own relay, set up once on the website (round O: netlify/functions/turn.mjs gives each game details
  // that last a few hours; the key itself never leaves Netlify)
  const own = await siteTurn(); if (own.length) return STUN.concat(own);
  return STUN.concat(PUBLIC_TURN);
}
let siteTurnAt = 0, siteTurnList = [];
async function siteTurn() {
  if (!/^https:$/.test(location.protocol) && !window.SV_TURN_TEST) return [];
  if (Date.now() - siteTurnAt < 30 * 60e3) return siteTurnList;
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch((window.SV_TURN_TEST || '') + '/api/turn', { signal: ctl.signal }); clearTimeout(t);
    const j = r.ok ? await r.json() : {}; siteTurnList = Array.isArray(j.iceServers) ? j.iceServers.filter(x => x && x.urls) : [];
  } catch (e) { siteTurnList = []; }
  siteTurnAt = Date.now(); return siteTurnList;
}
// PeerJS settings (the free public PeerJS server by default; tests can point it at a local one)
let ICE = STUN.concat(PUBLIC_TURN);
const peerOpts = () => Object.assign({ debug: 0, config: { iceServers: ICE, iceCandidatePoolSize: 2 } }, window.SV_PEER || {});
const prepare = async () => { await loadPeer(); ICE = await iceServers(); };
// (audit, 9 Oct) a photo goes into <img src="…">, so only a plain base64 picture is accepted: no quotes, spaces or
// anything else that could close the attribute and add code
export const okPhoto = p => typeof p === 'string' && p.length < 120000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(p) ? p : null;
// ids and friend codes go into the page, so only plain letters, digits and dashes are accepted
const okId = id => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);
const okLook = l => l && typeof l === 'object' && !Array.isArray(l) ? Object.fromEntries(Object.entries(l).filter(([k, v]) => /^\w{1,16}$/.test(k) && (typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' && v.length < 40 && /^[#\w -]*$/.test(v)))) : {};
const cleanHello = (d, from) => ({ id: from, name: String(d.name || '').slice(0, 20), look: okLook(d.look), photo: okPhoto(d.photo), friend: typeof d.friend === 'string' && /^[A-Z0-9]{4,8}$/i.test(d.friend) ? d.friend : null, pub: typeof d.pub === 'string' && d.pub.length < 200 ? d.pub : null, s: null });
// ---- the private pair keys for photos (ECDH P-256 → AES-GCM) ----
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let keyPair = null;
const myKeys = () => keyPair || (keyPair = crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']));
async function myPub() { return b64(await crypto.subtle.exportKey('raw', (await myKeys()).publicKey)); }
const pairKeys = new Map();
async function pairKey(pub) {
  if (!pairKeys.has(pub)) pairKeys.set(pub, (async () => { const k = await crypto.subtle.importKey('raw', unb64(pub), { name: 'ECDH', namedCurve: 'P-256' }, false, []); return crypto.subtle.deriveKey({ name: 'ECDH', public: k }, (await myKeys()).privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); })());
  return pairKeys.get(pub);
}
// a smaller copy of the photo for the cloud (about 5 KB)
function smallPhoto(src, size = 112) {
  return new Promise(res => { const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(im, 0, 0, size, size); res(c.toDataURL('image/jpeg', .72)); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = src; });
}

export const Net = {
  peer: null, conns: new Map(), calls: new Map(), cloud: null, cloudOn: false, _seen: new Set(), hostId: null, audios: new Map(), mic: null, code: null, role: null, muted: false, me: null, hello: null,
  knocking: false,           // (a newcomer) waiting at the door for the room's starter
  knocks: new Map(),         // (the room's starter) who is at the door: id -> {id, name, look, photo, friend, via, d}
  _admitted: new Set(),
  remotes: {},               // everyone else in the room: id -> {id, name, look, photo, friend, s:{x,y,z,yaw,st}}
  beacon: null,              // the friend-code listener
  handlers: {},
  on(type, f) { (this.handlers[type] = this.handlers[type] || []).push(f); },
  off(type, f) { const l = this.handlers[type]; if (l) this.handlers[type] = l.filter(x => x !== f); },
  emit(type, d) { (this.handlers[type] || []).forEach(f => { try { f(d); } catch (e) { console.warn(e); } }); },
  get connected() { return !this.knocking && ([...this.conns.values()].some(c => c.open) || (this.cloudOn && !!this.cloud && Object.keys(this.remotes).length > 0)); },
  get count() { return 1 + Object.keys(this.remotes).length; },
  get remote() { return Object.values(this.remotes)[0] || null; },  // older code: the first friend

  // The microphone (owner's iPhone bug, round F: "no microphone" although the phone has one). iPhones only open the
  // microphone straight after a tap, so a try without one can fail; that says "tap 🎙️ Microphone on" and only a phone
  // with really no microphone hears "no microphone"; a blocked one gets how to allow it. Round O (owner: the Friends
  // screen got stuck and the microphone never came on): it no longer tries again on every tap anywhere on the screen
  // (each try could bring the iPhone's question up again); the child taps the 🎙️ button in Friends or the call button.
  micError: null,
  async getMic() {
    if (this.mic) return this.mic;
    if (this._micAsking) return this._micAsking;
    this._micAsking = (async () => {
      const md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) { this.micError = 'nomedia'; this.emit('status', { key: 'nomic' }); return null; }
      let err = null;
      for (const audio of [{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }, true]) {
        try { this.mic = await md.getUserMedia({ audio, video: false }); break; } catch (e) { err = e; if (e && (e.name === 'NotFoundError' || e.name === 'NotAllowedError')) break; }
      }
      if (this.mic) { this.micError = null; this._micOn(); return this.mic; }
      const name = (err && err.name) || 'Error', tapped = !!(navigator.userActivation && navigator.userActivation.isActive);
      this.micError = name;
      if (name === 'NotFoundError' || name === 'OverconstrainedError') this.emit('status', { key: 'nomic' });
      else this.emit('status', { key: name === 'NotAllowedError' && tapped ? 'micdenied' : 'mictap' });
      return null;
    })();
    try { return await this._micAsking; } finally { this._micAsking = null; }
  },
  // the microphone arrived after the calls started (they carried silence): send it in every open call
  _micOn() {
    const track = this.mic && this.mic.getAudioTracks()[0]; if (!track) return;
    track.enabled = !this.muted && !this.knocking;
    for (const call of this.calls.values()) {
      const pc = call && call.peerConnection; if (!pc || !pc.getSenders) continue;
      const snd = pc.getSenders().find(x => x.track && x.track.kind === 'audio') || pc.getSenders().find(x => !x.track);
      if (snd && snd.track !== track) snd.replaceTrack(track).catch(() => { });
    }
    this.emit('status', { key: 'micon' });
  },

  async host(hello) {
    await prepare().catch(() => { }); await this.getMic();
    this.close(true);
    this.role = 'host'; this.hello = await this._withPub(hello);
    for (let tries = 0; tries < 4 && window.Peer; tries++) {
      this.code = String(1000 + Math.floor(Math.random() * 9000));
      const ok = await new Promise(res => {
        const p = new window.Peer(PREFIX + this.code, peerOpts());
        const t = setTimeout(() => { try { p.destroy(); } catch (e) { } res('down'); }, 9000);   // the meeting service is not answering
        p.on('open', id => { clearTimeout(t); this.peer = p; this.me = id; res(true); });
        p.on('error', err => { clearTimeout(t); if (err.type === 'unavailable-id') { p.destroy(); res(false); } else { this.emit('status', { key: 'error', err }); res(true); } });
      });
      if (ok === true || ok === 'down') break;
    }
    if (!this.code) this.code = String(1000 + Math.floor(Math.random() * 9000));
    if (!this.me) this.me = PREFIX + this.code;   // cloud relay only
    if (this.peer) {
      this.peer.on('connection', c => this._hostConn(c));
      this.peer.on('call', call => { if (!this._admitted.has(call.peer)) { try { call.close(); } catch (e) { } return; } call.answer(this.mic || undefined); this._call(call); });
      this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (e) { } });
    }
    await this._startCloud();
    if (!this.peer && !this.cloud.connected) { this.emit('status', { key: 'error' }); return null; }
    this._startPings(); this._wake(true);
    this.emit('status', { key: 'waiting', code: this.code });
    return this.code;
  },
  async join(code, hello) {
    await prepare().catch(() => { }); await this.getMic();
    this.close(true);
    hello = await this._withPub(hello);
    this.role = 'guest'; this.code = code; this.hello = hello; this.hostId = PREFIX + code;
    this._knock(true); this._heard = 0;
    this.emit('status', { key: 'connecting' });
    // the cloud relay starts at the same time, so there is a second way in from the very start
    const cloudReady = this._startCloud();
    let p = null;
    if (window.Peer) {
      p = new window.Peer(peerOpts()); this.peer = p;
      p.on('error', err => { if (err.type === 'peer-unavailable') this._noDirect = true; });
      // calls only from players the starter introduced (the introduction can arrive a moment after the call rings)
      p.on('call', call => { let n = 0; const tryIt = () => { if (this.peer !== p) return; if (this.remotes[call.peer] && !this.knocking) { call.answer(this.mic || undefined); this._call(call); } else if (++n > 20) { try { call.close(); } catch (e) { } } else setTimeout(tryIt, 200); }; tryIt(); });
      p.on('disconnected', () => { try { p.reconnect(); } catch (e) { } });
      this.me = await new Promise(res => { const t = setTimeout(() => res(null), 7000); p.on('open', id => { clearTimeout(t); res(id); }); });
    }
    if (!this.me) this.me = 'sv-c-' + Math.random().toString(36).slice(2, 10);
    await cloudReady;
    const host = this.hostId;
    if (p && p.open) {
      const c = p.connect(host, { reliable: true }); this.conns.set(host, c);
      c.on('open', () => c.send(Object.assign({ t: 'hello' }, hello))); // a knock: the call starts once we are let in
      c.on('data', d => this._recv(d, host));
      // the direct link broke: carry on through the cloud relay if the room is still there
      c.on('close', () => { this.conns.delete(host); if (this.role !== 'guest') return; this._useCloud(); this._helloCloud(); this.emit('status', { key: 'cloud' }); setTimeout(() => { if (this.role === 'guest' && !this._hostSeen(15000)) { Object.keys(this.remotes).forEach(id => this._gone(id)); this.emit('status', { key: 'left' }); } }, 15000); });
    }
    // after 7 s without a direct link, go through the cloud relay; explain, and give up with tips after 30 s
    // (knocking: the starter has heard the knock, so keep knocking for up to 2 minutes)
    const t0 = Date.now(); this._slowTold = false;
    const watch = setInterval(() => {
      if (this.role !== 'guest' || this.code !== code) { clearInterval(watch); return; }
      const c = this.conns.get(host), s = (Date.now() - t0) / 1000;
      if (this.remotes[host]) { clearInterval(watch); return; }
      if (this._heard) { if (this.cloudOn && !(c && c.open) && Math.floor(s) % 4 === 0) this._helloCloud(); if (Date.now() - this._heard > 120000) { clearInterval(watch); this.emit('status', { key: 'noanswer' }); this.close(true); } return; }
      if (c && c.open) return;
      if ((s > 7 || !p || !p.open || (c && c.peerConnection && c.peerConnection.iceConnectionState === 'failed')) && !this.cloudOn) { this._useCloud(); this._helloCloud(); }
      if (this.cloudOn && s > 3 && Math.floor(s) % 4 === 0) this._helloCloud();
      if (s > 12 && !this._slowTold) { this._slowTold = true; this.emit('status', { key: 'slow' }); }
      if (s > 30) { clearInterval(watch); this.emit('status', { key: this._noDirect && this.cloud && this.cloud.connected ? 'nocode' : 'stuck' }); this.close(true); }
    }, 1000);
    this._startPings(); this._wake(true);
  },

  // the room's starter: welcome a new friend, introduce everyone, and pass messages along
  _hostConn(c) {
    c.on('open', () => {
      if (Object.keys(this.remotes).length >= MAX_ROOM - 1 || (this._banned && this._banned.has(c.peer))) { c.send({ t: 'full', from: this.me }); setTimeout(() => c.close(), 300); return; }
      this.conns.set(c.peer, c);   // (a knock until let in: the welcome waits for admit())
      if (this._admitted.has(c.peer)) this._welcome(c.peer);
    });
    c.on('data', raw => {
      if (!raw || typeof raw !== 'object') return;
      raw.from = c.peer;                                  // the host decides who a message is from
      if (this._dup(raw)) return;                         // (a copy that also came through the cloud relay)
      const d = checkMsg(raw, c.peer); if (!d) return;    // checked once, before it is passed on to anyone (netmsg.js)
      if (!this._admitted.has(c.peer)) { if (d.t === 'hello') this._recv(d, c.peer, true); return; } // at the door: only the knock
      if (d.to && d.to !== this.me) { const t = this.conns.get(d.to); if (t && t.open && this._admitted.has(d.to)) t.send(d); return; }
      if (!d.to) for (const [id, o] of this.conns) if (id !== c.peer && o.open && this._admitted.has(id)) o.send(d);
      this._recv(d, c.peer, true);
    });
    c.on('close', () => { this.conns.delete(c.peer); this._goneKnock(c.peer); this._gone(c.peer); for (const o of this.conns.values()) if (o.open) o.send({ t: 'bye', from: c.peer }); });
  },

  _recv(d, via, checked) {
    if (!d || typeof d !== 'object') return;
    const from = d.from || via;
    if (!checked) { if (this._dup(d)) return; d = checkMsg(d, from); if (!d) return; } // every message: known kind, right fields, sizes and rate (netmsg.js; copies are not counted twice)
    if (d.to && d.to !== this.me) return;
    if (from === this.me || !okId(from)) return;
    if (this._banned && this._banned.has(from)) return;
    // the room's starter: someone not let in yet can only knock (a hello); everything else from them is dropped
    if (this.role === 'host' && !this._admitted.has(from)) { if (d.t === 'hello') this._atDoor(d, from, via); return; }
    // a newcomer at the door listens only to the starter's answer
    if (this.role === 'guest' && this.knocking && !(from === this.hostId && /^(hello|full|kick|nope|door)$/.test(d.t))) return;
    if (d.t === 's' && ![d.x, d.y, d.z, d.yaw].every(Number.isFinite)) return;
    if (d.mid) { if (this._seen.has(d.mid)) return; this._seen.add(d.mid); if (this._seen.size > 800) this._seen = new Set([...this._seen].slice(-400)); }
    if (this.remotes[from]) { this.remotes[from].last = Date.now(); if (via !== 'cloud') this.remotes[from].direct = Date.now(); }
    if (d.t === 'cloudon') { this._useCloud(); return; }
    if (d.t === 'ping') { this.send({ t: 'pong', to: from, ts: d.ts }); return; }
    if (d.t === 'pong') { const r = this.remotes[from]; if (r) { const rtt = Date.now() - d.ts; r.rtt = r.rtt ? Math.round(r.rtt * .6 + rtt * .4) : rtt; r.route = via === 'cloud' ? 'cloud' : 'direct'; this.emit('quality', r); } return; }
    // only the room's starter can say the room is full or ask someone to leave
    if (d.t === 'full') { if (this.role === 'guest' && from === this.hostId) { this.emit('status', { key: 'full' }); this.close(true); } return; }
    if (d.t === 'kick') { if (this.role === 'guest' && from === this.hostId) { this.emit('status', { key: 'removed' }); this.close(true); } return; }
    if (d.t === 'nope') { if (this.role === 'guest' && from === this.hostId) { this.emit('status', { key: 'denied' }); this.close(true); } return; }
    if (d.t === 'door') { if (this.role === 'guest' && from === this.hostId && this.knocking) { if (!this._heard) this.emit('status', { key: 'knocking' }); this._heard = Date.now(); } return; }
    if (d.t === 'hello') {
      const known = this.remotes[from];
      if (known && known.pub && d.pub && d.pub !== known.pub) return; // someone pretending to be a friend already here
      if (via === 'cloud' && this.role === 'host' && !known) {
        if (Object.keys(this.remotes).length >= MAX_ROOM - 1) { this._cloudSend({ t: 'full', to: from }); return; }
        this._useCloud(); this._welcome(from, 'cloud');
        this.emit('status', { key: 'cloud' });
      }
      // a newcomer: the starter's hello means we were let in (the microphone comes on, the call starts)
      if (this.role === 'guest' && from === this.hostId && this.knocking) {
        this._knock(false);
        this.emit('status', { key: via === 'cloud' ? 'cloud' : 'connected' });
        if (via !== 'cloud' && this.peer && this.peer.open && !this.calls.has(from)) { const call = this.peer.call(from, this.mic || this._silence()); if (call) this._call(call); }
      }
      const r = this.remotes[from] = Object.assign(cleanHello(d, from), { last: Date.now(), route: via === 'cloud' ? 'cloud' : (known && known.route) || 'direct', rtt: known && known.rtt, s: known && known.s, direct: known && known.direct, gotPhoto: known && known.gotPhoto });
      if (known && known.photo && !r.photo) r.photo = known.photo;
      if (known && !r.pub) r.pub = known.pub;
      // only rebuild the friend's character when something about them changed
      if (!known || known.name !== r.name || known.photo !== r.photo || JSON.stringify(known.look) !== JSON.stringify(r.look)) this.emit('hello', r);
      // the room's starter introduces a newcomer to everyone already there (cloud friends included)
      if (!known && this.role === 'host') this.send({ t: 'hello', from, name: r.name, look: r.look, friend: r.friend, pub: r.pub, photo: via === 'cloud' ? null : r.photo });
      // my photo for a friend on the cloud relay goes in its own privately locked message
      if (this.cloudOn || via === 'cloud') this._sendPhoto(from);
      if (known) return;
      // guests call each other too, so everyone hears everyone (the newer one rings)
      if (this.role === 'guest' && from !== via && this.me > from && !this.calls.has(from) && this.peer && this.peer.open) { const call = this.peer.call(from, this.mic || this._silence()); if (call) this._call(call); }
      return;
    }
    if (d.t === 'bye') { this._gone(from); return; }
    if (d.t === 'photo') { this._openPhoto(d, from); return; }
    if (d.t === 's') { if (this.remotes[from]) this.remotes[from].s = d; return; }
    this.emit(d.t, Object.assign({}, d, { from }));
  },
  // ---------- knocking ----------
  // (a newcomer) waiting at the door: the microphone stays off until the room's starter lets us in
  _knock(on) { this.knocking = on; if (!on) this._heard = 0; if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !on && !this.muted); },
  // (the room's starter) someone knocked: a saved friend comes straight in, anyone else waits for "Let in"
  _atDoor(d, id, via) {
    const was = this.knocks.get(id), h = Object.assign(cleanHello(d, id), { via, d });
    const full = Object.keys(this.remotes).length >= MAX_ROOM - 1;
    if (full) { if (via === 'cloud') this._cloudSend({ t: 'full', to: id }); else { const c = this.conns.get(id); if (c && c.open) try { c.send({ t: 'full', from: this.me }); } catch (e) { } } return; }
    const friends = Array.isArray(settings.friends) ? settings.friends : [];
    if (h.friend && friends.some(f => f.code === String(h.friend).toUpperCase())) { this.knocks.set(id, h); this.admit(id); return; }
    this.knocks.set(id, was ? Object.assign(was, h, { at: was.at }) : Object.assign(h, { at: Date.now() }));
    this._toDoor(id, { t: 'door' });
    if (!was) this.emit('knock', this.knocks.get(id));
  },
  _toDoor(id, d) { const k = this.knocks.get(id), c = this.conns.get(id); if (c && c.open) { try { c.send(Object.assign({ from: this.me }, d)); } catch (e) { } } if (this.cloud && (!c || !c.open || (k && k.via === 'cloud'))) this._cloudSend(Object.assign({ to: id }, d)); },
  // the welcome: my hello and everyone already in the room
  _welcome(id, via) {
    if (via === 'cloud') {
      this._cloudSend(Object.assign({ t: 'hello', to: id }, this.hello || {}, { photo: null }));
      // (everyone else a moment later: the cloud may not keep the order, and a newcomer listens to the starter first)
      setTimeout(() => { if (this.role === 'host') for (const r of Object.values(this.remotes)) if (r.id !== id) this._cloudSend({ t: 'hello', to: id, from: r.id, name: r.name, look: r.look, friend: r.friend, pub: r.pub }); }, 700);
      return;
    }
    const c = this.conns.get(id); if (!c || !c.open) return;
    if (this.cloudOn) c.send({ t: 'cloudon', from: this.me });
    c.send(Object.assign({ t: 'hello', from: this.me }, this.hello || {}));
    for (const r of Object.values(this.remotes)) if (r.id !== id) c.send({ t: 'hello', from: r.id, name: r.name, look: r.look, photo: r.photo, friend: r.friend, pub: r.pub });
    this.emit('status', { key: 'connected' });
  },
  admit(id) {
    if (this.role !== 'host') return;
    const k = this.knocks.get(id); this.knocks.delete(id); this._admitted.add(id);
    if (!k) return;
    const c = this.conns.get(id);
    if (c && c.open) this._welcome(id); else if (k.via === 'cloud') this._useCloud();
    this._recv(k.d, k.via, true);  // now in: the room meets them (the cloud welcome goes out from here)
    this.emit('knock', null);
  },
  deny(id) {
    if (this.role !== 'host') return;
    this._toDoor(id, { t: 'nope' }); this.knocks.delete(id);
    (this._banned = this._banned || new Set()).add(id);
    const c = this.conns.get(id); if (c) setTimeout(() => { try { c.close(); } catch (e) { } }, 400);
    this.emit('knock', null);
  },
  _goneKnock(id) { if (this.knocks.delete(id)) this.emit('knock', null); },
  _dup(d) { return typeof d.mid === 'string' && this._seen.has(d.mid); },
  _gone(id) {
    if (!this.remotes[id]) return;
    const r = this.remotes[id]; delete this.remotes[id];
    const call = this.calls.get(id); try { call && call.close(); } catch (e) { } this.calls.delete(id);
    const a = this.audios.get(id); if (a) { a.srcObject = null; this.audios.delete(id); }
    this.emit('left', r);
  },

  _call(call) {
    this.calls.set(call.peer, call);
    call.on('stream', stream => {
      let a = this.audios.get(call.peer);
      if (!a) { a = new Audio(); a.autoplay = true; a.setAttribute('playsinline', ''); this.audios.set(call.peer, a); }
      a.srcObject = stream; a.play().catch(() => this.emit('status', { key: 'tapaudio' }));
      this.emit('voice', true);
      this._meter(stream, call.peer);
    });
    call.on('close', () => { this.calls.delete(call.peer); this.emit('voice', this.calls.size > 0); });
  },
  // A silent stream so a child without a microphone can still hear their friends.
  _silence() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const d = a.createMediaStreamDestination(); return d.stream; } catch (e) { return undefined; } },
  // Report when anyone is talking (to light up the speech icon).
  _meters: new Map(),
  _meter(stream, id) {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)(), src = a.createMediaStreamSource(stream), an = a.createAnalyser(); an.fftSize = 256; src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      this._meters.set(id, () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); return m > 14; });
      if (!this._mt) this._mt = setInterval(() => { let on = false; for (const f of this._meters.values()) on = f() || on; this.emit('talking', on); }, 150);
    } catch (e) { }
  },

  // the room's starter can ask someone to leave (a grown-up's tool if anyone is unkind)
  // (works for friends on the direct link and on the cloud relay; they can't come back into this room)
  kick(id) {
    if (this.role !== 'host') return;
    (this._banned = this._banned || new Set()).add(id);
    const c = this.conns.get(id); if (c && c.open) { try { c.send({ t: 'kick', from: this.me }); } catch (e) { } setTimeout(() => { try { c.close(); } catch (e) { } }, 400); }
    if (this.cloud) this._cloudSend({ t: 'kick', to: id });
    this._gone(id); this.send({ t: 'bye', from: id });
  },
  setMuted(m) { this.muted = m; if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !m && !this.knocking); },
  resumeAudio() { for (const a of this.audios.values()) a.play().catch(() => { }); },
  // ---------- the cloud relay ----------
  async _startCloud() {
    if (this.cloud) this.cloud.close();
    const code = this.code, ch = this.cloud = new Channel({ kind: 'room', code, onMsg: m => { if (this.cloud === ch) this._recv(m, 'cloud'); } });
    await ch.start();
  },
  // from now on everything also goes through the cloud (someone in the room can't link directly)
  _useCloud() {
    if (this.cloudOn) return; this.cloudOn = true;
    for (const c of this.conns.values()) if (c.open) try { c.send({ t: 'cloudon', from: this.me }); } catch (e) { }
    for (const id of Object.keys(this.remotes)) this._sendPhoto(id);
  },
  async _withPub(hello) { try { this.pub = await myPub(); } catch (e) { this.pub = null; } return Object.assign({}, hello || {}, this.pub ? { pub: this.pub } : {}); },
  // send my photo to one friend through the cloud, locked with our pair key (once per friend)
  async _sendPhoto(id) {
    const r = this.remotes[id], mine = this.hello && this.hello.photo; this._photoTo = this._photoTo || new Set();
    if (!r || !r.pub || !mine || !this.cloud || this._photoTo.has(id + r.pub)) return;
    this._photoTo.add(id + r.pub);
    try {
      const small = await smallPhoto(mine); if (!small) return;
      const iv = crypto.getRandomValues(new Uint8Array(12)), ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pairKey(r.pub), new TextEncoder().encode(small));
      this._cloudSend({ t: 'photo', to: id, iv: b64(iv), ct: b64(ct), mid: 'p' + Math.random().toString(36).slice(2, 10) });
    } catch (e) { this._photoTo.delete(id + r.pub); }
  },
  async _openPhoto(d, from) {
    const r = this.remotes[from]; if (!r || !r.pub || typeof d.ct !== 'string' || d.ct.length > 160000) return;
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(d.iv) }, await pairKey(r.pub), unb64(d.ct)), photo = okPhoto(new TextDecoder().decode(pt));
      if (photo && this.remotes[from] === r && r.photo !== photo) { r.photo = photo; this.emit('hello', r); }
    } catch (e) { }
  },
  _cloudSend(d) { if (this.cloud) this.cloud.send(Object.assign({ from: this.me }, d)); },
  _helloCloud() { const h = Object.assign({}, this.hello || {}, { photo: null }); this._cloudSend(Object.assign({ t: 'hello', to: this.hostId }, h)); },
  _hostSeen(ms) { const r = this.remotes[this.hostId]; return r && Date.now() - (r.last || 0) < ms; },
  // ping everyone every 2 s (for the signal bars), and notice friends who have gone quiet
  _startPings() {
    clearInterval(this._pt);
    this._pt = setInterval(() => {
      if (!this.role) return;
      this.send({ t: 'ping', ts: Date.now() });
      for (const [id, r] of Object.entries(this.remotes)) {
        const quiet = Date.now() - (r.last || Date.now());
        if (quiet > 20000) { this._gone(id); continue; }
        r.weak = quiet > 6000;
        if (r.direct && Date.now() - r.direct > 6000 && r.route !== 'cloud') { r.route = 'cloud'; if (!this.cloudOn) this._useCloud(); }
      }
      this.emit('quality', null);
    }, 2000);
  },
  // keep the screen awake while playing together (so the phone does not sleep and drop the link)
  async _wake(on) {
    try {
      if (on && 'wakeLock' in navigator && !this._lock) { this._lock = await navigator.wakeLock.request('screen'); this._lock.addEventListener('release', () => { this._lock = null; }); }
      if (!on && this._lock) { await this._lock.release(); this._lock = null; }
    } catch (e) { this._lock = null; }
  },
  // what the game shows about the connection: signal bars, ping, route, this device's network
  quality(id) {
    const r = this.remotes[id]; if (!r) return null;
    const rtt = r.rtt || null, bars = r.weak ? 1 : rtt == null ? 2 : rtt < 150 ? 4 : rtt < 300 ? 3 : rtt < 700 ? 2 : 1;
    return { rtt, bars, route: r.route || 'direct', weak: !!r.weak };
  },
  netInfo() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    return { online: navigator.onLine !== false, type: c.type || '', eff: c.effectiveType || '', down: c.downlink || null, rtt: c.rtt || null, brokers: this.cloud ? this.cloud.connected : 0, cloud: this.cloudOn, voice: this.calls.size > 0 };
  },
  // send to everyone in the room, or to one friend with {to: id}
  send(d) {
    d = Object.assign({ mid: Math.random().toString(36).slice(2, 10) + (this._n = (this._n || 0) + 1) }, d);
    let fresh = false;
    if (d.t === 'hello' && !d.from) { if (this.pub) d.pub = this.pub; const { t, mid, ...me } = d; const was = this.hello && this.hello.photo; this.hello = me; if (me.photo !== was) { this._photoTo = new Set(); fresh = true; } }
    if (this.cloudOn && this.cloud) {
      // positions go through the cloud 5 times a second at most; photos never ride in the open hello there
      if (d.t !== 's' || !this._sT || Date.now() - this._sT > 190) { if (d.t === 's') this._sT = Date.now(); this._cloudSend(d.t === 'hello' ? Object.assign({}, d, { photo: null }) : d); }
      if (fresh) for (const id of Object.keys(this.remotes)) this._sendPhoto(id);
    }
    if (this.role === 'host') {
      const out = Object.assign({ from: this.me }, d);
      if (d.to) { const c = this.conns.get(d.to); if (c && c.open && this._admitted.has(d.to)) try { c.send(out); } catch (e) { } return; }
      for (const [id, c] of this.conns) if (c.open && this._admitted.has(id)) try { c.send(out); } catch (e) { }
    } else for (const c of this.conns.values()) if (c.open) try { c.send(d); } catch (e) { }
  },

  // ---------- friends ----------
  async listenForFriends(code, onInvite) {
    this.stopListening();
    if (!code) return;
    try {
      await loadPeer();
      const b = new window.Peer(PREFIX + 'f-' + code, peerOpts()); this.beacon = b;
      b.on('connection', c => c.on('data', d => { if (d && d.t === 'invite' && /^\d{4}$/.test(String(d.room))) onInvite({ name: String(d.name || '').slice(0, 20), room: String(d.room) }); setTimeout(() => c.close(), 500); }));
      b.on('error', () => { });
      b.on('disconnected', () => { try { b.reconnect(); } catch (e) { } });
    } catch (e) { }
  },
  // ---------- friends' status through the cloud relay ----------
  // Each device that has "friends can see me" switched on keeps a small, encrypted status note on its friend
  // code's topic: online or not, where it is in the valley, and the room it is playing in. The note says
  // "offline" by itself when the device goes away (MQTT "last will"). Invites also arrive this way.
  friends: { ch: null, code: null, watching: new Set(), status: {}, onInvite: null, onChange: null, share: false },
  async friendsStart({ code, share, onInvite, onChange }) {
    const F = this.friends; F.onInvite = onInvite; F.onChange = onChange;
    if (F.ch && F.code === code && F.share === share) return;
    // sharing switched off (or a new code): leave an "offline" note straight away, so friends stop seeing me
    if (F.ch) { const old = F.ch; if (F.share) old.send({ t: 'pres', code: F.code, online: false, ts: Date.now() }, { retain: true }); setTimeout(() => old.close(), 500); }
    F.share = share;
    F.code = code; F.watching = new Set();
    F.ch = new Channel({ kind: 'pres', code, will: share ? { t: 'pres', code, online: false } : null, onMsg: m => {
      if (m.t === 'pres' && m.code && m.code !== code) { if (m.room && !/^\d{4}$/.test(String(m.room))) m.room = null; const was = F.status[m.code]; F.status[m.code] = Object.assign({}, m, { seen: Date.now(), lastOnline: m.online ? Date.now() : (was && was.lastOnline) || m.ts || null }); F.onChange && F.onChange(m.code); }
      if (m.t === 'invite' && m._topic === F.inboxTopic && /^\d{4}$/.test(String(m.room))) F.onInvite && F.onInvite({ name: String(m.name || '').slice(0, 20), room: String(m.room) });
    } });
    await F.ch.start();
    F.inboxTopic = await F.ch.watch('inbox', code);
  },
  async friendsWatch(codes) { const F = this.friends; if (!F.ch) return; for (const c of codes) if (!F.watching.has(c)) { F.watching.add(c); await F.ch.watch('pres', c); } for (const c of [...F.watching]) if (!codes.includes(c)) { F.watching.delete(c); F.ch.unwatch('pres', c); } },
  // my status: { name, at, room } (only when the grown-up switched sharing on)
  friendsShare(st) { const F = this.friends; if (!F.ch || !F.share) return; F.ch.send(Object.assign({ t: 'pres', code: F.code, online: true, ts: Date.now() }, st), { retain: true }); },
  friendsStop() { const F = this.friends; if (F.ch) { if (F.share) F.ch.send({ t: 'pres', code: F.code, online: false, ts: Date.now() }, { retain: true }); const c = F.ch; setTimeout(() => c.close(), 500); } F.ch = null; F.code = null; },
  async cloudInvite(friendCode, name) { const F = this.friends; if (!F.ch || !this.code) return false; await F.ch.send({ t: 'invite', name, room: this.code }, { kind: 'inbox', code: friendCode }); return F.ch.connected > 0; },
  stopListening() { try { this.beacon && this.beacon.destroy(); } catch (e) { } this.beacon = null; },
  async invite(friendCode, name) {
    if (this.role !== 'host' || !this.peer || !this.code) return false;
    return new Promise(res => {
      const c = this.peer.connect(PREFIX + 'f-' + friendCode, { reliable: true });
      const t = setTimeout(() => { try { c.close(); } catch (e) { } res(false); }, 8000);
      c.on('open', () => { c.send({ t: 'invite', name, room: this.code }); clearTimeout(t); setTimeout(() => c.close(), 800); res(true); });
      c.on('error', () => { clearTimeout(t); res(false); });
    });
  },

  // Connection check for grown-ups: which kinds of route can this device make?
  async check() {
    const ice = await iceServers(), found = { host: false, srflx: false, relay: false };
    try {
      const pc = new RTCPeerConnection({ iceServers: ice }); pc.createDataChannel('t');
      pc.onicecandidate = e => { const c = e.candidate && e.candidate.candidate; if (!c) return; const m = / typ (\w+)/.exec(c); if (m && m[1] in found) found[m[1]] = true; };
      await pc.setLocalDescription(await pc.createOffer());
      await new Promise(r => setTimeout(r, 6000)); pc.close();
    } catch (e) { }
    let server = false; try { await loadPeer(); server = await new Promise(res => { const p = new window.Peer(peerOpts()); const t = setTimeout(() => { p.destroy(); res(false); }, 8000); p.on('open', () => { clearTimeout(t); p.destroy(); res(true); }); p.on('error', () => { clearTimeout(t); p.destroy(); res(false); }); }); } catch (e) { }
    // the cloud relay: how many public brokers answer, and how fast
    let cloud = 0, cloudMs = null; try { const t0 = Date.now(), ch = new Channel({ kind: 'check', code: 'check-' + Math.random() }); await ch.start(); cloud = ch.connected; cloudMs = Date.now() - t0; ch.close(); } catch (e) { }
    return Object.assign(found, { server, cloud, cloudMs });
  },

  close(keepMic) {
    if (this.role && this.cloud) try { this._cloudSend({ t: 'bye' }); } catch (e) { }
    const cl = this.cloud; this.cloud = null; this.cloudOn = false; if (cl) setTimeout(() => cl.close(), 400);
    clearInterval(this._pt); this._wake(false); this.hostId = null; this._noDirect = false;
    clearInterval(this._mt); this._mt = null; this._meters.clear();
    for (const c of this.calls.values()) try { c.close(); } catch (e) { }
    for (const c of this.conns.values()) try { c.close(); } catch (e) { }
    try { this.peer && this.peer.destroy(); } catch (e) { }
    for (const a of this.audios.values()) a.srcObject = null;
    Object.keys(this.remotes).forEach(id => this._gone(id));
    this.calls.clear(); this.conns.clear(); this.audios.clear();
    this.peer = null; this.role = null; this.me = null; this.code = null; this._banned = null; this._photoTo = null;
    const hadKnocks = this.knocks.size > 0; this.knocks.clear(); this._admitted = new Set(); this.knocking = false; this._heard = 0; if (hadKnocks) this.emit('knock', null);
    if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !this.muted);
    if (!keepMic && this.mic) { this.mic.getTracks().forEach(t => t.stop()); this.mic = null; }
  }
};
