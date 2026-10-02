// Food bought at a kiosk, a market stall or from a street seller goes in the backpack ("From shops and
// stalls"). The child can eat it straight away or keep it for later; eating it fills the stamina wheel and
// stamps the food passport. Kept in profile.bought = { vendorId: count }.
import { T } from './i18n.js';
import { VENDORS } from './regions.js';
import { dialog, reward } from './ui.js';
import { farm, saveFarm } from './state.js';
import { say } from './voice.js';
import { SFX } from './audio.js';

export const snackOf = id => VENDORS.find(v => v.id === id);

// pay (or get it as a gift when the purse is empty), put it in the bag, then ask: eat now or keep it?
export async function buyFood(G, h, v, gift = ['Here, this one is a gift!', 'Thôi, cái này tặng con đó!']) {
  const p = h.profile, price = v.food[3];
  if (farm.coins >= price) { farm.coins -= price; saveFarm(); } else say(gift[0], gift[1]);
  SFX.chime();
  p.bought = p.bought || {}; p.bought[v.id] = (p.bought[v.id] || 0) + 1; G.save();
  const k = await dialog(v.name, [[`Here you are: ${v.food[1]}! I put it in your bag.`, `Của con đây: ${v.food[2]}! Bỏ vào túi cho con rồi nhé.`]],
    [['😋 Eat it now', '😋 Ăn liền'], ['🎒 Keep it in my bag', '🎒 Để dành trong túi']]);
  if (k === 0) return eatSnack(G, h, v.id);
  G.toast && G.toast(h, `🎒 +1 ${v.food[0]} ${T(v.food[1], v.food[2])}`);
  say('Saved for later!', 'Để dành ăn sau nhé!');
}

// eat one from the bag. quiet: from the backpack screen (a toast instead of the big reward card)
export async function eatSnack(G, h, id, quiet = false) {
  const p = h.profile, v = snackOf(id); if (!v || !(p.bought && p.bought[id] > 0)) return;
  p.bought[id]--; if (p.bought[id] <= 0) delete p.bought[id];
  h.bonusStamina = Math.max(h.bonusStamina || 0, 1); h.stamina = (p.staminaMax || 1) + h.bonusStamina; h.exhausted = false; h.cheerT = 1.2; // one extra stamina wheel
  p.tasted = p.tasted || {}; const first = !p.tasted[id]; p.tasted[id] = true; G.save();
  const sub = first ? T('A new taste for your food passport! Full of energy.', 'Món mới trong hộ chiếu ẩm thực! Tràn đầy năng lượng.') : T('Full of energy!', 'Tràn đầy năng lượng!');
  if (quiet) { SFX.ok(); say(`Yum yum! ${v.food[1]}!`, `Măm măm! ${v.food[2]}!`); G.toast && G.toast(h, `${v.food[0]} ${sub}`); return; }
  await reward(v.food[0], T(`Yum, ${v.food[1]}!`, `Ngon quá, ${v.food[2]}!`), sub);
}
