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
// by js/content/chapter2hanoi.js; its words by js/content/chapter2text.js; its festival film is in js/content/chapter2films.js.
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
  // (its words: js/content/chapter2text.js, loaded with chapter 2's places so the valley starts no slower: PERF-001)
  { id: 'ch2', en: 'Hà Nội', vi: 'Hà Nội', landmark: 'thehuc', keepsake: 'lantern_ch2', reward: 40, trick: 'light', steps: [
    { id: 'c2_fly', icon: '🏮', en: 'Fly to Hà Nội with your friend', vi: 'Cùng bạn đồng hành bay đến Hà Nội', at: 'hanoi', visit: 'hanoi', lights: 3 },
    { id: 'c2_tam', icon: '👩‍🏫', en: 'Say hello to Cô Tam at Văn Miếu', vi: 'Chào Cô Tam ở Văn Miếu', at: 'tam2', big: true, talk: { who: 'Cô Tam', label: ['Say hello', 'Chào cô'] } },
    { id: 'c2_teo', icon: '🧒', en: 'Take up Tèo\'s challenge', vi: 'Nhận lời thách đấu của Tèo', at: 'teo2', game: ['oanquan'], gameLittle: ['oantuti'], challenge: {} },
    { id: 'c2_job', icon: '🍲', en: 'Help Bà Lan at the bún chả stall', vi: 'Giúp Bà Lan ở quán bún chả', at: 'bunca', job: true, big: true },
    { id: 'c2_vanmieu', icon: '📚', en: 'Cô Tam\'s lesson at Văn Miếu', vi: 'Học cùng Cô Tam ở Văn Miếu', at: 'tam2', lesson: true },
    { id: 'c2_tale', icon: '📖', en: 'Hear Bà Năm tell the story of Hồ Gươm', vi: 'Nghe Bà Năm kể Sự tích Hồ Gươm', at: 'nam2', tale_id: 'hoguom', talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'] } },
    { id: 'c2_find', icon: '🐢', en: 'Find the lantern by Hồ Gươm', vi: 'Tìm đèn lồng bên Hồ Gươm', at: 'clues', find: true, clues: 3 },
    { id: 'c2_hang', icon: '🌉', en: 'Hang the lantern on Cầu Thê Húc', vi: 'Treo đèn lồng trên Cầu Thê Húc', at: 'bridge', hang: true }
  ] },
  // (its words: js/content/chapter3text.js; its places: js/content/chapter3sydney.js; owner's go 10 Oct)
  { id: 'ch3', en: 'Sydney', vi: 'Sydney', landmark: 'opera', keepsake: 'lantern_ch3', reward: 40, trick: 'higher', steps: [
    { id: 'c3_fly', icon: '🏮', en: 'Fly to Sydney with your friend', vi: 'Cùng bạn đồng hành bay đến Sydney', at: 'sydney', visit: 'sydney', lights: 3 },
    { id: 'c3_chi', icon: '👧', en: 'Meet Chi in Sydney', vi: 'Gặp Chi ở Sydney', at: 'chi3', big: true, talk: { who: 'Chi', label: ['Say hello', 'Chào bạn'] } },
    { id: 'c3_words', icon: '💬', en: 'Learn Aussie words with Chi', vi: 'Học từ tiếng Úc cùng Chi', at: 'chi3', words: true },
    { id: 'c3_ferry', icon: '⛴️', en: 'Help Captain Molly with the ferries', vi: 'Giúp thuyền trưởng Molly đưa phà', at: 'molly', game: ['ferries'], big: true },
    { id: 'c3_jack', icon: '🏏', en: 'Play with Jack and Ruby', vi: 'Chơi với Jack và Ruby', at: 'jack3', game: ['cricket'], gameLittle: ['tug'], challenge: {} },
    { id: 'c3_tale', icon: '📖', en: 'Hear Bà Năm tell The Magic Pudding', vi: 'Nghe Bà Năm kể chuyện Chiếc bánh pudding thần kỳ', at: 'nam3', tale_id: 'magicpudding', talk: { who: 'Bà Năm', label: ['Listen to the story', 'Nghe kể chuyện'] } },
    { id: 'c3_find', icon: '🔭', en: 'Find the lantern by the harbour', vi: 'Tìm đèn lồng bên bến cảng', at: 'clues3', find: true, clues: 3 },
    { id: 'c3_hang', icon: '🎭', en: 'Hang the lantern at the Opera House', vi: 'Treo đèn lồng ở Nhà hát Opera', at: 'opera', hang: true }
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
    ['🥁🎆', 'That night Lotus Village held its festival: drums, games and lanterns everywhere. One lantern is home. Many more to find!', 'Đêm đó Làng Sen mở hội: tiếng trống, trò chơi và đèn lồng khắp nơi. Một chiếc đèn đã về nhà. Còn nhiều chiếc nữa đang chờ!']] }
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
  rope: ['Pull the rope to lift the lantern up!', 'Kéo dây để đưa đèn lồng lên cao!']
};
