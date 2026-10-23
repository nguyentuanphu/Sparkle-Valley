// r90 content opens after every original item in its category or shelf has been finished three times.
import { featureOn } from '../custom.js';
import { GAME_INFO } from './activities.js';

type Counts = Record<string, number | undefined>;
type Flags = Record<string, boolean | undefined>;
export type UnlockProfile = {
  admin?: boolean;
  unlockAll?: boolean;
  wins?: Counts;
  taleReads?: Counts;
  tales?: Flags;
};

export const SECOND_SET_GAMES: Record<string, string[]> = {
  animals: ['crabwalk', 'whohome', 'mumbaby', 'feedzoo', 'buffalo', 'reefcount', 'tracks', 'catchfish', 'emueggs', 'reefclean'],
  music: ['dantranh', 'bushband', 'drumecho', 'loudquiet', 'songsteps'],
  art: ['stamps', 'weave', 'mosaic', 'nonla', 'aodai', 'kitepaint', 'shades', 'shadowpic', 'spotdiff', 'hiddenpic', 'finishpic', 'scene', 'paperfold', 'lacquer', 'scratch', 'bubblepaint', 'fingerpaint', 'weatherpaint', 'thocam', 'pixelpic', 'fireworks', 'masks', 'makeface', 'gallery', 'leafrub'],
  numbers: ['numline', 'tenframe', 'dice', 'evenodd', 'measure', 'beforeafter', 'halves'],
  shapes: ['solids', 'townshapes', 'tiles', 'turnit', 'shapetrain', 'linescurves', 'foldbox'],
  words: ['whichgroup', 'storyorder', 'guesswhat', 'actions', 'position'],
  reading: ['rd_blend', 'rd_hats', 'rd_endings', 'rd_compound', 'rd_labels', 'rd_signs', 'rd_questions', 'rd_many', 'rd_caps', 'rd_poem', 'rd_missing', 'rd_book'],
  me: ['myday', 'plate', 'kindchoice'],
  play: ['hideseek', 'duckgoose', 'redgreen', 'simon', 'eggspoon', 'chairs', 'kicktokick', 'nippers', 'hoops', 'tag'],
  vietnam: ['rongran', 'meochuot', 'cuopco', 'keocua', 'danhdao', 'nemcon', 'trongnu', 'duathuyen', 'banhchung', 'denongsao', 'mualan', 'cayneu'],
  travel: ['cyclo', 'reunification', 'lighthouse', 'operaseats', 'outback', 'floating', 'airport', 'postcard'],
  thinking: ['minichess', 'cotuong', 'whosits', 'pipes'],
  money: ['savegoal', 'pocketweek', 'pricetags', 'busfare', 'lemonade', 'party', 'recycle', 'tetmarket', 'bank', 'sharefair']
};

const SECOND_GAME_IDS = new Set(Object.values(SECOND_SET_GAMES).flat());

export const FIRST_SET_GAMES: Record<string, string[]> = {};
for (const [id, info] of Object.entries(GAME_INFO)) {
  if (SECOND_GAME_IDS.has(id)) continue;
  const area = info[0];
  (FIRST_SET_GAMES[area] ||= []).push(id);
}

export const FIRST_SET_TALES: Record<string, string[]> = {
  '🇻🇳': ['banhchung', 'sontinh', 'rongtien', 'thanhgiong', 'hoguom', 'caytre', 'duahau', 'caykhe', 'tamcam', 'sodua', 'thachsanh', 'chucuoi', 'cockien', 'vusua', 'baluoiriu', 'quabau', 'thayboi', 'nhacmeo', 'ongtao', 'cachep'],
  '🇦🇺': ['tiddalik', 'rainbowserpent', 'emu', 'dotkangaroo', 'birdcolours', 'magicpudding'],
  '🇨🇳': ['change', 'greatrace', 'maliang', 'weaver', 'nian', 'kongrong'],
  '🇮🇳': ['monkey', 'crow', 'lionrabbit', 'ganesha', 'bluejackal', 'elephantmice'],
  world: []
};

export const SECOND_SET_TALES: Record<string, string[]> = {
  "🇻🇳": [
    "traucau",
    "hoacuctrang",
    "hobabe",
    "cayneutale",
    "trecoc",
    "datrang",
    "trangquynh",
    "luubinh",
    "caichoi",
    "hoamuoigio",
    "chimkhach",
    "thantrutroi",
    "hatlua",
    "colau",
    "tichchu",
    "thila",
    "hoaban",
    "conkhi",
    "nangut",
    "bacogai"
  ],
  "🇦🇺": [
    "platypus",
    "wombatdig",
    "koaladay",
    "kookaburra",
    "penguinparade",
    "reefturtle",
    "echidna",
    "bilby",
    "lyrebird",
    "capelighthouse"
  ],
  "🇨🇳": [
    "peachgarden",
    "tensuns",
    "jaderabbit",
    "mulan",
    "dragonboat",
    "movemountain"
  ],
  "🇮🇳": [
    "tortoisegeese",
    "fourfriends",
    "birbal",
    "tenaliraman",
    "goldenswan",
    "mousenet"
  ],
  "🌍": [
    "tortoisehare",
    "lionmouse",
    "antgrasshopper",
    "redhen",
    "gingerbread",
    "anansi",
    "stonesoup",
    "turnip",
    "billygoats",
    "shoemaker",
    "momotaro",
    "turtlepalace"
  ],
  "world": [
    "tortoisehare",
    "lionmouse",
    "antgrasshopper",
    "redhen",
    "gingerbread",
    "anansi",
    "stonesoup",
    "turnip",
    "billygoats",
    "shoemaker",
    "momotaro",
    "turtlepalace"
  ]
};

export type ProgressItem = { id: string; n: number };
export type Progress = { done: number; need: number; perGame: ProgressItem[] };

function firstSet(type: 'game' | 'tale', areaOrShelf: string): string[] {
  return type === 'game' ? FIRST_SET_GAMES[areaOrShelf] || [] : FIRST_SET_TALES[areaOrShelf] || [];
}

function secondSet(type: 'game' | 'tale', areaOrShelf: string): string[] {
  return type === 'game' ? SECOND_SET_GAMES[areaOrShelf] || [] : SECOND_SET_TALES[areaOrShelf] || [];
}

function overrideOn(profile: UnlockProfile): boolean {
  return featureOn('unlockAll', false) || !!profile.unlockAll || !!profile.admin;
}

export function secondSetOf(type: 'game' | 'tale', areaOrShelf: string): string[] {
  return secondSet(type, areaOrShelf).slice();
}

export function progressOf(profile: UnlockProfile, type: 'game' | 'tale', areaOrShelf: string): Progress {
  const ids = firstSet(type, areaOrShelf);
  if (overrideOn(profile) || ids.length === 0) return { done: 3, need: 3, perGame: [] };
  const wins = profile.wins || {};
  const reads = profile.taleReads || {};
  const perGame = ids.map(id => {
    const legacyRead = profile.tales?.[id] ? 1 : 0;
    const n = type === 'game' ? Number(wins[id] || 0) : Number(reads[id] || legacyRead);
    return { id, n: Math.min(3, Math.max(0, n)) };
  });
  const done = perGame.every(item => item.n >= 3) ? 3 : Math.min(2, Math.min(...perGame.map(item => item.n)));
  return { done, need: 3, perGame };
}

export function isOpen(profile: UnlockProfile, id: string, type: 'game' | 'tale', areaOrShelf: string): boolean {
  if (overrideOn(profile)) return true;
  if (!secondSet(type, areaOrShelf).includes(id)) return true;
  return progressOf(profile, type, areaOrShelf).done >= 3;
}