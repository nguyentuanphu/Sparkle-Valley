// The family's own content pack, made with Sparkle Studio on the grown-up's computer (studio/): content/custom.json,
// published with the game. Read once at start (offline it comes from the saved copy). Everything in it is optional:
//   message  { en, vi }                  a note from the grown-ups, shown once a day when the children start playing
//   names    { id: { en, vi } }          default names for villagers (a name changed on the device still wins)
//   faces    { id: { photo, skin } }     default photo faces (photo = 'content/faces/….jpg'; a face set on the device wins)
//   tales    [ { id, flag, en, vi, pages: [[pictures, en, vi], …] } ]   the family's own stories (Stories shelf)
//   quiz     [ { q: [en, vi], pic, answers: [[en, vi], …], right } ]   the Family Quiz game (Learning shelf)
//   defaults { restMins }                a starting value for settings the device hasn't chosen yet
let data = {};
try {
  const r = await fetch('content/custom.json', { cache: 'no-cache' });
  if (r.ok) data = await r.json();
} catch (e) { /* offline and never saved: no content pack */ }
export const CUSTOM = data && typeof data === 'object' ? data : {};
const str = v => typeof v === 'string' ? v.slice(0, 600) : '';
// only well-formed pieces are used, so a hand-edited file can't break the game
export const customTales = () => (Array.isArray(CUSTOM.tales) ? CUSTOM.tales : []).filter(t => t && t.id && Array.isArray(t.pages) && t.pages.length)
  .map(t => ({ id: 'my_' + String(t.id).replace(/[^\w-]/g, '').slice(0, 30), flag: str(t.flag) || '💛', en: str(t.en) || 'Our story', vi: str(t.vi) || 'Truyện của nhà mình', pages: t.pages.filter(p => Array.isArray(p)).map(p => [str(p[0]) || '📖', str(p[1]), str(p[2]) || str(p[1])]) }));
export const customQuiz = () => (Array.isArray(CUSTOM.quiz) ? CUSTOM.quiz : []).filter(q => q && Array.isArray(q.q) && Array.isArray(q.answers) && q.answers.length >= 2 && q.right >= 0 && q.right < q.answers.length)
  .map(q => ({ q: [str(q.q[0]), str(q.q[1]) || str(q.q[0])], pic: str(q.pic), answers: q.answers.map(a => [str(a[0]), str(a[1]) || str(a[0])]), right: q.right | 0 }));
export const customName = id => { const n = CUSTOM.names && CUSTOM.names[id]; return n && typeof n === 'object' ? n : null; };
export const customFace = id => { const f = CUSTOM.faces && CUSTOM.faces[id]; return f && typeof f.photo === 'string' && /^content\/faces\/[\w.-]+\.(jpg|jpeg|png)$/.test(f.photo) ? f : null; };
