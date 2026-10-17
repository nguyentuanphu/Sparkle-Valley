// Story Helpers (owner, 18 Oct 2026 AEDT: "read story then ask kid to resolve puzzle or work on something, eg in a house
// or garden move a broom to where, put dishes to where, depends on the context, then move on, read, and more
// interactive"; for 5 to 8 and also 2 to 5). Six stories; each page is read aloud (each word lit as it is said), then
// the child helps in the picture: puts things where they belong (put), finds who is hiding (find) or, from 5, puts what
// happened in order (order). js/games/storyhelp.ts plays them; the Reading corner lists the game (js/games/readingmenu.js).
// Spots are where things go in the scene: a drawn shape (cupboard, sink, table…) or a picture, at x, y (per cent of the
// scene, their middle). Every picture has its drawing in js/art.js.

export type Two = [string, string];
export type SpotKind = 'cupboard' | 'sink' | 'shelf' | 'table' | 'line' | 'door' | 'pond' | 'soil' | 'pic';
export interface Spot { id: string; kind: SpotKind; pic?: string; word: Two; x: number; y: number }
export interface Thing { pic: string; word: Two; to: string }
export type Task =
  | { kind: 'put'; say: Two; things: Thing[]; more?: Thing[] }          // more: also for 5 to 8
  | { kind: 'find'; say: Two; hide: string; found: Two; at: string; spots: string[] }
  | { kind: 'order'; say: Two; steps: { pic: string; word: Two }[] };
export interface Page { pics: string; text: Two; task: Task; older?: Task } // older: instead of task, for 5 to 8
export interface Story { id: string; icon: string; title: Two; scene: 'house' | 'kitchen' | 'garden' | 'yard' | 'farm'; spots: Spot[]; pages: Page[] }

const S = (id: string, kind: SpotKind, word: Two, x: number, y: number, pic?: string): Spot => ({ id, kind, word, x, y, pic });
const t = (pic: string, word: Two, to: string): Thing => ({ pic, word, to });

export const STORIES: Story[] = [
  { id: 'tidy', icon: '🧸', title: ['Tidy-up Day', 'Ngày Dọn Dẹp'], scene: 'house',
    spots: [S('box', 'pic', ['toy box', 'hộp đồ chơi'], 18, 66, '📦'), S('shelf', 'shelf', ['shelf', 'kệ sách'], 48, 26), S('basket', 'pic', ['basket', 'cái giỏ'], 80, 70, '🧺'),
      S('bed', 'pic', ['bed', 'giường'], 74, 34, '🛏️'), S('door', 'door', ['door', 'cửa'], 92, 40)],
    pages: [
      { pics: '🏠 🧸', text: ['Today is tidy-up day! Mai looks at her messy room.', 'Hôm nay là ngày dọn dẹp! Mai nhìn căn phòng bừa bộn.'],
        task: { kind: 'put', say: ['Put the toys in the toy box.', 'Con cất đồ chơi vào hộp đồ chơi nhé.'], things: [t('🧸', ['teddy', 'gấu bông'], 'box'), t('⚽', ['ball', 'quả bóng'], 'box')], more: [t('🧩', ['puzzle', 'đồ xếp hình'], 'box')] } },
      { pics: '📚', text: ['Next, the books go back on the shelf.', 'Tiếp theo, sách được xếp lại lên kệ.'],
        task: { kind: 'put', say: ['Put the books on the shelf.', 'Con xếp sách lên kệ nhé.'], things: [t('📚', ['books', 'sách'], 'shelf')], more: [t('🖍️', ['crayons', 'bút màu'], 'shelf')] } },
      { pics: '👕 🧦', text: ['Oh no! Some clothes are on the floor.', 'Ôi! Có quần áo nằm dưới sàn.'],
        task: { kind: 'put', say: ['Put the clothes in the basket, and the shoes by the door.', 'Con bỏ quần áo vào giỏ, còn giày để cạnh cửa nhé.'], things: [t('👕', ['shirt', 'áo'], 'basket')], more: [t('🧦', ['socks', 'tất'], 'basket'), t('👟', ['shoes', 'giày'], 'door')] } },
      { pics: '🐱', text: ['Where is Miu the cat? She is hiding!', 'Mèo Miu đâu rồi? Miu đang trốn!'],
        task: { kind: 'find', say: ['Tap where Miu is hiding.', 'Con chạm vào chỗ Miu đang trốn nhé.'], hide: '🐱', found: ['Miu was under the bed!', 'Miu trốn dưới gầm giường!'], at: 'bed', spots: ['bed', 'box', 'basket'] } },
      { pics: '🧸 🐱', text: ['The room is clean. Mai gives Miu a big hug.', 'Phòng sạch rồi. Mai ôm Miu thật chặt.'],
        task: { kind: 'put', say: ['Put the teddy on the bed for a rest.', 'Con đặt gấu bông lên giường cho gấu nghỉ nhé.'], things: [t('🧸', ['teddy', 'gấu bông'], 'bed')] },
        older: { kind: 'order', say: ['What did Mai do? Put it in order.', 'Mai đã làm gì? Con xếp theo thứ tự nhé.'], steps: [{ pic: '🧸', word: ['toys', 'đồ chơi'] }, { pic: '📚', word: ['books', 'sách'] }, { pic: '👕', word: ['clothes', 'quần áo'] }] } }
    ] },
  { id: 'dinner', icon: '🍚', title: ['Dinner Time', 'Giờ Ăn Tối'], scene: 'kitchen',
    spots: [S('table', 'table', ['table', 'bàn ăn'], 50, 62), S('sink', 'sink', ['sink', 'bồn rửa'], 16, 46), S('cupboard', 'cupboard', ['cupboard', 'tủ bát'], 84, 34), S('bin', 'pic', ['bin', 'thùng rác'], 90, 76, '🗑️')],
    pages: [
      { pics: '👵 🍳', text: ['Grandma is cooking dinner. It smells yummy!', 'Bà đang nấu cơm tối. Thơm quá!'],
        task: { kind: 'put', say: ['Help set the table: put the bowls and chopsticks on the table.', 'Con giúp dọn bàn: đặt bát và đũa lên bàn nhé.'], things: [t('🥣', ['bowl', 'cái bát'], 'table')], more: [t('🥢', ['chopsticks', 'đôi đũa'], 'table'), t('🥄', ['spoon', 'cái thìa'], 'table')] } },
      { pics: '🍚 🐟 🥬', text: ['Everyone eats rice, fish and vegetables.', 'Cả nhà ăn cơm, cá và rau.'],
        task: { kind: 'put', say: ['Bring the food to the table.', 'Con mang thức ăn lên bàn nhé.'], things: [t('🍚', ['rice', 'cơm'], 'table')], more: [t('🐟', ['fish', 'cá'], 'table'), t('🥬', ['vegetables', 'rau'], 'table')] } },
      { pics: '🥣 🧼', text: ['Dinner is finished. Time to wash the dishes.', 'Ăn xong rồi. Đến lúc rửa bát.'],
        task: { kind: 'put', say: ['Put the dirty dishes in the sink, and the banana peel in the bin.', 'Con bỏ bát bẩn vào bồn rửa, còn vỏ chuối vào thùng rác nhé.'], things: [t('🥣', ['bowl', 'cái bát'], 'sink')], more: [t('🥢', ['chopsticks', 'đôi đũa'], 'sink'), t('🍌', ['banana peel', 'vỏ chuối'], 'bin')] } },
      { pics: '🥣 ✨', text: ['The clean dishes go back in the cupboard.', 'Bát đĩa sạch được cất vào tủ.'],
        task: { kind: 'put', say: ['Put the clean bowl and teapot in the cupboard.', 'Con cất bát sạch và ấm trà vào tủ nhé.'], things: [t('🥣', ['bowl', 'cái bát'], 'cupboard')], more: [t('🫖', ['teapot', 'ấm trà'], 'cupboard')] } },
      { pics: '👵 💖', text: ['Thank you, little helper! Grandma smiles.', 'Cảm ơn con, người giúp việc nhỏ! Bà mỉm cười.'],
        task: { kind: 'put', say: ['Give Grandma a cup of tea at the table.', 'Con mời bà một tách trà ở bàn nhé.'], things: [t('☕', ['tea', 'tách trà'], 'table')] },
        older: { kind: 'order', say: ['What happened first? Put it in order.', 'Việc gì xảy ra trước? Con xếp theo thứ tự nhé.'], steps: [{ pic: '🥢', word: ['set the table', 'dọn bàn'] }, { pic: '🍚', word: ['eat', 'ăn cơm'] }, { pic: '🧼', word: ['wash up', 'rửa bát'] }] } }
    ] },
  { id: 'garden', icon: '🌷', title: ["Grandpa's Garden", 'Khu Vườn Của Ông'], scene: 'garden',
    spots: [S('pot', 'pic', ['flower pot', 'chậu cây'], 20, 66, '🪴'), S('bed', 'soil', ['garden bed', 'luống đất'], 52, 74), S('flower', 'pic', ['flowers', 'hoa'], 52, 50, '🌷'),
      S('basket', 'pic', ['basket', 'cái giỏ'], 84, 72, '🧺'), S('tree', 'pic', ['tree', 'cái cây'], 84, 30, '🌳')],
    pages: [
      { pics: '👴 🌱', text: ['Grandpa and Bin go out to the garden.', 'Ông và Bin ra vườn.'],
        task: { kind: 'put', say: ['Plant the seeds: put them in the flower pot and the garden bed.', 'Con gieo hạt: bỏ hạt vào chậu cây và luống đất nhé.'], things: [t('🌱', ['seeds', 'hạt giống'], 'pot')], more: [t('🌱', ['seeds', 'hạt giống'], 'bed')] } },
      { pics: '🌷 💧', text: ['The flowers are thirsty. Let us water them!', 'Hoa khát nước rồi. Mình tưới hoa nhé!'],
        task: { kind: 'put', say: ['Give the flowers some water.', 'Con tưới nước cho hoa nhé.'], things: [t('💧', ['water', 'nước'], 'flower')], more: [t('💧', ['water', 'nước'], 'pot')] } },
      { pics: '🍅 🥕', text: ['The tomatoes are red and ready to pick.', 'Cà chua đã đỏ, chín rồi.'],
        task: { kind: 'put', say: ['Put the tomatoes and carrots in the basket.', 'Con bỏ cà chua và cà rốt vào giỏ nhé.'], things: [t('🍅', ['tomato', 'quả cà chua'], 'basket')], more: [t('🥕', ['carrot', 'củ cà rốt'], 'basket'), t('🍅', ['tomato', 'quả cà chua'], 'basket')] } },
      { pics: '🐌 🍃', text: ['A little snail is sleeping on a leaf. Where is it?', 'Có chú ốc sên nhỏ ngủ trên lá. Ốc ở đâu nhỉ?'],
        task: { kind: 'find', say: ['Tap where the snail is.', 'Con chạm vào chỗ có ốc sên nhé.'], hide: '🐌', found: ['The snail was on the tree!', 'Ốc sên ở trên cây!'], at: 'tree', spots: ['tree', 'pot', 'basket'] } },
      { pics: '🧺 👵', text: ['Bin brings the basket home to Grandma.', 'Bin mang giỏ rau về cho bà.'],
        task: { kind: 'put', say: ['Put one more carrot in the basket for Grandma.', 'Con bỏ thêm một củ cà rốt vào giỏ cho bà nhé.'], things: [t('🥕', ['carrot', 'củ cà rốt'], 'basket')] },
        older: { kind: 'order', say: ['How does a garden grow? Put it in order.', 'Vườn lớn lên thế nào? Con xếp theo thứ tự nhé.'], steps: [{ pic: '🌱', word: ['plant', 'gieo hạt'] }, { pic: '💧', word: ['water', 'tưới nước'] }, { pic: '🍅', word: ['pick', 'hái quả'] }] } }
    ] },
  { id: 'washing', icon: '👕', title: ['Washing Day', 'Ngày Phơi Đồ'], scene: 'yard',
    spots: [S('line', 'line', ['washing line', 'dây phơi'], 50, 30), S('basket', 'pic', ['basket', 'cái giỏ'], 26, 70, '🧺'), S('door', 'door', ['door', 'cửa'], 88, 44), S('tree', 'pic', ['tree', 'cái cây'], 12, 36, '🌳')],
    pages: [
      { pics: '☀️ 👕', text: ['The sun is out. Mum washes the clothes.', 'Trời nắng. Mẹ giặt quần áo.'],
        task: { kind: 'put', say: ['Hang the clothes on the washing line.', 'Con phơi quần áo lên dây phơi nhé.'], things: [t('👕', ['shirt', 'áo'], 'line')], more: [t('🧦', ['socks', 'tất'], 'line'), t('🧣', ['scarf', 'khăn quàng'], 'line')] } },
      { pics: '⛅ 🌧️', text: ['Oh! Dark clouds are coming. Rain is on the way!', 'Ôi! Mây đen kéo đến. Sắp mưa rồi!'],
        task: { kind: 'put', say: ['Quick! Put the clothes in the basket.', 'Nhanh lên! Con bỏ quần áo vào giỏ nhé.'], things: [t('👕', ['shirt', 'áo'], 'basket')], more: [t('🧦', ['socks', 'tất'], 'basket')] } },
      { pics: '🧺 🏠', text: ['Lan carries the basket inside.', 'Lan mang giỏ vào nhà.'],
        task: { kind: 'put', say: ['Take the basket to the door.', 'Con mang giỏ tới cửa nhé.'], things: [t('🧺', ['basket', 'cái giỏ'], 'door')] } },
      { pics: '☂️', text: ['Splish, splash! Lan needs her umbrella.', 'Lách tách! Lan cần cái ô.'],
        task: { kind: 'find', say: ['Tap where the umbrella is.', 'Con chạm vào chỗ có cái ô nhé.'], hide: '☂️', found: ['The umbrella was by the tree!', 'Cái ô ở cạnh cái cây!'], at: 'tree', spots: ['tree', 'basket', 'door'] } },
      { pics: '🌈 ☀️', text: ['After the rain comes a rainbow. The clothes can dry again!', 'Mưa tạnh, có cầu vồng. Quần áo lại được phơi!'],
        task: { kind: 'put', say: ['Hang the shirt on the line again.', 'Con phơi lại cái áo lên dây nhé.'], things: [t('👕', ['shirt', 'áo'], 'line')] },
        older: { kind: 'order', say: ['What was the weather? Put it in order.', 'Thời tiết thế nào? Con xếp theo thứ tự nhé.'], steps: [{ pic: '☀️', word: ['sunny', 'nắng'] }, { pic: '🌧️', word: ['rain', 'mưa'] }, { pic: '🌈', word: ['rainbow', 'cầu vồng'] }] } }
    ] },
  { id: 'farm', icon: '🐔', title: ['Breakfast on the Farm', 'Bữa Sáng Ở Nông Trại'], scene: 'farm',
    spots: [S('hen', 'pic', ['hen', 'gà mái'], 18, 58, '🐔'), S('cow', 'pic', ['cow', 'con bò'], 46, 40, '🐄'), S('pig', 'pic', ['pig', 'con heo'], 76, 62, '🐷'),
      S('basket', 'pic', ['basket', 'cái giỏ'], 50, 78, '🧺'), S('pond', 'pond', ['pond', 'cái ao'], 86, 30), S('hay', 'pic', ['hay', 'đống rơm'], 14, 28, '🌾')],
    pages: [
      { pics: '☀️ 🐔 🐄', text: ['Good morning, farm! The animals are hungry.', 'Chào buổi sáng, nông trại! Các con vật đói rồi.'],
        task: { kind: 'put', say: ['Give the corn to the hen and the grass to the cow.', 'Con cho gà ăn ngô và cho bò ăn cỏ nhé.'], things: [t('🌽', ['corn', 'ngô'], 'hen')], more: [t('🌾', ['grass', 'cỏ'], 'cow')] } },
      { pics: '🐔 🥚', text: ['The hen has laid eggs. Let us collect them.', 'Gà mái đẻ trứng rồi. Mình nhặt trứng nhé.'],
        task: { kind: 'put', say: ['Put the eggs in the basket, gently!', 'Con nhẹ nhàng bỏ trứng vào giỏ nhé!'], things: [t('🥚', ['egg', 'quả trứng'], 'basket')], more: [t('🥚', ['egg', 'quả trứng'], 'basket'), t('🥚', ['egg', 'quả trứng'], 'basket')] } },
      { pics: '🐷 🍎', text: ['The pig wants his breakfast too. Oink!', 'Chú heo cũng muốn ăn sáng. Ụt ịt!'],
        task: { kind: 'put', say: ['Give the apple and carrot to the pig.', 'Con cho heo ăn táo và cà rốt nhé.'], things: [t('🍎', ['apple', 'quả táo'], 'pig')], more: [t('🥕', ['carrot', 'củ cà rốt'], 'pig')] } },
      { pics: '🦆', text: ['Where did the little duck go?', 'Vịt con đi đâu rồi nhỉ?'],
        task: { kind: 'find', say: ['Tap where the duck is.', 'Con chạm vào chỗ có vịt con nhé.'], hide: '🦆', found: ['The duck was swimming in the pond!', 'Vịt con đang bơi dưới ao!'], at: 'pond', spots: ['pond', 'hay', 'basket'] } },
      { pics: '🐔 🐄 🐷', text: ['All the animals are happy and full.', 'Các con vật đều no và vui.'],
        task: { kind: 'put', say: ['Give the cow one more bunch of grass.', 'Con cho bò thêm một bó cỏ nhé.'], things: [t('🌾', ['grass', 'cỏ'], 'cow')] },
        older: { kind: 'order', say: ['What did we do on the farm? Put it in order.', 'Mình đã làm gì ở nông trại? Con xếp theo thứ tự nhé.'], steps: [{ pic: '🌽', word: ['feed the hen', 'cho gà ăn'] }, { pic: '🥚', word: ['collect eggs', 'nhặt trứng'] }, { pic: '🍎', word: ['feed the pig', 'cho heo ăn'] }] } }
    ] },
  { id: 'tet', icon: '🧧', title: ['Getting Ready for Tết', 'Chuẩn Bị Đón Tết'], scene: 'house',
    spots: [S('cupboard', 'cupboard', ['cupboard', 'cái tủ'], 14, 40), S('vase', 'pic', ['vase', 'bình hoa'], 40, 30, '🏺'), S('table', 'table', ['table', 'cái bàn'], 56, 66),
      S('door', 'door', ['door', 'cửa'], 90, 42)],
    pages: [
      { pics: '🧹 🏠', text: ['Tết is coming! The family cleans the house.', 'Tết sắp đến rồi! Cả nhà dọn dẹp nhà cửa.'],
        task: { kind: 'put', say: ['The floor is swept. Put the broom back in the cupboard.', 'Quét nhà xong rồi. Con cất cây chổi vào tủ nhé.'], things: [t('🧹', ['broom', 'cây chổi'], 'cupboard')], more: [t('🪣', ['bucket', 'cái xô'], 'cupboard')] } },
      { pics: '🌸', text: ['Mum brings home a peach blossom branch.', 'Mẹ mang về một cành hoa đào.'],
        task: { kind: 'put', say: ['Put the peach blossom in the vase.', 'Con cắm hoa đào vào bình nhé.'], things: [t('🌸', ['peach blossom', 'hoa đào'], 'vase')] } },
      { pics: '🏮', text: ['Bin hangs red lanterns by the door.', 'Bin treo đèn lồng đỏ bên cửa.'],
        task: { kind: 'put', say: ['Hang the lanterns by the door.', 'Con treo đèn lồng bên cửa nhé.'], things: [t('🏮', ['lantern', 'đèn lồng'], 'door')], more: [t('🏮', ['lantern', 'đèn lồng'], 'door')] } },
      { pics: '🍌 🍊 🥭', text: ['Grandma puts fruit on the table.', 'Bà bày mâm ngũ quả lên bàn.'],
        task: { kind: 'put', say: ['Put the fruit on the table.', 'Con bày trái cây lên bàn nhé.'], things: [t('🍊', ['orange', 'quả cam'], 'table')], more: [t('🍌', ['bananas', 'nải chuối'], 'table'), t('🥭', ['mango', 'quả xoài'], 'table'), t('🍉', ['watermelon', 'quả dưa hấu'], 'table')] } },
      { pics: '🧧 🎆', text: ['Happy New Year! Grandpa gives lucky red envelopes.', 'Chúc mừng năm mới! Ông lì xì cho các cháu.'],
        task: { kind: 'find', say: ['Tap where the red envelope is.', 'Con chạm vào chỗ có bao lì xì nhé.'], hide: '🧧', found: ['The red envelope was on the table!', 'Bao lì xì ở trên bàn!'], at: 'table', spots: ['table', 'vase', 'cupboard'] },
        older: { kind: 'order', say: ['How did the family get ready for Tết? Put it in order.', 'Cả nhà chuẩn bị Tết thế nào? Con xếp theo thứ tự nhé.'], steps: [{ pic: '🧹', word: ['clean', 'dọn nhà'] }, { pic: '🌸', word: ['flowers', 'cắm hoa'] }, { pic: '🏮', word: ['lanterns', 'treo đèn'] }] } }
    ] }
];
// what the game says between pages ([en, vi]; recorded in the voice pack)
export const HELP_LINES = {
  choose: ['Choose a story to help in!', 'Con chọn một câu chuyện để cùng giúp nhé!'] as Two,
  drag: ['Drag it, or tap it and then tap where it goes.', 'Con kéo, hoặc chạm vào rồi chạm vào chỗ cần đặt nhé.'] as Two,
  notThere: ['Not there. Try another place!', 'Chưa đúng chỗ. Con thử chỗ khác nhé!'] as Two,
  notHere: ['Not here. Look again!', 'Không phải chỗ này. Con tìm lại nhé!'] as Two,
  first: ['Which came first? Tap them in order.', 'Việc nào trước? Con chạm theo thứ tự nhé.'] as Two,
  helped: ['You helped! Let us read on.', 'Con giúp giỏi quá! Mình đọc tiếp nhé.'] as Two,
  end: ['The end. Thank you for helping!', 'Hết truyện. Cảm ơn con đã giúp nhé!'] as Two
};
