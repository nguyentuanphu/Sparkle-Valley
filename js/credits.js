// The credits page: who made Sparkle Valley, for whom, and why. Grown-ups can edit the words.
import { T } from './i18n.js';
import { settings, saveSettings } from './state.js';
import { say, hush } from './voice.js';
import { Music } from './audio.js';
import { el, esc } from './util.js';

export const CREDIT_DEFAULTS = {
  creator: 'Henry Nguyen',
  forWhom: { en: 'For my children, and for every child growing up between two homes.', vi: 'Dành tặng các con, và mọi em nhỏ lớn lên giữa hai quê hương.' },
  why: {
    en: 'I made Sparkle Valley so my children could keep both of their homes, Vietnam and Australia, in one magical place. Here they hear both languages, play the folk games their parents and grandparents played, and learn to think, count and solve problems while they laugh and explore. Every puzzle is gentle, every mistake is a chance to try again, and every child is the hero of their own story.',
    vi: 'Bố làm Thung Lũng Lấp Lánh để các con giữ được cả hai quê hương, Việt Nam và Úc, trong một nơi diệu kỳ. Ở đây các con được nghe cả hai thứ tiếng, chơi những trò chơi dân gian mà bố mẹ và ông bà đã từng chơi, và học cách suy nghĩ, đếm và giải đố trong tiếng cười và niềm vui khám phá. Mỗi câu đố đều nhẹ nhàng, mỗi lần sai là một cơ hội thử lại, và mỗi em nhỏ đều là người hùng trong câu chuyện của mình.'
  }
};
const val = (k) => {
  const c = settings.credits || {};
  if (k === 'creator') return c.creator || CREDIT_DEFAULTS.creator;
  const d = CREDIT_DEFAULTS[k], own = c[k];
  return own || T(d.en, d.vi);
};

export function openCredits() {
  const prevMusic = Music.key; Music.play('twinkle');
  const teach = [
    ['🧠', T('Thinking & strategy', 'Tư duy và chiến thuật')], ['🔤', T('Letters & numbers in two languages', 'Chữ và số bằng hai thứ tiếng')],
    ['💰', T('Money: AUD and VND', 'Tiền: đô Úc và đồng Việt Nam')], ['🌱', T('Caring for plants & animals', 'Chăm sóc cây và con vật')],
    ['🪢', T('Folk games of Vietnam & Australia', 'Trò chơi dân gian Việt Nam và Úc')], ['🤝', T('Kindness & teamwork', 'Lòng tốt và tinh thần đồng đội')]
  ];
  const c = el('div', 'credits', `
    <button class="cr-x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <div class="cr-roll">
      <div class="cr-by">${T('Built by', 'Thực hiện bởi')} <b>${esc(val('creator'))}</b></div>
      <div class="cr-logo">Sparkle Valley</div><div class="cr-sub">Thung Lũng Lấp Lánh</div>
      <div class="cr-block"><small>${T('Created with love by', 'Được tạo ra với tình yêu bởi')}</small><h2>${esc(val('creator'))}</h2></div>
      <div class="cr-block"><p class="cr-for">${esc(val('forWhom'))}</p></div>
      <div class="cr-block"><small>${T('Why this game exists', 'Vì sao có trò chơi này')}</small><p>${esc(val('why'))}</p></div>
      <div class="cr-block"><small>${T('What children learn here', 'Các em học được gì')}</small><div class="cr-teach">${teach.map(([i, t]) => `<span><b>${i}</b>${esc(t)}</span>`).join('')}</div></div>
      <div class="cr-block"><small>${T('Idea, story & design', 'Ý tưởng, câu chuyện và thiết kế')}</small><p>${esc(val('creator'))}</p>
        <small>${T('Built with the help of', 'Được xây dựng với sự giúp đỡ của')}</small><p>Claude (Anthropic)</p>
        <small>${T('Thank you to', 'Cảm ơn')}</small><p>three.js · PeerJS · Fredoka & Baloo 2 fonts<br>${T('Traditional songs and folk games shared by families in Vietnam and Australia', 'Những bài hát truyền thống và trò chơi dân gian được các gia đình ở Việt Nam và Úc gìn giữ')}</p></div>
      <div class="cr-block cr-end">💖<p>${T('Thank you for playing!', 'Cảm ơn con đã chơi!')}</p></div>
    </div>`);
  document.body.appendChild(c);
  say(val('why'), val('why'));
  const close = () => { hush(); c.remove(); Music.play(prevMusic || 'field'); };
  c.querySelector('.cr-x').onclick = close;
}

// Grown-ups can change the creator's name and the message.
export function creditsFields() {
  const c = settings.credits || {};
  return `<div class="field"><label for="crName">${T('Creator name (credits page)', 'Tên người tạo (trang giới thiệu)')}</label><input type="text" id="crName" value="${esc(c.creator || CREDIT_DEFAULTS.creator)}"></div>
    <div class="field"><label for="crFor">${T('Dedication', 'Lời đề tặng')}</label><input type="text" id="crFor" value="${esc(c.forWhom || '')}" placeholder="${esc(T(CREDIT_DEFAULTS.forWhom.en, CREDIT_DEFAULTS.forWhom.vi))}"></div>
    <div class="field"><label for="crWhy">${T('Why I made this game', 'Vì sao tôi làm trò chơi này')}</label><textarea id="crWhy" rows="5" placeholder="${esc(T(CREDIT_DEFAULTS.why.en, CREDIT_DEFAULTS.why.vi))}">${esc(c.why || '')}</textarea></div>`;
}
export function bindCreditsFields(root) {
  const save = () => { settings.credits = { creator: root.querySelector('#crName').value.trim(), forWhom: root.querySelector('#crFor').value.trim(), why: root.querySelector('#crWhy').value.trim() }; saveSettings(); };
  ['#crName', '#crFor', '#crWhy'].forEach(s => root.querySelector(s).addEventListener('change', save));
}
