// (Round U, owner 11 Oct: "there are no sounds and voices option to turn on and off") Three big switches, the same on
// the Simple screen and in the valley (the dock's Sound button): music, sound effects and the talking voice, each on its
// own. The keyboard keys N and O still flip music and all sound at once.
import { T } from './i18n.js';
import { pic } from './art.js';
import { modal } from './popups.js';
import { settings } from './state.js';
import { SFX } from './audio.js';

const SWITCHES = [['music', '🎵', ['Music', 'Nhạc']], ['sound', '🔔', ['Sounds', 'Âm thanh']], ['voice', '🗣️', ['Voice', 'Giọng nói']]];
export function openSoundSheet(G) {
  const m = modal('soundsheet', `<h2>${pic('🔊')} ${T('Sound', 'Âm thanh')}</h2><div class="ss-row">${SWITCHES.map(([k, icon, name]) =>
    `<button class="ss-sw" data-k="${k}" aria-pressed="${!!settings[k]}"><span>${pic(icon)}</span><b>${T(...name)}</b><i>${T('On', 'Bật')}</i><i class="off">${T('Off', 'Tắt')}</i></button>`).join('')}</div>
    <div class="actions center"><button class="btn primary ss-done">${T('Done', 'Xong')}</button></div>`);
  const paint = () => m.querySelectorAll('.ss-sw').forEach(b => { const on = !!settings[b.dataset.k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  m.querySelectorAll('.ss-sw').forEach(b => b.onclick = () => { G.setAudio(b.dataset.k, !settings[b.dataset.k]); if (settings.sound) SFX.tap(); paint(); });
  m.querySelector('.ss-done').onclick = () => { SFX.tap(); m.close(); };
  m.onclick = e => { if (e.target === m) m.close(); };
  paint(); return m;
}
