// The auto play check (owner, 12 Oct AEDT: "an in-game auto play that will walk and check on each of the games,
// festival games, folks, everything in the game ... enabled from Studio ... a small window ... all tasks or certain
// tasks"). For grown-ups testing the game as a child sees it: js/autoplay.js walks the child to each thing, opens it,
// lets it play for a moment, closes it and notes what went wrong. This file is its lists and timings (no screen).
// Where it shows: Studio's Releases page, switch `autoplay` (off unless switched on), for every device or only the
// devices ticked there (`devices`: the game's player ids, the same ones as in Studio's players report).

// the groups in the window's checklist, in the order they run
export const AP_GROUPS = [
  { key: 'games', en: 'Games', vi: 'Trò chơi' },
  { key: 'festivals', en: 'Festivals and their tables', vi: 'Lễ hội và bàn lễ hội' },
  { key: 'folk', en: 'Hội làng and folk shows', vi: 'Hội làng và biểu diễn dân gian' },
  { key: 'stories', en: 'Stories', vi: 'Truyện' },
  { key: 'places', en: 'Places tour', vi: 'Đi một vòng các nơi' },
  { key: 'people', en: 'Villagers', vi: 'Dân làng' },
  { key: 'things', en: 'Game hosts and things to tap', vi: 'Người dẫn trò và đồ để chạm' },
  { key: 'shop', en: 'Shop, wardrobe and songs', vi: 'Cửa hàng, tủ đồ và bài hát' }
];
// how each speed moves and how long each thing stays open (seconds)
//   walk: 'walk' = the child walks there like a tap-to-walk, 'glide' = slides there fast, 'fly' = the game's travel
export const AP_SPEEDS = {
  watch: { en: 'Watch', vi: 'Xem', walk: 'walk', glide: 8, game: 8, story: 6, place: 3, talk: 3 },
  fast: { en: 'Fast', vi: 'Nhanh', walk: 'glide', glide: 40, game: 2, story: 2, place: .8, talk: 1 },
  jump: { en: 'Jump', vi: 'Nhảy', walk: 'fly', glide: 40, game: 2, story: 2, place: .8, talk: 1 }
};
// a game or a story that has not opened after this many seconds counts as stuck
export const AP_OPEN_WAIT = 3;
// which group an interactable belongs to, by its id
export const apGroupOf = id => /^npc_/.test(id) ? 'people' : /^festival_/.test(id) ? 'festivals' : /^shop_/.test(id) ? 'shop'
  : /hoilang|folk|show|stage|singer|pole|parade/.test(id) ? 'folk' : 'things';
// may this device show the window? (rule: the release rule from Studio; me: this device's player id)
export function apAllowed(on, rule, me) {
  if (!on) return false;
  const list = rule && Array.isArray(rule.devices) ? rule.devices.filter(d => typeof d === 'string') : [];
  return !list.length || list.includes(me);
}
// the localStorage keys the check never puts back (its own report, the live rules, this device's id)
export const AP_KEEP = /^sv2_(autoplay|live$|playerid$)/;
