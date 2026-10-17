// Vietnamese words inside English lines (round R, owner: "bánh khọt" or "nước mía" said by the English voice can't be
// understood). viRuns() cuts an English line into pieces, [['en', 'Buy some '], ['vi', 'bánh khọt'], ['en', '?']], so
// dish names, place names and people's names are spoken by the Vietnamese voice and everything else stays English.
// Used by the game (js/voice.js, device and online voices) and by tools/make-voice-pack.mts (recorded voices).
//   · a word with Vietnamese letters (đ, ơ, ư, ă, â, ê, ô or a tone mark) is Vietnamese;
//   · a plain word right next to one (only spaces between) joins it when it is a Vietnamese syllable that is not also
//     an everyday English word: "Hội An", "Bắc Ninh", "Phố Hai Quê", "Bác 2";
//   · a few well-known names have no marks at all ("Nha Trang", "Sa Pa").
const MARK = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const SYLL = new Set(('an ba bi ca cau canh cha chai chi chim cho co con cu da dinh em gia gian hai hoa kem kim kinh lang lon long ly mai mi minh '
  + 'mua nao nghe nghen nghi ngoan ngon nha ninh phong phu quan ra re ru sanh sao ta tam thoi thu thung tim tinh tranh tre trong trung tui xa xe xin').split(' '));
// plain words that join only when written with a capital (as a name): lower case they are English
const CAPS_ONLY = new Set(['an', 'long', 'mai', 'em', 'con', 'ta', 'trong', 'kim', 'lang', 'mi', 're']);
const NAMES = /\b(Nha Trang|Sa Pa|Sapa|Vung Tau|Ha Long|Hoi An|Da Nang|Hue|Pho|Banh Mi)\b/g;
// words with marks that are not Vietnamese (Chinese pinyin such as "Xiè xie")
const NOT_VI = /^(xi[eè]|xiè|n[ǐi]h[ǎa]o)$/i;
const core = w => w.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '');
const isVi = w => { const c = core(w); return !!c && MARK.test(c) && !NOT_VI.test(c) && !/[ǎǐǒǔǖǘǚǜāēīōū]/.test(c); };
const joins = w => { const c = core(w); if (!c) return false;
  if (/^\d+$/.test(c)) return true; const l = c.toLowerCase(); return SYLL.has(l) && (!CAPS_ONLY.has(l) || c[0] !== l[0]); };
export const hasVi = text => MARK.test(text) || (NAMES.lastIndex = 0, NAMES.test(text));

export function viRuns(text) {
  text = String(text);
  if (!hasVi(text)) return [['en', text]];
  // words and the spaces between them; a "word" keeps its punctuation, which is cut off again below
  const parts = text.split(/(\s+)/), n = parts.length, vi = new Array(n).fill(false);
  for (let i = 0; i < n; i += 2) vi[i] = isVi(parts[i]);
  NAMES.lastIndex = 0; let m; while ((m = NAMES.exec(text))) { let at = 0; for (let i = 0; i < n; i++) { const end = at + parts[i].length; if (i % 2 === 0 && end > m.index && at < m.index + m[0].length) vi[i] = true; at = end; } }
  // plain syllables next to a Vietnamese word join it; a number joins only after one ("Bác 2"); punctuation stops a run
  const stops = w => /[,.!?;:…)"”]$/.test(w), opens = w => /^[("“]/.test(w);
  for (let changed = true; changed;) { changed = false;
    for (let i = 0; i < n; i += 2) { if (vi[i] || !joins(parts[i])) continue;
      const left = i >= 2 && vi[i - 2] && !stops(parts[i - 2]) && !opens(parts[i]), right = i + 2 < n && vi[i + 2] && !stops(parts[i]) && !opens(parts[i + 2]) && !/^\d+$/.test(core(parts[i]));
      if (left || right) { vi[i] = changed = true; } } }
  const out = [], push = (lang, s) => { if (!s) return; const last = out[out.length - 1]; if (last && last[0] === lang) last[1] += s; else out.push([lang, s]); };
  for (let i = 0; i < n; i++) {
    const w = parts[i];
    if (i % 2) { push(vi[i - 1] && vi[i + 1] && !/[^\p{L}\d]$/u.test(parts[i - 1]) && !/^[^\p{L}\d]/u.test(parts[i + 1]) ? 'vi' : 'en', w); continue; }
    if (!vi[i]) { push('en', w); continue; }
    // leading and trailing punctuation stays with the English voice
    const a = w.match(/^[^\p{L}\d]*/u)[0], z = w.slice(a.length).match(/[^\p{L}\d]*$/u)[0];
    push('en', a); push('vi', w.slice(a.length, w.length - z.length)); push('en', z);
  }
  return out.filter(([, s]) => s);
}
// true when a line really needs the Vietnamese voice somewhere
export const mixed = text => viRuns(text).some(([l]) => l === 'vi');
// The Azure SSML for an English line with Vietnamese words: the English voice, switching to the Vietnamese voice of the
// same man or woman for each Vietnamese piece. Each voice normally pads itself with up to a second of silence, so the
// pauses at the switches are set by hand: none before a piece, a breath after a comma, a full stop's pause after a sentence.
// runs: viRuns(text), or the same list sent by Sparkle Studio's page; prosody: e.g. 'rate="-3%" pitch="+0%"'.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export function mixedSsml(runs, enVoice, viVoice, prosody = '') {
  runs = runs.filter((r, i) => /[\p{L}\d]/u.test(r[1]) || i === runs.length - 1);
  const body = runs.map(([l, s], i) => {
    const end = s.trimEnd(), tail = i === runs.length - 1 ? '' : /[.!?…]["”')]?$/.test(end) ? '350ms' : /[,;:]$/.test(end) ? '180ms' : '40ms';
    return `<voice name="${l === 'vi' ? viVoice : enVoice}">${i ? '<mstts:silence type="Leading-exact" value="0ms"/>' : ''}${tail ? `<mstts:silence type="Tailing-exact" value="${tail}"/>` : ''}${prosody ? `<prosody ${prosody}>${esc(s)}</prosody>` : esc(s)}</voice>`;
  }).join('');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-AU">${body}</speak>`;
}
