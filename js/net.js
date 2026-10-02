// Playing together from several devices: one device starts a room (a 4-digit code) and up to 5
// friends join it, peer-to-peer through the free PeerJS service. The room's starter passes messages
// between everyone, and everyone hears everyone through a live voice call.
// Friends: each device can have a friend code. If the grown-ups switch "friends can invite me" on, the
// game listens on that code while it is open, so a friend who is hosting a room can send an invite.
// Nothing goes through a server of ours: only names, outfits and positions travel, device to device.
// When the direct link can't open (different networks, mobile data), the room carries on through the cloud
// relay (relay.js): encrypted messages through free public MQTT brokers. Voice needs the direct link or a
// TURN relay. Everyone pings everyone every 2 s, so the game can show each friend's signal and ping.
import { settings } from './state.js';
import { Channel } from './relay.js';
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
  return STUN.concat(PUBLIC_TURN);
}
// PeerJS settings (the free public PeerJS server by default; tests can point it at a local one)
let ICE = STUN.concat(PUBLIC_TURN);
const peerOpts = () => Object.assign({ debug: 0, config: { iceServers: ICE, iceCandidatePoolSize: 2 } }, window.SV_PEER || {});
const prepare = async () => { await loadPeer(); ICE = await iceServers(); };
const cleanHello = (d, from) => ({ id: from, name: String(d.name || '').slice(0, 20), look: d.look, photo: typeof d.photo === 'string' && d.photo.startsWith('data:image/') ? d.photo : null, friend: typeof d.friend === 'string' ? d.friend.slice(0, 8) : null, s: null });

export const Net = {
  peer: null, conns: new Map(), calls: new Map(), cloud: null, cloudOn: false, _seen: new Set(), hostId: null, audios: new Map(), mic: null, code: null, role: null, muted: false, me: null, hello: null,
  remotes: {},               // everyone else in the room: id -> {id, name, look, photo, friend, s:{x,y,z,yaw,st}}
  beacon: null,              // the friend-code listener
  handlers: {},
  on(type, f) { (this.handlers[type] = this.handlers[type] || []).push(f); },
  off(type, f) { const l = this.handlers[type]; if (l) this.handlers[type] = l.filter(x => x !== f); },
  emit(type, d) { (this.handlers[type] || []).forEach(f => { try { f(d); } catch (e) { console.warn(e); } }); },
  get connected() { return [...this.conns.values()].some(c => c.open) || (this.cloudOn && !!this.cloud && Object.keys(this.remotes).length > 0); },
  get count() { return 1 + Object.keys(this.remotes).length; },
  get remote() { return Object.values(this.remotes)[0] || null; },  // older code: the first friend

  async getMic() {
    if (this.mic) return this.mic;
    try { this.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
    catch (e) { this.mic = null; this.emit('status', { key: 'nomic' }); }
    return this.mic;
  },

  async host(hello) {
    await prepare().catch(() => { }); await this.getMic();
    this.close(true);
    this.role = 'host'; this.hello = hello;
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
      this.peer.on('call', call => { call.answer(this.mic || undefined); this._call(call); });
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
    this.role = 'guest'; this.code = code; this.hello = hello; this.hostId = PREFIX + code;
    this.emit('status', { key: 'connecting' });
    // the cloud relay starts at the same time, so there is a second way in from the very start
    const cloudReady = this._startCloud();
    let p = null;
    if (window.Peer) {
      p = new window.Peer(peerOpts()); this.peer = p;
      p.on('error', err => { if (err.type === 'peer-unavailable') this._noDirect = true; });
      p.on('call', call => { call.answer(this.mic || undefined); this._call(call); });
      p.on('disconnected', () => { try { p.reconnect(); } catch (e) { } });
      this.me = await new Promise(res => { const t = setTimeout(() => res(null), 7000); p.on('open', id => { clearTimeout(t); res(id); }); });
    }
    if (!this.me) this.me = 'sv-c-' + Math.random().toString(36).slice(2, 10);
    await cloudReady;
    const host = this.hostId;
    if (p && p.open) {
      const c = p.connect(host, { reliable: true }); this.conns.set(host, c);
      c.on('open', () => { c.send(Object.assign({ t: 'hello' }, hello)); this.emit('status', { key: 'connected' }); const call = p.call(host, this.mic || this._silence()); if (call) this._call(call); });
      c.on('data', d => this._recv(d, host));
      // the direct link broke: carry on through the cloud relay if the room is still there
      c.on('close', () => { this.conns.delete(host); if (this.role !== 'guest') return; this._useCloud(); this._helloCloud(); this.emit('status', { key: 'cloud' }); setTimeout(() => { if (this.role === 'guest' && !this._hostSeen(15000)) { Object.keys(this.remotes).forEach(id => this._gone(id)); this.emit('status', { key: 'left' }); } }, 15000); });
    }
    // after 7 s without a direct link, go through the cloud relay; explain, and give up with tips after 30 s
    const t0 = Date.now(); this._slowTold = false;
    const watch = setInterval(() => {
      if (this.role !== 'guest' || this.code !== code) { clearInterval(watch); return; }
      const c = this.conns.get(host), s = (Date.now() - t0) / 1000;
      if ((c && c.open) || this.remotes[host]) { clearInterval(watch); return; }
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
    if (from === this.me) return;
    if (d.mid) { if (this._seen.has(d.mid)) return; this._seen.add(d.mid); if (this._seen.size > 800) this._seen = new Set([...this._seen].slice(-400)); }
    if (this.remotes[from]) { this.remotes[from].last = Date.now(); if (via !== 'cloud') this.remotes[from].direct = Date.now(); }
    if (d.t === 'cloudon') { this._useCloud(); return; }
    if (d.t === 'ping') { this.send({ t: 'pong', to: from, ts: d.ts }); return; }
    if (d.t === 'pong') { const r = this.remotes[from]; if (r) { const rtt = Date.now() - d.ts; r.rtt = r.rtt ? Math.round(r.rtt * .6 + rtt * .4) : rtt; r.route = via === 'cloud' ? 'cloud' : 'direct'; this.emit('quality', r); } return; }
    if (d.t === 'full') { this.emit('status', { key: 'full' }); this.close(true); return; }
    if (d.t === 'kick' && this.role === 'guest') { this.emit('status', { key: 'removed' }); this.close(true); return; }
    if (d.t === 'hello') {
      const known = this.remotes[from];
      if (via === 'cloud' && this.role === 'host' && !known) {
        if (Object.keys(this.remotes).length >= MAX_ROOM - 1) { this._cloudSend({ t: 'full', to: from }); return; }
        this._useCloud();
        this._cloudSend(Object.assign({ t: 'hello', to: from }, this.hello || {}, { photo: null }));
        for (const r of Object.values(this.remotes)) this._cloudSend({ t: 'hello', to: from, from: r.id, name: r.name, look: r.look, friend: r.friend });
        this.emit('status', { key: 'cloud' });
      }
      if (via === 'cloud' && this.role === 'guest' && from === this.hostId && !known) this.emit('status', { key: 'cloud' });
      const r = this.remotes[from] = Object.assign(cleanHello(d, from), { last: Date.now(), route: via === 'cloud' ? 'cloud' : 'direct', rtt: known && known.rtt }); if (known && known.photo && !r.photo) r.photo = known.photo; this.emit('hello', r);
      if (known) return;
      // guests call each other too, so everyone hears everyone (the newer one rings)
      if (this.role === 'guest' && from !== via && this.me > from && !this.calls.has(from) && this.peer && this.peer.open) { const call = this.peer.call(from, this.mic || this._silence()); if (call) this._call(call); }
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
    if (this.cloudOn && this.cloud) {
      // positions go through the cloud 5 times a second at most
      if (d.t !== 's' || !this._sT || Date.now() - this._sT > 190) { if (d.t === 's') this._sT = Date.now(); this._cloudSend(d); }
    }
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
  // ---------- friends' status through the cloud relay ----------
  // Each device that has "friends can see me" switched on keeps a small, encrypted status note on its friend
  // code's topic: online or not, where it is in the valley, and the room it is playing in. The note says
  // "offline" by itself when the device goes away (MQTT "last will"). Invites also arrive this way.
  friends: { ch: null, code: null, watching: new Set(), status: {}, onInvite: null, onChange: null, share: false },
  async friendsStart({ code, share, onInvite, onChange }) {
    const F = this.friends; F.onInvite = onInvite; F.onChange = onChange; F.share = share;
    if (F.ch && F.code === code) return;
    if (F.ch) F.ch.close();
    F.code = code; F.watching = new Set();
    F.ch = new Channel({ kind: 'pres', code, will: share ? { t: 'pres', code, online: false } : null, onMsg: m => {
      if (m.t === 'pres' && m.code && m.code !== code) { const was = F.status[m.code]; F.status[m.code] = Object.assign({}, m, { seen: Date.now(), lastOnline: m.online ? Date.now() : (was && was.lastOnline) || m.ts || null }); F.onChange && F.onChange(m.code); }
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
    this.peer = null; this.role = null; this.me = null; this.code = null;
    if (!keepMic && this.mic) { this.mic.getTracks().forEach(t => t.stop()); this.mic = null; }
  }
};
