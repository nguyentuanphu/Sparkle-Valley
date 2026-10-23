import { register, untilRight } from './frame.js';
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
  const wrap = el('div', 'd2-wrap');
  wrap.style.position = 'relative';
  wrap.style.margin = '0 auto';
  wrap.style.touchAction = 'none';
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';

  const c: HTMLCanvasElement = el('canvas', 'd2-cv');
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
  const b: HTMLButtonElement = el('button', 'd2-stroke-btn');
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
.d2-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; margin: 8px auto 0; max-width: 96vw; }
.d2-sw { width: 44px; height: 44px; min-width: 44px; min-height: 44px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25); cursor: pointer; }
.d2-sw.on { outline: 4px solid #4a2a78; outline-offset: 2px; }
.d2-btn { min-width: 44px; min-height: 44px; padding: 6px 16px; border: 0; border-radius: 999px; background: #fff; box-shadow: 0 3px 0 rgba(59,42,79,.18); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.d2-btn.go { background: #3cba54; color: #fff; }
.gl.little .d2-sw, .gl.little .d2-btn { min-width: 64px; min-height: 64px; }
`));
}

function palette(api: any, colors = ['#ff5a5f', '#ffb400', '#3cba54', '#2f80ed', '#9b51e0', '#ff7eb6']) {
  style();
  const state = { color: colors[0] };
  const row = el('div', 'd2-row');
  const btns = colors.map((col, i) => {
    const b = el('button', `d2-sw ${i === 0 ? 'on' : ''}`);
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

async function runInteractivePad(api: any, {
  sayText,
  winTitle,
  drawGuide
}: {
  sayText: [string, string];
  winTitle: [string, string];
  drawGuide: (g: CanvasRenderingContext2D, w: number, h: number) => void;
}) {
  style();
  api.say(sayText[0], sayText[1]);
  api.dots(3, 0);

  const { wrap, c, g, w, h } = pad(api, 0.75, '#fffdf6');
  const pal = palette(api);

  const done = el('button', 'd2-btn go', `${pic('✅')} ${T('Keep in Album', 'Lưu vào Album')}`);
  done.disabled = true;
  const row = el('div', 'd2-row', done);
  api.stage.appendChild(row);

  let painting = false;
  let painted = 0;
  drawGuide(g, w, h);

  const onDown = (e: PointerEvent) => {
    painting = true;
    g.strokeStyle = pal.state.color;
    g.lineWidth = api.little ? 16 : 10;
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
    const pts = Array.from({ length: 12 }, (_, i) => ({ x: w * (0.2 + 0.05 * i), y: h * (0.3 + 0.03 * (i % 3)) }));
    return stroke(c, w, pts, 600);
  }, { maxActions: 8 });

  const ok = await new Promise<boolean>(res => {
    done.onclick = () => res(true);
    api.onCleanup(() => res(false));
  });
  if (!ok || api.closed) return;

  api.right(done);
  keep(api, c.toDataURL('image/png'));
  api.say('Saved your artwork to your Album!', 'Đã lưu bức tranh của con vào Album rồi!');
  await wait(1200);
  api.dots(3, 3);
  return api.win({ title: T(winTitle[0], winTitle[1]) });
}

// 1. stamps
register({
  id: 'stamps', icon: '🥔',
  name: () => T('Potato Stamps', 'In Hình'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Dip stamps into paint and create your picture!', 'Chấm hình in vào màu và tự do tạo bức tranh nhé!'],
      winTitle: ['Potato Stamps Saved!', 'Tranh In Khoai Tây Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#f4ebd0';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.12)}px sans-serif`;
        g.fillText('🌸', w * 0.1, h * 0.3);
        g.fillText('⭐', w * 0.7, h * 0.4);
      }
    });
  }
});

// 2. weave
register({
  id: 'weave', icon: '🌾',
  name: () => T('Weave a Mat', 'Đan Chiếu'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Paint coloured strands across the woven reed mat!', 'Vẽ nếp cói màu sắc lên chiếc chiếu đan nhé!'],
      winTitle: ['Woven Mat Saved!', 'Chiếu Đan Thật Đẹp Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#f2e8cf';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#d4a373';
        g.lineWidth = 4;
        for (let x = 20; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        for (let y = 20; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      }
    });
  }
});

// 3. mosaic
register({
  id: 'mosaic', icon: '🏺',
  name: () => T('Bát Tràng Tiles', 'Ghép Gốm Bát Tràng'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Paint ceramic glazes on your Bát Tràng tile artwork!', 'Tô màu men gốm rực rỡ lên bức tranh Bát Tràng nhé!'],
      winTitle: ['Glazed Ceramic Tile Saved!', 'Tranh Gốm Bát Tràng Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#e9ecef';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#adb5bd';
        g.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          g.strokeRect(w * 0.1 + i * w * 0.2, h * 0.2, w * 0.16, h * 0.5);
        }
      }
    });
  }
});

// 4. nonla
register({
  id: 'nonla', icon: '👒',
  name: () => T('Paint a Nón Lá', 'Vẽ Nón Lá'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Paint bamboo and lotus onto your conical hat!', 'Vẽ cành tre và hoa sen lên chiếc nón lá xinh xắn nhé!'],
      winTitle: ['Painted Nón Lá Saved!', 'Chiếc Nón Lá Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#fefae0';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.moveTo(w * 0.5, h * 0.1);
        g.lineTo(w * 0.1, h * 0.85);
        g.lineTo(w * 0.9, h * 0.85);
        g.closePath();
        g.strokeStyle = '#dda15e';
        g.lineWidth = 5;
        g.stroke();
      }
    });
  }
});

// 5. aodai
register({
  id: 'aodai', icon: '👘',
  name: () => T('Áo Dài Designer', 'Thiết Kế Áo Dài'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Design colorful silk patterns on the Áo Dài dress!', 'Tự tay tô vẽ tà áo dài lụa thướt tha nhé!'],
      winTitle: ['Áo Dài Silk Design Saved!', 'Mẫu Áo Dài Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#fff0f3';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.22)}px sans-serif`;
        g.fillText('👘', w * 0.38, h * 0.62);
      }
    });
  }
});

// 6. kitepaint
register({
  id: 'kitepaint', icon: '🪁',
  name: () => T('Design a Kite', 'Trang Trí Diều'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Paint bright wings on your flute kite!', 'Tô cánh diều sáo thật rực rỡ để bay cao nhé!'],
      winTitle: ['Flute Kite Saved!', 'Chiếc Diều Sáo Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#e0f2fe';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.moveTo(w * 0.5, h * 0.15);
        g.lineTo(w * 0.85, h * 0.5);
        g.lineTo(w * 0.5, h * 0.85);
        g.lineTo(w * 0.15, h * 0.5);
        g.closePath();
        g.strokeStyle = '#0284c7';
        g.lineWidth = 4;
        g.stroke();
      }
    });
  }
});

// 7. shades
register({
  id: 'shades', icon: '🎨',
  name: () => T('Light and Dark Colours', 'Màu Đậm Màu Nhạt'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Blend pastel and deep shades together on the canvas!', 'Pha phối các dải màu đậm nhạt hòa quyện nhé!'],
      winTitle: ['Shades Artwork Saved!', 'Bức Tranh Dải Màu Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#bae6fd';
        g.fillRect(0, 0, w, h * 0.33);
        g.fillStyle = '#38bdf8';
        g.fillRect(0, h * 0.33, w, h * 0.33);
        g.fillStyle = '#0284c7';
        g.fillRect(0, h * 0.66, w, h * 0.34);
      }
    });
  }
});

// 8. shadowpic
register({
  id: 'shadowpic', icon: '👥',
  name: () => T('Light and Shadow', 'Bóng và Hình'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Trace around shadows to capture secret animal shapes!', 'Vẽ nét quanh chiếc bóng để giữ lại hình các bạn thú nhé!'],
      winTitle: ['Shadow Art Saved!', 'Tranh Bóng Thú Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#334155';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.22)}px sans-serif`;
        g.fillText('🐰', w * 0.35, h * 0.62);
      }
    });
  }
});

// 9. spotdiff
register({
  id: 'spotdiff', icon: '🔍',
  name: () => T('Spot the Difference', 'Tìm Điểm Khác'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Circle the differences between the twin pictures!', 'Khoanh tròn những điểm khác nhau giữa hai bức tranh nhé!'],
      winTitle: ['Differences Picture Saved!', 'Bức Tranh Tìm Điểm Khác Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#f8fafc';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.15)}px sans-serif`;
        g.fillText('🍎', w * 0.15, h * 0.55);
        g.fillText('🍏', w * 0.6, h * 0.55);
      }
    });
  }
});

// 10. hiddenpic
register({
  id: 'hiddenpic', icon: '🕵️',
  name: () => T('Hidden Pictures', 'Tìm Hình Ẩn'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Highlight the hidden treasures tucked behind leaves!', 'Tô nổi bật những vật ẩn giấu đằng sau vòm lá nhé!'],
      winTitle: ['Hidden Picture Keepsake Saved!', 'Bức Tranh Tìm Hình Ẩn Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#dcfce7';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.16)}px sans-serif`;
        g.fillText('🌿', w * 0.2, h * 0.4);
        g.fillText('🔑', w * 0.45, h * 0.6);
        g.fillText('🍃', w * 0.7, h * 0.4);
      }
    });
  }
});

// 11. finishpic
register({
  id: 'finishpic', icon: '✏️',
  name: () => T('Finish the Picture', 'Vẽ Nốt Bức Tranh'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Draw the missing side to complete the happy picture!', 'Vẽ nốt nửa còn thiếu để hoàn thiện bức tranh vui nhé!'],
      winTitle: ['Completed Picture Saved!', 'Bức Tranh Hoàn Chỉnh Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#fef3c7';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.arc(w * 0.5, h * 0.5, w * 0.25, -Math.PI / 2, Math.PI / 2);
        g.strokeStyle = '#d97706';
        g.lineWidth = 5;
        g.stroke();
      }
    });
  }
});

// 12. scene
register({
  id: 'scene', icon: '🏞️',
  name: () => T('Sticker Scene', 'Dán Tranh Cảnh'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Paint and place details across your sunny countryside scene!', 'Tô vẽ thêm cảnh vật thiên nhiên rực rỡ nhé!'],
      winTitle: ['Sticker Scene Saved!', 'Bức Tranh Phong Cảnh Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#e0e7ff';
        g.fillRect(0, 0, w, h * 0.55);
        g.fillStyle = '#bbf7d0';
        g.fillRect(0, h * 0.55, w, h * 0.45);
        g.font = `${Math.round(w * 0.15)}px sans-serif`;
        g.fillText('🌳', w * 0.15, h * 0.65);
        g.fillText('🌈', w * 0.55, h * 0.35);
      }
    });
  }
});

// 13. paperfold
register({
  id: 'paperfold', icon: '📄',
  name: () => T('Paper Folding', 'Gấp Giấy'),
  run(api) {
    return runInteractivePad(api, {
      sayText: ['Fold paper creases and color your origami boat!', 'Vẽ nếp gấp và tô màu chiếc thuyền giấy origami nhé!'],
      winTitle: ['Origami Folding Art Saved!', 'Tác Phẩm Gấp Giấy Đã Ở Trong Album!'],
      drawGuide(g, w, h) {
        g.fillStyle = '#fef2f2';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.22)}px sans-serif`;
        g.fillText('⛵', w * 0.38, h * 0.62);
      }
    });
  }
});
