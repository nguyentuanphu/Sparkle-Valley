// The cloud relay: a way for friends to reach each other from anywhere, used when the direct link between
// two devices can't open (different networks, mobile data, strict routers). Messages travel through free
// public MQTT brokers over a normal secure web connection (wss://), which works almost everywhere.
//  · Several brokers are used at once, so friends meet even if one broker is down or blocked; copies are
//    recognised and dropped.
//  · Everything is encrypted (AES-GCM) with a key made from the room code or friend code, and the topic name
//    is a hash, so the broker only ever sees scrambled bytes. Photos never go through the relay.
//  · No account, no server of ours. Voice still needs a direct link or a TURN relay (see net.js).
const enc = new TextEncoder(), dec = new TextDecoder();
export const BROKERS = () => window.SV_MQTT || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt', 'wss://mqtt.eclipseprojects.io/mqtt'];

// ---------- a tiny MQTT 3.1.1 client (QoS 0) over WebSocket ----------
const str = s => { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
const bin = b => [b.length >> 8, b.length & 255, ...b];
const remLen = n => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; };
const packet = (type, body) => new Uint8Array([type, ...remLen(body.length), ...body]);

class Mqtt {
  constructor(url) { this.url = url; this.subs = new Set(); this.onmessage = null; this.onclose = null; this.open = false; this.pid = 1; this.buf = new Uint8Array(0); }
  connect(will, timeout = 7000) {
    return new Promise(res => {
      let done = false; const finish = ok => { if (done) return; done = true; clearTimeout(t); res(ok); };
      const t = setTimeout(() => { try { this.ws && this.ws.close(); } catch (e) { } finish(false); }, timeout);
      let ws; try { ws = this.ws = new WebSocket(this.url, ['mqtt']); } catch (e) { return finish(false); }
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        const flags = 0x02 | (will ? 0x04 | (will.retain ? 0x20 : 0) : 0);
        const body = [...str('MQTT'), 4, flags, 0, 30, ...str('sv' + Math.random().toString(36).slice(2, 12))];
        if (will) body.push(...str(will.topic), ...bin(will.payload));
        ws.send(packet(0x10, body));
      };
      ws.onmessage = e => this._data(new Uint8Array(e.data), finish);
      ws.onerror = () => finish(false);
      ws.onclose = () => { const was = this.open; this.open = false; clearInterval(this.ka); finish(false); if (was && this.onclose) this.onclose(); };
    });
  }
  _data(chunk, finish) {
    const b = new Uint8Array(this.buf.length + chunk.length); b.set(this.buf); b.set(chunk, this.buf.length); this.buf = b;
    for (;;) {
      if (this.buf.length < 2) return;
      let len = 0, mul = 1, i = 1, d;
      do { if (i >= this.buf.length) return; d = this.buf[i++]; len += (d & 127) * mul; mul *= 128; } while (d & 128);
      if (this.buf.length < i + len) return;
      const type = this.buf[0], body = this.buf.slice(i, i + len); this.buf = this.buf.slice(i + len);
      const kind = type >> 4;
      if (kind === 2) { const ok = body[1] === 0; this.open = ok; if (ok) { this.ka = setInterval(() => this._send(new Uint8Array([0xc0, 0])), 20000); for (const s of this.subs) this._sub(s); } finish(ok); }
      else if (kind === 3) { const tl = (body[0] << 8) | body[1], topic = dec.decode(body.slice(2, 2 + tl)), q = (type >> 1) & 3, off = 2 + tl + (q ? 2 : 0); if (this.onmessage) this.onmessage(topic, body.slice(off)); }
    }
  }
  _send(p) { try { if (this.ws && this.ws.readyState === 1) this.ws.send(p); } catch (e) { } }
  _sub(topic) { const id = this.pid++ & 0xffff || 1; this._send(packet(0x82, [id >> 8, id & 255, ...str(topic), 0])); }
  subscribe(topic) { this.subs.add(topic); if (this.open) this._sub(topic); }
  unsubscribe(topic) { this.subs.delete(topic); if (!this.open) return; const id = this.pid++ & 0xffff || 1; this._send(packet(0xa2, [id >> 8, id & 255, ...str(topic)])); }
  publish(topic, payload, retain = false) { if (this.open) this._send(packet(0x30 | (retain ? 1 : 0), [...str(topic), ...payload])); }
  close() { this.open = false; clearInterval(this.ka); this._send(new Uint8Array([0xe0, 0])); try { this.ws && this.ws.close(); } catch (e) { } }
}

// ---------- keys, topics, sealing ----------
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
export async function topicFor(kind, code) { return 'sparklevalley/v1/' + kind + '/' + hex(await crypto.subtle.digest('SHA-256', enc.encode('sv-topic|' + kind + '|' + code))).slice(0, 32); }
export async function keyFor(code) {
  const base = await crypto.subtle.importKey('raw', enc.encode('sv-key|' + code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('sparkle-valley-relay'), iterations: 20000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function seal(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)))); const o = new Uint8Array(12 + ct.length); o.set(iv); o.set(ct, 12); return o; }
export async function open(key, bytes) { try { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12)); return JSON.parse(dec.decode(pt)); } catch (e) { return null; } }

// ---------- a channel: one encrypted topic on every broker that answers ----------
// onMsg(obj) gets each message once. status() tells how many brokers are connected.
export class Channel {
  constructor({ kind, code, onMsg, will }) { this.kind = kind; this.code = code; this.onMsg = onMsg; this.will = will; this.clients = []; this.seen = new Map(); this.alive = true; this.extra = new Set(); }
  async start() {
    this.key = await keyFor(this.code); this.topic = await topicFor(this.kind, this.code);
    const will = this.will ? { topic: this.topic, payload: await seal(this.key, this.will), retain: true } : null;
    await Promise.all(BROKERS().map(u => this._connect(u, will)));
    return this.clients.some(c => c.open);
  }
  async _connect(url, will, tries = 0) {
    if (!this.alive) return;
    const c = new Mqtt(url);
    c.onmessage = async (topic, bytes) => {
      const key = topic === this.topic ? this.key : this.extraKeys && this.extraKeys.get(topic); if (!key) return;
      const m = await open(key, bytes); if (!m) return;
      const id = m._id; if (id) { if (this.seen.has(id)) return; this.seen.set(id, Date.now()); if (this.seen.size > 600) { const old = [...this.seen.keys()].slice(0, 300); old.forEach(k => this.seen.delete(k)); } }
      m._topic = topic; this.onMsg && this.onMsg(m);
    };
    c.subscribe(this.topic); for (const t of this.extra) c.subscribe(t);
    if (!this.clients.includes(c)) this.clients.push(c);
    const ok = await c.connect(will);
    c.onclose = () => { if (this.alive) setTimeout(() => { this.clients = this.clients.filter(x => x !== c); this._connect(url, will); }, 2000); };
    if (!ok) { this.clients = this.clients.filter(x => x !== c); if (this.alive) setTimeout(() => this._connect(url, will, tries + 1), Math.min(60000, 4000 * (tries + 1))); }
  }
  // extra topics with their own keys (friends' presence)
  async watch(kind, code) { this.extraKeys = this.extraKeys || new Map(); const t = await topicFor(kind, code); this.extraKeys.set(t, await keyFor(code)); this.extra.add(t); this.clients.forEach(c => c.subscribe(t)); return t; }
  async unwatch(kind, code) { const t = await topicFor(kind, code); this.extra.delete(t); this.extraKeys && this.extraKeys.delete(t); this.clients.forEach(c => c.unsubscribe(t)); }
  async send(obj, { retain = false, kind, code } = {}) {
    if (!this.key) return;
    const m = Object.assign({ _id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }, obj);
    const topic = kind ? await topicFor(kind, code) : this.topic, key = kind ? await keyFor(code) : this.key;
    const bytes = await seal(key, m);
    this.clients.forEach(c => c.publish(topic, bytes, retain));
  }
  get connected() { return this.clients.filter(c => c.open).length; }
  close() { this.alive = false; this.clients.forEach(c => c.close()); this.clients = []; }
}
