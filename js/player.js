// The explorer: walking, running, jumping, gliding, climbing slopes, swimming and riding,
// with a stamina wheel. Nothing here can really hurt a child; long falls only cost a heart.
import { THREE } from './gfx.js';
import { buildAvatar } from './avatar.js';
import { WATER, heightAt } from './world.js';
import { clamp, lerp, angleLerp } from './util.js';
import { SFX } from './audio.js';

const GRAV = 22, WALK = 5.5, RUN = 9.5, SWIM = 3.4, CLIMB = 2.6, GLIDE = 8, RIDE = 11.5;

export class Hero {
  constructor(index, profile, scene, world) {
    this.i = index; this.profile = profile; this.scene = scene; this.world = world;
    this.pos = new THREE.Vector3(); this.vy = 0; this.yaw = 0;
    this.camYaw = Math.PI; this.camPitch = .3; this.camDist = 5.8; this.camPos = new THREE.Vector3();
    this.cam = new THREE.PerspectiveCamera(55, 1, .3, 1200);
    this.state = 'idle'; this.speed = 0; this.onGround = true;
    this.stamina = profile.staminaMax; this.exhausted = false; this.bonusStamina = 0;
    this.hearts = profile.hearts; this.lastSafe = new THREE.Vector3(); this.fallStart = null; this.towerClimb = null; this.riding = null;
    this.safeTimer = 0; this.stepTimer = 0; this.emoteT = 0; this.manualCamT = 0; this.cheerT = 0;
    this.buildModel();
  }
  buildModel() {
    if (this.av) this.scene.remove(this.av.root);
    this.av = buildAvatar(this.profile.look, this.profile.photo);
    this.scene.add(this.av.root);
  }
  place(x, z, y) {
    this.pos.set(x, y != null ? y : this.world.groundAt(x, z), z); this.vy = 0; this.lastSafe.copy(this.pos);
    this.camPos.set(x + Math.sin(this.camYaw) * this.camDist, this.pos.y + 4, z + Math.cos(this.camYaw) * this.camDist);
  }
  get staminaMax() { return this.profile.staminaMax + this.bonusStamina; }
  useStamina(a) {
    if (this.bonusStamina > 0 && this.stamina > this.profile.staminaMax) { this.stamina -= a; this.bonusStamina = Math.max(0, this.stamina - this.profile.staminaMax); return; }
    this.stamina = Math.max(0, this.stamina - a); if (this.stamina <= 0) { this.exhausted = true; }
  }

  update(dt, pad, t, game) {
    const W = this.world, p = this.pos;
    // camera control
    // Easy camera (default): a high view that gently turns to look the way the child walks. Drag does nothing.
    // Explorer camera: drag to look around, as in big open-world games.
    const easy = game.settings.camMode !== 'free';
    if (easy) { pad.cdx = 0; pad.cdy = 0; }
    if (pad.cdx || pad.cdy) this.manualCamT = 2.5;
    this.camYaw -= pad.cdx * .006 * (game.settings.camSpeed || 1); this.camPitch = clamp(this.camPitch + pad.cdy * .004, -.1, 1.1);
    pad.cdx = 0; pad.cdy = 0;
    this.manualCamT -= dt;

    if (this.towerClimb) return this.updateTowerClimb(dt, t, game);

    // The stick steers relative to the camera as it was when the child started pushing, so the Easy
    // camera swinging round behind them never bends their path into circles.
    const held = Math.abs(pad.mx) + Math.abs(pad.mz) > .05;
    if (!held || this.steerYaw === undefined || !easy) this.steerYaw = this.camYaw;
    const sy = easy ? this.steerYaw : this.camYaw;
    const f = [-Math.sin(sy), -Math.cos(sy)], r = [Math.cos(sy), -Math.sin(sy)];
    let mx = f[0] * pad.mz + r[0] * pad.mx, mz = f[1] * pad.mz + r[1] * pad.mx;
    // tap-to-walk: head for the tapped spot when the stick is not being used
    if (pad.mx || pad.mz) this.goal = null;
    else if (this.goal) {
      const gx = this.goal.x - this.pos.x, gz = this.goal.z - this.pos.z, gd = Math.hypot(gx, gz);
      if (gd < .7 || (this.goalT = (this.goalT || 0) + dt) > 25) { this.goal = null; this.goalT = 0; }
      else { mx = gx / gd; mz = gz / gd; if (gd < 2) { mx *= gd / 2 + .2; mz *= gd / 2 + .2; } }
    }
    const len = Math.hypot(mx, mz), mag = Math.min(1, len); if (len > .01) { mx /= len; mz /= len; }
    const ground = W.groundAt(p.x, p.z, p.y + .5);
    const swimming = ground < WATER - .9 && p.y <= WATER - .5;
    const jump = pad.jump();

    // riding the water buffalo
    if (this.riding) {
      if (jump || pad.act()) { this.dismount(); }
      else {
        const sp = RIDE * mag; this.speed = lerp(this.speed, sp, Math.min(1, dt * 4));
        if (mag > .05) this.yaw = angleLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, dt * 6));
        const nx = p.x + Math.sin(this.yaw) * this.speed * dt, nz = p.z + Math.cos(this.yaw) * this.speed * dt;
        const g = heightAt(nx, nz);
        if (g > WATER - .4 && Math.abs(g - ground) < 1.5) { p.x = nx; p.z = nz; }
        W.collide(p, 1.2); p.y = W.groundAt(p.x, p.z);
        const b = this.riding; b.mesh.position.set(p.x, p.y, p.z); b.mesh.rotation.y = this.yaw; b.shadow.position.set(p.x, p.y + .05, p.z);
        this.state = 'ride'; this.finish(dt, t, game, 1.6); return;
      }
    }

    let speed = 0, want = 'idle';
    if (swimming) {
      this.onGround = false; this.gliding = false; this.fallStart = null;
      speed = SWIM * mag; if (mag > .05) this.useStamina(dt * .06);
      p.y = lerp(p.y, WATER - .55, Math.min(1, dt * 5)); this.vy = 0; want = 'swim';
      if (this.stamina <= 0) { game.rescue(this); return; }
      if (!this._swimSfx) { SFX.splash(); this._swimSfx = true; }
    } else {
      this._swimSfx = false;
      // jumping and gliding
      if (jump) {
        if (this.onGround) { this.vy = 8.5; this.onGround = false; SFX.jump(); }
        else if (this.gliding) this.gliding = false;
        else if (this.profile.glider && !this.exhausted && this.stamina > 0) { this.gliding = true; SFX.glide(); game.onGlide(this); }
      }
      if (this.gliding && (this.exhausted || this.stamina <= 0)) this.gliding = false;
      const running = pad.run && !this.exhausted && this.onGround && mag > .3;
      speed = (running ? RUN : WALK) * mag;
      if (running) this.useStamina(dt * .22);
      if (this.gliding) { speed = GLIDE; this.vy = Math.max(this.vy - GRAV * dt, -2.2); this.useStamina(dt * .1); want = 'glide'; if (mag < .05) { mx = Math.sin(this.yaw); mz = Math.cos(this.yaw); } }
      else this.vy -= GRAV * dt;
      if (!this.onGround && !this.gliding) want = 'air'; else if (speed > .3) want = 'walk';
    }
    if (mag > .05 && !this.gliding) this.yaw = angleLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, dt * 12));
    if (this.gliding) this.yaw = angleLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, dt * 3));

    // horizontal move with slope climbing
    let nx = p.x + mx * speed * dt, nz = p.z + mz * speed * dt;
    if (speed > 0) {
      const gN = W.groundAt(nx, nz, p.y + .5), run = Math.hypot(nx - p.x, nz - p.z), rise = gN - ground;
      if (this.onGround && !swimming && rise / Math.max(run, 1e-4) > 1.1) {
        // too steep to walk: climb it with stamina, like scaling a cliff
        if (this.stamina > 0 && !this.exhausted) {
          const k = CLIMB / speed; nx = p.x + (nx - p.x) * k; nz = p.z + (nz - p.z) * k;
          this.useStamina(dt * .16); want = 'climb'; this.climbing = true;
        } else { nx = p.x; nz = p.z; want = 'idle'; game.hint(this, 'tired'); }
      } else this.climbing = false;
    } else this.climbing = false;
    p.x = nx; p.z = nz; W.collide(p, .45);
    p.y += this.vy * dt;
    const g = W.groundAt(p.x, p.z, p.y + .5);
    if (!swimming) {
      if (p.y <= g + .02 || (this.onGround && this.vy <= 0 && p.y - g < .6)) {
        if (!this.onGround) this.land(game);
        p.y = g; this.vy = 0; this.onGround = true; this.gliding = false;
      } else if (this.onGround && p.y > g + .6) { this.onGround = false; this.fallStart = p.y; }
      if (!this.onGround && this.fallStart == null) this.fallStart = p.y;
      if (this.gliding) this.fallStart = p.y;
    }
    // recover stamina when resting on the ground
    const resting = (this.onGround && !(pad.run && mag > .3) && !this.climbing) || this.riding;
    if (resting && !swimming) { this.stamina = Math.min(this.staminaMax, this.stamina + dt * (this.exhausted ? .3 : .45)); if (this.stamina >= this.profile.staminaMax * .999) this.exhausted = false; }
    // remember a safe place to come back to
    this.safeTimer -= dt;
    if (this.onGround && !swimming && g > WATER + .5 && this.safeTimer <= 0) { this.lastSafe.copy(p); this.safeTimer = 1; }
    if (want === 'walk' && this.onGround) { this.stepTimer -= dt * speed; if (this.stepTimer <= 0) { SFX.step(); this.stepTimer = 2.2; game.stats(this, speed); } }

    this.speed = speed; this.state = this.cheerT > 0 ? 'cheer' : this.emoteT > 0 && want === 'idle' ? 'wave' : want === 'idle' && this._dancing ? 'dance' : want;
    this.cheerT -= dt; this.emoteT -= dt;
    this.finish(dt, t, game, 0);
  }

  land(game) {
    const fell = this.fallStart != null ? this.fallStart - this.pos.y : 0;
    this.fallStart = null;
    if (fell > 14 && !this.gliding) game.hurt(this, fell > 30 ? 2 : 1);
  }
  mount(b) { this.riding = b; b.rider = this; this.gliding = false; this.pos.copy(b.mesh.position); this.yaw = b.yaw; SFX.moo(); }
  dismount() { const b = this.riding; if (!b) return; b.rider = null; b.tx = b.mesh.position.x; b.tz = b.mesh.position.z; this.riding = null; this.pos.x += Math.cos(this.yaw) * 1.8; this.pos.z -= Math.sin(this.yaw) * 1.8; this.pos.y = this.world.groundAt(this.pos.x, this.pos.z); }

  startTowerClimb(tw) {
    const m = this.world.towerMeshes[tw.id];
    const dx = this.pos.x - tw.x, dz = this.pos.z - tw.z, d = Math.hypot(dx, dz) || 1;
    this.towerClimb = { tw, top: m.y + 26 + .6, ax: tw.x + dx / d * 3.7, az: tw.z + dz / d * 3.7 };
    this.pos.x = this.towerClimb.ax; this.pos.z = this.towerClimb.az; this.yaw = Math.atan2(-dx, -dz); this.gliding = false;
  }
  updateTowerClimb(dt, t, game) {
    const c = this.towerClimb, p = this.pos;
    p.y += dt * 7;
    if (p.y >= c.top) {
      p.set(c.tw.x + (c.ax - c.tw.x) * .4, c.top, c.tw.z + (c.az - c.tw.z) * .4); this.towerClimb = null; this.onGround = true; this.vy = 0; this.fallStart = null;
      game.onTowerTop(this, c.tw);
    }
    this.state = 'climb'; this.speed = 2; this.finish(dt, t, game, 0);
  }

  finish(dt, t, game, rideY) {
    const A = this.av, p = this.pos;
    A.root.position.set(p.x, p.y + rideY, p.z); A.root.rotation.y = this.yaw;
    A.anim(this.state, t, this.speed);
    A.root.children[1].visible = this.state !== 'swim'; // blob shadow
    // camera: follow behind, gently swinging round when the child is just walking forward
    const easy = game.settings.camMode !== 'free';
    // Easy camera: high and a little further back, and it slowly swings round behind the way the child
    // is walking, so what's ahead is always on screen (it used to stay fixed facing north, which hid
    // everything when walking towards the camera). It waits a moment so small turns don't spin it.
    if (easy) {
      if (this.speed > .8 && !this.towerClimb && this.manualCamT <= 0) { this.easyT = (this.easyT || 0) + dt; if (this.easyT > .35) this.camYaw = angleLerp(this.camYaw, this.yaw + Math.PI, Math.min(1, dt * 1.6)); }
      else this.easyT = 0;
      this.camPitch += ((this.towerClimb ? .25 : .55) - this.camPitch) * Math.min(1, dt * 3);
    }
    else if (this.manualCamT <= 0 && this.speed > 1 && !this.towerClimb) this.camYaw = angleLerp(this.camYaw, this.yaw + Math.PI, Math.min(1, dt * .6));
    const close = game.closeUp === this.i; // wardrobe close-up
    if (close) { this.camYaw = angleLerp(this.camYaw, this.yaw, Math.min(1, dt * 4)); this.camPitch += (.08 - this.camPitch) * Math.min(1, dt * 4); }
    const dist = close ? 2.8 : (easy ? 11.5 : this.camDist) * (this.gliding ? 1.25 : this.riding ? 1.15 : 1) * (this.zoom || 1) * (game.zoom || 1);
    const target = new THREE.Vector3(p.x, p.y + (close ? .2 : 1.15) + rideY, p.z);
    const want = new THREE.Vector3(p.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist, target.y + Math.sin(this.camPitch) * dist, p.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist);
    // keep the camera out of houses: if a wall is between the child and the camera, move the camera in
    // front of it, so the child (and what's around them) is never hidden behind a building
    const bx = this.world.boxes; if (bx && bx.length && !close) {
      const dx = want.x - target.x, dz = want.z - target.z; let tmin = 1;
      for (const b of bx) {
        if (target.x > b.x0 && target.x < b.x1 && target.z > b.z0 && target.z < b.z1) continue;
        let t0 = 0, t1 = 1;
        for (const [o, d, lo, hi] of [[target.x, dx, b.x0 - .3, b.x1 + .3], [target.z, dz, b.z0 - .3, b.z1 + .3]]) {
          if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { t0 = 2; break; } continue; }
          let a = (lo - o) / d, c = (hi - o) / d; if (a > c) [a, c] = [c, a];
          t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) break;
        }
        if (t0 <= t1 && t0 < tmin) tmin = t0;
      }
      if (tmin < 1) { const k = Math.max(.22, tmin - .04); want.x = target.x + dx * k; want.z = target.z + dz * k; want.y = target.y + (want.y - target.y) * Math.max(k, .5); }
    }
    const gy = this.world.groundAt(want.x, want.z) + .7; if (want.y < gy) want.y = gy;
    this.camPos.lerp(want, Math.min(1, dt * 8));
    this.cam.position.copy(this.camPos); this.cam.lookAt(target);
  }
}
