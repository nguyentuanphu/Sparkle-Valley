// The auto play check (owner, 12 Oct AEDT: "an in-game auto play that will walk and check on each of the games,
// festival games, folks, everything in the game ... enabled from Studio ... a small window ... all tasks or certain
// tasks"). For grown-ups testing the game as a child sees it: js/autoplay.js moves the child to each thing like a child
// would, plays it with a finger on the screen and notes what went wrong. This file is its lists and timings (no screen).
// Where it shows: Studio's Releases page, switch `autoplay` (off unless switched on), for every device or only the
// devices ticked there (`devices`: the game's player ids, the same ones as in Studio's players report).
// (owner, 13 Oct AEDT, after testing it: "such a mess") it moves and plays like a person, never restarts the game, follows
// the quests, sits under the ladybird, and being stuck is a problem it reports.

// the groups in the window's checklist, in the order they run ('quests' follows the quest chain like a child would)
export const AP_GROUPS = [
  { key: 'quests', en: 'Follow the quests', vi: 'Làm theo nhiệm vụ' },
  { key: 'games', en: 'Games', vi: 'Trò chơi' },
  { key: 'festivals', en: 'Festivals and their tables', vi: 'Lễ hội và bàn lễ hội' },
  { key: 'folk', en: 'Hội làng and folk shows', vi: 'Hội làng và biểu diễn dân gian' },
  { key: 'stories', en: 'Stories', vi: 'Truyện' },
  { key: 'places', en: 'Places tour', vi: 'Đi một vòng các nơi' },
  { key: 'people', en: 'Villagers', vi: 'Dân làng' },
  { key: 'things', en: 'Game hosts and things to tap', vi: 'Người dẫn trò và đồ để chạm' },
  { key: 'shop', en: 'Shop, wardrobe and songs', vi: 'Cửa hàng, tủ đồ và bài hát' }
];
// the two speeds (seconds). Both move like a child: Watch walks and takes its time; Quick runs, flies longer trips and
// taps sooner. Neither slides through walls or water.
//   fly: a trip longer than this (metres) is flown, like the Go button does; think: the pause before each tap (from, to);
//   finger: how long the finger takes to reach a button (ms); game: the most a game is played; page: the time on each
//   story page (0: listen to the whole page); stay: time at a place; talk: time with a window or a villager;
//   idle: a game where nothing happens for this long is left (the finger found nothing that works)
export const AP_SPEEDS = {
  watch: { en: 'Watch', vi: 'Xem', run: false, fly: 110, think: [1.1, 2.2], finger: 650, game: 90, page: 0, stay: 3, talk: 3, idle: 25 },
  fast: { en: 'Quick', vi: 'Nhanh', run: true, fly: 45, think: [.35, .8], finger: 260, game: 45, page: 1.6, stay: .8, talk: 1.2, idle: 14 }
};
for (const rate of [1, 2, 3, 5]) AP_SPEEDS['x' + rate] = { ...AP_SPEEDS.watch, en: rate + '×', vi: rate + '×', run: rate > 1, think: AP_SPEEDS.watch.think.map(n => n / rate), finger: AP_SPEEDS.watch.finger / rate, stay: AP_SPEEDS.watch.stay / rate, talk: AP_SPEEDS.watch.talk / rate, game: AP_SPEEDS.watch.game, idle: AP_SPEEDS.watch.idle, rate };
export const apSpeed = k => AP_SPEEDS[k] || AP_SPEEDS.fast;
// a game or a story that has not opened after this many seconds did not open
export const AP_OPEN_WAIT = 3;
// how often a game's answer is the right one (owner, 13 Oct: "mostly right, some wrong", so wrong answers and hints
// are checked too)
export const AP_RIGHT = .75;
// stuck: moved less than `moved` metres in `secs` seconds while walking somewhere
export const AP_STUCK = { secs: 2.5, moved: .45 };
// the path finder: a grid this fine (metres), searched this far round the way (metres), at most this many squares
export const AP_PATH = { cell: 1.5, margin: 24, max: 9000 };
// the last steps sent with each problem, so whoever fixes it can do the same again
export const AP_TRAIL = 15;
// quests followed in one run, and tries at one quest before it is noted as stuck
export const AP_QUESTS = { max: 40, tries: 3 };
// which group an interactable belongs to, by its id
export const apGroupOf = id => /^npc_/.test(id) ? 'people' : /^festival_/.test(id) ? 'festivals' : /^shop_/.test(id) ? 'shop'
  : /hoilang|folk|show|stage|singer|pole|parade/.test(id) ? 'folk' : 'things';
// may this device show the window? (rule: the release rule from Studio; me: this device's player id)
export function apAllowed(on, rule, me) {
  if (!on || rule?.policies?.[me]?.autoplay === false) return false;
  const list = rule && Array.isArray(rule.devices) ? rule.devices.filter(d => typeof d === 'string') : [];
  return !list.length || list.includes(me);
}

// ---------- what goes back, and what stays (js/keepcopy.js) ----------
// Studio's tester rule `revert` (owner, 13 Oct: "can be selected on Studio, but enable progress back and keep reward"):
//   'progress' (the default): when a tester stops being a tester, the progress from when they started goes back;
//   'autoplay': only what each auto play run did goes back, when the run ends.
// A device that may use auto play but is not a tester always gets each run put back.
export const REVERT = [
  { key: 'progress', en: 'Everything since they became a tester goes back', vi: 'Mọi tiến bộ từ khi làm người thử được trả lại' },
  { key: 'autoplay', en: 'Only what auto play did goes back', vi: 'Chỉ trả lại phần tự chơi đã làm' }
];
export const revertOf = (rule, device = '') => { const value = rule?.policies?.[device]?.revert || rule?.revert; return ['keep', 'autoplay', 'progress'].includes(value) ? value : 'progress'; };
// the fields of a child's profile that stay as they are now: rewards (badges and the star are in `look`, stickers, the
// album, clothes and gear in `owned`, the tester's stickers) and what a grown-up set (name, photo, age, how hard, which
// screen, which story they follow), and where they stand
export const KEEP_FIELDS = ['name', 'photo', 'age', 'difficulty', 'gameDiff', 'screen', 'follow', 'look', 'owned', 'stickers', 'album', 'testerStickers', 'pos', 'posMap'];
export function keepRewards(old, now) {
  const m = Object.assign({}, old);
  for (const k of KEEP_FIELDS) if (now && k in now) m[k] = now[k];
  return m;
}
