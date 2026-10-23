import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', '.nat-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.nat-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}'));
}

register({
  id: 'catchfish', icon: '🐟',
  name: () => T('Catch-and-Release Fish', 'Vớt Cá Thơ Ngây'),
  async run(api) {
    style();
    api.say('Catch and release the fish!', 'Vớt cá thơ ngây!');
    const wrap = el('div', 'nat-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'nat-btn');
    btn.innerHTML = pic('🐟') + ' ' + T('Catch', 'Vớt');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T('Fish released!', 'Cá đã về với nước!') });
  }
});

register({
  id: 'emueggs', icon: '🥚',
  name: () => T('Emu Egg Basket', 'Nhặt Trứng Đà Điểu'),
  async run(api) {
    style();
    api.say('Collect the emu eggs!', 'Nhặt trứng đà điểu!');
    const wrap = el('div', 'nat-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'nat-btn');
    btn.innerHTML = pic('🥚') + ' ' + T('Collect', 'Nhặt');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T('Eggs collected!', 'Đã nhặt xong trứng!') });
  }
});

register({
  id: 'reefclean', icon: '🪸',
  name: () => T('Great Barrier Reef Cleaner', 'Bảo Vệ Rạn San Hô'),
  async run(api) {
    style();
    api.say('Clean the reef!', 'Bảo vệ rạn san hô!');
    const wrap = el('div', 'nat-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'nat-btn');
    btn.innerHTML = pic('🪸') + ' ' + T('Clean', 'Dọn');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T('Reef cleaned!', 'Rạn san hô đã sạch!') });
  }
});
