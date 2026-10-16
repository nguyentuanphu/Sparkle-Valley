// Enclosed vehicles keep their approved exterior, but a rider needs an open windscreen.
// Visibility is scoped to one camera render and restored before another player draws.
import { THREE, P, merge, toonSmooth } from './gfx.js';
const cabins = new WeakMap();
function cabinFor(vehicle) {
  if (cabins.has(vehicle)) return cabins.get(vehicle);
  const { width: w, length: l, bottom: b, top: t, color } = vehicle.cabin;
  const box = (w, h, d, pos) => P(new THREE.BoxGeometry(w, h, d), color, pos);
  const posts = [-1, 1].map(sign => box(.09, t - b, .1, [sign * (w / 2 - .06), (t + b) / 2, l / 2]));
  const parts = [...posts, box(w, .1, .12, [0, t, l / 2]), box(w, .12, .22, [0, b, l / 2]),
    box(w, .08, l, [0, t + .15, 0]), box(w, .08, l, [0, .35, 0]),
    ...[-1, 1].map(sign => box(.08, Math.max(.1, b - .4), l, [sign * (w / 2), (b + .4) / 2, 0]))];
  const root = new THREE.Mesh(merge(parts), toonSmooth()); root.visible = false;
  vehicle.o.add(root); cabins.set(vehicle, root); return root;
}
export function withRideView(hero, render) {
  if (!hero._pov) return render();
  const avatar = hero.av.root, ownVisible = avatar.visible;
  const vehicle = hero.riding && hero.riding.vehicle || hero.carry && hero.carryVehicle;
  const cabin = vehicle && vehicle.cabin ? cabinFor(vehicle) : null;
  const exterior = cabin ? vehicle.o.children.filter(child => child !== cabin).map(child => [child, child.visible]) : [];
  try {
    avatar.visible = false;
    exterior.forEach(([child]) => { child.visible = false; });
    if (cabin) cabin.visible = true;
    return render();
  } finally {
    avatar.visible = ownVisible;
    exterior.forEach(([child, visible]) => { child.visible = visible; });
    if (cabin) cabin.visible = false;
  }
}
