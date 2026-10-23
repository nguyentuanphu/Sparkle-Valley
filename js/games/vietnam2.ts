import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', '.vn2-wrap{display:grid;justify-items:center;gap:10px;padding:20px}.vn2-btn{min-width:120px;padding:10px;border-radius:15px;background:#fff;border:2px solid #3f2b24}'));
}

register({
  id: 'banhchung', icon: '🍃',
  name: () => T('Wrap Bánh Chưng for Tết', 'Làm Bánh Chưng Ngày Tết'),
  async run(api) {
    style();
    api.say('Wrap the Bánh Chưng for TET!', 'Gói bánh Chưng ngày Tết!');
    const wrap = el('div', 'vn2-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'vn2-btn');
    btn.innerHTML = pic('🍃') + ' ' + T('Wrap', 'Gói');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop();
    await wait(400);
    return api.win({ title: T('Bánh Chưng wrapped!', 'Đã gói xong bánh Chưng!') });
  }
});

register({
  id: 'denongsao', icon: '⭐',
  name: () => T('Make a Star Lantern', 'Làm Đèn Ông Sao'),
  async run(api) {
    style();
    api.say('Make a star lantern!', 'Làm đèn ông sao!');
    const wrap = el('div', 'vn2-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'vn2-btn');
    btn.innerHTML = pic('⭐') + ' ' + T('Light', 'Thắp');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.chime();
    await wait(400);
    return api.win({ title: T('Star lantern lit!', 'Đèn ông sao sáng rực!') });
  }
});

register({
  id: 'mualan', icon: '🦁',
  name: () => T('Lion Dance Drummer', 'Múa Lân Rộn Ràng'),
  async run(api) {
    style();
    api.say('Beat the drum for the lion dance!', 'Đánh trống múa lân!');
    const wrap = el('div', 'vn2-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'vn2-btn');
    btn.innerHTML = pic('🥁') + ' ' + T('Beat', 'Đánh');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.pop(4);
    await wait(400);
    return api.win({ title: T('Lion dance complete!', 'Múa lân rộn ràng!') });
  }
});

register({
  id: 'cayneu', icon: '🎋',
  name: () => T('Tết Pole Decorator', 'Trồng Cây Nêu Ngày Tết'),
  async run(api) {
    style();
    api.say('Decorate the TET pole!', 'Trồng cây nêu ngày TET!');
    const wrap = el('div', 'vn2-wrap');
    api.stage.appendChild(wrap);
    const btn = el('button', 'vn2-btn');
    btn.innerHTML = pic('🎋') + ' ' + T('Decorate', 'Trồng');
    wrap.appendChild(btn);
    await untilRight(api, [btn], () => true);
    api.sfx.ding();
    await wait(400);
    return api.win({ title: T('TET pole decorated!', 'Cây nêu đã dựng xong!') });
  }
});