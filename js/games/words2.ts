// Words additions (owner, 23 Oct 2026 AEDT):
// Which Group, Story in Order, Guess What I Am, Action Words, and Position (In, On, Under).
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.w2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.w2-stage { position: relative; width: min(360px, 86vw); height: min(280px, 42vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; padding: 10px; }
.w2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.w2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.w2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
`));
}

// 1. Which Group?
register({
  id: 'whichgroup', icon: 'ðŸ§º',
  name: () => T('Which Group?', 'Thuá»™c NhÃ³m NÃ o?'),
  async run(api) {
    style();
    api.say('Does the banana belong to Fruits, Animals, or Vehicles?',
      'Quáº£ chuá»‘i thuá»™c nhÃ³m TrÃ¡i cÃ¢y, Con váº­t hay Xe cá»™?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const questions = [
      { item: 'ðŸŒ', correct: 0, choices: [['Fruits', 'TrÃ¡i cÃ¢y'], ['Animals', 'Con váº­t'], ['Vehicles', 'Xe cá»™']] },
      { item: 'ðŸ•', correct: 1, choices: [['Clothes', 'Quáº§n Ã¡o'], ['Animals', 'Con váº­t'], ['Fruits', 'TrÃ¡i cÃ¢y']] },
      { item: 'ðŸš—', correct: 2, choices: [['Toys', 'Äá»“ chÆ¡i'], ['Food', 'Thá»©c Äƒn'], ['Vehicles', 'Xe cá»™']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      const icon = el('div', '', pic(questions[current].item));
      icon.style.fontSize = '80px';
      stage.appendChild(icon);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = questions[current].choices.map((c, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(c[0], c[1])}</span>`);
        b.dataset.idx = String(idx);
        controls.appendChild(b);
        return b;
      });

      const target = btns[questions[current].correct];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You know all the groups so well!', 'BÃ© phÃ¢n biá»‡t cÃ¡c nhÃ³m Ä‘á»“ váº­t tháº­t giá»i!');
    await wait(1200);
    return api.win({ title: T('Great Grouping!', 'PhÃ¢n Loáº¡i Tháº­t Chuáº©n!') });
  }
});

// 2. Story in Order
register({
  id: 'storyorder', icon: 'ðŸ“–',
  name: () => T('Story in Order', 'Xáº¿p Tranh Ká»ƒ Chuyá»‡n'),
  async run(api) {
    style();
    api.say('Put the plant story in order: seed, sprout, flower, fruit!',
      'Xáº¿p tranh háº¡t giá»‘ng lá»›n lÃªn: gieo háº¡t, náº£y máº§m, ná»Ÿ hoa, ra quáº£!');
    api.dots(4, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);
    const plant = el('div', '', pic('ðŸŒ±')); plant.style.fontSize = '80px'; stage.appendChild(plant);

    const steps = [
      { icon: 'ðŸ«˜', name: ['1. Seed', '1. Gieo háº¡t'] },
      { icon: 'ðŸŒ±', name: ['2. Sprout', '2. Náº£y máº§m'] },
      { icon: 'ðŸŒ¸', name: ['3. Flower', '3. Ná»Ÿ hoa'] },
      { icon: 'ðŸŽ', name: ['4. Fruit', '4. Ra quáº£'] }
    ];

    const controls = el('div', 'w2-controls'); wrap.appendChild(controls);
    const btns = steps.map((s, idx) => {
      const b = el('button', 'w2-btn', `${pic(s.icon)} <span>${T(s.name[0], s.name[1])}</span>`);
      b.dataset.step = String(idx);
      controls.appendChild(b);
      return b;
    });

    let current = 0;
    while (current < 4) {
      const target = btns[current];
      api.plan(() => target, { maxActions: 5 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      plant.innerHTML = pic(steps[current].icon);
      api.sfx.pop(current);
      current++;
      api.dots(4, current);
      await wait(300);
    }
    api.say('The seed grew into sweet, delicious fruit!', 'Háº¡t máº§m Ä‘Ã£ lá»›n lÃªn thÃ nh quáº£ ngá»t ngÃ o rá»“i!');
    await wait(1200);
    return api.win({ title: T('Story in Order!', 'Ká»ƒ Chuyá»‡n ÄÃºng Thá»© Tá»±!') });
  }
});

// 3. Guess What I Am
register({
  id: 'guesswhat', icon: 'â“',
  name: () => T('Guess What I Am', 'ÄoÃ¡n Xem TÃ´i LÃ  GÃ¬'),
  async run(api) {
    style();
    api.say('I have long ears and love carrots. Who am I?',
      'TÃ´i cÃ³ Ä‘Ã´i tai dÃ i vÃ  thÃ­ch Äƒn cÃ  rá»‘t. TÃ´i lÃ  ai?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const riddles = [
      { text: ['I have long ears and love carrots.', 'ÄÃ´i tai dÃ i, thÃ­ch Äƒn cÃ  rá»‘t.'], answer: 0, options: [['ðŸ° Rabbit', 'ðŸ° ChÃº thá»'], ['ðŸ¸ Frog', 'ðŸ¸ ChÃº cÃ³c'], ['ðŸ± Cat', 'ðŸ± ChÃº mÃ¨o']] },
      { text: ['I give fresh milk and say moo.', 'Cho sá»¯a ngá»t vÃ  kÃªu moo moo.'], answer: 1, options: [['ðŸ¶ Dog', 'ðŸ¶ CÃºn con'], ['ðŸ® Cow', 'ðŸ® BÃ² sá»¯a'], ['ðŸ” Hen', 'ðŸ” GÃ  mÃ¡i']] },
      { text: ['I swim in the water and have colorful scales.', 'BÆ¡i dÆ°á»›i nÆ°á»›c, cÃ³ váº£y nhiá»u mÃ u.'], answer: 2, options: [['ðŸ» Bear', 'ðŸ» Gáº¥u trÃºc'], ['ðŸ¦† Duck', 'ðŸ¦† Vá»‹t báº§u'], ['ðŸŸ Fish', 'ðŸŸ CÃ¡ vÃ ng']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      const prompt = el('div', '', T(riddles[current].text[0], riddles[current].text[1]));
      prompt.style.cssText = 'font:800 20px var(--font, sans-serif);color:#3b2a4f;text-align:center;padding:10px;';
      stage.appendChild(prompt);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = riddles[current].options.map((opt, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(opt[0], opt[1])}</span>`);
        b.dataset.idx = String(idx);
        controls.appendChild(b);
        return b;
      });

      const target = btns[riddles[current].answer];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You solved every riddle! Sharp and clever thinker!', 'Con Ä‘oÃ¡n trÃºng háº¿t cÃ¡c cÃ¢u Ä‘á»‘ rá»“i! Tháº­t thÃ´ng minh!');
    await wait(1200);
    return api.win({ title: T('Riddle Solver!', 'ÄoÃ¡n Äá»‘ TÃ i TÃ¬nh!') });
  }
});

// 4. Action Words
register({
  id: 'actions', icon: 'ðŸƒ',
  name: () => T('Action Words', 'Tá»« Chá»‰ Hoáº¡t Äá»™ng'),
  async run(api) {
    style();
    api.say('Which word is an action you can do?',
      'Tá»« nÃ o lÃ  tá»« chá»‰ hoáº¡t Ä‘á»™ng bÃ© cÃ³ thá»ƒ lÃ m?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const sets = [
      { action: 0, choices: [['ðŸƒ Run', 'ðŸƒ Cháº¡y'], ['ðŸª‘ Chair', 'ðŸª‘ CÃ¡i gháº¿'], ['ðŸŒ³ Tree', 'ðŸŒ³ CÃ¡i cÃ¢y']] },
      { action: 1, choices: [['ðŸŽ Apple', 'ðŸŽ Quáº£ tÃ¡o'], ['ðŸŠ Swim', 'ðŸŠ BÆ¡i'], ['ðŸ  House', 'ðŸ  NgÃ´i nhÃ ']] },
      { action: 2, choices: [['ðŸ‘Ÿ Shoe', 'ðŸ‘Ÿ ÄÃ´i giÃ y'], ['ðŸš— Car', 'ðŸš— Chiáº¿c xe'], ['ðŸ’ƒ Dance', 'ðŸ’ƒ MÃºa']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      const prompt = el('div', '', T('Find the action!', 'TÃ¬m hÃ nh Ä‘á»™ng nÃ o!'));
      prompt.style.cssText = 'font:800 20px var(--font, sans-serif);color:#3b2a4f;text-align:center;padding:10px;';
      stage.appendChild(prompt);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = sets[current].choices.map((c, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(c[0], c[1])}</span>`);
        b.dataset.idx = String(idx);
        controls.appendChild(b);
        return b;
      });

      const target = btns[sets[current].action];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.pop(current);
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('Run, swim, and dance! Active and strong!', 'Cháº¡y, bÆ¡i rá»“i mÃºa! BÃ© tháº­t khá»e máº¡nh vÃ  hoáº¡t bÃ¡t!');
    await wait(1200);
    return api.win({ title: T('Action Master!', 'Tá»« Hoáº¡t Äá»™ng!') });
  }
});

// 5. In, On, Under
register({
  id: 'position', icon: 'ðŸ“¦',
  name: () => T('In, On, Under', 'Trong, TrÃªn, DÆ°á»›i'),
  async run(api) {
    style();
    api.say('Where is the kitten: in the box, on the table, or under the bed?',
      'MÃ¨o con á»Ÿ Ä‘Ã¢u: trong há»™p, trÃªn bÃ n, hay dÆ°á»›i gáº§m giÆ°á»ng?');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 'w2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'w2-stage'); wrap.appendChild(stage);

    const questions = [
      { text: ['The cat is IN the box.', 'MÃ¨o á»Ÿ TRONG há»™p.'], correct: 0, choices: [['In', 'Trong'], ['On', 'TrÃªn'], ['Under', 'DÆ°á»›i']] },
      { text: ['The bird is ON the roof.', 'Chim á»Ÿ TRÃŠN mÃ¡i nhÃ .'], correct: 1, choices: [['In', 'Trong'], ['On', 'TrÃªn'], ['Under', 'DÆ°á»›i']] },
      { text: ['The ball is UNDER the chair.', 'BÃ³ng á»Ÿ DÆ¯á»šI gáº§m gháº¿.'], correct: 2, choices: [['In', 'Trong'], ['On', 'TrÃªn'], ['Under', 'DÆ°á»›i']] }
    ];

    let current = 0;
    while (current < rounds) {
      stage.innerHTML = '';
      const prompt = el('div', '', T(questions[current].text[0], questions[current].text[1]));
      prompt.style.cssText = 'font:800 20px var(--font, sans-serif);color:#3b2a4f;text-align:center;padding:10px;';
      stage.appendChild(prompt);

      const controls = el('div', 'w2-controls'); stage.appendChild(controls);
      const btns = questions[current].choices.map((c, idx) => {
        const b = el('button', 'w2-btn', `<span>${T(c[0], c[1])}</span>`);
        b.dataset.idx = String(idx);
        controls.appendChild(b);
        return b;
      });

      const target = btns[questions[current].correct];
      api.plan(() => target, { maxActions: 4 });
      const clicked = await untilRight(api, btns, e => e === target);
      if (!clicked || api.closed) return;
      api.sfx.ding();
      current++;
      api.dots(rounds, current);
      await wait(300);
    }
    api.say('You understand positions so well! In, on, under are crystal clear!', 'BÃ© hiá»ƒu rÃµ cÃ¡c vá»‹ trÃ­ rá»“i! Trong, trÃªn, dÆ°á»›i Ä‘á»u ráº¥t chuáº©n!');
    await wait(1200);
    return api.win({ title: T('Position Explorer!', 'BÃ© Biáº¿t Vá»‹ TrÃ­!') });
  }
});