// The story of Sparkle Valley, told as a narrated picture book.
// A short prologue starts the adventure; a new chapter opens each time a big quest is finished,
// with a reward. Chapters can be read again from the Album.
import { T } from './i18n.js';
import { say, hush } from './voice.js';
import { SFX } from './audio.js';
import { el } from './util.js';
import { burstConfetti } from './games/frame.js';

// {name} is replaced with the child's name.
export const PROLOGUE = { id: 'prologue', title: () => T('The Sleepy Valley', 'Thung Lũng Ngủ Quên'), pages: [
  ['🌄✨🏮', 'Long ago, Sparkle Valley shone with magic lanterns, happy animals and twelve glowing shrines full of puzzles.', 'Ngày xửa ngày xưa, Thung Lũng Lấp Lánh rực rỡ đèn lồng thần kỳ, đầy những con vật vui vẻ và mười hai ngôi đền phát sáng chứa đầy câu đố.'],
  ['⛈️☁️😤', 'One stormy night, a grumpy cloud called Mây Cau Có blew through the valley. Whoosh! The towers fell asleep and the shrines went quiet.', 'Một đêm giông bão, đám mây khó tính tên là Mây Cau Có thổi qua thung lũng. Vù vù! Các tháp ngủ quên và các ngôi đền im lặng.'],
  ['🦉🔭', 'Ông Cú, the wise old owl, looked through his telescope and said: "I know who can help. A brave, clever explorer called {name}!"', 'Ông Cú, chú cú già thông thái, nhìn qua kính viễn vọng và nói: "Ta biết ai có thể giúp. Một nhà thám hiểm dũng cảm và thông minh tên là {name}!"'],
  ['🧒🌟🗺️', 'Wake the towers. Solve the shrine puzzles. Help your friends. Make the valley sparkle again! Your adventure starts now.', 'Đánh thức các tháp. Giải câu đố ở các ngôi đền. Giúp đỡ bạn bè. Làm cho thung lũng lấp lánh trở lại! Cuộc phiêu lưu bắt đầu!']
] };

export const CHAPTERS = [
  { id: 'ch1', after: 'tower1', reward: 15, title: () => T('Chapter 1: The Tower Wakes Up', 'Chương 1: Tháp Thức Dậy'), pages: [
    ['🗼✨', 'Ding ding! The Dawn Tower opened its eyes and glowed bright blue. From the top, {name} could see the whole valley!', 'Đinh đoong! Tháp Bình Minh mở mắt và sáng rực màu xanh. Từ trên đỉnh, {name} nhìn thấy cả thung lũng!'],
    ['🗺️💡', '"Look at your map!" hooted Ông Cú. "Every tower you wake shows you more of the valley."', '"Nhìn bản đồ của con kìa!" Ông Cú nói. "Mỗi tháp con đánh thức sẽ cho con thấy thêm thung lũng."']] },
  { id: 'ch2', after: 'glider', reward: 20, title: () => T('Chapter 2: Wings of a Leaf', 'Chương 2: Đôi Cánh Lá'), pages: [
    ['🧩🧩🧩', 'Three shrines solved! Mây Cau Có grumbled: "Hmph. This explorer is too clever for me!"', 'Giải xong ba ngôi đền! Mây Cau Có cằn nhằn: "Hừm. Nhà thám hiểm này thông minh quá!"'],
    ['🪂🍃', 'Ông Cú gave {name} a magic Leaf Glider. Now {name} can float down from high places like a leaf on the wind.', 'Ông Cú tặng {name} một Cánh Lá thần kỳ. Giờ {name} có thể lượn xuống từ chỗ cao như chiếc lá bay trong gió.']] },
  { id: 'ch3', after: 'village', reward: 15, title: () => T('Chapter 3: Lotus Village', 'Chương 3: Làng Sen'), pages: [
    ['🏮🪷', 'In Lotus Village, the lanterns were dim and the children had forgotten their favourite games.', 'Ở Làng Sen, đèn lồng mờ đi và các bạn nhỏ đã quên mất những trò chơi yêu thích.'],
    ['🪢🦶🪨', '"Will you play with us?" asked Tèo, Tí, Bống and Su. "When we laugh, the lanterns shine again!"', '"Bạn chơi với tụi mình nhé?" Tèo, Tí, Bống và Su hỏi. "Khi tụi mình cười, đèn lồng sẽ sáng lại!"']] },
  { id: 'ch4', after: 'folk', reward: 15, title: () => T('Chapter 4: Laughter Lights the Lanterns', 'Chương 4: Tiếng Cười Thắp Đèn'), pages: [
    ['😄🏮✨', 'Ha ha ha! Everyone laughed and cheered. One by one, the red lanterns of Lotus Village began to glow.', 'Ha ha ha! Mọi người cười vang. Từng chiếc đèn lồng đỏ của Làng Sen sáng lên.']] },
  { id: 'ch5', after: 'cook', reward: 15, title: () => T('Chapter 5: A Feast for Friends', 'Chương 5: Bữa Tiệc Cho Bạn Bè'), pages: [
    ['🍲😋', 'Something smelled delicious! Bác Ba tasted {name}’s cooking and did a happy dance.', 'Thơm quá! Bác Ba nếm món ăn của {name} và nhảy một điệu vui vẻ.'],
    ['💚⚡', '"Good food gives you energy," said Bác Ba. "Eat it when you are tired, and you can run and climb even more!"', '"Ăn ngon thì có sức," Bác Ba nói. "Khi mệt hãy ăn, con sẽ chạy và leo được nhiều hơn!"']] },
  { id: 'ch6', after: 'leafies', reward: 20, title: () => T('Chapter 6: The Hidden Leafies', 'Chương 6: Các Bạn Lá Lá'), pages: [
    ['🍃🙈', 'Little Leafies were hiding under rocks and on mountain tops. They were scared of the grumpy cloud.', 'Các bạn Lá Lá nhỏ xíu trốn dưới hòn đá và trên đỉnh núi. Các bạn sợ đám mây khó tính.'],
    ['🍃💕', '"You found us! You are so kind," they giggled. "We will help make the valley green again."', '"Bạn tìm ra tụi mình rồi! Bạn tốt bụng quá," các bạn cười khúc khích. "Tụi mình sẽ giúp thung lũng xanh tươi trở lại."']] },
  { id: 'ch7', after: 'statue', reward: 20, title: () => T('Chapter 7: The Lotus Blessing', 'Chương 7: Phước Lành Hoa Sen'), pages: [
    ['🪷🔮', 'The Lotus Statue glowed as {name} offered four Sparkle Orbs. "Your clever thinking has made you stronger!"', 'Tượng Sen phát sáng khi {name} dâng bốn Ngọc Lấp Lánh. "Trí thông minh của con đã làm con mạnh mẽ hơn!"']] },
  { id: 'ch8', after: 'towers', reward: 30, title: () => T('Chapter 8: Every Tower Shines', 'Chương 8: Mọi Tháp Đều Sáng'), pages: [
    ['🗼🗼🗼🗼', 'All four towers were awake and shining. Mây Cau Có had nowhere left to hide.', 'Cả bốn tháp đều thức dậy và tỏa sáng. Mây Cau Có không còn chỗ nào để trốn.'],
    ['☁️🥺', 'The grumpy cloud looked a little sad. "Nobody ever plays with me," it whispered.', 'Đám mây khó tính trông hơi buồn. "Chẳng ai chơi với tớ cả," nó thì thầm.']] },
  { id: 'ch9', after: 'shrines', reward: 50, title: () => T('The End: A Rainbow Friend', 'Kết Thúc: Người Bạn Cầu Vồng'), pages: [
    ['🌟🌟🌟', 'Twelve shrines solved! Their light shot up into the sky, warm and bright.', 'Giải xong mười hai đền! Ánh sáng bay vút lên trời, ấm áp và rực rỡ.'],
    ['☁️➡️🌈', '{name} smiled at the cloud: "Do you want to play with us?" The cloud was so happy, it turned into a rainbow!', '{name} mỉm cười với đám mây: "Bạn có muốn chơi cùng tụi mình không?" Đám mây vui quá, biến thành cầu vồng!'],
    ['🎉🏆', 'Sparkle Valley sparkled brighter than ever, thanks to {name}, the hero of the valley. The End… but the fun goes on!', 'Thung Lũng Lấp Lánh lấp lánh hơn bao giờ hết, nhờ có {name}, người anh hùng của thung lũng. Hết… nhưng niềm vui vẫn còn tiếp!']] }
];

// Show pages as a picture book. Tap to turn the page; the voice reads each one.
export function showStory(story, name) {
  return new Promise(res => {
    const b = el('div', 'storybook', `<div class="sb-title"></div><div class="sb-art"></div><p class="sb-text"></p><div class="sb-foot"><span class="sb-dots"></span><button class="sb-skip">${T('Skip', 'Bỏ qua')} ⏭</button></div>`);
    document.body.appendChild(b); SFX.chime();
    let i = 0;
    const fill = s => s.replace(/\{name\}/g, name);
    const show = () => {
      const [art, en, vi] = story.pages[i];
      b.querySelector('.sb-title').textContent = story.title();
      const a = b.querySelector('.sb-art'); a.textContent = art; a.classList.remove('in'); void a.offsetWidth; a.classList.add('in');
      b.querySelector('.sb-text').textContent = T(fill(en), fill(vi));
      b.querySelector('.sb-dots').innerHTML = story.pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
      say(fill(en), fill(vi));
    };
    const close = () => { hush(); b.classList.add('out'); setTimeout(() => { b.remove(); res(); }, 300); };
    b.onclick = e => { if (e.target.closest('.sb-skip')) return close(); SFX.tap(); if (++i >= story.pages.length) close(); else show(); };
    show();
  });
}

// Open any chapter that has just been earned. Returns true if one was shown.
export async function storyCheck(G, h, questDone) {
  const p = h.profile;
  p.story = p.story || {};
  for (const c of CHAPTERS) {
    if (p.story[c.id] || !questDone(c.after)) continue;
    p.story[c.id] = true; G.save();
    const was = G.paused; G.paused = true;
    await showStory(c, p.name);
    G.addCoins(c.reward);
    const st = G.giveSticker(p);
    if (c.id === 'ch9') burstConfetti(document.body);
    await G.reward('📖', T('New chapter in your storybook!', 'Chương mới trong sách truyện!'), T(`+${G.fmt(c.reward)}${st ? ' and a sticker ' + st : ''}`, `+${G.fmt(c.reward)}${st ? ' và hình dán ' + st : ''}`));
    G.paused = was;
    return true;
  }
  return false;
}
export const storyList = p => [PROLOGUE, ...CHAPTERS.filter(c => p.story && p.story[c.id])];
