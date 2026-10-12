// Everything Sparkle Studio's Ra mắt (Releases) page can switch on, schedule or switch off (round R, owner, 8 Oct;
// the full list and suggested starts are in docs/cores/FEATURES.md). Each: id (what the game asks featureOn/releaseOn
// for), en, vi, group, def (what it is when Studio never set it: the owner chose "everything on"). Every festival is
// one too (fest_<id>, from js/content/festcal.js). Part 2 of round R adds the rest of the list as each one is built.
import { FESTCAL } from './festcal.js';
export const RELEASES = [
  { id: 'autoplay', en: 'Auto play check (for grown-ups testing: a small window that plays everything; every device, or only the ticked ones)', vi: 'Tự chơi để kiểm tra (cho người lớn thử game: một cửa sổ nhỏ tự chơi mọi thứ; mọi máy, hoặc chỉ các máy được chọn)', group: 'tools', def: false },
  { id: 'tester', en: 'Testers (devices that report problems by themselves, with the ladybird; every device, or only the ticked ones)', vi: 'Người thử (máy tự báo lỗi, có con bọ rùa; mọi máy, hoặc chỉ các máy được chọn)', group: 'tools', def: false },
  { id: 'traffic', en: 'Traffic on the roads', vi: 'Xe cộ trên đường', group: 'world', def: true },
  { id: 'cityVehicles', en: 'Vehicles in the cities (parked bikes and cars, tram, xích lô, Hồ Gươm cart)', vi: 'Xe trong thành phố (xe đậu, tàu điện, xích lô, xe điện Hồ Gươm)', group: 'world', def: true },
  { id: 'rideBikes', en: 'Bicycles children can ride', vi: 'Xe đạp cho các con đạp', group: 'world', def: true },
  { id: 'xichloRides', en: 'Xích lô rides', vi: 'Đi xích lô', group: 'world', def: true },
  { id: 'realVehicles', en: 'Real-looking vehicles for older children', vi: 'Xe như thật cho các con lớn', group: 'world', def: true },
  { id: 'powerPoles', en: 'Power poles and wires', vi: 'Cột điện và dây điện', group: 'world', def: false },
  { id: 'story_prologue', en: 'Story: The Lanterns Blow Away (prologue, companion)', vi: 'Truyện: Đèn Lồng Bay Mất (mở đầu, bạn đồng hành)', group: 'story', def: true },
  { id: 'story_ch1', en: 'Story chapter 1: Lotus Village', vi: 'Truyện chương 1: Làng Sen', group: 'story', def: true },
  { id: 'story_ch2', en: 'Story chapter 2: Hà Nội (Tèo\'s challenge, Văn Miếu, Cầu Thê Húc lights up, Trung Thu parade)', vi: 'Truyện chương 2: Hà Nội (Tèo thách đấu, Văn Miếu, Cầu Thê Húc sáng đèn, rước đèn Trung Thu)', group: 'story', def: true }, // (owner 10 Oct: off until an admin switches it on or schedules it)
  { id: 'story_ch3', en: 'Story chapter 3: Sydney (Chi\'s Aussie words, the ferries, cricket with Jack and Ruby, the Opera House lights up, fireworks)', vi: 'Truyện chương 3: Sydney (Chi dạy từ tiếng Úc, phà, chơi cricket với Jack và Ruby, Nhà hát Opera sáng đèn, pháo hoa)', group: 'story', def: true },
  { id: 'story_yard', en: 'Story: Bà Huệ and ông Nghi\'s yard (coach from Hà Tĩnh, dump truck, excavator, a house built together)', vi: 'Truyện: Công trường của bà Huệ và ông Nghi (xe khách từ Hà Tĩnh, xe ben, máy xúc, cùng xây nhà)', group: 'story', def: true },
  // (round R, owner 9 Oct: "add these in and add to the studio so we can switch on/off") what keeps little ones playing
  { id: 'yardHands', en: 'The yard by hand: steer the dump truck, drag the excavator arm, stack the bricks', vi: 'Công trường tự tay làm: lái xe ben, kéo cần máy xúc, xếp gạch', group: 'kids', def: true },
  { id: 'simpleStart', en: 'Under-5s start on the Simple screen (until they choose)', vi: 'Bé dưới 5 tuổi bắt đầu ở màn hình Đơn giản (đến khi bé tự chọn)', group: 'kids', def: true },
  { id: 'storyActions', en: 'Story steps with something to do (catch the wind ribbons, lift the lotus leaves)', vi: 'Mỗi bước truyện có việc để làm (bắt dải lụa gió, lật lá sen)', group: 'kids', def: true },
  { id: 'companionGrow', en: 'The companion grows: feed it once a day, it learns tricks and looks new', vi: 'Bạn đồng hành lớn lên: cho ăn mỗi ngày, học trò mới, đổi dáng mới', group: 'kids', def: true },
  { id: 'shortTalk', en: 'Shorter speeches and a big Skip button on story films', vi: 'Lời nói ngắn hơn và nút Bỏ qua lớn trên phim truyện', group: 'kids', def: true },
  { id: 'dailySurprise', en: 'A surprise gift somewhere in the valley every day', vi: 'Mỗi ngày có một món quà bất ngờ trong thung lũng', group: 'kids', def: true },
  { id: 'saveGoal', en: 'A coin goal to save for (hats for the companion)', vi: 'Mục tiêu để dành tiền (mũ cho bạn đồng hành)', group: 'kids', def: true },
  // (round S, owner plan 8 Oct: Round R Part 2 items 6 and 10) the clothes shop, and for 5 to 8 year olds at Medium or Hard
  { id: 'shop', en: 'Clothes shop by the market and the wardrobe (two starting outfits; the Bag button goes to the shop)', vi: 'Cửa hàng quần áo cạnh chợ và tủ đồ (hai bộ đồ ban đầu; nút Ba lô đưa đến cửa hàng)', group: 'rewards', def: true },
  { id: 'mysteryBox', en: 'Mystery boxes: one free a day and one for a finished quest (5 to 8, Medium or Hard)', vi: 'Hộp bí ẩn: mỗi ngày một hộp và thêm một hộp khi xong nhiệm vụ (5 đến 8 tuổi, Vừa hoặc Khó)', group: 'rewards', def: true },
  { id: 'rankings', en: 'Family rankings: stars and quests, collections, kindness, learning (5 to 8, Medium or Hard)', vi: 'Bảng thành tích gia đình: sao và nhiệm vụ, bộ sưu tập, tốt bụng, học hỏi (5 đến 8 tuổi, Vừa hoặc Khó)', group: 'rewards', def: true },
  { id: 'collectibles', en: 'Collection book: fairies, dragons, stickers, decorations (5 to 8, Medium or Hard)', vi: 'Sổ sưu tập: nàng tiên, rồng, hình dán, đồ trang trí (5 đến 8 tuổi, Vừa hoặc Khó)', group: 'rewards', def: true },
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
export const RELEASE_GROUPS = { story: ['The lantern story', 'Truyện đèn lồng'], kids: ['For little ones', 'Cho các bé'], rewards: ['Shop and rewards', 'Cửa hàng và phần thưởng'], world: ['In the valley', 'Trong thung lũng'], festivals: ['Festivals', 'Lễ hội'], tools: ['For testing', 'Để thử'] };
// (Play reading trial, owner 11 Oct 2026 AEDT) the ten reading games: off until an admin switches them on
// (owner, 12 Oct AEDT: "all other features should be on for now until I say or switch it off"; only power poles and
// the auto play check stay off) the reading games and story chapters 2 and 3 are on unless Studio switches them off
RELEASES.push({ id: 'readingTrial', en: 'Reading games (trial): ten games in the Reading corner, in English or Vietnamese by the language setting', vi: 'Trò chơi tập đọc (thử nghiệm): mười trò ở Góc đọc, tiếng Anh hoặc tiếng Việt theo ngôn ngữ đã chọn', group: 'trial', def: true });
RELEASE_GROUPS.trial = ['Trials', 'Thử nghiệm'];
