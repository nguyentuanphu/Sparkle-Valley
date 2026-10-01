// Shared 3D helpers: cel-shaded materials, geometry merging, emoji sprites.
import * as THREE from '../vendor/three.module.js';
export { THREE };

// Physically based materials (soft, slightly rough surfaces like painted wood, cloth and skin).
// The names "toon" are kept so the rest of the code reads the same.
const matCache = {};
export function toon(color, extra) {
  const key = extra ? null : color;
  if (key && matCache[key]) return matCache[key];
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: .82, metalness: 0 }, extra || {}));
  if (key) matCache[key] = m;
  return m;
}
export const toonVC = extra => new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: .88, metalness: 0 }, extra || {}));
export const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

// Merge several (geometry, colour, matrix) parts into one vertex-coloured geometry.
const _m = new THREE.Matrix4(), _c = new THREE.Color();
export function P(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) {
  _m.compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...(typeof scl === 'number' ? [scl, scl, scl] : scl)));
  const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m);
  return { g, color };
}
export function merge(parts) {
  let n = 0; parts.forEach(p => n += p.g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    const a = p.g.attributes.position, b = p.g.attributes.normal; _c.set(p.color);
    for (let i = 0; i < a.count; i++, o++) {
      pos[o * 3] = a.getX(i); pos[o * 3 + 1] = a.getY(i); pos[o * 3 + 2] = a.getZ(i);
      nor[o * 3] = b.getX(i); nor[o * 3 + 1] = b.getY(i); nor[o * 3 + 2] = b.getZ(i);
      col[o * 3] = _c.r; col[o * 3 + 1] = _c.g; col[o * 3 + 2] = _c.b;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

const emojiMats = {};
export function emojiMat(ch) {
  if (!emojiMats[ch]) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 64, 72);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    emojiMats[ch] = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false });
  }
  return emojiMats[ch];
}
export function sprite(ch, size = 1) { const s = new THREE.Sprite(emojiMat(ch)); s.scale.setScalar(size); return s; }

export const blobShadow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(20,40,20,.45)'); g.addColorStop(1, 'rgba(20,40,20,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  const geo = new THREE.CircleGeometry(.7, 24).rotateX(-Math.PI / 2);
  return () => new THREE.Mesh(geo, mat);
})();
