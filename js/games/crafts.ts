import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el('style', '', `
.cr-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.cr-stage { position: relative; width: min(360px, 86vw); height: min(280px, 42vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; padding: 10px; }
.cr-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.cr-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.cr-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.cr-preview { font-size: 72px; line-height: 1.2; text-align: center; }
`));
}

async function runCraftSequence(api, {
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

  const wrap = el('div', 'cr-board'); api.stage.appendChild(wrap);
  const stage = el('div', 'cr-stage'); wrap.appendChild(stage);
  const preview = el('div', 'cr-preview', pic(steps[0].preview)); stage.appendChild(preview);
  const controls = el('div', 'cr-controls'); wrap.appendChild(controls);

  const btns = steps.map((s, idx) => {
    const b = el('button', 'cr-btn', `${pic(s.icon)} <span>${T(s.name[0], s.name[1])}</span>`);
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

// 1. lacquer: Lacquer Painting / Tranh Sơn Mài
register({
  id: 'lacquer', icon: '🖼️',
  name: () => T('Lacquer Painting', 'Tranh Sơn Mài'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Lay real gold leaf and polish layers of natural sap until shimmering art emerges!', 'Dát vàng quỳ và mài từng lớp sơn ta để ánh lên bức tranh huyền ảo!'],
      steps: [
        { icon: '🪵', name: ['Black Lacquer Board', 'Vóc Gỗ Sơn Đen'], preview: '🪵' },
        { icon: '✨', name: ['Gold Leaf Inlay', 'Dát Vàng Quỳ'], preview: '✨' },
        { icon: '🪷', name: ['Polished Lotus Bloom', 'Mài Hiện Tranh Sen'], preview: '🪷' }
      ],
      winTitle: ['Luminous Lacquer Masterpiece!', 'Bức Tranh Sơn Mài Lấp Lánh Tuyệt Đẹp!']
    });
  }
});

// 2. scratch: Scratch Art / Tranh Cào
register({
  id: 'scratch', icon: '✨',
  name: () => T('Scratch Art', 'Tranh Cào'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Gently scrape away the dark layer with a stylus to reveal dazzling rainbow hues beneath!', 'Dùng que tre cào nhẹ lớp phấn đen để lộ ra sắc cầu vồng lấp lánh nhé!'],
      steps: [
        { icon: '🖌️', name: ['Scratch a Star', 'Cào Hình Ngôi Sao'], preview: '⭐' },
        { icon: '🌈', name: ['Reveal Rainbow Waves', 'Lộ Dải Cầu Vồng'], preview: '🌈' },
        { icon: '🎆', name: ['Sparkling Night Sky', 'Bầu Trời Đầy Tia Sáng'], preview: '✨' }
      ],
      winTitle: ['Dazzling Scratch Artwork!', 'Bức Tranh Cào Cầu Vồng Tuyệt Đẹp!']
    });
  }
});

// 3. bubblepaint: Bubble Paint / Vẽ Bong Bóng
register({
  id: 'bubblepaint', icon: '🫧',
  name: () => T('Bubble Paint', 'Vẽ Bong Bóng'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Blow joyful soapy bubbles in bright watercolours, then press paper down as they pop!', 'Thổi bong bóng màu xà phòng rực rỡ rồi áp giấy để in những đốm tròn diệu kỳ!'],
      steps: [
        { icon: '🫧', name: ['Blue Bubbles', 'Bong Bóng Xanh Biển'], preview: '🫧' },
        { icon: '🌸', name: ['Pink Foam Bubbles', 'Bong Bóng Hồng Đào'], preview: '🌸' },
        { icon: '📜', name: ['Bubble Print Paper', 'Trang Giấy Đốm Màu'], preview: '🎨' }
      ],
      winTitle: ['Bubbly Dreamy Picture!', 'Tranh Bong Bóng Nghệ Thuật Đã Xong!']
    });
  }
});

// 4. fingerpaint: Finger Painting / Vẽ Bằng Ngón Tay
register({
  id: 'fingerpaint', icon: '🖐️',
  name: () => T('Finger Painting', 'Vẽ Bằng Ngón Tay'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Dip your fingertips straight into silky non-toxic paint and dab your imagination onto the page!', 'Chấm ngón tay vào vệt màu mát mịn để vẽ những bông hoa và chú bướm xinh xắn!'],
      steps: [
        { icon: '🔴', name: ['Red Petal Dab', 'Chấm Cánh Hoa Đỏ'], preview: '🌺' },
        { icon: '🟢', name: ['Green Vine Dab', 'Vuốt Cành Lá Xanh'], preview: '🌿' },
        { icon: '🦋', name: ['Fingerprint Butterfly', 'In Chú Bướm Vàng'], preview: '🦋' }
      ],
      winTitle: ['A Cheerful Fingerprint Art Album!', 'Bức Tranh Dấu Tay Dễ Thương Đã Xong!']
    });
  }
});

// 5. weatherpaint: Colour the Weather / Tô Màu Thời Tiết
register({
  id: 'weatherpaint', icon: '🌦️',
  name: () => T('Colour the Weather', 'Tô Màu Thời Tiết'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Paint the sky for sunshine, gentle raindrops, drifting clouds or winter snow!', 'Tô màu cho bầu trời nắng ấm, mưa bay lất phất hay mây trắng bồng bềnh nhé!'],
      steps: [
        { icon: '☀️', name: ['Warm Golden Sun', 'Mặt Trời Tỏa Nắng'], preview: '☀️' },
        { icon: '🌧️', name: ['Gentle Spring Shower', 'Cơn Mưa Rào Mát Rượi'], preview: '🌧️' },
        { icon: '🌈', name: ['Clear Sky Rainbow', 'Cầu Vồng Sau Mưa'], preview: '🌈' }
      ],
      winTitle: ['A Full Sky of Seasons!', 'Bầu Trời Bốn Mùa Rực Rỡ Sắc Màu!']
    });
  }
});

// 6. thocam: Brocade Patterns / Hoa Văn Thổ Cẩm
register({
  id: 'thocam', icon: '🧶',
  name: () => T('Brocade Patterns', 'Hoa Văn Thổ Cẩm'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Arrange highland geometric motifs into a proud, vibrant ethnic brocade border!', 'Xếp những khối hình học kỷ hà độc đáo thành dải thổ cẩm vùng cao rực rỡ!'],
      steps: [
        { icon: '🔷', name: ['Mountain Diamond', 'Họa Tiết Hình Thoi'], preview: '🔷' },
        { icon: '🔺', name: ['Pine Tree Triangles', 'Rừng Thông Tam Giác'], preview: '🔺' },
        { icon: '🧵', name: ['Woven Brocade Border', 'Dải Viền Thổ Cẩm'], preview: '🧣' }
      ],
      winTitle: ['Highland Brocade Tapestry!', 'Tấm Thổ Cẩm Vùng Cao Đẹp Tuyệt Vời!']
    });
  }
});

// 7. pixelpic: Pixel Picture / Tranh Ô Vuông
register({
  id: 'pixelpic', icon: '👾',
  name: () => T('Pixel Picture', 'Tranh Ô Vuông'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Fill in each tiny square like little mosaic tiles to make retro character art!', 'Tô màu từng ô vuông nhỏ xíu để tạo nên nhân vật hoạt hình thật ngộ nghĩnh!'],
      steps: [
        { icon: '🟨', name: ['Yellow Face Pixels', 'Tô Ô Màu Vàng'], preview: '🙂' },
        { icon: '🟥', name: ['Red Cap Pixels', 'Tô Chiếc Mũ Đỏ'], preview: '🧢' },
        { icon: '⭐', name: ['Shiny Pixel Heart', 'Điểm Xuyết Trái Tim'], preview: '💖' }
      ],
      winTitle: ['Pixel Art Finished!', 'Bức Tranh Pixel Đáng Yêu Đã Hoàn Thành!']
    });
  }
});

// 8. fireworks: Fireworks Painter / Vẽ Pháo Hoa
register({
  id: 'fireworks', icon: '🎆',
  name: () => T('Fireworks Painter', 'Vẽ Pháo Hoa'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Light up the midnight sky with bursts of sparkling gold and ruby fireworks over the harbour and lake!', 'Thắp sáng bầu trời đêm Giao Thừa bằng những chùm pháo hoa rực rỡ trên mặt hồ!'],
      steps: [
        { icon: '✨', name: ['Golden Comet Trail', 'Vệt Pháo Sáng Vàng'], preview: '✨' },
        { icon: '🎆', name: ['Ruby Flower Burst', 'Bông Pháo Hoa Đỏ'], preview: '🎆' },
        { icon: '🎇', name: ['Sparkler Finale', 'Mưa Sao Lấp Lánh'], preview: '🎇' }
      ],
      winTitle: ['A Night Sky Full of Wonder!', 'Bầu Trời Pháo Hoa Giao Thừa Đẹp Lộng Lẫy!']
    });
  }
});

// 9. masks: Mid-Autumn Masks / Làm Mặt Nạ Trung Thu
register({
  id: 'masks', icon: '🎭',
  name: () => T('Mid-Autumn Masks', 'Làm Mặt Nạ Trung Thu'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Paint papier-mâché masks of the jolly Moon God Ông Địa and cheerful rabbits for festival night!', 'Vẽ mặt nạ giấy bồi Ông Địa phúc hậu và chú thỏ ngọc để rước đèn đêm rằm!'],
      steps: [
        { icon: '🎭', name: ['Smiling Ông Địa Mask', 'Mặt Nạ Ông Địa'], preview: '🎭' },
        { icon: '🐰', name: ['Jade Rabbit Mask', 'Mặt Nạ Thỏ Ngọc'], preview: '🐰' },
        { icon: '🏮', name: ['Moonlight Lantern Ribbons', 'Gắn Dải Ruy Băng Đèn Lồng'], preview: '🏮' }
      ],
      winTitle: ['Mid-Autumn Festival Masks Ready!', 'Mặt Nạ Trung Thu Vui Nhộn Đã Xong!']
    });
  }
});

// 10. makeface: Make a Face / Ghép Khuôn Mặt
register({
  id: 'makeface', icon: '😀',
  name: () => T('Make a Face', 'Ghép Khuôn Mặt'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Choose laughing eyes, silly button noses and great big smiles to build cheerful faces!', 'Chọn đôi mắt cười, chiếc mũi tròn và nụ cười rạng rỡ để ghép thành khuôn mặt vui vẻ!'],
      steps: [
        { icon: '👀', name: ['Sparkling Kind Eyes', 'Đôi Mắt Tinh Anh'], preview: '👀' },
        { icon: '👃', name: ['Button Nose', 'Chiếc Mũi Nhỏ'], preview: '👃' },
        { icon: '👄', name: ['Happy Broad Smile', 'Nụ Cười Rạng Rỡ'], preview: '😀' }
      ],
      winTitle: ['A Big Warm Cheerful Smile!', 'Khuôn Mặt Thật Tươi Tắn Và Dễ Thương!']
    });
  }
});

// 11. gallery: My Little Gallery / Phòng Tranh Của Em
register({
  id: 'gallery', icon: '🖼️',
  name: () => T('My Little Gallery', 'Phòng Tranh Của Em'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Select ornate wooden frames and hang your favorite drawings up in your cozy home museum!', 'Chọn khung gỗ xinh xắn và treo những bức tranh bé yêu thích lên phòng triển lãm nhé!'],
      steps: [
        { icon: '🪵', name: ['Carved Wood Frame', 'Khung Gỗ Chạm Khắc'], preview: '🖼️' },
        { icon: '💡', name: ['Spotlight Above', 'Gắn Đèn Soi Tranh'], preview: '💡' },
        { icon: '🏷️', name: ['Artist Signature Tag', 'Tấm Biển Tên Tác Giả'], preview: '🎨' }
      ],
      winTitle: ['Your Gallery is Open for Visitors!', 'Phòng Tranh Nhỏ Của Bé Đã Mở Cửa!']
    });
  }
});

// 12. leafrub: Leaf Rubbings / In Lá
register({
  id: 'leafrub', icon: '🍃',
  name: () => T('Leaf Rubbings', 'In Lá'),
  async run(api) {
    return runCraftSequence(api, {
      sayText: ['Place autumn leaves under drawing paper and rub wax crayons over them to reveal intricate veins!', 'Đặt chiếc lá dưới trang giấy rồi dùng sáp màu chà nhẹ để hiện lên từng đường gân lá kỳ diệu!'],
      steps: [
        { icon: '🍃', name: ['Broad Maple Leaf', 'Chiếc Lá Phong Rơi'], preview: '🍁' },
        { icon: '🖍️', name: ['Wax Crayon Rubbing', 'Chà Sáp Màu'], preview: '🖍️' },
        { icon: '🌿', name: ['Intricate Vein Pattern', 'Hiện Đường Gân Lá'], preview: '🌿' }
      ],
      winTitle: ['Natural Leaf Pattern Unveiled!', 'Bức Tranh In Lá Tự Nhiên Thật Đẹp!']
    });
  }
});
