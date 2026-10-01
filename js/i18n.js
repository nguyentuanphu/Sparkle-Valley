// Bilingual text. Strings are written inline as T('English', 'Tiếng Việt') so the two
// languages always travel together.
import { settings } from './state.js';

export const T = (en, vi) => (settings.lang === 'vi' ? vi : en);
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
