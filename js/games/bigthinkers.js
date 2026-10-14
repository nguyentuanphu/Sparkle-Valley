// Original guided reasoning activities; no timers or lost progress for wrong answers.
import { register, choiceButtons, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, shuffle, wait } from '../util.js';
import { GAME_INFO } from '../content/activities.js';
import { HOWTO } from '../howto.js';
GAME_INFO.rulefinder = ['thinking', 3, 1]; GAME_INFO.gardenorder = ['thinking', 3, 1]; GAME_INFO.steppingpath = ['thinking', 4, 2];
const instructions = {
  rulefinder: [['Look at the examples. Choose another picture that follows their rule.', 'Nhìn các ví dụ. Chọn thêm hình theo cùng quy luật.']],
  gardenorder: [['Help the garden: choose each step in order.', 'Giúp khu vườn: chọn từng bước theo thứ tự.']],
  steppingpath: [['Follow neighbouring flowers to reach the flag. Avoid the puddles.', 'Theo những bông hoa cạnh nhau đến lá cờ. Tránh vũng nước.']]
};
for (const [id, lines] of Object.entries(instructions)) HOWTO[id] = { steps: lines.map(([en, vi]) => ({ pic: '🧩', en, vi })) };
register({ id: 'rulefinder', icon: '🧩', name: () => T('Find the Rule', 'Tìm Quy Luật'), async run(api) {
  const sets = [ [['🍎','🍌'],'🍉',['🍉','👟','🪁']], [['🐶','🐱'],'🐰',['🐰','🍎','👕']], [['👟','👒'],'👕',['👕','🍇','🌳']], [['🚗','🚌'],'🚲',['🚲','📖','🌸']] ];
  for (let round = 0; round < 4; round++) { if (api.closed) return; api.dots(4, round); api.stage.innerHTML = ''; const [examples,right,options] = sets[round];
    const sample = el('div','seq', examples.map(value => `<span class="seq-item">${pic(value)}</span>`).join('')); api.stage.appendChild(sample);
    api.say('These belong together. Find another picture that follows the same rule.', 'Các hình này cùng một nhóm. Tìm thêm hình theo cùng quy luật.');
    const buttons = choiceButtons(api, shuffle(options.slice(0,api.little ? 2 : 3)), value => pic(value));
    await untilRight(api, buttons, b => b._v === right); if (api.closed) return; api.say('Yes! That follows the same rule.', 'Đúng rồi! Hình đó theo cùng quy luật.'); api.praise(); await wait(300);
  } return api.win();
} });
register({ id: 'gardenorder', icon: '🌱', name: () => T('Garden Steps', 'Các Bước Làm Vườn'), async run(api) {
  const steps = [ ['🌱','Plant the seed.', 'Gieo hạt.'], ['💧','Water the seed.', 'Tưới nước cho hạt.'], ['🌳','Let the tree grow.', 'Để cây lớn lên.'], ['🍎','Pick the fruit.', 'Hái quả.'] ];
  const done = el('div', 'seq'); api.stage.appendChild(done); const controls = el('div'); api.stage.appendChild(controls);
  for (let round = 0; round < steps.length; round++) { if (api.closed) return; api.dots(steps.length, round); controls.innerHTML = '';
    const choices = shuffle(steps.slice(round)); api.say(steps[round][1], steps[round][2]);
    const old = api.stage; api.stage = controls; const buttons = choiceButtons(api, choices, value => pic(value[0])); api.stage = old;
    await untilRight(api, buttons, b => b._v[0] === steps[round][0]); if (api.closed) return;
    done.appendChild(el('span', 'seq-item', pic(steps[round][0]))); api.praise(); await wait(300);
  } return api.win();
} });
register({ id: 'steppingpath', icon: '🗺️', name: () => T('Flower Path', 'Đường Hoa'), async run(api) {
  const size = api.little ? 3 : 4, route = size === 3 ? [0,1,4,7,8] : [0,1,5,6,10,14,15];
  const grid = el('div', 'think-path'); grid.style.cssText = `display:grid;grid-template-columns:repeat(${size},minmax(64px,1fr));gap:8px;max-width:460px;margin:auto`;
  api.stage.appendChild(grid); const cells = [];
  for (let i = 0; i < size * size; i++) { const b = el('button', 'choice', pic(i === route.at(-1) ? '🏁' : route.includes(i) ? '🌸' : '💧')); b.style.minHeight = '64px'; b.dataset.cell = i; b.setAttribute('aria-label', route.includes(i) ? T('Flower stepping stone', 'Bước qua hoa') : T('Puddle', 'Vũng nước')); grid.appendChild(b); cells.push(b); }
  cells[0].classList.add('right'); api.say(...instructions.steppingpath[0]);
  for (let step = 1; step < route.length; step++) { if (api.closed) return; api.dots(route.length - 1, step - 1); const current = route[step - 1];
    const neighbours = cells.filter((b,i) => Math.abs(i % size - current % size) + Math.abs(Math.floor(i / size) - Math.floor(current / size)) === 1);
    cells.forEach(b => { b.disabled = !neighbours.includes(b); });
    await untilRight(api, neighbours, b => +b.dataset.cell === route[step]); if (api.closed) return; cells[route[step]].classList.add('right'); api.praise();
  } return api.win();
} });
