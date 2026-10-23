// Reading Corner additions (owner, 23 Oct 2026 AEDT):
// rd_blend, rd_hats, rd_endings, rd_compound, rd_labels, rd_signs,
// rd_questions, rd_many, rd_caps, rd_poem, rd_missing, rd_book.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';
import { saveProfiles, settings } from '../state.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.rd2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.rd2-stage { width: min(400px, 90vw); min-height: 200px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 16px; text-align: center; }
.rd2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 420px; }
.rd2-btn { min-width: 64px; min-height: 64px; padding: 10px 18px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 18px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; touch-action: manipulation; }
.rd2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.rd2-big { font-size: 58px; line-height: 1.1; text-align: center; }
.rd2-desc { font: 800 18px/1.3 var(--font, sans-serif); color: #402c57; max-width: 340px; }
.gl.little .rd2-btn { min-width: 64px; min-height: 64px; font-size: 20px; }
`));
}

const isVi = () => settings.lang === 'vi';

function keep(api: any, png: string) {
  for (const p of api.players || []) {
    if (!p || !Array.isArray(p.album)) continue;
    p.album.push(png);
    if (p.album.length > 12) p.album.shift();
  }
  saveProfiles();
}

async function runReadingRounds(api: any, prompt: [string, string], qs: Array<{ show: string | [string, string]; desc: [string, string]; choices: string[][]; answer: number }>, done: [string, string]) {
  style(); api.say(prompt[0], prompt[1]); api.dots(qs.length, 0);
  const wrap = el('div', 'rd2-board'), stage = el('div', 'rd2-stage'), controls = el('div', 'rd2-controls');
  api.stage.appendChild(wrap); wrap.append(stage, controls);
  let k = 0;
  while (k < qs.length) {
    const q = qs[k];
    stage.innerHTML = `<div class="rd2-big">${Array.isArray(q.show) ? T(q.show[0], q.show[1]) : q.show}</div><div class="rd2-desc">${T(q.desc[0], q.desc[1])}</div>`;
    controls.innerHTML = '';
    const btns = q.choices.map((c, i) => {
      const b = el('button', 'rd2-btn', `<span>${T(c[0], c[1])}</span>`);
      b.dataset.i = String(i);
      controls.appendChild(b);
      return b;
    });
    const target = btns[q.answer];
    api.plan(() => target, { maxActions: 6 });
    const clicked = await untilRight(api, btns, (e: HTMLElement) => e === target);
    if (!clicked || api.closed) return;
    api.sfx.ding();
    k++; api.dots(qs.length, k);
    await wait(300);
  }
  api.say(done[0], done[1]);
  await wait(900);
  return api.win({ title: T(done[0], done[1]) });
}

// 1. Blend the Sounds (3 rounds)
register({
  id: 'rd_blend', icon: '🔤',
  name: () => T('Blend the Sounds', 'Ghép Âm'),
  async run(api) {
    return runReadingRounds(api,
      ['Listen and blend the sounds into a whole word!', 'Lắng nghe và ghép các âm thành từ hoàn chỉnh nhé!'],
      [
        {
          show: '🐱',
          desc: ['c - a - t', 'c - a'],
          choices: [['cat 🐱', 'ca 🐱'], ['sun ☀️', 'ba 👨'], ['dog 🐶', 'gà 🐔']],
          answer: 0
        },
        {
          show: '☀️',
          desc: ['s - u - n', 'b - a'],
          choices: [['pig 🐷', 'bò 🐮'], ['sun ☀️', 'ba 👨'], ['car 🚗', 'cá 🐟']],
          answer: 1
        },
        {
          show: '🐔',
          desc: ['p - i - g', 'g - à'],
          choices: [['cup 🥛', 'hoa 🌸'], ['hat 🎩', 'mèo 🐱'], ['pig 🐷', 'gà 🐔']],
          answer: 2
        }
      ],
      ['Sounds blended into words!', 'Con ghép âm thành từ thật giỏi!']
    );
  }
});

// 2. Vowel Hats (3 rounds)
register({
  id: 'rd_hats', icon: '🎩',
  name: () => T('Vowel Hats', 'Mũ Cho Chữ'),
  async run(api) {
    return runReadingRounds(api,
      ['Give the right little hat to each vowel letter!', 'Đội chiếc mũ xinh cho đúng từng chữ cái nhé!'],
      [
        {
          show: '🎩',
          desc: ['Give a hat to letter "a" to make:', 'Đội mũ cho chữ "a" thành chữ gì?'],
          choices: [['â 🎩', 'â 🎩'], ['á', 'á'], ['à', 'à']],
          answer: 0
        },
        {
          show: '🎩',
          desc: ['Give a hat to letter "e" to make:', 'Đội mũ cho chữ "e" thành chữ gì?'],
          choices: [['è', 'è'], ['ê 🎩', 'ê 🎩'], ['é', 'é']],
          answer: 1
        },
        {
          show: '🎩',
          desc: ['Give a hat to letter "o" to make:', 'Đội mũ cho chữ "o" thành chữ gì?'],
          choices: [['ỏ', 'ỏ'], ['ọ', 'ọ'], ['ô 🎩', 'ô 🎩']],
          answer: 2
        }
      ],
      ['All letters have their friendly hats!', 'Tất cả các chữ cái đều đã có mũ xinh!']
    );
  }
});

// 3. Word Endings (3 rounds)
register({
  id: 'rd_endings', icon: '🔚',
  name: () => T('Word Endings', 'Vần Cuối'),
  async run(api) {
    return runReadingRounds(api,
      ['Find words that share the same ending sound!', 'Tìm các từ có cùng vần cuối với nhau nhé!'],
      [
        {
          show: '🐱',
          desc: ['Ends like "c-at":', 'Cùng vần "át" với "cát":'],
          choices: [['hat 🎩', 'bát 🥣'], ['dog 🐶', 'chó 🐶'], ['sun ☀️', 'mây ☁️']],
          answer: 0
        },
        {
          show: '🛏️',
          desc: ['Ends like "r-ed":', 'Cùng vần "úp" với "búp":'],
          choices: [['pig 🐷', 'lá 🍃'], ['bed 🛏️', 'cúp 🏆'], ['car 🚗', 'cá 🐟']],
          answer: 1
        },
        {
          show: '☀️',
          desc: ['Ends like "f-un":', 'Cùng vần "anh" với "chanh":'],
          choices: [['cat 🐱', 'hoa 🌸'], ['cup 🥛', 'núi ⛰️'], ['sun ☀️', 'bánh 🍰']],
          answer: 2
        }
      ],
      ['Wonderful rhyming friends!', 'Các từ cùng vần thật ăn ý!']
    );
  }
});

// 4. Two Words Make One (3 rounds)
register({
  id: 'rd_compound', icon: '🧩',
  name: () => T('Two Words Make One', 'Ghép Hai Từ'),
  async run(api) {
    return runReadingRounds(api,
      ['Join two smaller words together to make a new one!', 'Ghép hai từ nhỏ thành một từ ghép mới nào!'],
      [
        {
          show: '🌻',
          desc: ['sun ☀️ + flower 🌸 =', 'hoa 🌸 + hướng dương ☀️ ='],
          choices: [['sunflower 🌻', 'hoa hướng dương 🌻'], ['sunhat 👒', 'hoa sen 🪷'], ['raincoat 🧥', 'hoa hồng 🌹']],
          answer: 0
        },
        {
          show: '🌈',
          desc: ['rain 🌧️ + bow 🎀 =', 'cầu 🌉 + vồng 🌈 ='],
          choices: [['rainboot 👢', 'cầu treo 🌉'], ['rainbow 🌈', 'cầu vồng 🌈'], ['teacup 🍵', 'cầu lông 🏸']],
          answer: 1
        },
        {
          show: ['🪼', '🐬'], // (a picture per language: the English and the Vietnamese answer differ)
          desc: ['jelly 🍮 + fish 🐟 =', 'cá 🐟 + heo 🐷 ='],
          choices: [['starfruit 🍈', 'sao băng 🌠'], ['moonlight 🌙', 'sao chổi ☄️'], ['jellyfish 🪼', 'cá heo 🐬']],
          answer: 2
        }
      ],
      ['Two words joined together!', 'Ghép từ thật chuẩn xác!']
    );
  }
});

// 5. Label the Picture (3 rounds)
register({
  id: 'rd_labels', icon: '🏷️',
  name: () => T('Label the Picture', 'Gắn Tên Cho Tranh'),
  async run(api) {
    return runReadingRounds(api,
      ['Match the right word label to each picture!', 'Gắn đúng tên cho từng bức tranh nhé!'],
      [
        {
          show: '🍎',
          desc: ['What is this red sweet fruit?', 'Quả gì màu đỏ ngọt ngào đây?'],
          choices: [['Apple 🍎', 'Quả Táo 🍎'], ['Banana 🍌', 'Quả Chuối 🍌'], ['Orange 🍊', 'Quả Cam 🍊']],
          answer: 0
        },
        {
          show: '🏠',
          desc: ['Where does family live cozy and warm?', 'Nơi gia đình mình ở ấm áp?'],
          choices: [['Tree 🌳', 'Cây Xanh 🌳'], ['House 🏠', 'Ngôi Nhà 🏠'], ['Boat ⛵', 'Chiếc Thuyền ⛵']],
          answer: 1
        },
        {
          show: '✈️',
          desc: ['What flies high up across the clouds?', 'Phương tiện nào bay lượn trên mây?'],
          choices: [['Train 🚂', 'Tàu Hỏa 🚂'], ['Car 🚗', 'Ô Tô 🚗'], ['Airplane ✈️', 'Máy Bay ✈️']],
          answer: 2
        }
      ],
      ['Every picture has its label!', 'Tranh nào cũng có tên thật đẹp!']
    );
  }
});

// 6. Signs in Town (3 rounds)
register({
  id: 'rd_signs', icon: '🚸',
  name: () => T('Signs in Town', 'Biển Báo Trong Phố'),
  async run(api) {
    return runReadingRounds(api,
      ['Read helpful town signs so we stay safe!', 'Đọc biển báo trên phố để luôn an toàn nhé!'],
      [
        {
          show: '🛑',
          desc: ['The bright red sign says:', 'Biển báo màu đỏ ghi chữ:'],
          choices: [['STOP 🛑', 'DỪNG LẠI 🛑'], ['RUN 🏃', 'CHẠY NHANH 🏃'], ['SING 🎶', 'HÁT VANG 🎶']],
          answer: 0
        },
        {
          show: '🚪',
          desc: ['The green doorway sign says:', 'Biển báo xanh trên cửa ghi chữ:'],
          choices: [['ENTER 🚪', 'LỐI VÀO 🚪'], ['EXIT 🚪', 'LỐI RA 🚪'], ['SLEEP 😴', 'ĐI NGỦ 😴']],
          answer: 1
        },
        {
          show: '📚',
          desc: ['The quiet reading house sign says:', 'Biển nhà đọc sách yên tĩnh ghi:'],
          choices: [['BAKERY 🥖', 'TIỆM BÁNH 🥖'], ['TOY STORE 🧸', 'ĐỒ CHƠI 🧸'], ['LIBRARY 📚', 'THƯ VIỆN 📚']],
          answer: 2
        }
      ],
      ['You read the town signs so well!', 'Con đọc biển báo trên phố rất giỏi!']
    );
  }
});

// 7. Who, What, Where (3 rounds)
register({
  id: 'rd_questions', icon: '❓',
  name: () => T('Who, What, Where', 'Ai, Gì, Ở Đâu'),
  async run(api) {
    return runReadingRounds(api,
      ['Answer the gentle question words: Who, What, Where!', 'Trả lời các câu hỏi: Ai, Cái gì, Ở đâu!'],
      [
        {
          show: '🩺',
          desc: ['WHO takes care of you when you have a cold?', 'AI chăm sóc con khi con bị ốm?'],
          choices: [['Doctor 🩺', 'Bác Sĩ 🩺'], ['Guitar 🎸', 'Cây Đàn 🎸'], ['Cloud ☁️', 'Đám Mây ☁️']],
          answer: 0
        },
        {
          show: '🏞️',
          desc: ['WHERE do we go to slide and swing?', 'Ở ĐÂU có xích đu và cầu trượt?'],
          choices: [['Pillow 🛏️', 'Cái Gối 🛏️'], ['Park 🏞️', 'Công Viên 🏞️'], ['Spoon 🥄', 'Cái Thìa 🥄']],
          answer: 1
        },
        {
          show: '💧',
          desc: ['WHAT falls softly from rainy clouds?', 'CÁI GÌ rơi tí tách từ đám mây mưa?'],
          choices: [['Stones 🪨', 'Hòn Đá 🪨'], ['Bread 🍞', 'Bánh Mì 🍞'], ['Raindrops 💧', 'Hạt Mưa 💧']],
          answer: 2
        }
      ],
      ['You know Who, What, and Where!', 'Con hiểu rõ Ai, Cái gì, Ở đâu rồi!']
    );
  }
});

// 8. One and Many (3 rounds)
register({
  id: 'rd_many', icon: '🔢',
  name: () => T('One and Many', 'Một và Nhiều'),
  async run(api) {
    return runReadingRounds(api,
      ['Match one little thing with a group of many!', 'Nối một bạn nhỏ với đàn nhiều bạn nhé!'],
      [
        {
          show: '🐱',
          desc: ['One cat 🐱 and many:', 'Một chú mèo 🐱 và nhiều:'],
          choices: [['Cats 🐱🐱', 'Đàn mèo 🐱🐱'], ['Dogs 🐶🐶', 'Đàn chó 🐶🐶'], ['Birds 🐦🐦', 'Đàn chim 🐦🐦']],
          answer: 0
        },
        {
          show: '🌸',
          desc: ['One flower 🌸 and many:', 'Một bông hoa 🌸 và nhiều:'],
          choices: [['Leaves 🍃🍃', 'Nhiều lá 🍃🍃'], ['Flowers 🌸🌸', 'Vườn hoa 🌸🌸'], ['Apples 🍎🍎', 'Nhiều táo 🍎🍎']],
          answer: 1
        },
        {
          show: '⭐',
          desc: ['One star ⭐ and many:', 'Một ngôi sao ⭐ và nhiều:'],
          choices: [['Moons 🌙🌙', 'Nhiều trăng 🌙🌙'], ['Clouds ☁️☁️', 'Nhiều mây ☁️☁️'], ['Stars ⭐⭐', 'Bầu trời sao ⭐⭐']],
          answer: 2
        }
      ],
      ['One and many matched together!', 'Một và nhiều bạn cùng chung vui!']
    );
  }
});

// 9. Big and Small Letters (3 rounds)
register({
  id: 'rd_caps', icon: '🔠',
  name: () => T('Big and Small Letters', 'Chữ Hoa Chữ Thường'),
  async run(api) {
    return runReadingRounds(api,
      ['Match the big capital letter with its little lowercase twin!', 'Tìm chữ thường đi cùng chữ hoa nhé!'],
      [
        {
          show: '🔠',
          desc: ['Big letter "A" pairs with:', 'Chữ hoa "A" đi cùng chữ thường:'],
          choices: [['a', 'a'], ['b', 'b'], ['c', 'c']],
          answer: 0
        },
        {
          show: '🔠',
          desc: ['Big letter "B" pairs with:', 'Chữ hoa "B" đi cùng chữ thường:'],
          choices: [['d', 'd'], ['b', 'b'], ['p', 'p']],
          answer: 1
        },
        {
          show: '🔠',
          desc: ['Big letter "M" pairs with:', 'Chữ hoa "M" đi cùng chữ thường:'],
          choices: [['w', 'w'], ['n', 'n'], ['m', 'm']],
          answer: 2
        }
      ],
      ['Capital and small letters matched!', 'Chữ hoa chữ thường ghép đôi thật khớp!']
    );
  }
});

// 10. Read a Little Poem (3 rounds)
register({
  id: 'rd_poem', icon: '📜',
  name: () => T('Read a Little Poem', 'Đọc Bài Thơ Nhỏ'),
  async run(api) {
    return runReadingRounds(api,
      ['Complete the gentle rhyming line in our valley poem!', 'Điền từ vần còn thiếu trong bài thơ nhỏ nhé!'],
      [
        {
          show: '🌟',
          desc: ['"Twinkle little star at night, shining with a friendly..."', '"Ngôi sao lấp lánh trên trời, dịu dàng tỏa ánh..."'],
          choices: [['light 💡', 'sáng ngời 💡'], ['tree 🌳', 'cây xanh 🌳'], ['shoe 👟', 'chiếc giày 👟']],
          answer: 0
        },
        {
          show: '🐸',
          desc: ['"Little green frog sitting on a log, splashing in the cool..."', '"Chú ếch xanh nhảy bên hồ, cất lời hát ca líu..."'],
          choices: [['pond 💧', 'lo 🎵'], ['cloud ☁️', 'mây ☁️'], ['bed 🛏️', 'giường 🛏️']],
          answer: 0
        },
        {
          show: '🐝',
          desc: ['"Busy honey bee in the sun so free, flying to the flowering..."', '"Ánh nắng sớm mai thật hiền, chim hót ríu rít trên..."'],
          choices: [['moon 🌙', 'mặt trăng 🌙'], ['spoon 🥄', 'chiếc thìa 🥄'], ['tree 🌳', 'cành cây 🌳']],
          answer: 2
        }
      ],
      ['The little poem sounds so sweet!', 'Bài thơ nhỏ ngân vang thật êm đềm!']
    );
  }
});

// 11. Missing Letter (3 rounds)
register({
  id: 'rd_missing', icon: '🧩',
  name: () => T('Missing Letter', 'Điền Chữ Còn Thiếu'),
  async run(api) {
    return runReadingRounds(api,
      ['Pick the missing letter to complete the friendly word!', 'Chọn chữ cái còn thiếu để hoàn chỉnh từ nhé!'],
      [
        {
          show: '🐱',
          desc: ['c _ t (cat)', 'm è _ (mèo)'],
          choices: [['a', 'o'], ['o', 'a'], ['u', 'u']],
          answer: 0
        },
        {
          show: '☀️',
          desc: ['s _ n (sun)', 'g _ à (gà)'],
          choices: [['e', 'o'], ['u', 'à'], ['i', 'u']],
          answer: 1
        },
        {
          show: '🐶',
          desc: ['d _ g (dog)', 'c _ á (cá)'],
          choices: [['a', 'u'], ['e', 'e'], ['o', 'á']],
          answer: 2
        }
      ],
      ['You found every missing letter!', 'Con tìm đủ mọi chữ cái còn thiếu!']
    );
  }
});

// 12. Make a Little Book (3 rounds, kept in the Album)
register({
  id: 'rd_book', icon: '📖',
  name: () => T('Make a Little Book', 'Làm Sách Nhỏ'),
  async run(api) {
    style();
    api.say('Make your own little picture storybook and keep it in your Album!', 'Tự tay làm cuốn sách tranh nhỏ và lưu vào Album nhé!');
    api.dots(3, 0);

    const wrap = el('div', 'rd2-board'), stage = el('div', 'rd2-stage'), controls = el('div', 'rd2-controls');
    api.stage.appendChild(wrap); wrap.append(stage, controls);

    const steps = [
      {
        show: '📖',
        desc: ['Choose your book cover theme:', 'Chọn trang bìa cho cuốn sách:'],
        choices: [['Sunny Valley ☀️', 'Thung Lũng Nắng ☀️'], ['Starry Night 🌙', 'Đêm Đầy Sao 🌙']],
        answer: 0
      },
      {
        show: '🐾',
        desc: ['Choose animal characters for page 2:', 'Chọn các bạn nhỏ cho trang 2:'],
        choices: [['Friendly Pets 🐱🐶', 'Thú Cưng Nhỏ 🐱🐶'], ['Baby Birds 🐦🐣', 'Chim Non 🐦🐣']],
        answer: 0
      },
      {
        show: '✨',
        desc: ['Bind the pages together with a colorful ribbon!', 'Đóng sách bằng dải ruy băng rực rỡ nào!'],
        choices: [['Bind Book 🎀', 'Đóng Sách 🎀'], ['Wait', 'Chờ']],
        answer: 0
      }
    ];

    for (let i = 0; i < steps.length; i++) {
      const q = steps[i];
      stage.innerHTML = `<div class="rd2-big">${Array.isArray(q.show) ? T(q.show[0], q.show[1]) : q.show}</div><div class="rd2-desc">${T(q.desc[0], q.desc[1])}</div>`;
      controls.innerHTML = '';
      const btns = q.choices.map((c, idx) => {
        const b = el('button', 'rd2-btn', `<span>${T(c[0], c[1])}</span>`);
        b.dataset.i = String(idx);
        controls.appendChild(b);
        return b;
      });
      const target = btns[q.answer];
      api.plan(() => target, { maxActions: 6 });
      const clicked = await untilRight(api, btns, (e: HTMLElement) => e === target);
      if (!clicked || api.closed) return;
      api.sfx.pop();
      api.dots(3, i + 1);
      await wait(300);
    }

    // Render keepsake canvas card for the Album
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff9eb';
      ctx.fillRect(0, 0, 320, 240);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#6f4b35';
      ctx.strokeRect(4, 4, 312, 232);
      ctx.fillStyle = '#3f2b24';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(T('My Little Book', 'Cuốn Sách Của Em'), 160, 60);
      ctx.font = '48px sans-serif';
      ctx.fillText('📖☀️🐱', 160, 130);
      ctx.font = '16px sans-serif';
      ctx.fillText(T('Sparkle Valley Reading', 'Tủ Sách Thung Lũng'), 160, 190);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        keep(api, dataUrl);
      } catch {}
    }

    api.say('Your little book is kept in your Album!', 'Cuốn sách nhỏ của con đã được lưu vào Album rồi!');
    await wait(1200);
    return api.win({ title: T('Little Book is Ready!', 'Cuốn Sách Đã Hoàn Thành!') });
  }
});
