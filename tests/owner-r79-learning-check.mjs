// (r79 learning, chat 2, owner 16 Oct AEDT) the check `r79learning` (called from tests/run.mjs):
//  games  the four talk-and-touch games (Say It Find It, Market Counting, How Do They Feel?, First Sound Hunt) at
//         under-5, Easy, Medium and Hard, in English and Vietnamese, on a phone: played to the end with one wrong tap
//         each; never a single choice; every wrong tap says why (not just "Try again"); buttons 64 px for under-5s and
//         44 px otherwise; nothing off screen; the levels differ
//  E1     three right in a row in a learning game: one small reward banner under the top bar, never two, never over the
//         puzzle, and no old stacked "Combo" banner
//  E3     on a computer "Hear again" and "Ready to try" have 18 to 20 px text
//  E4     "You did it!" has a dark layer behind it (dark, blurred background; the words on a dark band)
//  I1     three right in a row make the next round one step harder; two misses one step easier; at most one step from
//         the start; under-5s never change; Flower Path's step carries to "Play again" of the same game only
//  I2     the rule a child missed most comes back first; a miss counts up and a clean answer counts down; old saves of
//         any shape get a clean record; the record is kept after a reload
//  I4     finishing Hard in a reasoning game gives its skill sticker once (not for under-5s); the sticker book draws it
//  G2     under-5s: question line hidden (space kept), bigger pictures, and a hand shows the first move the first time
//         only; bigger children see neither
//  mic    Say It, Find It: without speech recognition there is no microphone button and tapping works; with it, saying
//         the word counts like a tap, a refused microphone hides the button, and nothing breaks
import fs from 'node:fs';

const NEW = ['sayfind', 'marketcount', 'feelings', 'soundhunt'];
const MODES = [['under-5', true, 1], ['Easy', false, 1], ['Medium', false, 2], ['Hard', false, 3]];
const VI_MARK = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;
const EN_WORDS = /\b(the|is|are|find|that|put|where|yes|we|need|take|add|feels|you|picture|starts|ends|basket|well done)\b/i;
const openGame = (P, id, little, level, extra = {}) => P.page.evaluate(async ({ id, little, level, extra }) => { const F = await import('/js/games/frame.js'); __sv.paused = true; window.__r79 = F.openGame(id, { players: [__sv.heroes[0].profile], little, level, ...extra }); }, { id, little, level, extra });
const finishWin = async P => { await P.page.waitForTimeout(650); await P.page.locator('.gl-win p').first().click(); await P.page.waitForSelector('.gl', { state: 'detached' }); return P.page.evaluate(() => window.__r79); };
const leave = async P => { await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' }); };
// play the open game through the auto play hooks with real taps: one wrong tap first (when there is a wrong choice),
// then right ones; measures every question on the way
const PLAY = async ({ wrongs = 1, rightsOnly = false } = {}) => {
  const F = await import('/js/games/frame.js'), wait = ms => new Promise(res => setTimeout(res, ms));
  const help = () => document.querySelector('.gl-help').textContent.trim();
  let wrongLeft = rightsOnly ? 0 : wrongs, asks = 0, minChoices = 99, maxChoices = 0, small = [], off = [], askHelp = new Set(), wrongHelp = [], banners = 0, stacked = 0, rounds = [];
  const until = Date.now() + 60000;
  while (Date.now() < until && !document.querySelector('.gl-win')) {
    banners = Math.max(banners, document.querySelectorAll('.gl-reward').length); stacked += document.querySelectorAll('.gl-combo').length;
    const ask = F.playWatch.ask;
    if (ask) {
      const live = ask.els.filter(b => b.isConnected && !b.disabled && b.getClientRects().length);
      if (live.length) {
        asks++; minChoices = Math.min(minChoices, live.length); maxChoices = Math.max(maxChoices, live.length); askHelp.add(help());
        rounds.push({ tier: +document.querySelector('.gl').dataset.tier, choices: live.length, examples: document.querySelectorAll('.gl-stage .seq .seq-item:not(.q)').length, stage: document.querySelectorAll('.gl-stage .choices .choice').length });
        const minSize = document.querySelector('.gl.little') ? 63 : 43.5;
        for (const x of document.querySelectorAll('.gl-stage button')) { if (x.disabled || !x.getClientRects().length) continue; const q = x.getBoundingClientRect(); if (Math.min(q.width, q.height) < minSize) small.push(x.className + ' ' + Math.round(q.width) + 'x' + Math.round(q.height)); if (q.left < -1 || q.right > innerWidth + 1) off.push(x.className); }
        // (in Market Counting moving a fruit is a move that is counted aloud, not an answer: the answer is "That's it!")
        const bad = live.find(b => !ask.check(b) && !b.classList.contains('mc-fruit')) || live.find(b => !ask.check(b));
        if (wrongLeft > 0 && bad) { wrongLeft--; bad.click(); await wait(150); wrongHelp.push(help()); }
        else live.find(ask.check)?.click();
      }
    } else { const next = F.playWatch.plan?.(); if (next && !next.disabled) next.click(); }
    await wait(70);
  }
  return { won: !!document.querySelector('.gl-win'), asks, minChoices, maxChoices, wrongHelp, askHelp: [...askHelp], small: [...new Set(small)], off: [...new Set(off)], sideways: document.scrollingElement.scrollWidth > innerWidth + 1, banners, stacked, rounds };
};

export default async function r79learning(b, { open, clear, ok }) {
  const notes = [], rows = [];
  fs.mkdirSync('out/r79-learning', { recursive: true });

  // ---------- the four new games, every level, both languages ----------
  for (const lang of ['en', 'vi']) {
    const P = await open(b, { w: 390, h: 844, touch: true, lang }); await clear(P.page);
    for (const id of NEW) for (const [mode, little, level] of MODES) {
      await openGame(P, id, little, level); await P.page.waitForSelector('.gl');
      const r = await P.page.evaluate(PLAY, { wrongs: 1 });
      await P.page.screenshot({ path: `out/r79-learning/${id}-${lang}-${mode}.png` });
      const row = { id, lang, mode, ...r, rounds: undefined, first: r.rounds[0] }; rows.push(row); const say = JSON.stringify(row);
      ok(r.won && r.asks > 1, 'did not finish: ' + say);
      ok(r.minChoices >= 2, 'a single-choice question: ' + say);
      ok(r.wrongHelp.length && r.wrongHelp.every(t => t && !/^(Try again|Thử lại)/i.test(t)), 'a wrong tap must say why: ' + say);
      ok(!r.small.length && !r.off.length && !r.sideways, 'small or off-screen buttons, or sideways scroll: ' + say);
      ok(r.banners <= 1 && !r.stacked, 'more than one reward banner: ' + say);
      // Vietnamese: the question has Vietnamese letters, and no line has English words (short Vietnamese words such as
      // "cua", "kem" or a counted "Hai" have no accent marks, so the other lines are checked for English instead)
      if (lang === 'vi') ok(VI_MARK.test(r.askHelp[0]) && [...r.askHelp, ...r.wrongHelp].every(t => !EN_WORDS.test(t)), 'English words in a Vietnamese game: ' + say);
      ok((await finishWin(P)).won, 'the reward must finish the game: ' + say);
    }
    ok(!P.errors.length, P.errors.join('\n')); await P.ctx.close();
  }
  // the levels differ: more pictures from under-5 to Easy to Medium; Hard asks for something harder
  for (const lang of ['en', 'vi']) {
    const one = (id, mode) => rows.find(x => x.id === id && x.mode === mode && x.lang === lang);
    ok(one('sayfind', 'under-5').first.choices === 2 && one('sayfind', 'Easy').first.choices === 4 && one('sayfind', 'Medium').first.choices === 6, 'Say It, Find It: 2, 4, 6 pictures: ' + lang);
    ok(one('sayfind', 'Hard').askHelp.some(t => /big|little| to | nhỏ/.test(t)), 'Say It, Find It Hard asks with two words: ' + JSON.stringify(one('sayfind', 'Hard').askHelp));
    ok(one('feelings', 'under-5').first.choices === 2 && one('feelings', 'Easy').first.choices === 4, 'How Do They Feel?: 2 then 4 faces: ' + lang);
    ok(one('feelings', 'Hard').askHelp.some(t => /What could you do|Con có thể làm gì/.test(t)), 'How Do They Feel? Hard asks what could help');
    ok(one('soundhunt', 'under-5').first.choices === 2 && one('soundhunt', 'Easy').first.choices === 4 && one('soundhunt', 'Medium').first.choices === 6, 'First Sound Hunt: 2, 4, 6 pictures: ' + lang);
    ok(one('soundhunt', 'Hard').askHelp.some(t => lang === 'vi' ? /dấu|thanh/.test(t) : /ends like/.test(t)), 'First Sound Hunt Hard: end sounds or tones: ' + JSON.stringify(one('soundhunt', 'Hard').askHelp));
    ok(one('marketcount', 'Hard').askHelp.some(t => /Add 2 more|Take 1 away|thêm hai|Lấy ra một/.test(t)), 'Market Counting Hard: add or take away');
  }
  notes.push(`games ${rows.length} runs`);

  const P = await open(b, { w: 390, h: 844, touch: true, lang: 'en' }); await clear(P.page);
  const prof = f => P.page.evaluate(f);
  // ---------- E1: one small banner under the top bar, not over the puzzle ----------
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl-stage .choice');
  const e1 = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms)); let k = 0, most = 0, over = [], old = 0;
    while (k < 3) { const ask = F.playWatch.ask; if (ask) { const e = ask.els.find(x => !x.disabled && ask.check(x)); if (e) { e.click(); k++; } } await wait(450); }
    for (let i = 0; i < 12; i++) {
      const bs = [...document.querySelectorAll('.gl-reward')]; most = Math.max(most, bs.length); old += document.querySelectorAll('.gl-combo').length;
      const head = document.querySelector('.gl-head').getBoundingClientRect(), keep = [...document.querySelectorAll('.gl-stage .seq, .gl-stage .choices, .gl-help, .gl-head button')].map(x => x.getBoundingClientRect());
      for (const b of bs) { const r = b.getBoundingClientRect(); if (r.top < head.top - 1 || r.bottom > head.bottom + 1 || keep.some(p => r.bottom > p.top && r.top < p.bottom && r.right > p.left && r.left < p.right) || r.height > 40) over.push(Math.round(r.top) + '/' + Math.round(r.height)); }
      await wait(60);
    }
    return { most, over: [...new Set(over)], old };
  });
  ok(e1.most === 1 && !e1.over.length && !e1.old, 'E1 reward banner: ' + JSON.stringify(e1));
  await P.page.screenshot({ path: 'out/r79-learning/e1-banner.png' }); await leave(P);

  // ---------- E4: the dark layer behind "You did it!" ----------
  await openGame(P, 'patternpicnic', true, 1); await P.page.waitForSelector('.gl');
  await P.page.evaluate(PLAY, { rightsOnly: true }); await P.page.waitForSelector('.gl-win'); await P.page.waitForTimeout(1700);
  const e4 = await P.page.evaluate(() => { const w = getComputedStyle(document.querySelector('.gl-win')), p = getComputedStyle(document.querySelector('.gl-win > p')); const a = +(w.backgroundColor.match(/[\d.]+\)$/) || ['1'])[0].replace(')', ''); return { alpha: a, blur: /blur/.test(w.backdropFilter || w.webkitBackdropFilter || ''), band: p.backgroundColor }; });
  ok(e4.alpha >= .75 && e4.blur && e4.band !== 'rgba(0, 0, 0, 0)', 'E4 win layer: ' + JSON.stringify(e4));
  await P.page.screenshot({ path: 'out/r79-learning/e4-win.png' }); await finishWin(P);

  // ---------- I1: the level follows the child ----------
  // Easy, all right: rounds 1-3 Easy (2 examples), round 4 one step harder (3 examples), never Hard (4 choices)
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl');
  const up = await P.page.evaluate(PLAY, { rightsOnly: true }); await finishWin(P);
  const ex = up.rounds.map(r => r.tier);
  ok(ex.join('') === '1112' && up.rounds.at(-1).examples === 3 && up.maxChoices <= 3, 'I1 three right in a row: one step harder, at most one step: ' + JSON.stringify(up.rounds));
  // Medium, two misses in round 1: round 2 one step easier (2 examples)
  await openGame(P, 'rulefinder', false, 2); await P.page.waitForSelector('.gl');
  const down = await P.page.evaluate(PLAY, { wrongs: 2 }); await finishWin(P);
  const dEx = down.rounds.map(r => r.tier).join('');
  ok(/^2+1+2*$/.test(dEx) && down.rounds.every(r => r.tier >= 1), 'I1 two misses: one step easier: ' + JSON.stringify(down.rounds) + dEx);
  // under-5: always 2 choices, however well they do
  await openGame(P, 'rulefinder', true, 1); await P.page.waitForSelector('.gl');
  const u5 = await P.page.evaluate(PLAY, { rightsOnly: true }); await finishWin(P);
  ok(u5.maxChoices === 2 && u5.minChoices === 2 && u5.rounds.every(r => r.tier === 0), 'I1 under-5s stay at their level: ' + JSON.stringify(u5.rounds));
  // Flower Path (one board): the step carries to "Play again" of the same game, and to nothing else
  // dead ends: flower squares (not the start) touching only one other flower or the flag (the path never touches itself)
  const deadEnds = () => P.page.evaluate(() => { const cells = [...document.querySelector('.think-path').children], n = Math.round(Math.sqrt(cells.length)), on = i => i >= 0 && i < cells.length && /flower|flag/i.test(cells[i].getAttribute('aria-label'));
    return cells.filter((c, i) => i > 0 && /flower/i.test(c.getAttribute('aria-label')) && [i - n, i + n, i % n ? i - 1 : -1, (i + 1) % n ? i + 1 : -1].filter(on).length === 1).length; });
  await openGame(P, 'steppingpath', false, 1); await P.page.waitForSelector('.think-path');
  const flowersEasy = await deadEnds();
  await P.page.evaluate(PLAY, { rightsOnly: true }); await P.page.waitForTimeout(1800);
  await P.page.locator('.gl-nx[data-n="again"]').click(); await P.page.waitForSelector('.gl', { state: 'detached' });
  const againRes = await P.page.evaluate(() => window.__r79); ok(againRes.next === 'again', 'Play again result: ' + JSON.stringify(againRes));
  await openGame(P, 'steppingpath', false, 1); await P.page.waitForSelector('.think-path');
  const carried = { size: await P.page.evaluate(() => Math.round(Math.sqrt(document.querySelector('.think-path').children.length))), deadEnds: await deadEnds() };
  await leave(P);
  await openGame(P, 'steppingpath', false, 1); await P.page.waitForSelector('.think-path');
  const fresh = { size: await P.page.evaluate(() => Math.round(Math.sqrt(document.querySelector('.think-path').children.length))), deadEnds: await deadEnds() }; await leave(P);
  ok(flowersEasy === 0 && carried.size === 4 && carried.deadEnds >= 1 && fresh.size === 4 && fresh.deadEnds === 0, 'I1 Flower Path: the step carries to Play again only: ' + JSON.stringify({ flowersEasy, carried, fresh }));
  notes.push(`I1 Easy tiers ${ex.join('')}, Medium with two misses ${dEx}`);

  // ---------- I2: the rule missed most comes back first ----------
  await prof(() => { const p = __sv.heroes[0].profile; p.learn = { v: 1, miss: { rulefinder: { clothes: 2, fruit: 1 } }, seen: {} }; });
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl');
  const i2 = await P.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    while (!F.playWatch.ask) await wait(50);
    const ask = F.playWatch.ask; ask.els.find(b => !ask.check(b)).click(); await wait(150);
    return { help: document.querySelector('.gl-help').textContent, miss: JSON.parse(JSON.stringify(__sv.heroes[0].profile.learn.miss.rulefinder)) };
  });
  ok(/things to wear/.test(i2.help) && i2.miss.clothes === 3, 'I2 the missed rule comes first and counts up: ' + JSON.stringify(i2));
  await leave(P);
  // a clean answer counts it down
  await prof(() => { __sv.heroes[0].profile.learn.miss.rulefinder = { clothes: 1 }; });
  await openGame(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl');
  await P.page.evaluate(PLAY, { rightsOnly: true }); await finishWin(P);
  const after = await prof(() => __sv.heroes[0].profile.learn.miss.rulefinder || {});
  ok(!after.clothes, 'I2 a clean answer counts the miss down: ' + JSON.stringify(after));
  // old saves of any shape (UX-009) and the record kept after a reload
  const mig = await P.page.evaluate(async () => {
    const S = await import('/js/state.js');
    const a = S.normalizeProfile({ name: 'Old', stickers: ['🦄'], levels: { counting: 3 } });
    const b2 = S.normalizeProfile({ name: 'Odd', learn: 'junk' });
    const c = S.normalizeProfile({ name: 'Mixed', learn: { miss: { rulefinder: { fly: '2', red: -1, x: 'no' }, bad: [] }, seen: { feelings: true, x: 0 } } });
    return { a: a.learn, kept: a.stickers.length === 1 && a.levels.counting === 3, b: b2.learn, c: c.learn };
  });
  ok(JSON.stringify(mig.a) === '{"v":1,"miss":{},"seen":{}}' && mig.kept && JSON.stringify(mig.b) === '{"v":1,"miss":{},"seen":{}}' && JSON.stringify(mig.c) === '{"v":1,"miss":{"rulefinder":{"fly":2}},"seen":{"feelings":1}}', 'I2 old saves: ' + JSON.stringify(mig));
  await prof(async () => { __sv.heroes[0].profile.learn.miss.gardenorder = { 'Snow falls.': 2 }; (await import('/js/state.js')).saveProfiles(true); });
  await P.page.waitForTimeout(300); await P.page.reload(); await P.page.waitForSelector('.screen.title', { timeout: 90000 });
  const kept = await P.page.evaluate(async () => (await import('/js/state.js')).profiles[0].learn.miss.gardenorder);
  ok(kept && kept['Snow falls.'] === 2, 'I2 the record is kept after a reload: ' + JSON.stringify(kept));
  ok(!P.errors.length, P.errors.join('\n')); await P.ctx.close();

  // ---------- I4: skill stickers ----------
  const Q = await open(b, { w: 390, h: 844, touch: true, lang: 'vi' }); await clear(Q.page);
  await Q.page.evaluate(() => { const p = __sv.heroes[0].profile; p.stickers = []; });
  await openGame(Q, 'rulefinder', true, 3); await Q.page.waitForSelector('.gl'); await Q.page.evaluate(PLAY, { rightsOnly: true }); await Q.page.waitForSelector('.gl-win');
  const littleSticker = await Q.page.evaluate(() => ({ shown: !!document.querySelector('.gl-skill'), has: __sv.heroes[0].profile.stickers.includes('skill:rulefinder') }));
  await finishWin(Q);
  ok(!littleSticker.shown && !littleSticker.has, 'I4 no skill sticker for under-5s: ' + JSON.stringify(littleSticker));
  await openGame(Q, 'rulefinder', false, 3); await Q.page.waitForSelector('.gl'); await Q.page.evaluate(PLAY, { rightsOnly: true }); await Q.page.waitForSelector('.gl-win'); await Q.page.waitForTimeout(1700);
  const won = await Q.page.evaluate(() => { const s = document.querySelector('.gl-skill'), r = s && s.getBoundingClientRect(); return { text: s && s.textContent.trim(), svg: !!(s && s.querySelector('svg')), inside: !!r && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, n: __sv.heroes[0].profile.stickers.filter(x => x === 'skill:rulefinder').length }; });
  await Q.page.screenshot({ path: 'out/r79-learning/i4-sticker-vi.png' }); await finishWin(Q);
  ok(won.text && /Tìm quy luật/.test(won.text) && won.svg && won.inside && won.n === 1, 'I4 the sticker at Hard: ' + JSON.stringify(won));
  await openGame(Q, 'rulefinder', false, 3); await Q.page.waitForSelector('.gl'); await Q.page.evaluate(PLAY, { rightsOnly: true }); await Q.page.waitForSelector('.gl-win');
  const twice = await Q.page.evaluate(() => ({ shown: !!document.querySelector('.gl-skill'), n: __sv.heroes[0].profile.stickers.filter(x => x === 'skill:rulefinder').length })); await finishWin(Q);
  ok(!twice.shown && twice.n === 1, 'I4 only once: ' + JSON.stringify(twice));
  // every reasoning game has a drawn sticker, and the sticker book draws it (never the key as words)
  const book = await Q.page.evaluate(async () => {
    const A = await import('/js/art.js'), R = await import('/js/games/registry.js');
    const drawn = Object.values(R.SKILLS).every(s => A.hasArt(s.key));
    __sv.heroes[0].profile.stickers.push('skill:gardenorder'); __sv.openScrapbook(__sv.heroes[0]);
    await new Promise(r => setTimeout(r, 400));
    const tray = document.querySelector('.sb-tray'), btn = tray && tray.querySelector('[data-s="skill:rulefinder"]');
    return { drawn, svg: !!(btn && btn.querySelector('svg')), words: /skill:/.test(tray ? tray.innerText : 'skill:'), label: btn && btn.getAttribute('aria-label'), size: btn ? Math.round(btn.getBoundingClientRect().width) : 0 };
  });
  ok(book.drawn && book.svg && !book.words && book.label === 'Tìm quy luật' && book.size >= 44, 'I4 sticker book: ' + JSON.stringify(book));
  await Q.page.screenshot({ path: 'out/r79-learning/i4-scrapbook-vi.png' });
  await Q.page.evaluate(() => document.querySelector('.modal.scrap .x, .scrap .x')?.click()); await Q.page.waitForTimeout(300);
  ok(!Q.errors.length, Q.errors.join('\n')); await Q.ctx.close();

  // ---------- G2: picture-only mode and the showing hand ----------
  const R = await open(b, { w: 390, h: 844, touch: true, lang: 'en' }); await clear(R.page);
  await R.page.evaluate(() => { __sv.heroes[0].profile.learn = { v: 1, miss: {}, seen: {} }; });
  await openGame(R, 'gardenorder', true, 1); await R.page.waitForSelector('.gl-stage .choice'); await R.page.waitForTimeout(500);
  const g2 = await R.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), layer = document.querySelector('.gl'), help = document.querySelector('.gl-help'), hand = document.querySelector('.gl-hand');
    const ask = F.playWatch.ask, right = ask && ask.els.find(ask.check), rr = right && right.getBoundingClientRect(), hr = hand && hand.getBoundingClientRect();
    const choice = document.querySelector('.gl-stage .choice').getBoundingClientRect();
    return { picOnly: layer.classList.contains('pic-only'), hidden: getComputedStyle(help).visibility === 'hidden', helpHeight: help.getBoundingClientRect().height, text: help.textContent.length,
      hand: !!hand, onRight: !!(hr && rr && hr.left + 28 > rr.left - 4 && hr.left + 28 < rr.right + 4 && hr.top > rr.top - 30 && hr.top < rr.bottom), choice: Math.round(choice.width), seen: __sv.heroes[0].profile.learn.seen.gardenorder };
  });
  await R.page.screenshot({ path: 'out/r79-learning/g2-hand.png' }); await leave(R);
  ok(g2.picOnly && g2.hidden && g2.helpHeight > 0 && g2.text > 0 && g2.hand && g2.onRight && g2.choice >= 112 && g2.seen === 1, 'G2 under-5 first time: ' + JSON.stringify(g2));
  await openGame(R, 'gardenorder', true, 1); await R.page.waitForSelector('.gl-stage .choice'); await R.page.waitForTimeout(500);
  const g2b = await R.page.evaluate(() => !!document.querySelector('.gl-hand')); await leave(R);
  ok(!g2b, 'G2 the hand shows only the first time');
  await openGame(R, 'rulefinder', false, 1); await R.page.waitForSelector('.gl-stage .choice'); await R.page.waitForTimeout(500);
  const g2c = await R.page.evaluate(() => ({ picOnly: document.querySelector('.gl').classList.contains('pic-only'), hand: !!document.querySelector('.gl-hand'), help: getComputedStyle(document.querySelector('.gl-help')).visibility }));
  await leave(R);
  ok(!g2c.picOnly && !g2c.hand && g2c.help === 'visible', 'G2 bigger children: words and no hand: ' + JSON.stringify(g2c));
  // Market Counting's first move is a fruit, shown by the hand too
  await openGame(R, 'marketcount', true, 1); await R.page.waitForSelector('.mc-fruit'); await R.page.waitForTimeout(400);
  const g2d = await R.page.evaluate(() => !!document.querySelector('.gl-hand')); await leave(R);
  ok(g2d, 'G2 Market Counting shows the hand the first time');
  ok(!R.errors.length, R.errors.join('\n')); await R.ctx.close();

  // ---------- E3: bigger button text on a computer ----------
  const C = await open(b, { w: 1280, h: 800, touch: false, lang: 'en' }); await clear(C.page);
  await openGame(C, 'remembergarden', false, 1); await C.page.waitForSelector('.bt-repeat');
  const e3 = await C.page.evaluate(() => [...document.querySelectorAll('.gl-stage .btn')].map(b => ({ t: b.textContent.trim(), px: parseFloat(getComputedStyle(b).fontSize) })));
  await C.page.screenshot({ path: 'out/r79-learning/e3-computer.png' }); await leave(C);
  ok(e3.length >= 2 && e3.every(x => x.px >= 18 && x.px <= 20), 'E3 computer button text: ' + JSON.stringify(e3));
  ok(!C.errors.length, C.errors.join('\n')); await C.ctx.close();
  // and on a phone the buttons keep their size (the rule is for computers only)
  const Pp = await open(b, { w: 390, h: 844, touch: true, lang: 'en' }); await clear(Pp.page);
  await openGame(Pp, 'remembergarden', false, 1); await Pp.page.waitForSelector('.bt-repeat');
  const e3p = await Pp.page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.bt-repeat')).fontSize)); await leave(Pp);
  ok(e3p < 18, 'E3 phone text unchanged: ' + e3p); await Pp.ctx.close();

  // ---------- the microphone in Say It, Find It ----------
  // no speech recognition: no button, tapping works (the game matrix above played every level by tapping)
  const N = await open(b, { w: 390, h: 844, touch: true, lang: 'en', pre: () => { for (const k of ['SpeechRecognition', 'webkitSpeechRecognition']) { try { delete window[k]; } catch (e) { } Object.defineProperty(window, k, { value: undefined, configurable: true }); } } });
  await clear(N.page); await openGame(N, 'sayfind', false, 1); await N.page.waitForSelector('.sf-pic');
  const noMic = await N.page.evaluate(() => !!document.querySelector('.sf-mic')); await leave(N);
  ok(!noMic, 'no microphone button without speech recognition');
  ok(!N.errors.length, N.errors.join('\n')); await N.ctx.close();
  // a pretend recogniser: hears the target's word (counts as the right tap), then refuses (the button goes, tapping still works)
  const M = await open(b, { w: 390, h: 844, touch: true, lang: 'en', pre: () => {
    class FakeSR { start() { setTimeout(() => { const w = window.__heard; if (w === 'deny') this.onerror && this.onerror({ error: 'not-allowed' }); else this.onresult && this.onresult({ results: [[{ transcript: w }]] }); this.onend && this.onend(); }, 60); } stop() { } abort() { } }
    window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = FakeSR;
  } });
  await clear(M.page); await openGame(M, 'sayfind', false, 1); await M.page.waitForSelector('.sf-mic');
  const mic = await M.page.evaluate(async () => {
    const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    while (!F.playWatch.ask) await wait(50);
    const btn = document.querySelector('.sf-mic'), size = btn.getBoundingClientRect();
    const target = F.playWatch.ask.els.find(F.playWatch.ask.check), word = target.getAttribute('aria-label');
    const dotsBefore = document.querySelectorAll('.gl-dots i.on').length;
    window.__heard = 'it is the ' + word; btn.click();
    for (let i = 0; i < 60 && document.querySelectorAll('.gl-dots i.on').length === dotsBefore; i++) await wait(100);
    const counted = document.querySelectorAll('.gl-dots i.on').length > dotsBefore;
    for (let i = 0; i < 40 && !document.querySelector('.sf-mic'); i++) await wait(100);
    window.__heard = 'deny'; document.querySelector('.sf-mic').click(); await wait(500);
    return { word, counted, size: Math.round(Math.min(size.width, size.height)), gone: !document.querySelector('.sf-mic'), help: document.querySelector('.gl-help').textContent };
  });
  ok(mic.counted && mic.size >= 44 && mic.gone && /microphone is off/i.test(mic.help), 'microphone: ' + JSON.stringify(mic));
  const rest = await M.page.evaluate(PLAY, { rightsOnly: true });
  ok(rest.won, 'tapping still finishes after the microphone was refused: ' + JSON.stringify(rest));
  await finishWin(M);
  ok(!M.errors.length, M.errors.join('\n')); await M.ctx.close();

  fs.writeFileSync('out/r79-learning/results.json', JSON.stringify({ rows, e1, e3, e4, i2, mig, won, book, g2, mic }, null, 1));
  return notes.join('; ') + '; E1 E3 E4 I1 I2 I4 G2 mic pass';
}
