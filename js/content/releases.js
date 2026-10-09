// Everything Sparkle Studio's Ra mắt (Releases) page can switch on, schedule or switch off (round R, owner, 8 Oct;
// the full list and suggested starts are in docs/cores/FEATURES.md). Each: id (what the game asks featureOn/releaseOn
// for), en, vi, group, def (what it is when Studio never set it: the owner chose "everything on"). Every festival is
// one too (fest_<id>, from js/content/festcal.js). Part 2 of round R adds the rest of the list as each one is built.
import { FESTCAL } from './festcal.js';
export const RELEASES = [
  { id: 'traffic', en: 'Traffic on the roads', vi: 'Xe cộ trên đường', group: 'world', def: true },
  { id: 'cityVehicles', en: 'Vehicles in the cities (parked bikes and cars, tram, xích lô, Hồ Gươm cart)', vi: 'Xe trong thành phố (xe đậu, tàu điện, xích lô, xe điện Hồ Gươm)', group: 'world', def: true },
  { id: 'rideBikes', en: 'Bicycles children can ride', vi: 'Xe đạp cho các con đạp', group: 'world', def: true },
  { id: 'xichloRides', en: 'Xích lô rides', vi: 'Đi xích lô', group: 'world', def: true },
  { id: 'realVehicles', en: 'Real-looking vehicles for older children', vi: 'Xe như thật cho các con lớn', group: 'world', def: true },
  { id: 'powerPoles', en: 'Power poles and wires', vi: 'Cột điện và dây điện', group: 'world', def: false },
  { id: 'story_prologue', en: 'Story: The Lanterns Blow Away (prologue, companion)', vi: 'Truyện: Đèn Lồng Bay Mất (mở đầu, bạn đồng hành)', group: 'story', def: true },
  { id: 'story_ch1', en: 'Story chapter 1: Lotus Village', vi: 'Truyện chương 1: Làng Sen', group: 'story', def: true },
  { id: 'story_yard', en: 'Story: Bà Huệ and ông Nghi\'s yard (coach from Hà Tĩnh, dump truck, excavator, a house built together)', vi: 'Truyện: Công trường của bà Huệ và ông Nghi (xe khách từ Hà Tĩnh, xe ben, máy xúc, cùng xây nhà)', group: 'story', def: true },
  // (round R, owner 9 Oct: "add these in and add to the studio so we can switch on/off") what keeps little ones playing
  { id: 'yardHands', en: 'The yard by hand: steer the dump truck, drag the excavator arm, stack the bricks', vi: 'Công trường tự tay làm: lái xe ben, kéo cần máy xúc, xếp gạch', group: 'kids', def: true },
  { id: 'simpleStart', en: 'Under-5s start on the Simple screen (until they choose)', vi: 'Bé dưới 5 tuổi bắt đầu ở màn hình Đơn giản (đến khi bé tự chọn)', group: 'kids', def: true },
  { id: 'storyActions', en: 'Story steps with something to do (catch the wind ribbons, lift the lotus leaves)', vi: 'Mỗi bước truyện có việc để làm (bắt dải lụa gió, lật lá sen)', group: 'kids', def: true },
  { id: 'companionGrow', en: 'The companion grows: feed it once a day, it learns tricks and looks new', vi: 'Bạn đồng hành lớn lên: cho ăn mỗi ngày, học trò mới, đổi dáng mới', group: 'kids', def: true },
  { id: 'shortTalk', en: 'Shorter speeches and a big Skip button on story films', vi: 'Lời nói ngắn hơn và nút Bỏ qua lớn trên phim truyện', group: 'kids', def: true },
  { id: 'dailySurprise', en: 'A surprise gift somewhere in the valley every day', vi: 'Mỗi ngày có một món quà bất ngờ trong thung lũng', group: 'kids', def: true },
  { id: 'saveGoal', en: 'A coin goal to save for (hats for the companion)', vi: 'Mục tiêu để dành tiền (mũ cho bạn đồng hành)', group: 'kids', def: true },
  // (round S, owner plan 8 Oct: ROUND-R items 5, 9 and 11) the village festival, surprises and the grown-ups' features
  { id: 'hoilang', en: 'Village festival (Hội làng) three times a day: parade, crowd and a special prize', vi: 'Hội làng ba lần mỗi ngày: rước, đông vui và quà đặc biệt', group: 'kids', def: true },
  { id: 'surprises', en: 'Surprises (rainbow lotus, golden butterfly, treasure map, fairy glade, rare visitors…), up to 3 a visit', vi: 'Điều bất ngờ (sen cầu vồng, bướm vàng, bản đồ kho báu, rừng tiên, khách quý…), tối đa 3 lần mỗi lượt chơi', group: 'kids', def: true },
  { id: 'familyMissions', en: 'Family missions a grown-up writes and ticks', vi: 'Nhiệm vụ gia đình do người lớn viết và đánh dấu', group: 'kids', def: true },
  { id: 'weeklyNote', en: 'A weekly note for grown-ups', vi: 'Ghi chú hằng tuần cho người lớn', group: 'kids', def: true },
  { id: 'certCard', en: 'Certificate card with the stickers earned (save the picture)', vi: 'Thiệp khen với các hình dán đã nhận (lưu ảnh)', group: 'kids', def: true },
  { id: 'danceBreak', en: 'A dance break after 20 minutes of play', vi: 'Giờ nhảy múa sau 20 phút chơi', group: 'kids', def: true },
  { id: 'bedtime', en: 'Bedtime: the valley dims, lullabies, goodnight', vi: 'Giờ đi ngủ: thung lũng tối dần, hát ru, chúc ngủ ngon', group: 'kids', def: true },
  { id: 'birthday', en: 'A birthday surprise (birthday kept on the device only)', vi: 'Quà bất ngờ ngày sinh nhật (ngày sinh chỉ lưu trên máy)', group: 'kids', def: true },
  ...FESTCAL.map(F => ({ id: 'fest_' + F.id, en: F.en, vi: F.vi, group: 'festivals', def: true, icon: F.icon }))
];
export const RELEASE_GROUPS = { story: ['The lantern story', 'Truyện đèn lồng'], kids: ['For little ones', 'Cho các bé'], world: ['In the valley', 'Trong thung lũng'], festivals: ['Festivals', 'Lễ hội'] };
