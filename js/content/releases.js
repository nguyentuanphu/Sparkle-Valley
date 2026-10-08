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
  ...FESTCAL.map(F => ({ id: 'fest_' + F.id, en: F.en, vi: F.vi, group: 'festivals', def: true, icon: F.icon }))
];
export const RELEASE_GROUPS = { story: ['The lantern story', 'Truyện đèn lồng'], world: ['In the valley', 'Trong thung lũng'], festivals: ['Festivals', 'Lễ hội'] };
