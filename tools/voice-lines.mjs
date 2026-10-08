// Lists every line the game speaks (English + Tiếng Việt), with the character who says it, so a voice
// pack can be made. Usage: node tools/voice-lines.mjs > tools/voice-lines.json
// Lines that contain a child's name or other changing words (`${…}`) can't be recorded in advance, so the game
// speaks a fixed version instead (round F: dialog lines [shown en, shown vi, spoken en, spoken vi]).
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const files = [...fs.readdirSync(path.join(ROOT, 'js')).map(f => 'js/' + f), ...fs.readdirSync(path.join(ROOT, 'js/games')).map(f => 'js/games/' + f), ...fs.readdirSync(path.join(ROOT, 'js/content')).map(f => 'js/content/' + f)].filter(f => f.endsWith('.js'));
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
// a quoted string without ${…}
const Q = String.raw`(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\$]|\\.|\$(?!\{))*\x60)`;
const unq = s => s.slice(1, -1).replace(/\\(['"\x60\\])/g, '$1').replace(/\\n/g, ' ');
// spoken contexts: say/sayAsync/api.say(en, vi), dialog lines [[en, vi]], story pages [pic, en, vi],
// how-to cards S(pic, en, vi), facts and lines arrays
const PATTERNS = [
  new RegExp(String.raw`\b(?:say|sayAsync|api\.say|\.say)\(\s*(${Q})\s*,\s*(${Q})`, 'g'),
  new RegExp(String.raw`\[\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g'),
  new RegExp(String.raw`\[\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g'),
  new RegExp(String.raw`\bS\(\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\)`, 'g'),
  // a speech-box line that shows a name but speaks recordable words: [`…${name}…`, `…`, 'say en', 'say vi']
  new RegExp(String.raw`\[\s*\x60[^\x60]*\x60\s*,\s*\x60[^\x60]*\x60\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, 'g'),
  new RegExp(String.raw`\b(?:fact|story|hint|about)\s*:\s*\[\s*(${Q})\s*,\s*(${Q})`, 'g'),
  // the child's turn in a film (js/content/films.js): S.help(time, en, vi, …)
  new RegExp(String.raw`\bS\.help\(\s*[^,]+,\s*(${Q})\s*,\s*(${Q})`, 'g')
];
export function collectLines() {
const seen = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const re of PATTERNS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(src))) {
      const en = unq(m[1]).trim(), vi = unq(m[2]).trim();
      if (!en || !vi || en.length < 2) continue;
      if (/^[a-z]{2}:/.test(en) || /^[a-z]{2}:/.test(vi)) continue; // wiki page keys, not speech
      if (!VI.test(vi) && en === vi) continue;             // not a translation pair
      if (/^[\p{Emoji}\s✓✕+−=]+$/u.test(en)) continue;     // pictures only
      if (en.split(/\s+/).length < 2 && !/[!?.]$/.test(en)) continue; // single-word labels are not speech
      const key = en + '\u0000' + vi;
      if (!seen.has(key)) seen.set(key, { en, vi, files: new Set() });
      seen.get(key).files.add(f);
    }
  }
}
// names spoken on their own (round I, the Simple screen says what a child taps): games, tales and the places a child
// can fly to; one word is enough here, and a name that is the same in both languages (Uluru) is still said in each
const NAME = new RegExp(String.raw`\b(?:name|title)\s*:\s*\(\)\s*=>\s*T\(\s*(${Q})\s*,\s*(${Q})\s*\)`, 'g');
for (const f of files.filter(f => f.startsWith('js/games/') || f === 'js/learn.js' || f === 'js/main.js' || f === 'js/content/activities.js')) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); NAME.lastIndex = 0; let m;
  while ((m = NAME.exec(src))) {
    const en = unq(m[1]).trim(), vi = unq(m[2]).trim(); if (!en || !vi || !/\p{L}/u.test(en)) continue;
    const key = en + '\u0000' + vi;
    if (!seen.has(key)) seen.set(key, { en, vi, files: new Set() });
    seen.get(key).files.add(f);
  }
}
return [...seen.values()].map(l => ({ en: l.en, vi: l.vi, from: [...l.files].join(',') }));
}
if (process.argv[1] && process.argv[1].endsWith('voice-lines.mjs')) {
const lines = collectLines();
const chars = lines.reduce((a, l) => a + l.en.length + l.vi.length, 0);
if (process.argv.includes('--count')) { console.log(JSON.stringify({ lines: lines.length, characters: chars, en: lines.reduce((a, l) => a + l.en.length, 0), vi: lines.reduce((a, l) => a + l.vi.length, 0) })); }
else console.log(JSON.stringify(lines, null, 1));
}
