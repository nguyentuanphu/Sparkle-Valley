import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el('style', '', `
.d2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.d2-stage { position: relative; width: min(360px, 86vw); height: min(280px, 42vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; padding: 10px; }
.d2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.d2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.d2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.d2-preview { font-size: 72px; line-height: 1.2; text-align: center; }
.d2-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; max-width: 240px; }
.d2-tile { width: 100%; aspect-ratio: 1; border-radius: 8px; background: #eee; border: 2px dashed #bba; display: flex; align-items: center; justify-content: center; font-size: 32px; }
.d2-tile.done { border-style: solid; border-color: #3b2a4f; background: #fff; }
`));
}

async function runStepSequence(api, {
  sayText,
  steps,
  winTitle
}: {
  sayText: [string, string];
  steps: Array<{ icon: string; name: [string, string]; preview: string }>;
  winTitle: [string, string];
}) {
  style();
  api.say(sayText[0], sayText[1]);
  api.dots(steps.length, 0);

  const wrap = el('div', 'd2-board'); api.stage.appendChild(wrap);
  const stage = el('div', 'd2-stage'); wrap.appendChild(stage);
  const preview = el('div', 'd2-preview', pic(steps[0].preview)); stage.appendChild(preview);
  const controls = el('div', 'd2-controls'); wrap.appendChild(controls);

  const btns = steps.map((s, idx) => {
    const b = el('button', 'd2-btn', `${pic(s.icon)} <span>${T(s.name[0], s.name[1])}</span>`);
    b.dataset.step = String(idx);
    controls.appendChild(b);
    return b;
  });

  let current = 0;
  while (current < steps.length) {
    api.plan(() => btns[current] || null, { maxActions: 5 });
    const target = btns[current];
    const clicked = await untilRight(api, btns, e => e === target);
    if (!clicked || api.closed) return;
    preview.innerHTML = pic(steps[current].preview);
    api.sfx.pop(current);
    current++;
    api.dots(steps.length, current);
    await wait(300);
  }
  await wait(800);
  return api.win({ title: T(winTitle[0], winTitle[1]) });
}

// 1. stamps: Potato Stamps / In Hình
register({
  id: 'stamps', icon: '🥔',
  name: () => T('Potato Stamps', 'In Hình'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Press your carved potato into bright paints to stamp pretty shapes!', 'Chấm củ khoai tây vào màu để in những hình thật xinh nhé!'],
      steps: [
        { icon: '⭐', name: ['Star Stamp', 'Hình Ngôi Sao'], preview: '⭐' },
        { icon: '🌸', name: ['Flower Stamp', 'Hình Bông Hoa'], preview: '🌸' },
        { icon: '🐟', name: ['Fish Stamp', 'Hình Chú Cá'], preview: '🐟' }
      ],
      winTitle: ['Beautiful Stamps Made!', 'Đã In Xong Những Hình Thật Đẹp!']
    });
  }
});

// 2. weave: Weave a Mat / Đan Chiếu
register({
  id: 'weave', icon: '🌾',
  name: () => T('Weave a Mat', 'Đan Chiếu'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Weave the colourful dyed reeds under and over to make a traditional sleeping mat!', 'Đan những sợi cói màu sắc nong mốt nong hai để làm chiếc chiếu êm nhé!'],
      steps: [
        { icon: '🔴', name: ['Red Reed', 'Sợi Cói Đỏ'], preview: '🧣' },
        { icon: '🟡', name: ['Yellow Reed', 'Sợi Cói Vàng'], preview: '🧺' },
        { icon: '🟢', name: ['Green Reed', 'Sợi Cói Xanh'], preview: '🛏️' }
      ],
      winTitle: ['A Neat Woven Mat!', 'Chiếc Chiếu Hoa Thật Khéo!']
    });
  }
});

// 3. mosaic: Bát Tràng Tiles / Ghép Gốm Bát Tràng
register({
  id: 'mosaic', icon: '🏺',
  name: () => T('Bát Tràng Tiles', 'Ghép Gốm Bát Tràng'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Fit the shiny glazed ceramic pieces together onto the wall mural!', 'Ghép các mảnh gốm men màu lên bức tranh tường rực rỡ nào!'],
      steps: [
        { icon: '🟦', name: ['Blue Glaze', 'Men Lam Bát Tràng'], preview: '🔷' },
        { icon: '🟫', name: ['Clay Corner', 'Góc Đất Nung'], preview: '🏺' },
        { icon: '✨', name: ['Lotus Tile', 'Mảnh Sen Vàng'], preview: '🪷' }
      ],
      winTitle: ['Gleaming Mosaic Finished!', 'Tranh Gốm Bát Tràng Tuyệt Đẹp!']
    });
  }
});

// 4. nonla: Paint a Nón Lá / Vẽ Nón Lá
register({
  id: 'nonla', icon: '👒',
  name: () => T('Paint a Nón Lá', 'Vẽ Nón Lá'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Paint bamboo groves and poetic verses onto your smooth conical hat!', 'Vẽ những hàng tre xanh và câu thơ lên chiếc nón bài thơ xinh xắn nhé!'],
      steps: [
        { icon: '🎋', name: ['Green Bamboo', 'Rặng Tre Xanh'], preview: '🎋' },
        { icon: '🪷', name: ['Pink Lotus', 'Hoa Sen Hồng'], preview: '🪷' },
        { icon: '📜', name: ['Poem Stanza', 'Câu Thơ Thơ Mộng'], preview: '👒' }
      ],
      winTitle: ['A Lovely Painted Nón Lá!', 'Chiếc Nón Bài Thơ Xong Rồi!']
    });
  }
});

// 5. aodai: Áo Dài Designer / Thiết Kế Áo Dài
register({
  id: 'aodai', icon: '👘',
  name: () => T('Áo Dài Designer', 'Thiết Kế Áo Dài'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Pick rich silk fabrics and elegant patterns for a festive Áo Dài!', 'Chọn gấm lụa thướt tha và hoa văn duyên dáng để may tà áo dài đón Tết!'],
      steps: [
        { icon: '🧵', name: ['Red Silk Cloth', 'Lụa Tơ Tằm Đỏ'], preview: '🧣' },
        { icon: '🌼', name: ['Golden Blossom Pattern', 'Hoa Văn Mai Vàng'], preview: '🌼' },
        { icon: '🪡', name: ['Silk Buttons', 'Cúc Bấm Cổ Áo'], preview: '👘' }
      ],
      winTitle: ['Graceful Áo Dài Ready!', 'Bộ Áo Dài Duyên Dáng Đã Hoàn Thành!']
    });
  }
});

// 6. kitepaint: Design a Kite / Trang Trí Diều
register({
  id: 'kitepaint', icon: '🪁',
  name: () => T('Design a Kite', 'Trang Trí Diều'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Decorate the wings of your whistling flute kite to soar across the sky!', 'Vẽ cánh diều sáo thật rực rỡ để bay lượn vi vu trên bầu trời nhé!'],
      steps: [
        { icon: '🎨', name: ['Sunburst Wings', 'Cánh Mặt Trời'], preview: '☀️' },
        { icon: '🎏', name: ['Long Tails', 'Đuôi Diều Bay'], preview: '🎏' },
        { icon: '🎵', name: ['Bamboo Flute', 'Gắn Ống Sáo Diều'], preview: '🪁' }
      ],
      winTitle: ['Whistling Kite Ready to Fly!', 'Diều Sáo Đã Sẵn Sàng Bay Cao!']
    });
  }
});

// 7. shades: Light and Dark Colours / Màu Đậm Màu Nhạt
register({
  id: 'shades', icon: '🎨',
  name: () => T('Light and Dark Colours', 'Màu Đậm Màu Nhạt'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Order the colour swatches from soft pastel to deep vivid tone!', 'Xếp các sắc độ màu từ nhạt tinh khôi đến đậm rực rỡ nhé!'],
      steps: [
        { icon: '⚪', name: ['Pale Sky Tint', 'Xanh Nhạt Buổi Sớm'], preview: '☁️' },
        { icon: '🔷', name: ['Clear Ocean Blue', 'Xanh Biển Trong'], preview: '🌊' },
        { icon: '🌌', name: ['Deep Midnight Blue', 'Xanh Thẫm Đêm Sao'], preview: '🌌' }
      ],
      winTitle: ['Perfect Harmonious Shades!', 'Phối Màu Đậm Nhạt Thật Chuẩn!']
    });
  }
});

// 8. shadowpic: Light and Shadow / Bóng và Hình
register({
  id: 'shadowpic', icon: '👥',
  name: () => T('Light and Shadow', 'Bóng và Hình'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Shine the lamp to match every animal cutout with its sharp shadow on the wall!', 'Chiếu đèn pin để tìm đúng bóng đen của mỗi bạn thú ngộ nghĩnh!'],
      steps: [
        { icon: '🐰', name: ['Bunny Ears Shadow', 'Bóng Chú Thỏ'], preview: '🐰' },
        { icon: '🐦', name: ['Flying Bird Shadow', 'Bóng Cánh Chim'], preview: '🐦' },
        { icon: '🦌', name: ['Antler Shadow', 'Bóng Chú Hươu'], preview: '🦌' }
      ],
      winTitle: ['Shadow Puppet Match!', 'Bóng Và Hình Đã Khớp Rồi!']
    });
  }
});

// 9. spotdiff: Spot the Difference / Tìm Điểm Khác
register({
  id: 'spotdiff', icon: '🔍',
  name: () => T('Spot the Difference', 'Tìm Điểm Khác'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Look sharp and find all the little differences hidden in the twin drawings!', 'Quan sát thật kỹ để tìm những điểm khác nhau giữa hai bức tranh nhé!'],
      steps: [
        { icon: '👒', name: ['Hidden Hat', 'Chiếc Mũ Khác'], preview: '👒' },
        { icon: '🍎', name: ['Extra Apple', 'Quả Táo Đỏ'], preview: '🍎' },
        { icon: '🦋', name: ['Fluttering Butterfly', 'Chú Bướm Bay'], preview: '🦋' }
      ],
      winTitle: ['All Differences Spotted!', 'Bé Có Đôi Mắt Tinh Tường Quá!']
    });
  }
});

// 10. hiddenpic: Hidden Pictures / Tìm Hình Ẩn
register({
  id: 'hiddenpic', icon: '🕵️',
  name: () => T('Hidden Pictures', 'Tìm Hình Ẩn'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Can you discover the quiet treasures tucked away behind leaves and trees?', 'Bé có tìm ra những bí mật đang trốn sau vòm lá xanh không?'],
      steps: [
        { icon: '🔑', name: ['Golden Key', 'Chìa Khóa Vàng'], preview: '🔑' },
        { icon: '🔔', name: ['Little Bell', 'Chiếc Chuông Nhỏ'], preview: '🔔' },
        { icon: '⭐', name: ['Hidden Star', 'Ngôi Sao Ẩn'], preview: '⭐' }
      ],
      winTitle: ['Found Every Hidden Item!', 'Đã Tìm Thấy Hết Mọi Hình Ẩn!']
    });
  }
});

// 11. finishpic: Finish the Picture / Vẽ Nốt Bức Tranh
register({
  id: 'finishpic', icon: '✏️',
  name: () => T('Finish the Picture', 'Vẽ Nốt Bức Tranh'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Add the missing half to make each cheerful face and picture whole!', 'Vẽ nốt nửa còn thiếu để hoàn chỉnh bức tranh vui nhộn nhé!'],
      steps: [
        { icon: '☀️', name: ['Sunny Rays', 'Tia Nắng Ấm'], preview: '☀️' },
        { icon: '🚗', name: ['Missing Wheel', 'Bánh Xe Tròn'], preview: '🚗' },
        { icon: '🐱', name: ['Cat Whiskers', 'Râu Mèo Con'], preview: '🐱' }
      ],
      winTitle: ['The Picture is Complete!', 'Bức Tranh Đã Trọn Vẹn Rồi!']
    });
  }
});

// 12. scene: Sticker Scene / Dán Tranh Cảnh
register({
  id: 'scene', icon: '🏞️',
  name: () => T('Sticker Scene', 'Dán Tranh Cảnh'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Place cute stickers across the sunny landscape to create your story!', 'Dán những hình dán đáng yêu lên khung cảnh thiên nhiên tươi đẹp nào!'],
      steps: [
        { icon: '🌳', name: ['Shady Tree', 'Cây Xanh Mát'], preview: '🌳' },
        { icon: '🦆', name: ['Swimming Duck', 'Vịt Bơi Lội'], preview: '🦆' },
        { icon: '🌈', name: ['Bright Rainbow', 'Cầu Vồng Rực Rỡ'], preview: '🌈' }
      ],
      winTitle: ['A Wonderfully Lively Scene!', 'Bức Tranh Cảnh Thật Sống Động!']
    });
  }
});

// 13. paperfold: Paper Folding / Gấp Giấy
register({
  id: 'paperfold', icon: '📄',
  name: () => T('Paper Folding', 'Gấp Giấy'),
  async run(api) {
    return runStepSequence(api, {
      sayText: ['Crease and fold the crisp paper step by step into an origami companion!', 'Gấp từng nếp giấy vuông vức để tạo thành chú cào cào hay chiếc thuyền nhé!'],
      steps: [
        { icon: '📐', name: ['Corner to Corner', 'Gấp Chéo Góc'], preview: '📐' },
        { icon: '⛵', name: ['Fold Up Sails', 'Gấp Cánh Buồm'], preview: '⛵' },
        { icon: '🚢', name: ['Little Paper Boat', 'Chiếc Thuyền Giấy'], preview: '🚢' }
      ],
      winTitle: ['Origami Masterpiece Folded!', 'Bé Gấp Giấy Khéo Quá!']
    });
  }
});
