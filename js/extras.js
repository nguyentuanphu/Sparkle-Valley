// Grown-ups settings for the optional extras: a natural online voice, voice control and free chat
// with the villagers. Everything here is off until a grown-up turns it on; keys stay on this device.
import { T } from './i18n.js';
import { settings, saveSettings } from './state.js';
import { testCloudVoice, cloneFamilyVoice, clipCount, say, ELEVEN_DEFAULT } from './voice.js';
import { canListen } from './listen.js';
import { esc } from './util.js';

export function extrasHTML() {
  const s = settings, sel = (v, w) => v === w ? 'selected' : '';
  return `
  <h3>✨ ${T('More natural voice', 'Giọng tự nhiên hơn')}</h3>
  <p class="note">${T('Every character has their own voice: grandparents speak slower and lower, kids higher, aunties and uncles with a woman’s or a man’s voice. More Vietnamese voices: on Android open Settings → Text-to-speech → Google → Install voice data → Vietnamese and download all 4 voices; the game shares them out between the characters. With Google Cloud below, each character also gets a natural voice of their own.', 'Mỗi nhân vật có giọng riêng: ông bà nói chậm và trầm hơn, các bạn nhỏ cao giọng hơn, cô chú có giọng nữ hoặc nam. Thêm giọng tiếng Việt: trên Android vào Cài đặt → Chuyển văn bản thành giọng nói → Google → Cài đặt dữ liệu giọng nói → Tiếng Việt và tải cả 4 giọng; trò chơi sẽ chia các giọng cho các nhân vật. Nếu dùng Google Cloud bên dưới, mỗi nhân vật còn có một giọng tự nhiên riêng.')}</p>
  <div class="field"><label>${T('Speed', 'Tốc độ')}</label><div class="seg vrate">${[[.85, T('Slow', 'Chậm')], [1, T('Normal', 'Vừa')], [1.12, T('Quick', 'Nhanh')]].map(([v, l]) => `<button data-r="${v}" class="${Math.abs((s.voiceRate || 1) - v) < .01 ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  <div class="field"><label>${T('Voice engine', 'Bộ đọc')}</label><select id="xTts">
    <option value="device" ${sel(s.tts, 'device')}>${T('This device (free, offline)', 'Giọng của máy (miễn phí, không cần mạng)')}</option>
    <option value="eleven" ${sel(s.tts, 'eleven')}>ElevenLabs (${T('very natural, online, your own key', 'rất tự nhiên, cần mạng, dùng key của bạn')})</option>
    <option value="google" ${sel(s.tts, 'google')}>Google Cloud (${T('natural, online, your own key', 'tự nhiên, cần mạng, dùng key của bạn')})</option></select></div>
  <div class="xcloud" ${s.tts === 'device' ? 'hidden' : ''}>
    <div class="field"><label for="xKey">${T('API key', 'API key')}</label><input type="password" id="xKey" autocomplete="off" value="${esc(s.ttsKey || '')}" placeholder="${s.tts === 'google' ? 'AIza…' : 'sk_…'}"></div>
    <div class="field xel" ${s.tts !== 'eleven' ? 'hidden' : ''}><label for="xVoice">${T('ElevenLabs voice ID', 'Mã giọng ElevenLabs')}</label><input type="text" id="xVoice" value="${esc(s.elevenVoice || '')}" placeholder="${ELEVEN_DEFAULT}"></div>
    <div class="field xgo" ${s.tts !== 'google' ? 'hidden' : ''}><label>${T('Google voices', 'Giọng Google')}</label><div class="vrow"><input type="text" id="xGEn" value="${esc(s.googleVoiceEn || '')}" placeholder="en-AU-Neural2-C"><input type="text" id="xGVi" value="${esc(s.googleVoiceVi || '')}" placeholder="vi-VN-Neural2-A"></div></div>
    <div class="actions"><button class="btn" id="xTestEn">▶ English</button><button class="btn" id="xTestVi">▶ Tiếng Việt</button></div>
    <button class="btn wide xel" id="xClone" ${s.tts !== 'eleven' ? 'hidden' : ''}>🧬 ${T('Make a voice from my family recordings', 'Tạo giọng từ các bản thu của gia đình')} (${clipCount()})</button>
    <p class="note">${T('Each new sentence is sent (as text only) to the service you chose and the sound is kept on this device, so lines play instantly and offline next time. These services charge for use; check their prices. "Make a voice" uploads your recordings to ElevenLabs.', 'Mỗi câu mới được gửi (chỉ phần chữ) đến dịch vụ bạn chọn, âm thanh được lưu trên máy này nên lần sau phát ngay và không cần mạng. Các dịch vụ này tính phí; hãy xem bảng giá của họ. "Tạo giọng" sẽ tải các bản thu của bạn lên ElevenLabs.')}</p>
  </div>
  <h3>🎤 ${T('Talking to the game', 'Nói chuyện với trò chơi')}</h3>
  <label class="tog"><input type="checkbox" id="xVc" ${s.voiceControl ? 'checked' : ''} ${canListen() ? '' : 'disabled'}> ${T('Show the 🎤 button: children can say “open the map”, “play marbles”, “go to the village”…', 'Hiện nút 🎤: trẻ có thể nói “mở bản đồ”, “chơi bắn bi”, “đi đến làng”…')}</label>
  <p class="note">${canListen() ? T('Speech recognition is done by Apple or Google and usually needs the internet. Nothing is recorded or saved.', 'Nhận dạng giọng nói do Apple hoặc Google thực hiện và thường cần mạng. Không có gì được ghi âm hay lưu lại.') : T('This browser cannot listen. Use Safari on iPhone/iPad or Chrome on Android.', 'Trình duyệt này không nghe được. Hãy dùng Safari trên iPhone/iPad hoặc Chrome trên Android.')}</p>
  <h3>💬 ${T('Villagers who chat freely (AI)', 'Dân làng trò chuyện tự nhiên (AI)')}</h3>
  <p class="note">${T('Tap 💬 Chat when a villager talks. Without a key they answer with built-in, offline answers. With an Anthropic API key they can answer anything, kindly and in character, using Claude. Only the chat text and the child’s first name are sent.', 'Chạm 💬 Trò chuyện khi dân làng nói. Không có key thì họ trả lời bằng câu có sẵn, không cần mạng. Có Anthropic API key thì họ trả lời mọi câu hỏi, nhẹ nhàng và đúng tính cách, nhờ Claude. Chỉ gửi nội dung trò chuyện và tên của bé.')}</p>
  <label class="tog"><input type="checkbox" id="xAi" ${s.aiOn ? 'checked' : ''}> ${T('Use Claude for villager chat', 'Dùng Claude cho dân làng trò chuyện')}</label>
  <div class="field" ${s.aiOn ? '' : 'hidden'} id="xAiF"><label for="xAiKey">Anthropic API key</label><input type="password" id="xAiKey" autocomplete="off" value="${esc(s.aiKey || '')}" placeholder="sk-ant-…"></div>`;
}

export function bindExtras(card, redraw, toast) {
  const s = settings, q = x => card.querySelector(x), save = () => saveSettings();
  card.querySelectorAll('.seg.vrate button').forEach(b => b.onclick = () => { s.voiceRate = +b.dataset.r; save(); redraw(); say('This is how fast I talk.', 'Tớ nói nhanh như thế này nè.'); });
  q('#xTts').onchange = e => { s.tts = e.target.value; save(); redraw(); };
  const txt = (id, k) => { const e = q(id); if (e) e.onchange = () => { s[k] = e.value.trim(); save(); }; };
  txt('#xKey', 'ttsKey'); txt('#xVoice', 'elevenVoice'); txt('#xGEn', 'googleVoiceEn'); txt('#xGVi', 'googleVoiceVi'); txt('#xAiKey', 'aiKey');
  const test = lang => async () => { ['#xKey', '#xVoice', '#xGEn', '#xGVi'].forEach(id => q(id) && q(id).onchange && q(id).onchange()); try { await testCloudVoice(lang); } catch (e) { toast(T('It did not work: ', 'Chưa được: ') + (e.message || e)); } };
  if (q('#xTestEn')) { q('#xTestEn').onclick = test('en'); q('#xTestVi').onclick = test('vi'); }
  if (q('#xClone')) q('#xClone').onclick = async () => {
    if (!s.ttsKey) return toast(T('Add your ElevenLabs key first.', 'Hãy nhập ElevenLabs key trước.'));
    if (!clipCount()) return toast(T('Record some lines first (🎙️ above).', 'Hãy thu vài câu trước (🎙️ ở trên).'));
    if (!confirm(T('This uploads your family recordings to ElevenLabs to make a voice. Continue?', 'Thao tác này tải các bản thu của gia đình lên ElevenLabs để tạo giọng. Tiếp tục?'))) return;
    try { const id = await cloneFamilyVoice(T('Sparkle Valley family voice', 'Giọng gia đình Thung Lũng Lấp Lánh')); s.elevenVoice = id; save(); redraw(); toast(T('Your family voice is ready!', 'Giọng của gia đình đã sẵn sàng!')); }
    catch (e) { toast(T('It did not work: ', 'Chưa được: ') + (e.message || e)); }
  };
  q('#xVc').onchange = e => { s.voiceControl = e.target.checked; save(); document.querySelectorAll('.dk.voicecmd').forEach(b => b.hidden = !(s.voiceControl && canListen())); };
  q('#xAi').onchange = e => { s.aiOn = e.target.checked; save(); redraw(); };
}
