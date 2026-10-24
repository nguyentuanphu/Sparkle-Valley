// Music additions (owner, 23 Oct 2026 AEDT):
// Đàn Tranh, Bush Band, Drum Echo, Loud and Quiet, and Song Steps.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.mu2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.mu2-stage { position: relative; width: min(360px, 86vw); height: min(280px, 42vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; padding: 10px; }
.mu2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.mu2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.mu2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.mu2-zither { width: 90%; height: 160px; background: #a8743a; border-radius: 12px; display: flex; justify-content: space-around; align-items: stretch; padding: 10px 14px; box-shadow: inset 0 0 10px rgba(0,0,0,.3); }
.mu2-string { width: 44px; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
.mu2-wire { width: 4px; height: 100%; background: #ffd96b; border-radius: 2px; transition: all .2s; }
.mu2-wire.lit { background: #fff; box-shadow: 0 0 12px #ffde00; transform: scaleX(2); }
`));
}

// 1. Zither Strings (Đàn Tranh)
register({
  id: 'dantranh', icon: '🎻',
  name: () => T('Zither Strings', 'Đàn Tranh'),
  async run(api) {
    style();
    api.say('Pluck the lit strings of the Đàn Tranh to play the melody!',
      'Gảy những dây đàn tranh đang phát sáng để tạo giai điệu nhé!');
    const targetNotes = api.little ? 4 : 6;
    api.dots(targetNotes, 0);
    const wrap = el('div', 'mu2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'mu2-stage'); wrap.appendChild(stage);
    const zither = el('div', 'mu2-zither'); stage.appendChild(zither);

    const stringEls = [0, 1, 2, 3, 4].map(idx => {
      const col = el('div', 'mu2-string');
      const wire = el('div', 'mu2-wire');
      col.appendChild(wire);
      col.dataset.note = String(idx);
      zither.appendChild(col);
      return { col, wire, idx };
    });

    let played = 0;
    while (played < targetNotes) {
      const targetIdx = (played * 2) % 5;
      stringEls.forEach(s => s.wire.classList.toggle('lit', s.idx === targetIdx));

      api.plan(() => stringEls[targetIdx].col, { maxActions: 4 });
      const clicked = await untilRight(api, stringEls.map(s => s.col), e => e === stringEls[targetIdx].col);
      if (!clicked || api.closed) return;
      api.sfx.pop(targetIdx);
      played++;
      api.dots(targetNotes, played);
      await wait(300);
    }
    stringEls.forEach(s => s.wire.classList.remove('lit'));
    api.say('The zither sings like water flowing down the stream!', 'Tiếng đàn tranh thánh thót như dòng suối trong veo!');
    await wait(1200);
    return api.win({ title: T('Melodious Zither!', 'Đàn Tranh Reo Vui!') });
  }
});

// 2. Bush Band
register({
  id: 'bushband', icon: '🪕',
  name: () => T('Bush Band', 'Ban Nhạc Đồng Quê'),
  async run(api) {
    style();
    api.say('Play the washboard, bush bass, and lagerphone with the outback band!',
      'Hòa tấu bàn giặt, đàn thùng và gậy leng keng cùng ban nhạc nhé!');
    const targetPlays = api.little ? 3 : 5;
    api.dots(targetPlays, 0);
    const wrap = el('div', 'mu2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'mu2-stage'); wrap.appendChild(stage);

    const insts = [
      { icon: '🪵', name: ['Washboard', 'Bàn giặt'] },
      { icon: '🪕', name: ['Bush bass', 'Đàn thùng'] },
      { icon: '🔔', name: ['Lagerphone', 'Gậy leng keng'] }
    ];

    const display = el('div', '', pic('🪕')); display.style.fontSize = '80px'; stage.appendChild(display);
    const controls = el('div', 'mu2-controls'); wrap.appendChild(controls);
    const btns = insts.map((inst, idx) => {
      const b = el('button', 'mu2-btn', `${pic(inst.icon)} <span>${T(inst.name[0], inst.name[1])}</span>`);
      b.dataset.idx = String(idx);
      controls.appendChild(b);
      return b;
    });

    let current = 0;
    while (current < targetPlays) {
      const target = btns[current % 3];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      display.innerHTML = pic(insts[current % 3].icon);
      api.sfx.pop(current % 3);
      current++;
      api.dots(targetPlays, current);
      await wait(300);
    }
    api.say('The bush band gets everyone dancing in the barn!', 'Cả xóm làng cùng nhảy múa theo ban nhạc đồng quê!');
    await wait(1200);
    return api.win({ title: T('Rhythmic Bush Band!', 'Ban Nhạc Rộn Ràng!') });
  }
});

// 3. Drum Echo
register({
  id: 'drumecho', icon: '🥁',
  name: () => T('Drum Echo', 'Trống Đáp'),
  async run(api) {
    style();
    api.say('Listen to the leader drum, then echo the same beats back!',
      'Nghe trống cái đánh rồi đánh đáp lại đúng số tiếng nhé!');
    const rounds = api.little ? 3 : 4;
    api.dots(rounds, 0);
    const wrap = el('div', 'mu2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'mu2-stage'); wrap.appendChild(stage);
    const drum = el('div', '', pic('🥁')); drum.style.fontSize = '80px'; stage.appendChild(drum);

    const controls = el('div', 'mu2-controls'); wrap.appendChild(controls);
    const hitBtn = el('button', 'mu2-btn', `${pic('🥁')} <span>${T('Tap drum', 'Đánh trống')}</span>`);
    controls.appendChild(hitBtn);

    let round = 0;
    while (round < rounds) {
      const targetBeats = (round % 3) + 2;
      api.say(`Echo back ${targetBeats} drum beats!`, `Đánh đáp lại ${targetBeats} tiếng trống nhé!`);
      let hits = 0;
      hitBtn.onclick = () => {
        hits++;
        api.sfx.pop(hits % 4);
      };
      api.plan(() => hits < targetBeats ? hitBtn : null, { maxActions: targetBeats + 2 });
      while (hits < targetBeats) {
        await wait(150);
        if (api.closed) return;
      }
      round++;
      api.dots(rounds, round);
      api.sfx.ding();
      await wait(400);
    }
    api.say('Your rhythm is right on beat! What a sharp ear!', 'Con nghe nhịp chuẩn lắm! Tai bé thật thính!');
    await wait(1200);
    return api.win({ title: T('Drum Echo Master!', 'Bé Đánh Trống Giỏi!') });
  }
});

// 4. Loud and Quiet
register({
  id: 'loudquiet', icon: '📢',
  name: () => T('Loud and Quiet', 'To Và Nhỏ'),
  async run(api) {
    style();
    api.say('Is the sound loud like a lion, or quiet like a mouse?',
      'Âm thanh to như sư tử hay nhỏ nhẹ như chú chuột?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'mu2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'mu2-stage'); wrap.appendChild(stage);
    const iconEl = el('div', '', pic('📢')); iconEl.style.fontSize = '80px'; stage.appendChild(iconEl);

    const controls = el('div', 'mu2-controls'); wrap.appendChild(controls);
    const loudBtn = el('button', 'mu2-btn', `${pic('🦁')} <span>${T('Loud', 'To')}</span>`);
    const quietBtn = el('button', 'mu2-btn', `${pic('🐭')} <span>${T('Quiet', 'Nhỏ')}</span>`);
    controls.appendChild(loudBtn); controls.appendChild(quietBtn);

    const answers = [loudBtn, quietBtn, loudBtn];
    let current = 0;
    while (current < rounds) {
      const target = answers[current];
      if (target === loudBtn) api.sfx.pop(5); else api.sfx.tap();
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, [loudBtn, quietBtn], e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You can tell soft whispers from roaring sounds!', 'Con phân biệt tiếng to và tiếng nhỏ rất tài!');
    await wait(1200);
    return api.win({ title: T('Sharp Listening!', 'Tai Nghe Thính!') });
  }
});

// 5. Song Steps
register({
  id: 'songsteps', icon: '🎶',
  name: () => T('Song Steps', 'Xếp Câu Hát'),
  async run(api) {
    style();
    api.say('Put the lyrics of "Kìa con bướm vàng" in order!',
      'Xếp các câu hát của bài "Kìa con bướm vàng" đúng thứ tự nhé!');
    api.dots(4, 0);
    const wrap = el('div', 'mu2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'mu2-stage'); wrap.appendChild(stage);
    const butterfly = el('div', '', pic('🦋')); butterfly.style.fontSize = '80px'; stage.appendChild(butterfly);

    // the song's own words, sung in Vietnamese in both languages
    const lines = ['Kìa con bướm vàng', 'Xòe đôi cánh', 'Tung cánh bay lên trời', 'Em ngồi xem'];

    const controls = el('div', 'mu2-controls'); wrap.appendChild(controls);
    const btns = lines.map((l, idx) => {
      const b = el('button', 'mu2-btn', `<span>${idx + 1}. ${l}</span>`);
      b.dataset.idx = String(idx);
      controls.appendChild(b);
      return b;
    });

    let current = 0;
    while (current < 4) {
      const target = btns[current];
      api.plan(() => target, { maxActions: 5 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.pop(current);
      current++;
      api.dots(4, current);
      await wait(300);
    }
    api.say('You sang the whole song in tune! Beautiful voice!', 'Con hát cả bài thật đúng điệu! Giọng hát hay quá!');
    await wait(1200);
    return api.win({ title: T('Song Finished!', 'Bài Hát Hoàn Thành!') });
  }
});