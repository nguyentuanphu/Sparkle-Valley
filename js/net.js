// Playing together from several devices: one device starts a room (a 4-digit code) and up to 5
// friends join it, peer-to-peer through the free PeerJS service. The room's starter passes messages
// between everyone, and everyone hears everyone through a live voice call.
// Friends: each device can have a friend code. If the grown-ups switch "friends can invite me" on, the
// game listens on that code while it is open, so a friend who is hosting a room can send an invite.
// Nothing goes through a server of ours: only names, outfits and positions travel, device to device.
import { settings } from './state.js';
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
const PUBLIC_TURN = [{ urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }];
let fetched = null;
export async function iceServers() {
  const r = (settings.turnUrl || '').trim();
  if (/^https:\/\//i.test(r)) { // a link that hands out relay details (e.g. Metered's free plan)
    if (!fetched || fetched.url !== r) { try { const res = await fetch(r); const j = await res.json(); fetched = { url: r, list: Array.isArray(j) ? j : j.iceServers || [] }; } catch (e) { fetched = { url: r, list: [] }; } }
    if (fetched.list.length) return STUN.concat(fetched.list);
  } else if (/^turns?:/i.test(r)) return STUN.concat([{ urls: r.split(/[\s,]+/).filter(Boolean), username: settings.turnUser || '', credential: settings.turnPass || '' }]);
  return STUN.concat(PUBLIC_TURN);
}
// PeerJS settings (the free public PeerJS server by default; tests can point it at a local one)
let ICE = STUN.concat(PUBLIC_TURN);
const peerOpts = () => Object.assign({ debug: 0, config: { iceServers: ICE, iceCandidatePoolSize: 2 } }, window.SV_PEER || {});
const prepare = async () => { await loadPeer(); ICE = await iceServers(); };
const cleanHello = (d, from) => ({ id: from, name: String(d.name || '').slice(0, 20), look: d.look, photo: typeof d.photo === 'string' && d.photo.startsWith('data:image/') ? d.photo : null, friend: typeof d.friend === 'string' ? d.friend.slice(0, 8) : null, s: null });

export const Net = {
  peer: null, conns: new Map(), calls: new Map(), audios: new Map(), mic: null, code: null, role: null, muted: false, me: null, hello: null,
  remotes: {},               // everyone else in the room: id -> {id, name, look, photo, friend, s:{x,y,z,yaw,st}}
  beacon: null,              // the friend-code listener
  handlers: {},
  on(type, f) { (this.handlers[type] = this.handlers[type] || []).push(f); },
  off(type, f) { const l = this.handlers[type]; if (l) this.handlers[type] = l.filter(x => x !== f); },
  emit(type, d) { (this.handlers[type] || []).forEach(f => { try { f(d); } catch (e) { console.warn(e); } }); },
  get connected() { return [...this.conns.values()].some(c => c.open); },
  get count() { return 1 + Object.keys(this.remotes).length; },
  get remote() { return Object.values(this.remotes)[0] || null; },  // older code: the first friend

  async getMic() {
    if (this.mic) return this.mic;
    try { this.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
    catch (e) { this.mic = null; this.emit('status', { key: 'nomic' }); }
    return this.mic;
  },

  async host(hello) {
    await prepare(); await this.getMic();
    this.close(true);
    this.role = 'host'; this.hello = hello;
    for (let tries = 0; tries < 4; tries++) {
      this.code = String(1000 + Math.floor(Math.random() * 9000));
      const ok = await new Promise(res => {
        const p = new window.Peer(PREFIX + this.code, peerOpts());
        p.on('open', id => { this.peer = p; this.me = id; res(true); });
        p.on('error', err => { if (err.type === 'unavailable-id') { p.destroy(); res(false); } else { this.emit('status', { key: 'error', err }); res(true); } });
      });
      if (ok) break;
    }
    if (!this.peer) return null;
    this.peer.on('connection', c => this._hostConn(c));
    this.peer.on('call', call => { call.answer(this.mic || undefined); this._call(call); });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (e) { } });
    this.emit('status', { key: 'waiting', code: this.code });
    return this.code;
  },

  async join(code, hello) {
    await prepare(); await this.getMic();
    this.close(true);
    this.role = 'guest'; this.code = code; this.hello = hello;
    const p = new window.Peer(peerOpts()); this.peer = p;
    p.on('error', err => this.emit('status', { key: err.type === 'peer-unavailable' ? 'nocode' : 'error', err }));
    p.on('call', call => { call.answer(this.mic || undefined); this._call(call); });
    this.me = await new Promise(res => p.on('open', res));
    this.emit('status', { key: 'connecting' });
    const host = PREFIX + code, c = p.connect(host, { reliable: true });
    this.conns.set(host, c);
    // never wait forever: explain after 12 s, give up with tips after 30 s (or as soon as the link fails)
    const t0 = Date.now(), giveUp = why => { if (c.open || this.conns.get(host) !== c) return; clearInterval(watch); this.emit('status', { key: 'stuck', why }); this.close(true); };
    const watch = setInterval(() => {
      if (c.open || this.conns.get(host) !== c) { clearInterval(watch); return; }
      const s = (Date.now() - t0) / 1000, pc = c.peerConnection;
      if (pc && pc.iceConnectionState === 'failed') return giveUp('ice');
      if (s > 12 && !this._slowTold) { this._slowTold = true; this.emit('status', { key: 'slow' }); }
      if (s > 30) giveUp('timeout');
    }, 1000);
    this._slowTold = false;
    c.on('open', () => { c.send(Object.assign({ t: 'hello' }, hello)); this.emit('status', { key: 'connected' }); const call = p.call(host, this.mic || this._silence()); if (call) this._call(call); });
    c.on('data', d => this._recv(d, host));
    c.on('close', () => { this.conns.delete(host); Object.keys(this.remotes).forEach(id => this._gone(id)); this.emit('status', { key: 'left' }); });
  },

  // the room's starter: welcome a new friend, introduce everyone, and pass messages along
  _hostConn(c) {
    c.on('open', () => {
      if (this.conns.size >= MAX_ROOM - 1) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; }
      this.conns.set(c.peer, c);
      c.send(Object.assign({ t: 'hello', from: this.me }, this.hello || {}));
      for (const r of Object.values(this.remotes)) c.send({ t: 'hello', from: r.id, name: r.name, look: r.look, photo: r.photo, friend: r.friend });
      this.emit('status', { key: 'connected' });
    });
    c.on('data', d => {
      if (!d || typeof d !== 'object') return;
      d.from = c.peer;                                    // the host decides who a message is from
      if (d.to && d.to !== this.me) { const t = this.conns.get(d.to); if (t && t.open) t.send(d); return; }
      if (!d.to) for (const [id, o] of this.conns) if (id !== c.peer && o.open) o.send(d);
      this._recv(d, c.peer);
    });
    c.on('close', () => { this.conns.delete(c.peer); this._gone(c.peer); for (const o of this.conns.values()) if (o.open) o.send({ t: 'bye', from: c.peer }); });
  },

  _recv(d, via) {
    if (!d || typeof d !== 'object') return;
    const from = d.from || via;
    if (d.to && d.to !== this.me) return;
    if (d.t === 'full') { this.emit('status', { key: 'full' }); this.close(true); return; }
    if (d.t === 'kick' && this.role === 'guest') { this.emit('status', { key: 'removed' }); this.close(true); return; }
    if (d.t === 'hello') {
      const r = this.remotes[from] = cleanHello(d, from); this.emit('hello', r);
      // guests call each other too, so everyone hears everyone (the newer one rings)
      if (this.role === 'guest' && from !== via && this.me > from && !this.calls.has(from)) { const call = this.peer.call(from, this.mic || this._silence()); if (call) this._call(call); }
      return;
    }
    if (d.t === 'bye') { this._gone(from); return; }
    if (d.t === 's') { if (this.remotes[from]) this.remotes[from].s = d; return; }
    this.emit(d.t, Object.assign({}, d, { from }));
  },
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
  kick(id) { if (this.role !== 'host') return; const c = this.conns.get(id); if (c && c.open) { try { c.send({ t: 'kick', from: this.me }); } catch (e) { } setTimeout(() => { try { c.close(); } catch (e) { } }, 400); } },
  setMuted(m) { this.muted = m; if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !m); },
  resumeAudio() { for (const a of this.audios.values()) a.play().catch(() => { }); },
  // send to everyone in the room, or to one friend with {to: id}
  send(d) {
    if (this.role === 'host') {
      const out = Object.assign({ from: this.me }, d);
      if (d.to) { const c = this.conns.get(d.to); if (c && c.open) try { c.send(out); } catch (e) { } return; }
      for (const c of this.conns.values()) if (c.open) try { c.send(out); } catch (e) { }
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
    return Object.assign(found, { server });
  },

  close(keepMic) {
    clearInterval(this._mt); this._mt = null; this._meters.clear();
    for (const c of this.calls.values()) try { c.close(); } catch (e) { }
    for (const c of this.conns.values()) try { c.close(); } catch (e) { }
    try { this.peer && this.peer.destroy(); } catch (e) { }
    for (const a of this.audios.values()) a.srcObject = null;
    Object.keys(this.remotes).forEach(id => this._gone(id));
    this.calls.clear(); this.conns.clear(); this.audios.clear();
    this.peer = null; this.role = null; this.me = null; this.code = null;
    if (!keepMic && this.mic) { this.mic.getTracks().forEach(t => t.stop()); this.mic = null; }
  }
};
