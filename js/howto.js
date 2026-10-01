// "📺 How to play": a short narrated film for every game. Each film is a few animated picture cards
// with a voice telling the story of the game and how to play it. Folk games also tell where the game
// comes from and how to play it for real with friends.
// If a grown-up drops a real video into videos/<game id>.mp4, that video is played instead.
import { T } from './i18n.js';
import { sayAsync, hush } from './voice.js';
import { Music, SFX } from './audio.js';
import { GAMES } from './games/frame.js';
import { el, esc, wait } from './util.js';

// [picture, English, Vietnamese]
const S = (pic, en, vi) => ({ pic, en, vi });
export const HOWTO = {
  // ---- folk games ----
  mrwolf: {
    origin: S('🇦🇺 🐺', 'This is a schoolyard game from Australia. Children have played it for more than a hundred years!', 'Đây là trò chơi sân trường của nước Úc. Các bạn nhỏ đã chơi trò này hơn một trăm năm rồi!'),
    steps: [S('🗣️ 🐺', 'Ask: What is the time, Mr Wolf?', 'Hỏi: Mấy giờ rồi, ông Sói ơi?'),
      S('🕒 👣👣👣', 'If Mr Wolf says three o clock, take three steps. Count them out loud!', 'Nếu ông Sói nói ba giờ, con bước ba bước. Đếm to lên nhé!'),
      S('🍽️ 🐺 🏃 🏠', 'When he shouts Dinner time, run home as fast as you can!', 'Khi ông Sói hét Đến giờ ăn tối, chạy về nhà thật nhanh!')],
    real: S('🧒🧒🧒 🐺', 'To play with friends: one friend is Mr Wolf and stands with their back turned. Everyone else starts at the wall and creeps closer.', 'Chơi với bạn bè: một bạn làm ông Sói, đứng quay lưng lại. Các bạn khác đứng ở bức tường rồi tiến lại gần.')
  },
  chuyen: {
    origin: S('🇻🇳 🇦🇺 🥢', 'In Vietnam girls play Đánh chuyền with a little ball and ten chopsticks. In Australia children play Knucklebones with five little bones or jacks.', 'Ở Việt Nam các bạn gái chơi đánh chuyền với một quả bóng nhỏ và mười que. Ở Úc các bạn chơi Knucklebones với năm khúc xương nhỏ.'),
    steps: [S('👆 🟠 ⬆️', 'Tap the ball to throw it up high.', 'Chạm quả bóng để tung lên cao.'),
      S('🥢 ✋', 'Quick! Pick up the sticks while the ball is in the air.', 'Nhanh lên! Nhặt que khi bóng còn trên không.'),
      S('🟠 🤲', 'Then tap the ball to catch it before it lands. Pick one, then two, then three!', 'Rồi chạm quả bóng để bắt trước khi bóng rơi. Nhặt một que, rồi hai, rồi ba!')],
    real: S('🎵 🥢 🟠', 'In Vietnam you sing while you play: Chuyền chuyền một, một đôi. Chuyền chuyền hai, hai đôi!', 'Ở Việt Nam vừa chơi vừa hát: Chuyền chuyền một, một đôi. Chuyền chuyền hai, hai đôi!')
  },
  dragon: {
    origin: S('🇻🇳 🐉', 'Rồng rắn lên mây is a game from Vietnam. The children hold on to each other to make a long dragon.', 'Rồng rắn lên mây là trò chơi dân gian Việt Nam. Các bạn nắm vạt áo nhau thành một con rồng thật dài.'),
    steps: [S('🐲🧒👧👦 🎵', 'The dragon sings: Dragon snake up to the clouds. Is the doctor at home?', 'Rồng rắn hát: Rồng rắn lên mây, có cây lúc lắc, hỏi thăm thầy thuốc có nhà hay không?'),
      S('🧑‍⚕️ 💬', 'The doctor asks for the head, the middle and the tail. Choose what the dragon answers.', 'Thầy thuốc xin khúc đầu, khúc giữa, khúc đuôi. Con chọn câu rồng rắn trả lời nhé.'),
      S('🧑‍⚕️ 👆 🐉', 'Then the doctor chases the tail! Tap the doctor to keep the tail safe.', 'Rồi thầy thuốc đuổi bắt khúc đuôi! Chạm vào thầy thuốc để bảo vệ khúc đuôi.')],
    real: S('🧒👧👦👧 🧑‍⚕️', 'With friends: the head spreads their arms to block the doctor, and everyone holds on tight!', 'Chơi với bạn bè: bạn đầu rồng dang tay chặn thầy thuốc, và mọi người bám thật chặt!')
  },
  marbles: {
    origin: S('🇻🇳 🇦🇺 🔮', 'Children in Vietnam and in Australia both love marbles. In Vietnam it is called Bắn bi.', 'Trẻ em ở Việt Nam và ở Úc đều thích chơi bi. Ở Úc gọi là Marbles.'),
    steps: [S('⚪ 👇', 'Put your finger on the big white marble and pull back.', 'Đặt ngón tay lên viên bi cái màu trắng rồi kéo về phía sau.'),
      S('⚪ 💨 🔴', 'Let go to shoot! The dotted line shows where it goes.', 'Thả tay ra để bắn! Đường chấm chỉ hướng bi sẽ đi.'),
      S('⭕ 🔴 ➡️', 'Knock the marbles out of the chalk circle to win them.', 'Bắn cho bi văng ra khỏi vòng phấn là được bi đó.')],
    real: S('✏️ ⭕ 🔮', 'For real: draw a circle in the dirt, put the marbles in the middle and flick your shooter with your thumb.', 'Chơi thật: vẽ một vòng tròn trên đất, đặt bi vào giữa, rồi dùng ngón cái búng viên bi cái.')
  },
  skipping: {
    origin: S('🇻🇳 🇦🇺 🪢', 'Skipping is loved everywhere. In Vietnam it is called Nhảy dây, and in Australia children also jump Elastics.', 'Nhảy dây được trẻ em khắp nơi yêu thích. Ở Úc các bạn còn chơi nhảy dây chun gọi là Elastics.'),
    steps: [S('👧 〰️ 👦', 'Two friends turn the rope round and round.', 'Hai bạn quay dây vòng vòng.'),
      S('👇 〰️ ⤴️', 'When the rope comes down to your feet, tap Jump!', 'Khi dây quay xuống chân, chạm nút Nhảy!'),
      S('1️⃣ 2️⃣ 3️⃣', 'Count every jump with me!', 'Cùng đếm mỗi lần nhảy nhé!')],
    real: S('👧🪢👦 🧒', 'For real: two friends hold the ends of a long rope, and everyone takes turns jumping in.', 'Chơi thật: hai bạn cầm hai đầu sợi dây dài, các bạn khác lần lượt nhảy vào.')
  },
  oanquan: {
    origin: S('🇻🇳 🪨', 'Ô ăn quan is one of the oldest games in Vietnam. Children draw the board on the ground and play with little stones.', 'Ô ăn quan là một trong những trò chơi lâu đời nhất của Việt Nam. Các bạn vẽ bàn trên đất và chơi bằng sỏi.'),
    steps: [S('👆 ⬜', 'Pick one of your squares on the bottom row.', 'Chọn một ô của con ở hàng dưới.'),
      S('⬅️ ➡️', 'Choose a direction, then drop one seed in each square.', 'Chọn hướng, rồi rải mỗi ô một hạt.'),
      S('⬜ ⬜ 🪨', 'If you land next to an empty square, you capture the seeds after it!', 'Gặp ô trống thì được ăn các hạt ở ô sau đó!')],
    real: S('✏️ 🪨🪨', 'For real: draw ten squares and two half moons in the dirt, and use pebbles as seeds.', 'Chơi thật: kẻ mười ô vuông và hai ô quan hình bán nguyệt, dùng sỏi làm quân.')
  },
  hopscotch: {
    origin: S('🇻🇳 🇦🇺 🦶', 'Hopscotch is played in Vietnam, where it is called Nhảy lò cò, and in Australia too.', 'Nhảy lò cò được chơi ở Việt Nam, và ở Úc cũng vậy, gọi là Hopscotch.'),
    steps: [S('🪨 ⬜', 'A stone lands on one square.', 'Viên đá rơi vào một ô.'),
      S('1️⃣ 2️⃣ 3️⃣', 'Tap the numbers in order to hop.', 'Chạm các số theo thứ tự để nhảy.'),
      S('🚫 🪨', 'Skip the square with the stone!', 'Nhớ bỏ qua ô có viên đá!')],
    real: S('✏️ 🦶', 'For real: draw the squares with chalk, throw a stone, and hop on one leg.', 'Chơi thật: vẽ ô bằng phấn, ném viên đá, rồi nhảy lò cò bằng một chân.')
  },
  tug: {
    origin: S('🇻🇳 🪢', 'Kéo co is played at village festivals all over Vietnam. Everyone shouts Dô ta!', 'Kéo co được chơi trong các lễ hội làng khắp Việt Nam. Mọi người cùng hô Dô ta!'),
    steps: [S('💪 👆👆👆', 'Tap the Pull button as fast as you can.', 'Bấm nút Kéo thật nhanh.'),
      S('🪢 ⬅️', 'Pull the red mark all the way to your side to win.', 'Kéo vạch đỏ về phía đội mình là thắng.')],
    real: S('🧒🧒🪢👧👧', 'For real: two teams hold a long rope and pull together on Dô ta!', 'Chơi thật: hai đội cầm sợi dây dài và cùng kéo theo tiếng hô Dô ta!')
  },
  caro: {
    origin: S('🇻🇳 ⭕', 'Cờ caro is played on squared paper in every Vietnamese school. In Australia a small one is called Noughts and Crosses.', 'Cờ caro được chơi trên giấy ô li ở mọi trường học Việt Nam. Ở Úc có trò tương tự tên là Noughts and Crosses.'),
    steps: [S('👆 ⬜', 'Take turns to tap a square.', 'Lần lượt chạm vào một ô.'),
      S('🌸🌸🌸', 'Get your flowers in a row: across, down or slanted!', 'Xếp các bông hoa thẳng hàng: ngang, dọc hoặc chéo!')]
  },
  goat: {
    origin: S('🇻🇳 🐐', 'Bịt mắt bắt dê, blindfold goat, is a favourite Vietnamese party game.', 'Bịt mắt bắt dê là trò chơi dân gian rất được yêu thích ở Việt Nam.'),
    steps: [S('🌾🌾🌾 🐐', 'The goat is hiding in one haystack.', 'Chú dê đang trốn trong một đống rơm.'),
      S('👆 🌾 ➡️', 'Tap a haystack. The hoof prints point towards the goat.', 'Chạm vào đống rơm. Dấu chân dê chỉ về phía chú dê.')],
    real: S('🙈 🧒 🐐', 'For real: one friend wears a blindfold and tries to catch the others, who call out Be be!', 'Chơi thật: một bạn bịt mắt đi bắt, các bạn khác kêu Be be để trêu!')
  },
  // ---- puzzles and learning ----
  pattern: { steps: [S('🔴🔵🔴🔵 ❓', 'Look at the pattern.', 'Nhìn dãy hình nhé.'), S('👆 🔴', 'Tap what comes next!', 'Chạm vào hình tiếp theo!')] },
  counting: { steps: [S('🍎🍎🍎', 'Count the things on the screen.', 'Đếm các đồ vật trên màn hình.'), S('👆 3️⃣', 'Tap the right number.', 'Chạm vào số đúng.')] },
  letters: { steps: [S('🔤 👂', 'Listen to the letter.', 'Nghe tên chữ cái.'), S('👆 A', 'Find it and tap it!', 'Tìm và chạm vào chữ đó!')] },
  numbers: { steps: [S('🚂 1 2 ❓ 4', 'The number train has a gap.', 'Đoàn tàu số bị thiếu một toa.'), S('👆 3️⃣', 'Tap the missing number.', 'Chạm vào số còn thiếu.')] },
  shapes: { steps: [S('⬛ 🔷', 'Look at the shadow.', 'Nhìn cái bóng.'), S('👆 🔷', 'Tap the shape that makes that shadow.', 'Chạm vào hình tạo ra cái bóng đó.')] },
  colors: { steps: [S('🔴 ➕ 🟡', 'Mix two paints.', 'Pha hai màu.'), S('🟠 ✨', 'Find the colour they make!', 'Tìm màu pha ra được!')] },
  sorting: { steps: [S('🐭 🐶 🐘', 'Put things from small to big.', 'Xếp từ bé đến lớn.'), S('👆 🐭', 'Tap the smallest first.', 'Chạm vào cái bé nhất trước.')] },
  memory: { steps: [S('🃏🃏', 'Flip two cards.', 'Lật hai thẻ.'), S('🐱 🐱', 'Find the matching pairs. Remember where they are!', 'Tìm hai hình giống nhau. Nhớ vị trí nhé!')] },
  hanoi: { steps: [S('🗼 ⬆️', 'Move the whole tower to another pole.', 'Chuyển cả tháp sang cột khác.'), S('🟥 🚫 🟨', 'Never put a big disc on a small one. Need help? Tap the light bulb.', 'Không đặt đĩa to lên đĩa nhỏ. Cần giúp? Chạm bóng đèn.')] },
  robot: { steps: [S('🤖 ⬆️➡️', 'Plan the robot path with arrows.', 'Lập kế hoạch đường đi cho rô-bốt bằng mũi tên.'), S('▶️ ⭐', 'Press go and watch it reach the star.', 'Bấm chạy và xem rô-bốt đến ngôi sao.')] },
  maze: { steps: [S('🌀 👆', 'Tap the path squares one by one.', 'Chạm từng ô đường đi.'), S('🍉', 'Find the way to the watermelon!', 'Tìm đường đến quả dưa hấu!')] },
  market: { steps: [S('🛒 💰', 'A customer wants to buy something.', 'Có khách muốn mua hàng.'), S('🪙 ➕ 🪙', 'Tap coins to pay exactly the price.', 'Chạm tiền để trả đúng giá.')] },
  order: { steps: [S('📋 🥕🥕', 'Read the order board.', 'Đọc bảng đặt hàng.'), S('👆 🥕', 'Tap the right things to fill the order.', 'Chạm đúng đồ để giao hàng.')] },
  sortout: { steps: [S('👆 🍎', 'Tap a thing first.', 'Chạm vào đồ trước.'), S('🧺', 'Then tap the basket where it belongs.', 'Rồi chạm vào giỏ đúng.')] },
  bunny: { steps: [S('🐰 ❓', 'Bunny is hungry. Listen to what Bunny wants.', 'Thỏ đói rồi. Nghe thỏ muốn ăn gì.'), S('👆 🥕', 'Tap the right food.', 'Chạm vào món đúng.')] },
  jigsaw: { steps: [S('🖼️ 🧩', 'Your picture is all mixed up.', 'Bức ảnh bị xáo trộn.'), S('👆 👆', 'Tap two pieces to swap them.', 'Chạm hai mảnh để đổi chỗ.')] },
  oddone: { steps: [S('🍎🍌🚗', 'Look at all the pictures.', 'Nhìn tất cả các hình.'), S('👆 🚗', 'Tap the one that is different.', 'Chạm vào hình khác loại.')] },
  tower: { steps: [S('🧱 ⬛', 'Start with the biggest block.', 'Bắt đầu bằng khối to nhất.'), S('🧱 ⬆️', 'Then the next biggest, all the way up.', 'Rồi khối to tiếp theo, xây lên cao.')] },
  duckmaze: { steps: [S('🐥 🌀', 'Duckling is lost.', 'Vịt con bị lạc.'), S('👆 🦆', 'Tap the path to bring it to Mummy Duck.', 'Chạm đường đi để đưa vịt con về với mẹ.')] },
  balloon: { steps: [S('👆 🎈 ⬆️', 'Tap to float up. Let go to drift down.', 'Chạm để bay lên. Thả ra để hạ xuống.'), S('🌈 ⭕', 'Fly through the rainbow rings!', 'Bay qua các vòng cầu vồng!')] },
  bubbles: { steps: [S('🫧 👆', 'Tap bubbles to pop them.', 'Chạm bong bóng để chọc vỡ.'), S('🫧⭐', 'Bubbles with a star have a surprise!', 'Bong bóng có ngôi sao có quà bất ngờ!')] },
  tune: { steps: [S('🎵 👂', 'Listen and watch the bars light up.', 'Nghe và nhìn các phím sáng lên.'), S('👆 🎵', 'Play the same tune back!', 'Chơi lại đúng giai điệu!')] }
};
const FLAG_WORDS = { au: ['From Australia', 'Từ nước Úc'], vn: ['From Vietnam', 'Từ Việt Nam'], both: ['From Vietnam & Australia', 'Từ Việt Nam và Úc'] };
export const originLabel = id => { const o = GAMES[id] && GAMES[id].origin; return o ? T(...FLAG_WORDS[o]) : ''; };

// Does a real video exist for this game? (checked once, quietly)
const videoOK = {};
async function hasVideo(id) {
  if (id in videoOK) return videoOK[id];
  try { const r = await fetch(`videos/${id}.mp4`, { method: 'HEAD' }); videoOK[id] = r.ok && /video/.test(r.headers.get('content-type') || 'video'); }
  catch (e) { videoOK[id] = false; }
  return videoOK[id];
}

// Opens the film. onPlay (optional) is called if the child taps "Play now" at the end.
export function openHowTo(id, { onPlay, onClose } = {}) {
  const g = GAMES[id], h = HOWTO[id] || { steps: [S(g ? g.icon : '🎮', 'Tap and try! There is no wrong way to play.', 'Cứ chạm và thử! Không có cách chơi nào sai cả.')] };
  const cards = [S(g ? g.icon : '🎮', g ? g.name() : '', g ? g.name() : '')]; cards[0].title = true;
  if (h.origin) cards.push(h.origin);
  cards.push(...h.steps);
  if (h.real) cards.push(h.real);
  cards.push(Object.assign(S('⭐ 🎉', 'Now it is your turn. Have fun!', 'Giờ đến lượt con. Chơi vui nhé!'), { end: true }));
  const prevMusic = Music.key; Music.play('none');
  const m = el('div', 'howto', `<div class="ht-film"><div class="ht-screen"></div><div class="ht-cap"></div><div class="ht-bar"><i></i></div></div>
    <div class="ht-ctl"><button class="ht-b ht-prev" aria-label="${T('Back', 'Lùi')}">⏮</button><button class="ht-b ht-pp" aria-label="${T('Pause', 'Tạm dừng')}">⏸</button><button class="ht-b ht-next" aria-label="${T('Next', 'Tiếp')}">⏭</button>
    ${onPlay ? `<button class="ht-play">▶ ${T('Play now', 'Chơi ngay')}</button>` : ''}</div><button class="ht-x" aria-label="${T('Close', 'Đóng')}">✕</button>`);
  document.body.appendChild(m);
  const screen = m.querySelector('.ht-screen'), cap = m.querySelector('.ht-cap'), bar = m.querySelector('.ht-bar i'), pp = m.querySelector('.ht-pp');
  let k = 0, paused = false, closed = false, token = 0;
  const close = () => { if (closed) return; closed = true; token++; hush(); m.remove(); Music.play(prevMusic || 'field'); onClose && onClose(); };
  const show = async () => {
    const my = ++token, c = cards[k];
    bar.style.width = ((k + 1) / cards.length * 100) + '%';
    const pics = [...String(c.pic).matchAll(/\S+/g)].map(x => x[0]);
    screen.className = 'ht-screen' + (c.title ? ' title' : '') + (c.end ? ' end' : '');
    screen.innerHTML = c.title ? `<span class="ht-big">${c.pic}</span><b class="ht-name">${esc(T(c.en, c.vi))}</b>${originLabel(id) ? `<small>${esc(originLabel(id))}</small>` : ''}`
      : pics.map((p, i) => `<span class="ht-pic${p === '👆' || p === '👇' ? ' finger' : ''}" style="--d:${i * .35}s">${p}</span>`).join('');
    cap.textContent = c.title ? '' : T(c.en, c.vi);
    SFX.pop && SFX.pop(k);
    const t0 = performance.now();
    await sayAsync(c.title ? T('How to play ', 'Cách chơi ') + T(c.en, c.vi) : c.en, c.title ? T('How to play ', 'Cách chơi ') + c.vi : c.vi);
    const left = 2600 - (performance.now() - t0); if (left > 0) await wait(left);
    await wait(700);
    while (paused && my === token && !closed) await wait(200);
    if (my !== token || closed) return;
    if (k < cards.length - 1) { k++; show(); }
  };
  m.querySelector('.ht-x').onclick = close;
  m.querySelector('.ht-prev').onclick = () => { k = Math.max(0, k - 1); paused = false; pp.textContent = '⏸'; hush(); show(); };
  m.querySelector('.ht-next').onclick = () => { k = Math.min(cards.length - 1, k + 1); paused = false; pp.textContent = '⏸'; hush(); show(); };
  pp.onclick = () => { paused = !paused; pp.textContent = paused ? '▶' : '⏸'; if (paused) hush(); };
  const pb = m.querySelector('.ht-play'); if (pb) pb.onclick = () => { close(); onPlay(); };
  // a real video, if one has been added for this game
  hasVideo(id).then(ok => {
    if (!ok || closed) return show();
    token++; m.classList.add('video');
    const v = el('video', 'ht-video'); v.src = `videos/${id}.mp4`; v.controls = true; v.playsInline = true; v.autoplay = true;
    screen.replaceWith(v); cap.textContent = ''; m.querySelector('.ht-ctl').querySelectorAll('.ht-b').forEach(b => b.hidden = true);
    v.onerror = () => { v.replaceWith(screen); m.classList.remove('video'); m.querySelectorAll('.ht-b').forEach(b => b.hidden = false); show(); };
  });
  return close;
}
