// Enclosed vehicles keep their approved exterior, but a rider needs an open windscreen.
// Visibility is scoped to one camera render and restored before another player draws.
import { THREE, P, merge, toonSmooth } from './gfx.js';
import type { Hero, RideVehicle } from './player.js';

// Keep a seated child's eyes within the actual windscreen, rather than above a car roof.
export function vehicleEye(vehicle: RideVehicle, scale: number, passenger = false): THREE.Vector3 {
  const seat = vehicle.seat, cabin = vehicle.cabin;
  let y = seat[1] + .78 * scale;
  if (cabin) { const gap = Math.min(.12, (cabin.top - cabin.bottom) / 3); y = Math.max(cabin.bottom + gap, Math.min(cabin.top - gap, y)); }
  const eye = new THREE.Vector3(passenger && cabin ? -.45 : seat[0], y, passenger && cabin ? cabin.length / 2 - 1.5 : seat[2] + .28 * scale);
  vehicle.o.updateMatrixWorld(true); return vehicle.o.localToWorld(eye);
}

const cabins = new WeakMap();
function cabinFor(vehicle: RideVehicle) {
  if (cabins.has(vehicle)) return cabins.get(vehicle);
  const { width: w, length: l, bottom: b, top: t, color } = vehicle.cabin;
  // A car's bonnet projects beyond its windscreen. The steering position locates its cabin front;
  // putting the frame at the bumper made the window a narrow slot from a child's seat.
  const front = vehicle.wheelAt ? Math.min(l / 2, vehicle.wheelAt[2] + .5) : l / 2;
  const cabinLength = front + l / 2, centre = (front - l / 2) / 2;
  const roofFront = vehicle.wheelAt ? Math.min(front, vehicle.wheelAt[2] - .1) : front;
  const roofLength = roofFront + l / 2, roofCentre = (roofFront - l / 2) / 2;
  const postLength = Math.hypot(t - b, front - roofFront), postAngle = -Math.atan2(front - roofFront, t - b);
  const box = (w, h, d, pos) => P(new THREE.BoxGeometry(w, h, d), color, pos);
  const posts = [-1, 1].map(sign => P(new THREE.BoxGeometry(.09, postLength, .1), color, [sign * (w / 2 - .06), (t + b) / 2, (front + roofFront) / 2], [postAngle, 0, 0]));
  const parts = [...posts, box(w, .1, .12, [0, t, roofFront]), box(w, .12, .22, [0, b, front]),
    box(w, .08, roofLength, [0, t + .15, roofCentre]), box(w, .08, cabinLength, [0, .35, centre]),
    ...[-1, 1].map(sign => box(.08, Math.max(.1, b - .4), cabinLength, [sign * (w / 2), (b + .4) / 2, centre]))];
  const root = new THREE.Mesh(merge(parts), toonSmooth()); root.visible = false;
  vehicle.o.add(root); cabins.set(vehicle, root); return root;
}
export function withRideView<T>(hero: Hero, render: () => T): T {
  if (!hero._pov) return render();
  const avatar = hero.av.root, ownVisible = avatar.visible;
  const vehicle = hero.riding && hero.riding.vehicle || hero.carry && hero.carryVehicle;
  const cabin = vehicle && vehicle.cabin ? cabinFor(vehicle) : null;
  const exterior = cabin ? vehicle.o.children.filter(child => child !== cabin).map((child): [THREE.Object3D, boolean] => [child, child.visible]) : [];
  const hidden = [...exterior, ...(hero.riding?.firstPersonHide || []).map((o): [THREE.Object3D, boolean] => [o, o.visible])];
  try {
    avatar.visible = false;
    hidden.forEach(([child]) => { child.visible = false; });
    if (cabin) cabin.visible = true;
    return render();
  } finally {
    avatar.visible = ownVisible;
    hidden.forEach(([child, visible]) => { child.visible = visible; });
    if (cabin) cabin.visible = false;
  }
}
