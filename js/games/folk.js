// Folk games that children in Australia and Vietnam play in the schoolyard, made simple enough for
// little ones to learn here and then play for real with friends:
// What's the time, Mr Wolf? · Đánh chuyền / Knucklebones · Rồng rắn lên mây · Bắn bi / Marbles · Nhảy dây / Skipping.
import { register, tapOne } from './frame.js';
import { T, numWord } from '../i18n.js';
import { settings } from '../state.js';
import { sayIn } from '../voice.js';
import { el, wait, pick, rand, clamp, shuffle } from '../util.js';

const count = n => sayIn(settings.lang, numWord(n));
// A star flies from a point on a canvas: frame.right() wants an element, so make a tiny one there.
function rightAt(api, canvas, x, y) {
  const r = canvas.getBoundingClientRect(), k = r.width / canvas._w;
  const d = el('i', 'tmp-pt'); d.style.left = r.left + x * k + 'px'; d.style.top = r.top + y * k + 'px'; document.body.appendChild(d);
  api.right(d); setTimeout(() => d.remove(), 900);
}
function makeCanvas(api, aspect = 1) {
  const box = api.stage.getBoundingClientRect();
  const w = Math.max(260, Math.min(560, box.width - 16, (innerHeight * .62) / aspect)), h = w * aspect, dpr = Math.min(2, devicePixelRatio || 1);
  const c = el('canvas', 'folk-cv'); c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px'; c._w = w; c._h = h;
  const g = c.getContext('2d'); g.scale(dpr, dpr); api.stage.appendChild(c);
  return { c, g, w, h };
}
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

// ---------- What's the time, Mr Wolf? (Australia) ----------
const clockSVG = hr => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#fffdf6" stroke="#6b4a2a" stroke-width="5"/>${Array.from({ length: 12 }, (_, i) => { const a = (i + 1) / 12 * Math.PI * 2; return `<text x="${(50 + Math.sin(a) * 34).toFixed(1)}" y="${(54.5 - Math.cos(a) * 34).toFixed(1)}" font-size="13" text-anchor="middle" fill="#6b4a2a" font-weight="700" font-family="Fredoka,sans-serif">${i + 1}</text>`; }).join('')}
  <line x1="50" y1="50" x2="${(50 + Math.sin(hr / 12 * Math.PI * 2) * 21).toFixed(1)}" y2="${(50 - Math.cos(hr / 12 * Math.PI * 2) * 21).toFixed(1)}" stroke="#e8434a" stroke-width="7" stroke-linecap="round"/>
  <line x1="50" y1="50" x2="50" y2="15" stroke="#3b6fe0" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="#6b4a2a"/></svg>`;
register({
  id: 'mrwolf', icon: '🐺', origin: 'au', name: () => T("What's the Time, Mr Wolf?", 'Mấy Giờ Rồi, Ông Sói?'),
  async run(api) {
    const N = 12, autoStop = api.little || api.level <= 1, readClock = !api.little && api.level >= 3;
    const name = api.players[0].name;
    api.say("Ask Mr Wolf the time, then take that many steps. When he shouts Dinner time, run home!", 'Hỏi ông Sói mấy giờ rồi, rồi bước đúng bấy nhiêu bước. Khi ông Sói hét "Đến giờ ăn tối!" thì chạy về nhà thật nhanh!');
    const w = el('div', 'wolf', `<div class="wolf-lane"><span class="wolf-home">🏠</span><div class="wolf-steps">${'<i></i>'.repeat(N)}</div><span class="wolf-kid">🧒</span><span class="wolf-w">🐺</span></div>
      <div class="wolf-talk"><div class="wolf-clock"></div><b class="wolf-said"></b></div><div class="wolf-btns"></div>`);
    api.stage.appendChild(w);
    const kid = w.querySelector('.wolf-kid'), wolf = w.querySelector('.wolf-w'), said = w.querySelector('.wolf-said'), clock = w.querySelector('.wolf-clock'), btns = w.querySelector('.wolf-btns'), steps = [...w.querySelectorAll('.wolf-steps i')];
    let pos = 0, caught = 0, dinnerAt = api.little ? 99 : Math.floor(rand(5, 10));
    const place = () => { kid.style.left = `calc(${6 + pos / N * 78}% - 20px)`; steps.forEach((s, k) => s.classList.toggle('on', k < pos)); };
    const btn = (html, cls = '') => { btns.innerHTML = ''; const b = el('button', 'pill big ' + cls, html); btns.appendChild(b); return b; };
    place();
    for (;;) {
      wolf.classList.remove('turned'); said.textContent = ''; clock.innerHTML = '';
      await tapOne([btn('🗣️ ' + T("What's the time, Mr Wolf?", 'Mấy giờ rồi, ông Sói ơi?'), 'ask')]); if (api.closed) return;
      api.sfx.tap(); btns.innerHTML = ''; wolf.classList.add('think'); await wait(900); wolf.classList.remove('think'); if (api.closed) return;
      if (pos >= dinnerAt) {
        // Dinner time! Mr Wolf turns around and chases. Little ones always get home in time.
        wolf.classList.add('turned'); said.textContent = T('DINNER TIME!', 'ĐẾN GIỜ ĂN TỐI!'); api.sfx.whoosh();
        api.say('Dinner time! Run home, quick!', 'Đến giờ ăn tối! Chạy về nhà mau!');
        const allow = api.little ? 1e9 : [3800, 3000, 2400, 2000, 1700][api.level - 1] + caught * 1200;
        const run = btn('🏃 ' + T('Run home!', 'Chạy về nhà!'), 'run');
        wolf.style.transition = `left ${allow / 1000}s linear`; wolf.style.left = kid.style.left;
        const ok = await Promise.race([tapOne([run]).then(() => true), wait(allow).then(() => false)]); if (api.closed) return;
        btns.innerHTML = ''; wolf.style.transition = ''; wolf.style.left = '';
        if (ok) { pos = 0; kid.classList.add('dash'); place(); api.right(kid); await wait(900); kid.classList.remove('dash');
          return api.win({ title: T(`Safe at home, ${name}! You escaped Mr Wolf!`, `${name} về nhà an toàn rồi! Thoát được ông Sói!`) }); }
        caught++; wolf.classList.add('hug'); said.textContent = '🤗';
        api.say('Mr Wolf caught you... for a big hug! Let us play again.', 'Ông Sói bắt được con... để ôm một cái thật chặt! Mình chơi lại nhé.');
        await wait(2200); wolf.classList.remove('hug'); pos = 0; place(); dinnerAt = Math.floor(rand(5, 10)); continue;
      }
      const hr = Math.min(N - pos, 1 + Math.floor(Math.random() * (api.little ? 2 : api.level <= 1 ? 3 : 4)));
      clock.innerHTML = clockSVG(hr);
      if (readClock) { said.textContent = T('Read my clock!', 'Đọc đồng hồ của ta nè!'); api.say('Look at my clock! What time is it?', 'Nhìn đồng hồ của ta! Mấy giờ rồi?'); }
      else { said.textContent = T(`${hr} o'clock!`, `${hr} giờ!`); api.say(`${hr} o'clock!`, `${numWord(hr)} giờ!`); }
      // take the steps, counting out loud
      const start = pos;
      for (;;) {
        btns.innerHTML = '';
        const step = el('button', 'pill big step', '👣 ' + T('Step', 'Bước')); btns.appendChild(step);
        const done = autoStop ? null : el('button', 'pill big done', '✋ ' + T('Stop', 'Dừng')); if (done) btns.appendChild(done);
        let taken = pos - start;
        while (true) {
          const b = await tapOne(done ? [step, done] : [step]); if (api.closed) return;
          if (b === done) break;
          if (pos >= N) break;
          pos++; taken++; place(); api.sfx.jump(); count(taken);
          if (autoStop && taken >= hr) break;
        }
        if (taken === hr || pos >= N) { await wait(500); if (taken === hr) api.praise(); break; }
        api.wrong(kid, `Mr Wolf said ${hr} o'clock. Let us count again!`, `Ông Sói nói ${numWord(hr)} giờ. Mình đếm lại nhé!`);
        await wait(900); pos = start; place();
      }
      if (pos >= N) {
        said.textContent = '';
        await tapOne([btn('👋 ' + T('Tap Mr Wolf!', 'Vỗ vai ông Sói!'), 'tag'), wolf]); if (api.closed) return;
        wolf.classList.add('turned'); api.right(wolf); said.textContent = T('You got me!', 'Bị bắt rồi!');
        await wait(900); return api.win({ title: T(`${name} tagged Mr Wolf!`, `${name} vỗ được vai ông Sói!`) });
      }
      await wait(700);
    }
  }
});

// ---------- Đánh chuyền / Knucklebones (Vietnam & Australia) ----------
register({
  id: 'chuyen', icon: '🥢', origin: 'both', name: () => T('Knucklebones (Chuyền)', 'Đánh Chuyền'),
  async run(api) {
    const rounds = 3, need = api.little ? [1, 1, 2] : [[1, 2, 2], [1, 2, 3], [2, 3, 3], [2, 3, 4], [3, 4, 5]][api.level - 1];
    let air = api.little ? 0 : [3600, 3000, 2500, 2200, 1900][api.level - 1] - (api.strong ? 200 : 0);
    api.say('Tap the ball to throw it up. Pick up the sticks, then catch the ball before it lands!', 'Chạm quả bóng để tung lên. Nhặt que thật nhanh rồi bắt bóng trước khi bóng rơi nhé!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const k = need[r];
      const mat = el('div', 'chuyen', `<div class="ch-sky"></div><button class="ch-ball" aria-label="ball"></button><div class="ch-sticks"></div><div class="ch-hand">✋ <b>0</b>/${k}</div>`);
      api.stage.appendChild(mat);
      const ball = mat.querySelector('.ch-ball'), box = mat.querySelector('.ch-sticks'), hand = mat.querySelector('.ch-hand b');
      const sticks = Array.from({ length: api.little ? 3 : 5 }, (_, i) => { const s = el('button', 'ch-stick'); s.style.setProperty('--r', (rand(-40, 40)) + 'deg'); s.style.setProperty('--y', rand(-10, 10) + 'px'); box.appendChild(s); return s; });
      api.show(`Pick up ${k} at a time`, `Nhặt ${k} que một lần`);
      api.say(k === 1 ? 'Pick up one stick each throw.' : `Pick up ${k} sticks this time!`, k === 1 ? 'Chuyền chuyền một! Mỗi lần nhặt một que.' : `Chuyền chuyền ${numWord(k)}! Lần này nhặt ${numWord(k)} que!`);
      let misses = 0, stop = null; api.onCleanup(() => stop && stop());
      for (;;) {
        ball.className = 'ch-ball'; hand.textContent = '0';
        await tapOne([ball]); if (api.closed) return;
        api.sfx.whoosh();
        const t = air ? air * (1 + misses * .3) : 0;
        ball.style.setProperty('--t', (t || 1600) + 'ms'); ball.classList.add(t ? 'toss' : 'float');
        let picked = [];
        const caught = await new Promise(res => {
          let timer = t ? setTimeout(() => finish(false), t) : null;
          const finish = v => { clearTimeout(timer); sticks.forEach(s => s.onclick = null); ball.onclick = null; res(v); };
          sticks.forEach(s => s.onclick = () => {
            if (s.classList.contains('gone')) return;
            if (picked.length >= k) { api.show('Catch the ball now!', 'Bắt bóng đi!'); return; }
            s.classList.add('gone'); picked.push(s); hand.textContent = picked.length; api.sfx.pop(picked.length); count(picked.length);
          });
          ball.onclick = () => { if (picked.length < k) { api.show(`Pick up ${k - picked.length} more first!`, `Nhặt thêm ${k - picked.length} que nữa đã!`); api.sfx.no(); return; } finish(true); };
          stop = () => finish(false);
        });
        if (api.closed) return;
        if (caught) {
          ball.className = 'ch-ball caught'; api.right(ball);
          if (sticks.every(s => s.classList.contains('gone')) || sticks.filter(s => !s.classList.contains('gone')).length < k) break;
          api.show(`Again! Pick up ${k} more`, `Tiếp nào! Nhặt thêm ${k} que`); continue;
        }
        misses++; ball.className = 'ch-ball dropped'; api.sfx.no(); picked.forEach(s => s.classList.remove('gone'));
        api.say('Oops, the ball landed! Try again. Throw, pick, catch!', 'Ối, bóng rơi rồi! Thử lại nhé. Tung, nhặt, bắt!');
        await wait(900);
      }
      api.praise(); await wait(1200);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Rồng rắn lên mây (Vietnam) ----------
register({
  id: 'dragon', icon: '🐉', origin: 'vn', name: () => T('Dragon Snake to the Clouds', 'Rồng Rắn Lên Mây'),
  async run(api) {
    // Part 1: learn the chant by answering the doctor
    const kids = ['🧒', '👧', '👦', '🧒', '👧', '👦'];
    const scene = el('div', 'dragon', `<div class="dr-doc">🧑‍⚕️<b></b></div><div class="dr-line">${kids.map((k, i) => `<span style="--i:${i}">${i === 0 ? '🐲' : k}</span>`).join('')}</div><div class="dr-say"></div><div class="dr-ans"></div>`);
    api.stage.appendChild(scene);
    const docSay = scene.querySelector('.dr-doc b'), lineSay = scene.querySelector('.dr-say'), ans = scene.querySelector('.dr-ans'), line = scene.querySelector('.dr-line');
    const lines = [
      ['Dragon snake goes up to the clouds, past the wiggly tree. Is the doctor at home?', 'Rồng rắn lên mây, có cây lúc lắc, hỏi thăm thầy thuốc có nhà hay không?'],
    ];
    lineSay.textContent = T(lines[0][0], lines[0][1]); line.classList.add('wiggle');
    api.say(lines[0][0], lines[0][1]); await wait(4200); if (api.closed) return;
    const QA = [
      [['The doctor is at home! Which part may I have?', 'Thầy thuốc có nhà! Xin khúc đầu!'], ['Only bones!', 'Cùng xương cùng xẩu!'], ['Yummy cake!', 'Bánh ngọt!']],
      [['Then may I have the middle?', 'Xin khúc giữa!'], ['Only gristle and gooey bits!', 'Cùng máu cùng me!'], ['A big balloon!', 'Một quả bóng bay!']],
      [['Then may I have the tail?', 'Xin khúc đuôi!'], ['Catch it if you can!', 'Tha hồ mà đuổi!'], ['Go to sleep!', 'Đi ngủ thôi!']]
    ];
    for (const [ask, right, wrong] of QA) {
      docSay.textContent = T(ask[0], ask[1]); lineSay.textContent = ''; api.say(ask[0], ask[1]);
      ans.innerHTML = '';
      const opts = api.little ? [right] : shuffle([right, wrong]);
      const bs = opts.map(o => { const b = el('button', 'pill big', '🐲 ' + T(o[0], o[1])); b._ok = o === right; ans.appendChild(b); return b; });
      for (;;) { const b = await tapOne(bs); if (api.closed) return; if (b._ok) { api.right(b); lineSay.textContent = T(right[0], right[1]); api.say(right[0], right[1]); break; } api.wrong(b, 'Hmm, what does the dragon say?', 'Ừm, rồng rắn trả lời sao nhỉ?'); }
      await wait(2200); if (api.closed) return;
    }
    // Part 2: the doctor chases the tail. Tap the doctor to block him!
    ans.innerHTML = ''; docSay.textContent = ''; lineSay.textContent = '';
    const need = api.little ? 4 : [5, 6, 7, 8, 9][api.level - 1], ms = api.little ? 4200 : [3600, 3000, 2500, 2100, 1800][api.level - 1];
    api.say('Here comes the doctor! Tap him to protect the tail of the dragon!', 'Thầy thuốc đuổi kìa! Chạm vào thầy thuốc để bảo vệ khúc đuôi nhé!');
    const doc = scene.querySelector('.dr-doc'); doc.classList.add('chase');
    let blocked = 0; api.dots(need, 0);
    while (blocked < need) {
      await wait(600); if (api.closed) return;
      const side = Math.random() < .5 ? 'l' : 'r';
      doc.style.transition = 'none'; doc.className = 'dr-doc chase from-' + side; void doc.offsetWidth;
      doc.style.transition = `left ${ms}ms linear, top ${ms}ms linear`; doc.classList.add('go');
      const ok = await Promise.race([tapOne([doc]).then(() => true), wait(ms).then(() => false)]); if (api.closed) return;
      const cs = getComputedStyle(doc); doc.style.transition = 'none'; doc.style.left = cs.left; doc.style.top = cs.top; void doc.offsetWidth;
      if (ok) { blocked++; api.right(doc); api.dots(need, blocked); count(blocked); doc.classList.add('bonk'); line.classList.add('wiggle'); }
      else { line.classList.add('tagged'); api.sfx.no(); api.say('He tagged the tail! Ha ha! Again!', 'Bị bắt đuôi rồi! Ha ha! Lại nào!'); }
      await wait(800); doc.style.left = doc.style.top = ''; line.classList.remove('tagged', 'wiggle');
    }
    return api.win({ title: T('The dragon is safe! What a team!', 'Rồng rắn an toàn rồi! Đội mình giỏi quá!') });
  }
});

// ---------- Bắn bi / Marbles (Vietnam & Australia) ----------
register({
  id: 'marbles', icon: '🔮', origin: 'both', name: () => T('Marbles', 'Bắn Bi'),
  async run(api) {
    const need = api.little ? 3 : [3, 4, 5, 5, 6][api.level - 1], n = need + 2;
    api.say('Pull back the big marble and let go to shoot. Knock the marbles out of the circle!', 'Kéo viên bi cái về phía sau rồi thả tay để bắn. Bắn cho bi văng ra khỏi vòng tròn nhé!');
    const { c, g, w, h } = makeCanvas(api, 1.05);
    const R = w * .3, cx = w / 2, cy = h * .4, mr = w * .032, home = { x: w / 2, y: h * .86 };
    const COLS = ['#ff5f7e', '#3cc7e8', '#ffd23f', '#7ee35a', '#b598ff', '#ff9f43', '#5fd3c9', '#ff7eb8'];
    const balls = [{ x: home.x, y: home.y, vx: 0, vy: 0, r: mr * 1.3, col: '#f4f4ff', shooter: true }];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rand(-.2, .2), d = i === 0 ? 0 : R * rand(.15, .55); balls.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: 0, vy: 0, r: mr, col: COLS[i % COLS.length] }); }
    // keep them from starting on top of each other
    for (let it = 0; it < 30; it++) for (const a of balls) for (const b of balls) if (a !== b) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, m = a.r + b.r + 3; if (d < m) { const p = (m - d) / 2; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; } }
    const sh = balls[0]; let out = 0, aim = null, moving = false, last = performance.now(), shots = 0;
    const draw = () => {
      g.clearRect(0, 0, w, h);
      const grd = g.createRadialGradient(cx, cy, 10, cx, cy, w * .8); grd.addColorStop(0, '#e9c995'); grd.addColorStop(1, '#c59b63'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.setLineDash([10, 7]); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(home.x, home.y, mr * 2.1, 0, Math.PI * 2); g.fill();
      if (aim) {
        const dx = sh.x - aim.x, dy = sh.y - aim.y, L = Math.min(Math.hypot(dx, dy), w * .3);
        const a = Math.atan2(dy, dx); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(sh.x + Math.cos(a) * L * 2.4, sh.y + Math.sin(a) * L * 2.4); g.stroke(); g.setLineDash([]);
        g.strokeStyle = '#8a5a3b'; g.lineWidth = 5; g.beginPath(); g.moveTo(sh.x, sh.y); g.lineTo(sh.x - Math.cos(a) * L, sh.y - Math.sin(a) * L); g.stroke();
      }
      for (const b of balls) {
        if (b.gone) continue;
        g.fillStyle = 'rgba(60,30,10,.25)'; g.beginPath(); g.ellipse(b.x + 2, b.y + b.r * .7, b.r, b.r * .45, 0, 0, Math.PI * 2); g.fill();
        const gg = g.createRadialGradient(b.x - b.r * .35, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r); gg.addColorStop(0, '#fff'); gg.addColorStop(.35, b.col); gg.addColorStop(1, shade(b.col)); g.fillStyle = gg;
        g.globalAlpha = b.fade != null ? b.fade : 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      }
    };
    const pt = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * w / r.width, y: (e.clientY - r.top) * h / r.height }; };
    c.onpointerdown = e => { if (moving) return; const p = pt(e); if (Math.hypot(p.x - sh.x, p.y - sh.y) < sh.r * 4 || p.y > h * .7) { aim = p; c.setPointerCapture(e.pointerId); } };
    c.onpointermove = e => { if (aim) aim = pt(e); };
    c.onpointerup = () => {
      if (!aim) return;
      let dx = sh.x - aim.x, dy = sh.y - aim.y; const L = Math.min(Math.hypot(dx, dy), w * .3); aim = null;
      if (L < 8) return;
      let a = Math.atan2(dy, dx);
      if (api.little || api.level <= 1) { // gentle aim help: bend the shot towards the closest marble in that direction
        let best = null, bd = .45; for (const b of balls) if (!b.shooter && !b.gone) { const d = Math.abs(((Math.atan2(b.y - sh.y, b.x - sh.x) - a + 9.42) % 6.283) - 3.14); if (d < bd) { bd = d; best = b; } }
        if (best) a = Math.atan2(best.y - sh.y, best.x - sh.x);
      }
      const sp = 6 + L / (w * .3) * 16; sh.vx = Math.cos(a) * sp * 60; sh.vy = Math.sin(a) * sp * 60; moving = true; shots++; api.sfx.whoosh();
    };
    let done;
    const finished = new Promise(r => done = r);
    const tick = now => {
      if (api.closed) return;
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      for (let s = 0; s < 3; s++) {
        const d = dt / 3;
        for (const b of balls) if (!b.gone) { b.x += b.vx * d; b.y += b.vy * d; const f = Math.pow(.25, d); b.vx *= f; b.vy *= f;
          if (b.x < b.r || b.x > w - b.r) { b.vx *= -.7; b.x = clamp(b.x, b.r, w - b.r); } if (b.y < b.r || b.y > h - b.r) { b.vy *= -.7; b.y = clamp(b.y, b.r, h - b.r); } }
        for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i], b = balls[j]; if (a.gone || b.gone) continue;
          const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), m = a.r + b.r; if (dist >= m || dist === 0) continue;
          const nx = dx / dist, ny = dy / dist, p = (m - dist) / 2; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { const imp = -rv * .95; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; if (-rv > 40) api.sfx.pop(Math.min(9, Math.floor(-rv / 60))); }
        }
      }
      for (const b of balls) {
        if (b.shooter || b.gone) continue;
        if (b.fade != null) { b.fade -= dt * 2; if (b.fade <= 0) b.gone = true; continue; }
        if (Math.hypot(b.x - cx, b.y - cy) > R + b.r) { b.fade = 1; out++; rightAt(api, c, b.x, b.y); count(out); api.dots(need, out); }
      }
      if (moving && balls.every(b => b.gone || Math.hypot(b.vx, b.vy) < 6)) {
        moving = false; balls.forEach(b => { b.vx = b.vy = 0; });
        sh.x = home.x; sh.y = home.y;
        if (out >= need) { draw(); done(); return; }
        if (shots % 3 === 0) api.show('Pull back and let go!', 'Kéo về phía sau rồi thả tay!');
      }
      draw(); requestAnimationFrame(tick);
    };
    api.dots(need, 0); requestAnimationFrame(tick);
    await finished; if (api.closed) return;
    await wait(500); return api.win({ title: T(`${out} marbles out! Great shooting!`, `Bắn được ${out} viên bi! Giỏi quá!`) });
  }
});
function shade(hex) { const n = parseInt(hex.slice(1), 16), f = .55; return `rgb(${(n >> 16 & 255) * f | 0},${(n >> 8 & 255) * f | 0},${(n & 255) * f | 0})`; }

// ---------- Nhảy dây / Skipping (Vietnam & Australia) ----------
register({
  id: 'skipping', icon: '🪢', origin: 'both', name: () => T('Skipping Rope', 'Nhảy Dây'),
  async run(api) {
    const need = api.little ? 5 : [6, 8, 10, 12, 15][api.level - 1];
    let period = api.little ? 2.2 : [1.9, 1.7, 1.5, 1.35, 1.2][api.level - 1];
    api.say('Tap Jump when the rope comes down to your feet. Count your jumps!', 'Chạm nút Nhảy khi dây quay xuống chân. Cùng đếm số lần nhảy nhé!');
    const { c, g, w, h } = makeCanvas(api, .62);
    const btn = el('button', 'pill big jumpbtn', '⤴️ ' + T('Jump!', 'Nhảy!')); api.stage.appendChild(btn);
    const lx = w * .14, rx = w * .86, handY = h * .52, ground = h * .86, mid = w / 2;
    let phase = Math.PI, jumpT = -1, jumps = 0, last = performance.now(), prevPh = phase, msg = '', msgT = 0, tripT = 0;
    const jump = () => { if (jumpT < 0 && tripT <= 0) { jumpT = 0; api.sfx.jump(); } };
    btn.onclick = jump; c.onpointerdown = jump;
    const key = e => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    addEventListener('keydown', key); api.onCleanup(() => removeEventListener('keydown', key));
    const J = .62; // seconds in the air
    let done; const finished = new Promise(r => done = r);
    const kidY = () => jumpT < 0 ? 0 : Math.sin(Math.min(1, jumpT / J) * Math.PI) * h * .2;
    const drawRope = front => {
      const s = Math.sin(phase); if ((s >= 0) !== front) return;
      const ctrlY = handY + Math.cos(phase) * (ground - handY + h * .05) * 2;
      g.strokeStyle = '#e8434a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(lx + 18, handY); g.quadraticCurveTo(mid, ctrlY, rx - 18, handY); g.stroke();
    };
    const tick = now => {
      if (api.closed) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (jumpT >= 0) { jumpT += dt; if (jumpT > J) jumpT = -1; }
      if (tripT > 0) tripT -= dt;
      else {
        // little ones: the rope waits low for the jump, so they can never get it wrong
        const toBottom = ((Math.PI * 2 - (phase % (Math.PI * 2))) % (Math.PI * 2));
        const hold = api.little && jumpT < 0 && toBottom < .5 && toBottom > .02;
        if (!hold) { prevPh = phase; phase += dt * Math.PI * 2 / period; }
        // the rope passes the feet when the phase crosses a whole turn
        if (Math.floor(prevPh / (Math.PI * 2)) !== Math.floor(phase / (Math.PI * 2))) {
          prevPh = phase;
          if (kidY() > h * .04 || api.little) { jumps++; count(jumps); api.dots(need, jumps); msg = jumps + ''; msgT = .6; if (!api.little && jumps % 4 === 0) period = Math.max(1, period * .95); if (jumps >= need) { done(); return; } }
          else { tripT = 1.1; msg = T('Oops!', 'Ối!'); msgT = 1; api.sfx.no(); api.show('Jump when the rope is at your feet!', 'Nhảy khi dây chạm chân nhé!'); }
        }
      }
      g.clearRect(0, 0, w, h);
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#bfe8ff'); sky.addColorStop(1, '#fff3d6'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#9ad46a'; g.fillRect(0, ground - 4, w, h - ground + 4);
      g.font = `${h * .2}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'bottom';
      drawRope(false);
      g.fillText('👧', lx, ground); g.fillText('👦', rx, ground);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(mid, ground - 2, w * .05 * (1 - kidY() / h), 6, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000'; g.save(); if (tripT > 0) { g.translate(mid, ground); g.rotate(Math.sin(tripT * 20) * .1); g.translate(-mid, -ground); } g.fillText('🧒', mid, ground - kidY()); g.restore();
      drawRope(true);
      if (msgT > 0) { msgT -= dt; g.font = `bold ${h * .14}px Fredoka, sans-serif`; g.fillStyle = '#ff5fa2'; g.globalAlpha = Math.min(1, msgT * 3); g.fillText(msg, mid, h * .26); g.globalAlpha = 1; }
      requestAnimationFrame(tick);
    };
    api.dots(need, 0); requestAnimationFrame(tick);
    await finished; if (api.closed) return;
    return api.win({ title: T(`${jumps} jumps! You are a skipping star!`, `Nhảy được ${jumps} lần! Con là ngôi sao nhảy dây!`) });
  }
});
