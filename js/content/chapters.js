// Đèn Lồng Thung Lũng (The Valley Lanterns): the main story (round R, approved by the owner on 9 Oct; the plan is in
// docs/cores/STORY.md). The night before the great lantern festival, the grumpy cloud Mây Cau Có blew the valley's
// lanterns far away; with a companion, the child brings them home one region at a time. Each chapter is a list of
// steps (one at a time is the child's goal) and a release switch in Studio ('story_<id>'). js/lanterns.js runs it.
//
// A step: id, icon, en/vi (the goal shown), tale [art, who, en, vi] (told when the step starts; {name} = the child),
// how it is done:
//   visit: region key            the child is in that area (profile.visited)
//   act: interactable id         the child used that thing (e.g. the village well)
//   game: [game ids]             the child finished one of those games
//   talk: { who, lines }         talk to someone: a speech box with lines [[en, vi], …] (js/lanterns.js places the button)
//   tale: tale id                hear one of the stories (the theatre opens at the storyteller)
//   find: true                   pick up the chapter's lantern where it landed
//   hang: true                   hang it at the chapter's landmark: the festival film, the landmark lights up, a keepsake
// at: where the arrow points (owl, storyteller, village, teo, well, lantern, landmark)
// With Studio's storyActions on (owner 9 Oct: every step something to do): ribbons: n wind ribbons to catch on the way,
// leaves: n lotus leaves to lift (the lantern is under one), and hanging is done by pulling the rope; act_en/act_vi is
// the goal shown then. Lines for these are in STORY_LINES.
// Chapter 2 (Hà Nội, Play core, 10 Oct) adds: big: true (only for big kids, 5 to 8: an under-5 skips the step),
// gameLittle (the game an under-5 plays instead), taleLittle / actL_en / actL_vi (what an under-5 is told instead),
// lights: n (lantern lights to follow, like the ribbons), challenge (Tèo's challenge: a line each for big and little,
// then the game), job (help someone with the hand controls), lesson (Cô Tam's lesson: count the stone turtles) and
// clues: n (spots by the lake to look at; an under-5's companion lights the way to the right one). Its places are built
// by js/content/chapter2hanoi.js; its festival film is in js/content/chapter2films.js.
export const CHAPTERS = [
  { id: 'prologue', en: 'The Lanterns Blow Away', vi: 'Đèn Lồng Bay Mất', steps: [
    { id: 'p_owl', icon: '🦉', en: 'Talk to Ông Cú', vi: 'Nói chuyện với Ông Cú', at: 'owl', owl: true }
  ] },
  { id: 'ch1', en: 'Lotus Village', vi: 'Làng Sen', landmark: 'dinh', keepsake: 'lantern_ch1', reward: 30, steps: [
    { id: 'c1_village', icon: '🏮', en: 'Fly to Lotus Village with your friend', vi: 'Cùng bạn đồng hành bay đến Làng Sen', at: 'village', visit: 'village',
      ribbons: 3, act_en: 'Catch the 3 wind ribbons on the way to Lotus Village', act_vi: 'Bắt 3 dải lụa gió trên đường đến Làng Sen',
      tale: ['🦉🏮', 'Ông Cú', 'One lantern blew towards Lotus Village, across the river bridge. Go with your friend and ask the villagers. They will help you!', 'Một chiếc đèn lồng bay về phía Làng Sen, bên kia cầu. Con và bạn đồng hành đi hỏi dân làng nhé. Mọi người sẽ giúp con!'] },
    { id: 'c1_nam', icon: '👵', en: 'Ask Bà Năm where the lantern went', vi: 'Hỏi Bà Năm đèn lồng bay đi đâu', at: 'storyteller',
      talk: { who: 'Bà Năm', label: ['Ask about the lantern', 'Hỏi về đèn lồng'], lines: [
        ['Oh, {name}! Last night I saw a red light float down towards the lotus pond.', 'Ôi, {name}! Đêm qua bà thấy một đốm sáng đỏ bay xuống phía hồ sen.'],
        ['But before you look, could you help the village get ready for the festival?', 'Nhưng trước khi đi tìm, con giúp làng chuẩn bị cho lễ hội nhé?'],
        ['The đình needs fresh water from the old well. Can you fetch some?', 'Đình làng cần nước sạch từ giếng cổ. Con múc giúp bà một ít được không?']],
        short: [['A red light flew down to the lotus pond! First, fetch water from the old well for the đình.', 'Đốm sáng đỏ bay xuống hồ sen rồi! Trước tiên, con múc nước giếng cổ cho đình nhé.']] } },
    { id: 'c1_well', icon: '🪣', en: 'Fetch water from the old well', vi: 'Múc nước ở giếng cổ', at: 'well', act: 'lv_well',
      tale: ['👵🪣', 'Bà Năm', 'The old well is by the banyan tree. Walk up to it and draw the water up in the bucket.', 'Giếng cổ ở cạnh gốc đa. Con đi đến giếng và kéo gàu nước lên nhé.'] },
    { id: 'c1_teo', icon: '🧒', en: 'Play a folk game with Tèo', vi: 'Chơi một trò dân gian với Tèo', at: 'teo', game: ['oanquan', 'hopscotch', 'tug', 'caro', 'chuyen', 'marbles', 'skipping', 'dragon', 'mrwolf', 'dacau', 'oantuti', 'nemlon', 'goat'],
      tale: ['🧒🪨', 'Tèo', 'You want to find the lantern? Beat me at a game first! Ô ăn quan, hopscotch, anything. I am the best in the village. Well, almost.', 'Bạn muốn tìm đèn lồng hả? Thắng tớ một ván trước đã! Ô ăn quan, nhảy lò cò, gì cũng được. Tớ giỏi nhất làng đó. À, gần nhất thôi.'] },
    { id: 'c1_tale', icon: '📖', en: 'Hear Bà Năm tell the story of the first watermelon', vi: 'Nghe Bà Năm kể Sự tích dưa hấu', at: 'storyteller', tale_id: 'duahau',
      talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. Here is the story of Mai An Tiêm and the first watermelon.', 'Lại đây ngồi nào, {name}. Bà kể con nghe chuyện Mai An Tiêm và quả dưa hấu đầu tiên.']] },
      tale: ['🧒😄', 'Tèo', 'Okay, okay, you win! Bà Năm knows everything that happens in the village. Go and hear her story, she has a clue for you.', 'Thôi được, bạn thắng! Bà Năm biết hết mọi chuyện trong làng. Đi nghe bà kể chuyện đi, bà có manh mối cho bạn đó.'] },
    { id: 'c1_find', icon: '🪷', en: 'Find the lantern by the lotus pond', vi: 'Tìm đèn lồng bên hồ sen', at: 'lantern', find: true,
      leaves: 5, act_en: 'Lift the lotus leaves to find the lantern', act_vi: 'Lật lá sen để tìm đèn lồng',
      tale: ['👵🪷', 'Bà Năm', 'Like Mai An Tiêm, you never gave up. Now look among the lotus leaves by the pond. Something red is shining there!', 'Giống như Mai An Tiêm, con không bao giờ bỏ cuộc. Giờ con tìm giữa những lá sen bên hồ nhé. Có gì đó màu đỏ đang sáng ở đó!'] },
    { id: 'c1_hang', icon: '🏯', en: 'Hang the lantern at the đình', vi: 'Treo đèn lồng ở đình làng', at: 'landmark', hang: true,
      tale: ['🏮✨', 'Lấp Lánh', 'We found it! The đình is sleeping in the mist. Let us hang the lantern there and wake it up!', 'Tìm thấy rồi! Đình làng đang ngủ trong sương. Mình treo đèn lồng lên để đánh thức đình nhé!'] }
  ] }
  ,
  { id: 'ch2', en: 'Hà Nội', vi: 'Hà Nội', landmark: 'thehuc', keepsake: 'lantern_ch2', reward: 40, trick: 'light', steps: [
    { id: 'c2_fly', icon: '🏮', en: 'Fly to Hà Nội with your friend', vi: 'Cùng bạn đồng hành bay đến Hà Nội', at: 'hanoi', visit: 'hanoi',
      lights: 3, act_en: 'Follow the 3 lantern lights to Hà Nội', act_vi: 'Đi theo 3 đốm đèn lồng đến Hà Nội',
      tale: ['🦉🏮', 'Ông Cú', 'Hoo hoo! One lantern flew north, all the way to Hà Nội. Trung Thu, the Mid-Autumn festival, is coming, and Hà Nội needs its lantern back. Follow the little lights!', 'Hu hu! Một chiếc đèn lồng bay về phía bắc, tận Hà Nội. Sắp đến Trung Thu rồi, Hà Nội đang cần đèn lồng. Con đi theo những đốm sáng nhỏ nhé!'] },
    { id: 'c2_tam', icon: '👩‍🏫', en: 'Say hello to Cô Tam at Văn Miếu', vi: 'Chào Cô Tam ở Văn Miếu', at: 'tam2', big: true,
      talk: { who: 'Cô Tam', label: ['Say hello', 'Chào cô'], lines: [
        ['Welcome to Hà Nội, {name}! I brought my class to see Văn Miếu, the oldest school in Vietnam.', 'Chào mừng con đến Hà Nội, {name}! Cô đưa lớp ra thăm Văn Miếu, ngôi trường xưa nhất Việt Nam.'],
        ['Last night a red lantern floated over Hồ Gươm, the lake with the red bridge.', 'Đêm qua có một chiếc đèn lồng đỏ bay lơ lửng trên Hồ Gươm, cái hồ có cây cầu đỏ.'],
        ['And look who came for the holidays: Tèo! He says he knows where it went.', 'Mà con xem ai ra đây chơi kìa: Tèo đó! Bạn ấy bảo biết đèn lồng bay đi đâu.']],
        short: [['Welcome to Hà Nội! A red lantern floated over Hồ Gươm. Tèo is here too, ask him!', 'Chào mừng con đến Hà Nội! Có đèn lồng đỏ bay trên Hồ Gươm. Tèo cũng ở đây, con hỏi bạn ấy nhé!']] },
      tale: ['👩‍🏫🏮', 'Cô Tam', 'You made it to Hà Nội! I am at Văn Miếu with my class. Come and say hello!', 'Con đến Hà Nội rồi! Cô đang ở Văn Miếu với lớp. Lại đây chào cô nhé!'] },
    { id: 'c2_teo', icon: '🧒', en: 'Take up Tèo\'s challenge', vi: 'Nhận lời thách đấu của Tèo', at: 'teo2', game: ['oanquan'], gameLittle: ['oantuti'],
      challenge: { big: ['I am the Ô ăn quan champion of Hà Nội! Beat me and I will tell you where the lantern went.', 'Tớ là vô địch Ô ăn quan của Hà Nội đó! Thắng tớ thì tớ chỉ chỗ đèn lồng cho.'],
        little: ['Oẳn tù tì! Rock, paper, scissors! Play with me and I will tell you a secret.', 'Oẳn tù tì, ra cái gì ra cái này! Chơi với tớ rồi tớ kể bí mật cho.'] },
      act_en: 'Beat Tèo at Ô ăn quan', act_vi: 'Thắng Tèo một ván Ô ăn quan', actL_en: 'Play Oẳn tù tì with Tèo', actL_vi: 'Chơi Oẳn tù tì với Tèo',
      tale: ['🧒🪨', 'Tèo', 'Hey, it is me, Tèo! I came to Hà Nội for Trung Thu. I am the best player here. Bet you cannot beat me!', 'Ê, tớ Tèo đây! Tớ ra Hà Nội chơi Trung Thu. Ở đây tớ chơi giỏi nhất đó. Cá là bạn không thắng nổi tớ!'],
      taleLittle: ['🧒🏮', 'Tèo', 'Hello! I am Tèo. I came to Hà Nội for Trung Thu. Come and play with me!', 'Chào bạn! Tớ là Tèo. Tớ ra Hà Nội chơi Trung Thu. Lại đây chơi với tớ nào!'] },
    { id: 'c2_job', icon: '🍲', en: 'Help Bà Lan at the bún chả stall', vi: 'Giúp Bà Lan ở quán bún chả', at: 'bunca', job: true, big: true,
      act_en: 'Fan the grill and carry the bowls for Bà Lan', act_vi: 'Quạt bếp và bưng bát giúp Bà Lan',
      tale: ['🧒😄', 'Tèo', 'Wow, you are really good! Sorry I showed off. Friends? Bà Lan at the bún chả stall needs help. Let us help her together!', 'Oa, bạn giỏi thật đó! Xin lỗi vì tớ khoe khoang nha. Mình làm bạn nhé? Bà Lan ở quán bún chả đang cần giúp, mình cùng giúp bà đi!'] },
    { id: 'c2_vanmieu', icon: '📚', en: 'Cô Tam\'s lesson at Văn Miếu', vi: 'Học cùng Cô Tam ở Văn Miếu', at: 'tam2', lesson: true,
      act_en: 'Count the stone turtles at Văn Miếu with Cô Tam', act_vi: 'Đếm rùa đá ở Văn Miếu cùng Cô Tam',
      tale: ['🍲😊', 'Bà Lan', 'Thank you, little helpers! Cô Tam is waiting at Văn Miếu. She has a lesson for you.', 'Cảm ơn các cháu giỏi giang! Cô Tam đang chờ ở Văn Miếu. Cô có một bài học cho các cháu đó.'],
      taleLittle: ['🧒😄', 'Tèo', 'You are good! Friends? Cô Tam is at Văn Miếu, the oldest school in Vietnam. Let us go!', 'Bạn giỏi quá! Mình làm bạn nhé? Cô Tam đang ở Văn Miếu, ngôi trường xưa nhất Việt Nam. Mình đi thôi!'] },
    { id: 'c2_tale', icon: '📖', en: 'Hear Bà Năm tell the story of Hồ Gươm', vi: 'Nghe Bà Năm kể Sự tích Hồ Gươm', at: 'nam2', tale_id: 'hoguom',
      talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'], lines: [['Come and sit, {name}. Here is the story of the lake with the red bridge, Hồ Gươm.', 'Lại đây ngồi nào, {name}. Bà kể con nghe Sự tích Hồ Gươm, cái hồ có cây cầu đỏ.']] },
      tale: ['👩‍🏫🐢', 'Cô Tam', 'Well counted! Bà Năm came to Hà Nội for Trung Thu too. She is sitting by Hồ Gươm. Ask her for its story!', 'Đếm giỏi lắm! Bà Năm cũng ra Hà Nội đón Trung Thu. Bà đang ngồi bên Hồ Gươm. Con nhờ bà kể chuyện nhé!'] },
    { id: 'c2_find', icon: '🐢', en: 'Find the lantern by Hồ Gươm', vi: 'Tìm đèn lồng bên Hồ Gươm', at: 'clues', find: true, clues: 3,
      act_en: 'Look by Hồ Gươm: where does the old turtle rest?', act_vi: 'Tìm bên Hồ Gươm: chú rùa già nghỉ ở đâu?',
      actL_en: 'Follow your friend\'s light to the lantern', actL_vi: 'Đi theo ánh sáng của bạn đồng hành đến đèn lồng',
      tale: ['👵🐢', 'Bà Năm', 'The golden turtle keeps lost things safe in Hồ Gươm. Look for the lantern where the old turtle rests, by the lake!', 'Rùa Vàng giữ gìn những thứ bị lạc ở Hồ Gươm. Con tìm đèn lồng ở chỗ chú rùa già nghỉ, bên bờ hồ nhé!'],
      taleLittle: ['✨🏮', 'Bà Năm', 'Your friend has learned a new trick: it can light the way! Follow its light to the lantern.', 'Bạn đồng hành của con vừa học được trò mới: soi đường! Con đi theo ánh sáng của bạn ấy đến chỗ đèn lồng nhé.'] },
    { id: 'c2_hang', icon: '🌉', en: 'Hang the lantern on Cầu Thê Húc', vi: 'Treo đèn lồng trên Cầu Thê Húc', at: 'bridge', hang: true,
      tale: ['🏮✨', '{companion}', 'We found it! Cầu Thê Húc is sleeping in the mist. Let us hang the lantern and wake it up for Trung Thu!', 'Tìm thấy rồi! Cầu Thê Húc đang ngủ trong sương. Mình treo đèn lồng lên để đánh thức cây cầu đón Trung Thu nhé!'] }
  ] }
];

// The story films (played in the tale theatre, scripts in js/content/films.js; {name} = the child)
export const STORY_TALES = {
  lantern_prologue: { id: 'lantern_prologue', flag: '🏮', title: ['The Lanterns Blow Away', 'Đèn Lồng Bay Mất'], pages: [
    ['🏮🌳', 'The night before the great lantern festival, the magic lanterns of Sparkle Valley glowed on the old banyan tree.', 'Đêm trước lễ hội đèn lồng lớn, những chiếc đèn lồng thần kỳ của Thung Lũng Lấp Lánh sáng rực trên cây đa cổ thụ.'],
    ['☁️💨🏮', 'Whoosh! Mây Cau Có huffed and puffed, and the wind carried every lantern far away, over Vietnam and Australia.', 'Vù vù! Đám mây khó tính Mây Cau Có phồng má thổi mạnh, gió cuốn hết đèn lồng bay thật xa, qua Việt Nam và nước Úc.'],
    ['🦉🧒', 'Ông Cú hooted: "Little explorer, will you bring our lanterns home? Choose a friend to fly with you!"', 'Ông Cú nói: "Nhà thám hiểm nhỏ ơi, con giúp mang đèn lồng về nhà nhé? Hãy chọn một người bạn bay cùng con!"']] },
  lantern_ch1: { id: 'lantern_ch1', flag: '🏮', title: ['The Lantern of Lotus Village', 'Đèn Lồng Làng Sen'], pages: [
    ['🏯🏮', 'Up went the lantern on the đình. It glowed warm and red, and the morning mist lifted from Lotus Village.', 'Chiếc đèn lồng được treo lên đình. Đèn sáng ấm áp màu đỏ, và màn sương sớm tan khỏi Làng Sen.'],
    ['🥁🎆', 'That night Lotus Village held its festival: drums, games and lanterns everywhere. One lantern is home. Many more to find!', 'Đêm đó Làng Sen mở hội: tiếng trống, trò chơi và đèn lồng khắp nơi. Một chiếc đèn đã về nhà. Còn nhiều chiếc nữa đang chờ!']] },
  lantern_ch2: { id: 'lantern_ch2', flag: '🏮', title: ['The Lantern of Hà Nội', 'Đèn Lồng Hà Nội'], pages: [
    ['🌉🏮', 'Up went the lantern on Cầu Thê Húc. The mist lifted, and the red bridge glowed over Hồ Gươm like a ribbon of light.', 'Chiếc đèn lồng được treo lên Cầu Thê Húc. Sương tan, cây cầu đỏ rực sáng trên Hồ Gươm như một dải lụa ánh sáng.'],
    ['🌕⭐🦁', 'It was Trung Thu! Children carried star lanterns round the lake, the lion danced to the drums, and everyone shared mooncakes under the full moon.', 'Trung Thu đến rồi! Các bạn nhỏ rước đèn ông sao quanh hồ, múa lân theo tiếng trống, và mọi người cùng ăn bánh trung thu dưới trăng rằm.']] }
};

export const COMPANIONS = {
  firefly: { icon: '✨', en: 'Sparkle the firefly', vi: 'Đom đóm Lấp Lánh', name: 'Lấp Lánh' },
  dragon: { icon: '🐉', en: 'Little Dragon', vi: 'Rồng con', name: 'Rồng con' }
};

// what is said during the story's actions ([en, vi]; no names, so the recordings fit every child)
export const STORY_LINES = {
  ribbon: ['You caught a wind ribbon!', 'Con bắt được một dải lụa gió!'],
  ribbonsAll: ['All the wind ribbons! The wind is showing us the way to Lotus Village.', 'Đủ hết dải lụa gió rồi! Gió đang chỉ đường cho mình đến Làng Sen.'],
  leafFrog: ['Just a little frog! Try another leaf.', 'Chỉ là một chú ếch nhỏ! Con thử lá khác nhé.'],
  leafFound: ['There it is! The lantern was hiding under the leaf.', 'Đây rồi! Đèn lồng trốn dưới lá sen.'],
  rope: ['Pull the rope to lift the lantern up!', 'Kéo dây để đưa đèn lồng lên cao!'],
  // chapter 2 (Hà Nội)
  light: ['You found a lantern light!', 'Con tìm được một đốm đèn lồng!'],
  lightsAll: ['All the lights! They are showing us the way to Hà Nội.', 'Đủ hết đốm sáng rồi! Các đốm sáng đang chỉ đường cho mình đến Hà Nội.'],
  fan: ['Hold the fan button to fan the grill!', 'Giữ nút quạt để quạt bếp than nhé!'],
  grilled: ['Smells good! Now carry the bowls to the tables.', 'Thơm quá! Giờ con bưng bát ra bàn nhé.'],
  bowl: ['One bowl on the table!', 'Một bát lên bàn rồi!'],
  jobDone: ['Thank you, little helpers! Everyone loves bún chả.', 'Cảm ơn các cháu! Ai cũng thích bún chả.'],
  lessonStart: ['These stone turtles have stood at Văn Miếu for hundreds of years. Tap each one and we will count them together!', 'Những chú rùa đá này đứng ở Văn Miếu hàng trăm năm rồi. Con chạm vào từng chú, mình cùng đếm nhé!'],
  countAsk: ['How many stone turtles did we count?', 'Mình đếm được bao nhiêu chú rùa đá?'],
  countAgain: ['Let us count them again, slowly.', 'Mình đếm lại thật chậm nhé.'],
  countLittle: ['Three stone turtles! Well done!', 'Ba chú rùa đá! Giỏi lắm!'],
  word: ['Five! Well done! Here is a word to learn: học means learn. At Văn Miếu, people came to học.', 'Năm! Giỏi lắm! Cô dạy con một chữ nhé: học. Ngày xưa mọi người đến Văn Miếu để học.'],
  fish: ['Just a little fish saying hello! Look somewhere else.', 'Chỉ là một chú cá nhỏ chào con thôi! Con tìm chỗ khác nhé.'],
  clueFound: ['There it is! The lantern was resting by the old stone turtle.', 'Đây rồi! Đèn lồng đang nghỉ bên chú rùa đá già.'],
  lead: ['Follow me! I will light the way.', 'Đi theo mình nào! Mình sẽ soi đường cho.'],
  trick: ['I learned a new trick: I can light the way!', 'Mình học được trò mới: mình biết soi đường rồi!'],
  parade: ['Look! The Trung Thu parade is going round the lake. Walk with them!', 'Nhìn kìa! Đoàn rước đèn Trung Thu đang đi quanh hồ. Con đi cùng các bạn nhé!'],
  secret: ['A golden turtle! It only comes up for very kind helpers. Here is a sticker for your book.', 'Rùa Vàng kìa! Rùa chỉ nổi lên chào những bạn tốt bụng thôi. Tặng con một hình dán nhé.']
};
// numbers for counting, said in both languages
export const COUNT = [['One', 'Một'], ['Two', 'Hai'], ['Three', 'Ba'], ['Four', 'Bốn'], ['Five', 'Năm']];
