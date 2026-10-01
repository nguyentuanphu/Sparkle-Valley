// Bilingual text. Strings are written inline as T('English', 'Tiếng Việt') so the two
// languages always travel together.
import { settings } from './state.js';

// People's titles follow the chosen language: in English "Ông Cú" is "Grandpa Owl" and "Bà Hai" is
// "Grandma Hai"; in Vietnamese "Mrs Kelly" is "Cô Kelly". First names stay as they are.
const NAMES_EN = {
  'Ông Cú': 'Grandpa Owl', 'Ông Bầu': 'Grandpa Gourd', 'Mây Cau Có': 'Grumpy Cloud', 'Cô Mai': 'Auntie Mai', 'Bác Ba': 'Uncle Ba',
  'Cô Sáu': 'Auntie Sáu', 'Chú Tư': 'Uncle Tư', 'Anh Tuấn': 'Big Brother Tuấn', 'Bà Hai': 'Grandma Hai', 'Cô Thu': 'Auntie Thu',
  'O Lài': 'Auntie Lài', 'Chú Năm': 'Uncle Năm', 'Chú Tám': 'Uncle Tám', 'Cô Út': 'Auntie Út', 'Bà Năm': 'Grandma Năm',
  'Anh Hai': 'Big Brother Hai', 'Cô Hạnh': 'Miss Hạnh', 'Bác Gấu': 'Mr. Bear'
};
const NAMES_VI = { 'Mrs Kelly': 'Cô Kelly', 'Aunty Bev': 'Dì Bev', 'Uncle Robbo': 'Chú Robbo', 'Mr. Bear': 'Bác Gấu' };
const reOf = map => new RegExp(Object.keys(map).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
const RE_EN = reOf(NAMES_EN), RE_VI = reOf(NAMES_VI);
// swap people's names inside any text for the given language
export const swapNames = (text, lang = settings.lang) => typeof text !== 'string' ? text : lang === 'vi' ? text.replace(RE_VI, m => NAMES_VI[m]) : text.replace(RE_EN, m => NAMES_EN[m]);
export const nm = name => swapNames(name);
export const T = (en, vi) => (settings.lang === 'vi' ? swapNames(vi, 'vi') : swapNames(en, 'en'));
// Things drawn into the 3D world (signs, name tags) register here to redraw when the language changes.
const langListeners = [];
export const onLang = f => { langListeners.push(f); };
export const applyLang = () => { document.documentElement.lang = settings.lang === 'vi' ? 'vi' : 'en'; langListeners.forEach(f => { try { f(); } catch (e) { } }); };
applyLang();
export const other = (en, vi) => (settings.lang === 'vi' ? en : vi);

// Alphabets for the letter games.
export const ALPHABET = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  vi: ['A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y']
};
// How each Vietnamese letter is read aloud (traditional school names).
export const VI_LETTER_NAMES = {
  A: 'a', 'Ă': 'á', 'Â': 'ớ', B: 'bờ', C: 'cờ', D: 'dờ', 'Đ': 'đờ', E: 'e', 'Ê': 'ê', G: 'gờ', H: 'hờ', I: 'i', K: 'ca',
  L: 'lờ', M: 'mờ', N: 'nờ', O: 'o', 'Ô': 'ô', 'Ơ': 'ơ', P: 'pờ', Q: 'quờ', R: 'rờ', S: 'sờ', T: 'tờ', U: 'u', 'Ư': 'ư', V: 'vờ', X: 'xờ', Y: 'i dài'
};
// A picture word for each letter, so the letter games can say "B is for ball".
export const LETTER_WORDS = {
  en: { A: ['🍎', 'apple'], B: ['⚽', 'ball'], C: ['🐱', 'cat'], D: ['🐶', 'dog'], E: ['🐘', 'elephant'], F: ['🐟', 'fish'], G: ['🍇', 'grapes'], H: ['🏠', 'house'],
    I: ['🍦', 'ice cream'], J: ['🧃', 'juice'], K: ['🪁', 'kite'], L: ['🦁', 'lion'], M: ['🌙', 'moon'], N: ['🪺', 'nest'], O: ['🐙', 'octopus'], P: ['🐷', 'pig'],
    Q: ['👑', 'queen'], R: ['🌈', 'rainbow'], S: ['☀️', 'sun'], T: ['🐢', 'turtle'], U: ['☂️', 'umbrella'], V: ['🎻', 'violin'], W: ['🐋', 'whale'], X: ['🎄', 'xmas tree'], Y: ['🪀', 'yo-yo'], Z: ['🦓', 'zebra'] },
  vi: { A: ['👕', 'cái áo'], 'Ă': ['🍚', 'ăn cơm'], 'Â': ['🫖', 'ấm trà'], B: ['🐄', 'con bò'], C: ['🐟', 'con cá'], D: ['🥥', 'quả dừa'], 'Đ': ['🏮', 'đèn lồng'],
    E: ['👶', 'em bé'], 'Ê': ['🐸', 'con ếch'], G: ['🐔', 'con gà'], H: ['🌸', 'bông hoa'], I: ['🔵', 'hòn bi'], K: ['🍬', 'cái kẹo'], L: ['🍐', 'quả lê'],
    M: ['🐱', 'con mèo'], N: ['🍇', 'quả nho'], O: ['🐝', 'con ong'], 'Ô': ['☂️', 'cái ô'], 'Ơ': ['🌶️', 'quả ớt'], P: ['🔋', 'cục pin'], Q: ['🍊', 'quả cam'],
    R: ['🐢', 'con rùa'], S: ['📕', 'quyển sách'], T: ['🍎', 'quả táo'], U: ['🦉', 'con cú'], 'Ư': ['🦁', 'sư tử'], V: ['🐘', 'con voi'], X: ['🚲', 'xe đạp'], Y: ['🩺', 'y tá'] }
};
export const NUMBER_WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  vi: ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín', 'hai mươi']
};
export const numWord = n => (NUMBER_WORDS[settings.lang] || NUMBER_WORDS.en)[n] ?? String(n);
export const COLORS = [
  { hex: '#e8434a', en: 'red', vi: 'đỏ' }, { hex: '#3d7fd6', en: 'blue', vi: 'xanh dương' }, { hex: '#ffd23f', en: 'yellow', vi: 'vàng' },
  { hex: '#4cbf5c', en: 'green', vi: 'xanh lá' }, { hex: '#ff8a2a', en: 'orange', vi: 'cam' }, { hex: '#9a6bff', en: 'purple', vi: 'tím' }, { hex: '#ff7eb8', en: 'pink', vi: 'hồng' }
];
export const colorName = c => T(c.en, c.vi);
