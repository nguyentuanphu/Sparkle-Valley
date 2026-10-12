// The clothes shop and wardrobe (round S, owner plan 8 Oct: Round R Part 2 item 6). Pure data and rules, no DOM, so the
// unit tests can read it (tests/unit/shop.test.mjs) and js/avatar.js can draw what a child wears.
//   slots     hat, neck, top, bottom, feet, back (look.hat … look.back hold an item id, or 'none')
//   for       'g' (girls), 'b' (boys), 'both': about twice the old choice for each (owner: "about 2x for boys and girls")
//   tier      small, nice, special: a nice thing costs about one day of play (owner: "about one day of play for a nice item")
// Hats and backs keep the old ids (cap, bow, wings, cape…), so a child who already wears one keeps it. Game coins only.

// about what a child earns in a day of play, in coins (xu): a few games (5–25 each), a shrine (20), the daily gift (15)
export const DAY_COINS = 70;
export const TIERS = { small: .4, nice: 1, special: 1.7 };
export const priceOf = it => Math.max(5, Math.round(DAY_COINS * (TIERS[it && it.tier] || 1) / 5) * 5);

export const SLOTS = [
  { id: 'hat', icon: '👒', en: 'Hats and nón', vi: 'Mũ và nón' },
  { id: 'neck', icon: '📿', en: 'Necklaces', vi: 'Vòng cổ' },
  { id: 'top', icon: '👕', en: 'Tops', vi: 'Áo' },
  { id: 'bottom', icon: '👖', en: 'Shorts, trousers and skirts', vi: 'Quần và váy' },
  { id: 'feet', icon: '👟', en: 'Shoes and sandals', vi: 'Giày và dép' },
  { id: 'back', icon: '🪽', en: 'On the back', vi: 'Sau lưng' }
];

// shape: how js/avatar.js draws it (and how the shop draws its picture); color, trim: its colours
const I = (id, slot, shape, color, tier, f, en, vi, trim) => ({ id, slot, shape, color, tier, for: f, en, vi, trim });
export const CLOTHES = [
  // hats and nón (the first six were free in the old wardrobe: a child who wears one keeps it)
  I('cap', 'hat', 'cap', '#e8434a', 'small', 'b', 'Red cap', 'Mũ lưỡi trai đỏ'),
  I('bow', 'hat', 'bow', '#ff5fa2', 'small', 'g', 'Hair bow', 'Nơ cài tóc'),
  I('flower', 'hat', 'flower', '#ff7eb8', 'small', 'g', 'Flower clip', 'Kẹp hoa'),
  I('bunny', 'hat', 'bunny', '#ffffff', 'nice', 'both', 'Bunny ears', 'Tai thỏ'),
  I('nonla', 'hat', 'nonla', '#ecd9a0', 'nice', 'both', 'Nón lá', 'Nón lá'),
  I('crown', 'hat', 'crown', '#ffcf3a', 'special', 'both', 'Golden crown', 'Vương miện vàng'),
  I('beanie', 'hat', 'beanie', '#3b6fe0', 'small', 'b', 'Woolly beanie', 'Mũ len', '#ffffff'),
  I('bucket', 'hat', 'bucket', '#7fb069', 'nice', 'b', 'Bucket hat', 'Mũ tai bèo'),
  I('dino', 'hat', 'dino', '#5fd39a', 'special', 'b', 'Dinosaur hood', 'Mũ khủng long', '#ffd23f'),
  I('sunhat', 'hat', 'sunhat', '#f2d38a', 'nice', 'g', 'Straw sun hat', 'Mũ rơm đi nắng', '#ff7eb8'),
  I('tiara', 'hat', 'tiara', '#d8dde3', 'special', 'g', 'Sparkly tiara', 'Vương miện lấp lánh', '#a66bff'),
  I('catears', 'hat', 'catears', '#3b2618', 'nice', 'both', 'Cat ears', 'Tai mèo', '#ffb3cf'),
  // necklaces
  I('pearls', 'neck', 'beads', '#fff8ee', 'nice', 'g', 'Pearl necklace', 'Vòng ngọc trai'),
  I('heart', 'neck', 'locket', '#ffcf3a', 'nice', 'g', 'Heart locket', 'Mặt dây trái tim', '#ff5fa2'),
  I('lei', 'neck', 'lei', '#ff9f43', 'small', 'both', 'Flower garland', 'Vòng hoa', '#ffd23f'),
  I('shells', 'neck', 'beads', '#f6c7a5', 'small', 'b', 'Shell necklace', 'Vòng vỏ sò'),
  I('medal', 'neck', 'medal', '#ffcf3a', 'special', 'b', 'Gold medal', 'Huy chương vàng', '#3b6fe0'),
  I('scarf', 'neck', 'scarf', '#e8434a', 'small', 'both', 'Warm scarf', 'Khăn quàng ấm', '#ffffff'),
  // tops
  I('tee_red', 'top', 'tee', '#e8434a', 'small', 'b', 'Red T-shirt', 'Áo phông đỏ'),
  I('tee_stripe', 'top', 'tee', '#3b6fe0', 'nice', 'b', 'Sailor stripes', 'Áo sọc thủy thủ', '#ffffff'),
  I('footy', 'top', 'tee', '#5fd39a', 'nice', 'b', 'Footy jersey', 'Áo đá bóng', '#ffd23f'),
  I('hoodie_green', 'top', 'hoodie', '#5fa860', 'nice', 'b', 'Green hoodie', 'Áo nỉ xanh lá'),
  I('aodai_blue', 'top', 'aodai', '#3b6fe0', 'special', 'b', 'Blue áo dài', 'Áo dài xanh'),
  I('baba', 'top', 'tunic', '#2b2238', 'nice', 'both', 'Áo bà ba', 'Áo bà ba'),
  I('overalls_denim', 'top', 'overalls', '#4f7fc4', 'nice', 'both', 'Denim overalls', 'Quần yếm bò'),
  I('tee_pink', 'top', 'tee', '#ff7eb8', 'small', 'g', 'Pink T-shirt', 'Áo phông hồng'),
  I('dress_yellow', 'top', 'dress', '#ffd23f', 'nice', 'g', 'Sunny dress', 'Váy vàng nắng', '#ffffff'),
  I('dress_purple', 'top', 'dress', '#a66bff', 'nice', 'g', 'Purple party dress', 'Váy tím dự tiệc', '#ffd23f'),
  I('hoodie_purple', 'top', 'hoodie', '#b48cff', 'nice', 'g', 'Purple hoodie', 'Áo nỉ tím'),
  I('aodai_pink', 'top', 'aodai', '#ff5fa2', 'special', 'g', 'Pink áo dài', 'Áo dài hồng'),
  // shorts, trousers and skirts
  I('shorts_navy', 'bottom', 'shorts', '#2f3a5a', 'small', 'b', 'Navy shorts', 'Quần soóc xanh đậm'),
  I('shorts_khaki', 'bottom', 'shorts', '#c9a66b', 'small', 'b', 'Explorer shorts', 'Quần soóc thám hiểm'),
  I('jeans', 'bottom', 'pants', '#4f7fc4', 'nice', 'both', 'Jeans', 'Quần bò'),
  I('pants_white', 'bottom', 'pants', '#ffffff', 'nice', 'both', 'White áo dài trousers', 'Quần trắng mặc áo dài'),
  I('pants_red', 'bottom', 'pants', '#c62828', 'nice', 'b', 'Red trousers', 'Quần đỏ'),
  I('skirt_pink', 'bottom', 'skirt', '#ff7eb8', 'small', 'g', 'Pink skirt', 'Chân váy hồng'),
  I('tutu', 'bottom', 'skirt', '#e9d6ff', 'nice', 'g', 'Ballet tutu', 'Váy múa ba lê'),
  I('leggings', 'bottom', 'pants', '#a66bff', 'small', 'g', 'Purple leggings', 'Quần tất tím'),
  // shoes and sandals
  I('sneakers_red', 'feet', 'shoe', '#e8434a', 'small', 'b', 'Red sneakers', 'Giày thể thao đỏ'),
  I('sneakers_blue', 'feet', 'shoe', '#3cc7e8', 'small', 'b', 'Blue sneakers', 'Giày thể thao xanh'),
  I('dep', 'feet', 'sandal', '#7a4a35', 'small', 'both', 'Dép (sandals)', 'Dép quai hậu'),
  I('boots', 'feet', 'boot', '#ffd23f', 'nice', 'both', 'Rain boots', 'Ủng đi mưa'),
  I('maryjane', 'feet', 'shoe', '#ff5fa2', 'nice', 'g', 'Shiny shoes', 'Giày búp bê'),
  I('sandal_pink', 'feet', 'sandal', '#ff9ac8', 'small', 'g', 'Pink sandals', 'Dép hồng'),
  // on the back (wings and the cape were free before: a child who wears one keeps it)
  I('wings', 'back', 'wings', '#e9d6ff', 'nice', 'g', 'Fairy wings', 'Cánh tiên'),
  I('cape', 'back', 'cape', '#e8332a', 'nice', 'b', 'Hero cape', 'Áo choàng anh hùng'),
  I('butterfly', 'back', 'wings', '#ffb347', 'special', 'g', 'Butterfly wings', 'Cánh bướm'),
  I('dragon', 'back', 'dragonwings', '#5fbf4a', 'special', 'b', 'Dragon wings', 'Cánh rồng'),
  I('backpack', 'back', 'backpack', '#ff9f43', 'small', 'both', 'Little backpack', 'Ba lô nhỏ', '#ffd23f'),
  I('shell', 'back', 'shell', '#5fa860', 'nice', 'both', 'Turtle shell', 'Mai rùa', '#a0724a'),
  // (owner, 12 Oct: tester rewards) earned only by testers (js/testerrewards.js), never sold in the shop
  { ...I('sleuthhat', 'hat', 'sleuth', '#8a6a3a', 'special', 'both', 'Bug hunter hat (with a magnifying glass)', 'Mũ săn bọ (có kính lúp)', '#7fd3ff'), tester: true },
  { ...I('ladypack', 'back', 'backpack', '#e8332a', 'special', 'both', 'Ladybird backpack', 'Ba lô bọ rùa', '#2b2238'), tester: true },
  { ...I('sleuthcape', 'back', 'cape', '#6a4a8a', 'special', 'both', 'Detective cape', 'Áo choàng thám tử'), tester: true }
];
export const ITEM = Object.fromEntries(CLOTHES.map(x => [x.id, x]));
export const itemIn = (slot, id) => { const x = ITEM[id]; return x && x.slot === slot ? x : null; };
export const forSlot = slot => CLOTHES.filter(x => x.slot === slot && !x.tester); // (tester rewards are not sold)

// the two default outfits (owner: "only 2 default outfits, boy and girl"); hair is chosen when the character is made
export const DEFAULT_OUTFITS = {
  girl: { style: 'dress', color: '#ff5fa2', hat: 'none', neck: 'none', top: 'none', bottom: 'none', feet: 'none', back: 'none' },
  boy: { style: 'shirt', color: '#3b6fe0', hat: 'none', neck: 'none', top: 'none', bottom: 'none', feet: 'none', back: 'none' }
};
export const outfitOf = look => Object.keys(DEFAULT_OUTFITS).find(k => { const o = DEFAULT_OUTFITS[k]; return look && look.style === o.style && look.color === o.color; }) || null;

// ---------- what a child owns ----------
// profile.owned.clothes: the ids bought (or worn when the shop came: owner "existing players keep everything they wear")
const worn = look => SLOTS.map(s => look && look[s.id]).filter(id => id && id !== 'none' && ITEM[id]);
export function adoptWorn(p) {
  const o = p.owned = p.owned && typeof p.owned === 'object' ? p.owned : {};
  if (!Array.isArray(o.clothes)) o.clothes = [];
  for (const id of worn(p.look)) if (!o.clothes.includes(id)) o.clothes.push(id);
  return o.clothes;
}
// (a hat won another way, e.g. the crown for finishing every quest, is in owned.hats and counts too)
export const owns = (p, id) => !!p && !!p.owned && ((p.owned.clothes || []).includes(id) || (ITEM[id] && ITEM[id].slot === 'hat' && (p.owned.hats || []).includes(id)));
// buy: { ok, why: 'owned' | 'coins' | 'unknown', price }; the caller takes the coins (G.addCoins(-price)) and saves
export function buy(p, coins, id) {
  const it = ITEM[id]; if (!it) return { ok: false, why: 'unknown', price: 0 };
  const price = priceOf(it); adoptWorn(p);
  if (owns(p, id)) return { ok: false, why: 'owned', price };
  if (!(coins >= price)) return { ok: false, why: 'coins', price };
  p.owned.clothes.push(id); return { ok: true, price };
}
// put an owned thing on (or take the slot off with 'none'); a top hides the old outfit's own top until it is taken off
export function wear(p, slot, id) {
  if (!SLOTS.some(s => s.id === slot)) return false;
  if (id !== 'none' && !(itemIn(slot, id) && owns(p, id))) return false;
  p.look[slot] = id; return true;
}
// what js/avatar.js draws for a look: the item for each slot, or null
// (Round U, owner 11 Oct: "clothes should be as per gender, not unisex") a child's set: the one chosen when the character
// was made (look.set), or read from the starting outfit; the shop shows that set and the things for both first
export const setOf = look => (look && (look.set || outfitOf(look))) || (look && look.style === 'dress' ? 'girl' : 'boy');
export const forSet = (it, set) => !it || it.for === 'both' || it.for === (set === 'girl' ? 'g' : 'b');
export const wearing = look => Object.fromEntries(SLOTS.map(s => [s.id, itemIn(s.id, look && look[s.id])]));
