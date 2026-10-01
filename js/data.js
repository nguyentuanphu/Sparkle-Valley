// Items, recipes, shop, quests and stickers.
import { T } from './i18n.js';

export const ITEMS = {
  apple: { icon: '🍎', name: () => T('Apple', 'Táo') },
  banana: { icon: '🍌', name: () => T('Banana', 'Chuối') },
  mango: { icon: '🥭', name: () => T('Mango', 'Xoài') },
  rice: { icon: '🌾', name: () => T('Rice', 'Gạo') },
  egg: { icon: '🥚', name: () => T('Egg', 'Trứng') },
  fish: { icon: '🐟', name: () => T('Fish', 'Cá') },
  herb: { icon: '🌿', name: () => T('Herbs', 'Rau thơm') },
  mushroom: { icon: '🍄', name: () => T('Mushroom', 'Nấm') },
  noodles: { icon: '🍜', name: () => T('Rice noodles', 'Bánh phở') },
  leaf: { icon: '🍃', name: () => T('Banana leaf', 'Lá dong') },
  bean: { icon: '🫘', name: () => T('Mung beans', 'Đậu xanh') }
};

// Recipes are checked by the set of ingredients (order does not matter).
// heal = hearts restored, bonus = extra (yellow) stamina wheels.
export const RECIPES = [
  { id: 'pho', icon: '🍲', need: ['noodles', 'herb', 'egg'], name: () => T('Phở noodle soup', 'Phở'), heal: 3, bonus: .5 },
  { id: 'banhchung', icon: '🟩', need: ['rice', 'bean', 'leaf'], name: () => T('Bánh chưng (square rice cake)', 'Bánh chưng'), heal: 3, bonus: 1 },
  { id: 'xoixoai', icon: '🥭', need: ['rice', 'mango'], name: () => T('Mango sticky rice', 'Xôi xoài'), heal: 2, bonus: .5 },
  { id: 'chechuoi', icon: '🍧', need: ['banana', 'bean'], name: () => T('Banana sweet soup', 'Chè chuối'), heal: 2, bonus: .3 },
  { id: 'canhchua', icon: '🥣', need: ['fish', 'herb'], name: () => T('Sour fish soup', 'Canh chua cá'), heal: 2, bonus: .3 },
  { id: 'comchien', icon: '🍳', need: ['rice', 'egg'], name: () => T('Egg fried rice', 'Cơm chiên trứng'), heal: 2, bonus: 0 },
  { id: 'comnam', icon: '🍚', need: ['rice', 'mushroom'], name: () => T('Mushroom rice', 'Cơm nấm'), heal: 2, bonus: 0 },
  { id: 'cakho', icon: '🐟', need: ['fish', 'rice'], name: () => T('Braised fish with rice', 'Cá kho với cơm'), heal: 2, bonus: .2 },
  { id: 'taonuong', icon: '🍎', need: ['apple', 'apple'], name: () => T('Baked apples', 'Táo nướng'), heal: 1, bonus: 0 },
  { id: 'chuoinuong', icon: '🍌', need: ['banana'], name: () => T('Grilled banana', 'Chuối nướng'), heal: 1, bonus: 0 },
  { id: 'nam', icon: '🍢', need: ['mushroom'], name: () => T('Mushroom skewer', 'Nấm xiên nướng'), heal: 1, bonus: 0 },
  { id: 'fruit', icon: '🥗', need: ['apple', 'banana', 'mango'], name: () => T('Rainbow fruit salad', 'Salad trái cây'), heal: 3, bonus: .3 }
];
export const MYSTERY = { id: 'mystery', icon: '🥘', name: () => T('Mystery stew', 'Món hầm bí ẩn'), heal: 1, bonus: 0 };
export function findRecipe(list) {
  const key = list.slice().sort().join('+');
  return RECIPES.find(r => r.need.slice().sort().join('+') === key) || (list.length ? MYSTERY : null);
}

// Shop prices are in xu: 1 xu = 10c = 2.000đ
export const SHOP = [
  { kind: 'item', id: 'banana', price: 5 }, { kind: 'item', id: 'mango', price: 8 }, { kind: 'item', id: 'rice', price: 4 },
  { kind: 'item', id: 'egg', price: 3 }, { kind: 'item', id: 'fish', price: 10 }, { kind: 'item', id: 'noodles', price: 6 },
  { kind: 'item', id: 'bean', price: 4 }, { kind: 'item', id: 'leaf', price: 2 },
  { kind: 'hat', id: 'nonla', price: 30 }, { kind: 'hat', id: 'cap', price: 30 }, { kind: 'hat', id: 'flower', price: 25 },
  { kind: 'hat', id: 'bunny', price: 40 }, { kind: 'hat', id: 'crown', price: 80 },
  { kind: 'glider', id: 1, price: 50 }, { kind: 'glider', id: 2, price: 50 }, { kind: 'glider', id: 3, price: 50 }, { kind: 'glider', id: 4, price: 50 }
];
export const HAT_ICON = { none: '🙂', nonla: '👒', cap: '🧢', crown: '👑', bunny: '🐰', flower: '🌸' };
export const HAT_NAME = { none: () => T('No hat', 'Không đội mũ'), nonla: () => T('Nón lá (leaf hat)', 'Nón lá'), cap: () => T('Cap', 'Mũ lưỡi trai'), crown: () => T('Crown', 'Vương miện'), bunny: () => T('Bunny ears', 'Tai thỏ'), flower: () => T('Flower clip', 'Kẹp hoa') };

// Things to gather around the world (they grow back after a while).
export const GATHER = [
  ['herb', -100, 70], ['herb', -86, 98], ['herb', -120, 84], ['herb', -70, 110], ['mushroom', -95, 60], ['mushroom', -60, -80], ['mushroom', -20, -70], ['mushroom', 30, -90],
  ['herb', 10, -30], ['mushroom', -26, -4], ['egg', 104, 12], ['egg', 98, 16], ['rice', 105, -40], ['rice', 118, -30], ['rice', 100, -28], ['banana', 30, 115],
  ['banana', 80, 150], ['banana', 20, 140], ['fish', 38, 98], ['mango', 140, 60], ['mango', 150, 100], ['leaf', -80, 76], ['bean', 125, -46], ['herb', 70, 20]
];

export const STICKERS = ['🦄', '🌈', '🧁', '🍓', '🐱', '🐶', '🦋', '🦖', '🍭', '🚂', '👑', '🐬', '🐣', '🍉', '🌻', '🚀', '🍦', '🐼', '🦊', '🐸', '🐞', '🌙', '☀️', '🏮', '🐢', '🦜', '🐙', '🪁', '🐉', '🪷'];

// The main adventure. Each quest has a check (true when done) and a place to point at.
export const QUESTS = [
  { id: 'owl', icon: '🦉', title: () => T('Talk to Ông Cú the Owl', 'Nói chuyện với Ông Cú'), at: 'owl' },
  { id: 'tower1', icon: '🗼', title: () => T('Climb the Dawn Tower', 'Leo lên Tháp Bình Minh'), at: 'tw_plateau', check: p => p.towers.tw_plateau },
  { id: 'plateau', icon: '✨', title: () => T('Solve the 3 shrines on the plateau', 'Giải 3 đền trên cao nguyên'), at: 'plateauShrine', check: p => ['sh_pattern', 'sh_count', 'sh_letters'].every(s => p.shrines[s]) },
  { id: 'glider', icon: '🪂', title: () => T('Get the Leaf Glider from Ông Cú', 'Nhận Cánh Lá từ Ông Cú'), at: 'owl', check: p => p.glider },
  { id: 'village', icon: '🏮', title: () => T('Visit Lotus Village', 'Đến thăm Làng Sen'), at: 'village' },
  { id: 'market', icon: '🛒', title: () => T('Help Cô Mai at the market', 'Giúp Cô Mai bán hàng'), at: 'mai' },
  { id: 'cook', icon: '🍲', title: () => T('Cook a dish at a cooking pot', 'Nấu một món ăn'), at: 'pot', check: p => Object.keys(p.dishes).length > 0 },
  { id: 'folk', icon: '🪢', title: () => T('Play a folk game with the village kids', 'Chơi trò dân gian với các bạn'), at: 'kids' },
  { id: 'buffalo', icon: '🐃', title: () => T('Ride a water buffalo', 'Cưỡi trâu'), at: 'buffalo' },
  { id: 'leafies', icon: '🍃', title: () => T('Find 5 hidden Leafies', 'Tìm 5 bạn Lá Lá đang trốn'), at: 'leafy', check: p => Object.keys(p.leafies).length >= 5 },
  { id: 'statue', icon: '🪷', title: () => T('Bring 4 Sparkle Orbs to the Lotus Statue', 'Mang 4 Ngọc Lấp Lánh đến Tượng Sen'), at: 'statue' },
  { id: 'towers', icon: '🗺️', title: () => T('Light up all 4 towers', 'Thắp sáng cả 4 tháp'), at: 'tower', check: p => Object.keys(p.towers).length >= 4 },
  { id: 'shrines', icon: '🌟', title: () => T('Solve all 12 shrines', 'Giải cả 12 đền'), at: 'shrine', check: p => Object.keys(p.shrines).length >= 12 }
];
