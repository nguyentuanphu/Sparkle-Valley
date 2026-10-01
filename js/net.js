// Playing together from two devices: a 4-digit room code connects them peer-to-peer
// (WebRTC through the free PeerJS service), with a live voice call so the children can talk.
const PREFIX = 'sparkle-valley-v2-';
let loading = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve();
  if (!loading) loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/peerjs.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  return loading;
}

export const Net = {
  peer: null, conn: null, call: null, mic: null, audio: null, code: null, role: null, muted: false,
  remote: null,              // latest partner data {name, look, photo, s:{x,y,z,yaw,st}}
  handlers: {},
  on(type, f) { this.handlers[type] = f; },
  emit(type, d) { const f = this.handlers[type]; if (f) f(d); },
  get connected() { return !!(this.conn && this.conn.open); },

  async getMic() {
    if (this.mic) return this.mic;
    try { this.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
    catch (e) { this.mic = null; this.emit('status', { key: 'nomic' }); }
    return this.mic;
  },

  async host(hello) {
    await loadPeer(); await this.getMic();
    this.close(true);
    this.role = 'host';
    for (let tries = 0; tries < 4; tries++) {
      this.code = String(1000 + Math.floor(Math.random() * 9000));
      const ok = await new Promise(res => {
        const p = new window.Peer(PREFIX + this.code, { debug: 0 });
        p.on('open', () => { this.peer = p; res(true); });
        p.on('error', err => { if (err.type === 'unavailable-id') { p.destroy(); res(false); } else { this.emit('status', { key: 'error', err }); res(true); } });
      });
      if (ok) break;
    }
    if (!this.peer) return null;
    this.peer.on('connection', c => this._setup(c, hello));
    this.peer.on('call', call => { call.answer(this.mic || undefined); this._call(call); });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (e) { } });
    this.emit('status', { key: 'waiting', code: this.code });
    return this.code;
  },

  async join(code, hello) {
    await loadPeer(); await this.getMic();
    this.close(true);
    this.role = 'guest'; this.code = code;
    const p = new window.Peer({ debug: 0 }); this.peer = p;
    p.on('error', err => this.emit('status', { key: err.type === 'peer-unavailable' ? 'nocode' : 'error', err }));
    p.on('call', call => { call.answer(this.mic || undefined); this._call(call); });
    await new Promise(res => p.on('open', res));
    this.emit('status', { key: 'connecting' });
    const c = p.connect(PREFIX + code, { reliable: true });
    this._setup(c, hello);
    c.on('open', () => { const call = p.call(PREFIX + code, this.mic || this._silence()); if (call) this._call(call); });
  },

  _setup(c, hello) {
    if (this.conn && this.conn.open) { c.close(); return; }
    this.conn = c;
    c.on('open', () => { this.send(Object.assign({ t: 'hello' }, hello)); this.emit('status', { key: 'connected' }); });
    c.on('data', d => {
      if (!d || typeof d !== 'object') return;
      if (d.t === 'hello') { this.remote = { name: String(d.name || '').slice(0, 20), look: d.look, photo: typeof d.photo === 'string' && d.photo.startsWith('data:image/') ? d.photo : null, s: null }; this.emit('hello', this.remote); }
      else if (d.t === 's') { if (this.remote) this.remote.s = d; }
      else this.emit(d.t, d);
    });
    c.on('close', () => { this.remote = null; this.emit('status', { key: 'left' }); this.emit('left'); });
  },

  _call(call) {
    this.call = call;
    call.on('stream', stream => {
      if (!this.audio) { this.audio = new Audio(); this.audio.autoplay = true; this.audio.setAttribute('playsinline', ''); }
      this.audio.srcObject = stream; this.audio.play().catch(() => this.emit('status', { key: 'tapaudio' }));
      this.emit('voice', true);
      this._meter(stream);
    });
    call.on('close', () => this.emit('voice', false));
  },

  // A silent stream so a child without a microphone can still hear their friend.
  _silence() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const d = a.createMediaStreamDestination(); return d.stream; } catch (e) { return undefined; } },

  // Report when the friend is talking (to light up the speech icon).
  _meter(stream) {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)(), src = a.createMediaStreamSource(stream), an = a.createAnalyser(); an.fftSize = 256; src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      clearInterval(this._mt);
      this._mt = setInterval(() => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); this.emit('talking', m > 14); }, 150);
    } catch (e) { }
  },

  setMuted(m) { this.muted = m; if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !m); },
  resumeAudio() { if (this.audio) this.audio.play().catch(() => { }); },
  send(d) { if (this.conn && this.conn.open) try { this.conn.send(d); } catch (e) { } },

  close(keepMic) {
    clearInterval(this._mt);
    try { this.call && this.call.close(); } catch (e) { }
    try { this.conn && this.conn.close(); } catch (e) { }
    try { this.peer && this.peer.destroy(); } catch (e) { }
    this.call = this.conn = this.peer = null; this.remote = null; this.role = null;
    if (!keepMic && this.mic) { this.mic.getTracks().forEach(t => t.stop()); this.mic = null; }
  }
};
