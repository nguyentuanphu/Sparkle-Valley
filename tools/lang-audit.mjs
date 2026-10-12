// (Round U, owner 11 Oct: "Grandma Huệ speaks Vietnamese even though English is set; check everything")
// Finds every pair of strings written [English, Vietnamese] (an array of two strings, or T('…', '…')) whose English
// slot is really Vietnamese: most of its words carry Vietnamese letters, or it is the same sentence as the Vietnamese one.
// Names and dish words inside an English line are fine (a few words); a whole Vietnamese sentence is not.
//   node tools/lang-audit.mjs           list the faults (file:line, the English slot)
//   node tools/lang-audit.mjs --json    the same as JSON (tests: "bilingual")
// English slots that stay Vietnamese on purpose (names, songs, sayings) are listed with a reason in tools/lang-allow.json.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VI = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const STR = String.raw`'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"`;
const PAIR = new RegExp(String.raw`(?:\[|\bT\()\s*(${STR})\s*,\s*(${STR})\s*(?:[\],)])|\ben:\s*(${STR})\s*,\s*vi:\s*(${STR})`, 'g');
const unq = s => s.slice(1, -1).replace(/\\(.)/g, '$1');
// a sentence (three words or more) where most words carry Vietnamese letters and hardly any are plain English
const EN = new Set('the a an to is are you your and of in on with for it this that we i my me be can let lets let’s what where who how do does have has not no yes come here there some look like want will all at by from up out go see say says said its into our very more one two'.split(' '));
export function looksVietnamese(en) {
  const words = en.split(/[\s,.!?;:…()"“”·]+/).filter(w => /\p{L}/u.test(w));
  if (words.length < 3) return false;
  const vi = words.filter(w => VI.test(w)).length, eng = words.filter(w => EN.has(w.toLowerCase())).length;
  return vi / words.length >= .55 && eng <= 1;
}
export function audit(root = ROOT) {
  const allow = new Set(Object.entries(JSON.parse(fs.readFileSync(path.join(root, 'tools/lang-allow.json'), 'utf8'))).filter(([k]) => k !== '_why').flatMap(([, v]) => v));
  const files = [];
  const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!/vendor|node_modules/.test(f.name)) walk(p); } else if (f.name.endsWith('.js')) files.push(p); } };
  walk(path.join(root, 'js'));
  const out = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(PAIR)) {
      const en = unq(m[1] || m[3]), vi = unq(m[2] || m[4]);
      if (!VI.test(vi) && !looksVietnamese(vi)) continue;   // only pairs whose second string is Vietnamese
      if (allow.has(en)) continue;
      if (looksVietnamese(en) || (en === vi && en.split(/\s+/).length >= 4 && VI.test(en))) out.push({ file: path.relative(root, f), line: src.slice(0, m.index).split('\n').length, en: en.slice(0, 90) });
    }
  }
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('lang-audit.mjs')) {
  const r = audit();
  if (process.argv.includes('--json')) console.log(JSON.stringify(r));
  else { for (const x of r) console.log(`${x.file}:${x.line}  ${x.en}`); console.log(`${r.length} English slots in Vietnamese`); }
}
