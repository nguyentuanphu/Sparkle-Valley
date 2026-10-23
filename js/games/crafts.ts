import { register } from './frame.js';
import { T } from '../i18n.js';
import { saveProfiles } from '../state.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

type Pt = { x: number; y: number };

function keep(api: any, png: string) {
  for (const p of api.players || []) {
    if (!p || !Array.isArray(p.album)) continue;
    p.album.push(png);
    if (p.album.length > 12) p.album.shift();
  }
  saveProfiles();
}

function pad(api: any, aspect = 0.75, bg = '#fffdf6') {
  const box = api.stage.getBoundingClientRect();
  const w = Math.round(Math.max(260, Math.min(520, box.width - 16, (innerHeight * 0.45) / aspect)));
  const h = Math.round(w * aspect);
  const dpr = Math.min(2, devicePixelRatio || 1);
  const wrap = el('div', 'cr-wrap');
  wrap.style.position = 'relative';
  wrap.style.margin = '0 auto';
  wrap.style.touchAction = 'none';
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';

  const c: HTMLCanvasElement = el('canvas', 'cr-cv');
  c.width = w * dpr;
  c.height = h * dpr;
  c.style.width = w + 'px';
  c.style.height = h + 'px';
  c.style.borderRadius = '18px';
  c.style.boxShadow = '0 4px 14px rgba(40,30,60,.18)';
  c.style.background = bg;
  c.style.display = 'block';

  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  wrap.appendChild(c);
  api.stage.appendChild(wrap);
  return { wrap, c, g, w, h };
}

function stroke(c: HTMLCanvasElement, w: number, pts: Pt[], ms = 800): HTMLButtonElement {
  const b: HTMLButtonElement = el('button', 'cr-stroke-btn');
  b.style.position = 'absolute';
  b.style.inset = '0';
  b.style.width = '100%';
  b.style.height = '100%';
  b.style.opacity = '0';
  b.style.cursor = 'pointer';
  b.onclick = () => {
    const rect = c.getBoundingClientRect();
    const scale = w / rect.width;
    let step = 0;
    const timer = setInterval(() => {
      if (step >= pts.length) {
        clearInterval(timer);
        return;
      }
      const p = pts[step];
      const ev = { clientX: rect.left + (p.x / scale), clientY: rect.top + (p.y / scale) };
      if (step === 0) {
        c.dispatchEvent(new PointerEvent('pointerdown', { ...ev, bubbles: true }));
      } else {
        c.dispatchEvent(new PointerEvent('pointermove', { ...ev, bubbles: true }));
      }
      if (step === pts.length - 1) {
        c.dispatchEvent(new PointerEvent('pointerup', { ...ev, bubbles: true }));
      }
      step++;
    }, Math.max(16, Math.floor(ms / pts.length)));
  };
  return b;
}

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el('style', '', `
.cr-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; margin: 8px auto 0; max-width: 96vw; }
.cr-sw { width: 44px; height: 44px; min-width: 44px; min-height: 44px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25); cursor: pointer; }
.cr-sw.on { outline: 4px solid #4a2a78; outline-offset: 2px; }
.cr-btn { min-width: 44px; min-height: 44px; padding: 6px 16px; border: 0; border-radius: 999px; background: #fff; box-shadow: 0 3px 0 rgba(59,42,79,.18); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.cr-btn.go { background: #3cba54; color: #fff; }
.gl.little .cr-sw, .gl.little .cr-btn { min-width: 64px; min-height: 64px; }
`));
}

function palette(api: any, colors = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557', '#ffb703']) {
  style();
  const state = { color: colors[0] };
  const row = el('div', 'cr-row');
  const btns = colors.map((col, i) => {
    const b = el('button', `cr-sw ${i === 0 ? 'on' : ''}`);
    b.style.background = col;
    b.onclick = () => {
      state.color = col;
      btns.forEach(x => x.classList.toggle('on', x === b));
      api.sfx.tap();
    };
    return b;
  });
  row.append(...btns);
  api.stage.appendChild(row);
  return { row, btns, state, of: (c: string) => btns.find((b: any) => b.style.background === c) };
}

async function runCraftPad(api: any, {
  sayText,
  winTitle,
  drawBase
}: {
  sayText: [string, string];
  winTitle: [string, string];
  drawBase: (g: CanvasRenderingContext2D, w: number, h: number) => void;
}) {
  style();
  api.say(sayText[0], sayText[1]);
  api.dots(3, 0);

  const { wrap, c, g, w, h } = pad(api, 0.75, '#1e1e24');
  const pal = palette(api);

  const done = el('button', 'cr-btn go', `${pic('✅')} ${T('Save Craft Keepsake', 'Lưu Tác Phẩm Album')}`);
  done.disabled = true;
  const row = el('div', 'cr-row', done);
  api.stage.appendChild(row);

  let painting = false;
  let painted = 0;
  drawBase(g, w, h);

  const onDown = (e: PointerEvent) => {
    painting = true;
    g.strokeStyle = pal.state.color;
    g.lineWidth = api.little ? 18 : 12;
    const rect = c.getBoundingClientRect();
    const scale = w / rect.width;
    g.beginPath();
    g.moveTo((e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale);
  };
  const onMove = (e: PointerEvent) => {
    if (!painting) return;
    const rect = c.getBoundingClientRect();
    const scale = w / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    g.lineTo(x, y);
    g.stroke();
    painted += 2;
    if (painted > 120 && done.disabled) {
      done.disabled = false;
      api.dots(3, 1);
    }
  };
  const onUp = () => { painting = false; };

  c.addEventListener('pointerdown', onDown);
  c.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  api.onCleanup(() => {
    c.removeEventListener('pointerdown', onDown);
    c.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  });

  api.plan(() => {
    if (!c.isConnected) return null;
    if (!done.disabled) return done;
    const pts = Array.from({ length: 12 }, (_, i) => ({ x: w * (0.25 + 0.04 * i), y: h * (0.35 + 0.03 * (i % 3)) }));
    return stroke(c, w, pts, 600);
  }, { maxActions: 8 });

  const ok = await new Promise<boolean>(res => {
    done.onclick = () => res(true);
    api.onCleanup(() => res(false));
  });
  if (!ok || api.closed) return;

  api.right(done);
  keep(api, c.toDataURL('image/png'));
  api.say('Saved your craft creation to your Album!', 'Đã lưu tác phẩm thủ công của con vào Album!');
  await wait(1200);
  api.dots(3, 3);
  return api.win({ title: T(winTitle[0], winTitle[1]) });
}

// 1. lacquer
register({
  id: 'lacquer', icon: '🖼️',
  name: () => T('Lacquer Painting', 'Tranh Sơn Mài'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Gently rub gold leaf onto the dark lacquer board!', 'Thoa dát vàng quỳ lấp lánh lên vóc gỗ sơn mài nhé!'],
      winTitle: ['Lacquer Painting Saved!', 'Tranh Sơn Mài Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#121212';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.18)}px sans-serif`;
        g.fillText('🪷', w * 0.38, h * 0.6);
      }
    });
  }
});

// 2. scratch
register({
  id: 'scratch', icon: '✨',
  name: () => T('Scratch Art', 'Tranh Cào'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Scratch away the dark coat to reveal rainbow colors underneath!', 'Cào lớp phủ đen để lộ dải màu cầu vồng rực rỡ nhé!'],
      winTitle: ['Scratch Art Keepsake Saved!', 'Tranh Cào Cầu Vồng Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#212529';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#ffb703';
        g.lineWidth = 3;
        g.strokeRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
      }
    });
  }
});

// 3. bubblepaint
register({
  id: 'bubblepaint', icon: '🫧',
  name: () => T('Bubble Paint', 'Vẽ Bong Bóng'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Pop soapy color bubbles onto your sheet of paper!', 'Thổi bong bóng xà phòng màu lên trang giấy nhé!'],
      winTitle: ['Bubble Print Artwork Saved!', 'Tranh Bong Bóng Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#f8f9fa';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.14)}px sans-serif`;
        g.fillText('🫧', w * 0.15, h * 0.4);
        g.fillText('🫧', w * 0.55, h * 0.65);
      }
    });
  }
});

// 4. fingerpaint
register({
  id: 'fingerpaint', icon: '🖐️',
  name: () => T('Finger Painting', 'Vẽ Bằng Ngón Tay'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Paint with your fingertips directly on the canvas!', 'Dùng ngón tay chấm tô màu trực tiếp lên tranh nhé!'],
      winTitle: ['Fingerprint Picture Saved!', 'Tranh Dấu Ngón Tay Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#fffdf6';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.15)}px sans-serif`;
        g.fillText('🌺', w * 0.2, h * 0.5);
        g.fillText('🦋', w * 0.6, h * 0.5);
      }
    });
  }
});

// 5. weatherpaint
register({
  id: 'weatherpaint', icon: '🌦️',
  name: () => T('Colour the Weather', 'Tô Màu Thời Tiết'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Paint gentle rain, sunbeams, and clouds in the sky!', 'Tô màu cho nắng ấm và hạt mưa dịu dàng nhé!'],
      winTitle: ['Weather Canvas Saved!', 'Tranh Thời Tiết Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#e0f2fe';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.16)}px sans-serif`;
        g.fillText('☀️', w * 0.15, h * 0.4);
        g.fillText('🌧️', w * 0.55, h * 0.6);
      }
    });
  }
});

// 6. thocam
register({
  id: 'thocam', icon: '🧶',
  name: () => T('Brocade Patterns', 'Hoa Văn Thổ Cẩm'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Paint vibrant ethnic geometric patterns on woven cloth!', 'Tô màu dải thổ cẩm vùng cao rực rỡ nhé!'],
      winTitle: ['Brocade Tapestry Saved!', 'Thổ Cẩm Vùng Cao Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#2b2d42';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#d90429';
        g.lineWidth = 4;
        g.strokeRect(w * 0.05, h * 0.1, w * 0.9, h * 0.8);
      }
    });
  }
});

// 7. pixelpic
register({
  id: 'pixelpic', icon: '🤖',
  name: () => T('Pixel Picture', 'Tranh Ô Vuông'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Fill grid squares to paint a cute retro pixel character!', 'Tô màu ô vuông để tạo nhân vật pixel ngộ nghĩnh nhé!'],
      winTitle: ['Pixel Art Saved!', 'Tranh Pixel Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#f1f5f9';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#cbd5e1';
        g.lineWidth = 2;
        for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        for (let y = 20; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      }
    });
  }
});

// 8. fireworks
register({
  id: 'fireworks', icon: '🎆',
  name: () => T('Fireworks Painter', 'Vẽ Pháo Hoa'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Draw glowing fireworks bursts across the midnight sky!', 'Vẽ những chùm pháo hoa lấp lánh đêm Giao Thừa nhé!'],
      winTitle: ['Fireworks Display Saved!', 'Bức Tranh Pháo Hoa Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#0b090a';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.16)}px sans-serif`;
        g.fillText('🎆', w * 0.2, h * 0.45);
        g.fillText('✨', w * 0.6, h * 0.45);
      }
    });
  }
});

// 9. masks
register({
  id: 'masks', icon: '🎭',
  name: () => T('Mid-Autumn Masks', 'Làm Mặt Nạ Trung Thu'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Decorate festival masks with bright paint!', 'Tô màu chiếc mặt nạ giấy bồi đón Rằm tháng Tám nhé!'],
      winTitle: ['Festival Mask Saved!', 'Mặt Nạ Trung Thu Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#fff7ed';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.2)}px sans-serif`;
        g.fillText('🎭', w * 0.35, h * 0.62);
      }
    });
  }
});

// 10. makeface
register({
  id: 'makeface', icon: '😀',
  name: () => T('Make a Face', 'Ghép Khuôn Mặt'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Paint smiles, eyes, and expressions on a cheerful face!', 'Tô nụ cười và ánh mắt rạng rỡ lên khuôn mặt nhé!'],
      winTitle: ['Cheerful Face Saved!', 'Khuôn Mặt Vui Vẻ Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#fef3c7';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.arc(w * 0.5, h * 0.5, w * 0.3, 0, Math.PI * 2);
        g.strokeStyle = '#f59e0b';
        g.lineWidth = 5;
        g.stroke();
      }
    });
  }
});

// 11. gallery
register({
  id: 'gallery', icon: '🖼️',
  name: () => T('My Little Gallery', 'Phòng Tranh Của Em'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Paint and frame your picture for your home exhibition!', 'Vẽ và lồng khung cho bức tranh triển lãm nhé!'],
      winTitle: ['Gallery Frame Artwork Saved!', 'Bức Tranh Triển Lãm Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#f8fafc';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#78350f';
        g.lineWidth = 10;
        g.strokeRect(10, 10, w - 20, h - 20);
      }
    });
  }
});

// 12. leafrub
register({
  id: 'leafrub', icon: '🍃',
  name: () => T('Leaf Rubbings', 'In Lá'),
  run(api) {
    return runCraftPad(api, {
      sayText: ['Rub wax crayons across the leaf to reveal delicate veins!', 'Chà sáp màu lên lá để hiện đường gân lá kỳ diệu nhé!'],
      winTitle: ['Leaf Rubbing Keepsake Saved!', 'Tranh In Lá Tự Nhiên Đã Ở Trong Album!'],
      drawBase(g, w, h) {
        g.fillStyle = '#fefae0';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.2)}px sans-serif`;
        g.fillText('🍂', w * 0.35, h * 0.62);
      }
    });
  }
});
