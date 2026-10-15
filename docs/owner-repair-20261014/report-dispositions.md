# Open report dispositions (216 bug-labelled, through #299)

Refreshed 15 October 2026 AEDT: newest open report is still #299. No issue is closed or marked fixed by this document; each needs Release's round report and the owner's retest. Bodies, names, screenshots and device ids are not copied.

## Groups

| Group | Reports | What the evidence shows | What is still missing |
|---|---:|---|---|
| off-match | 136 | Current control reachable at the reported viewport/language (bounded Chromium probe, evidence/reported-screens-b09). R74 detector also counted scroll-reachable/background controls; repaired detector (tester-detection.js, check reportdetectors) separates them. | Original detailed state/duplicate labels not reproduced; physical device and owner retest pending |
| off-unmatched | 35 | Reported label/state not matched in the bounded probe; cause not established. | Needs the original window state (report screenshot in Studio) to reproduce |
| slow | 13 | r70 device frame-rate report (12-20 fps). Not reproducible in software-rendered test browser; PERF budgets checked by perf/battery/startup locally (solo) and festival patch budget (festhunt). | Physical-device fps measurement on the reporting device class (iOS/Windows) pending |
| import | 10 | 'Importing a module script failed' on r73 (hashed chunk names main-GMPRN3OC.js / c-7YK2XFTA.js): traced to the r74 deploy (live about 07:03 AEDT 14 Oct; reports 10:20 AEDT from an r73 page): r73/r74 service workers took over at once and deleted every older copy, so an open r73 page lost its later-loading files. Repaired this round (update waits, one older copy kept) and a missing part now offers the update (WO-05 point 11). | Timeline match, not a replay of the phone; owner retest after the next deploy |
| noopen | 6 | R74 detector reported 'did not open' whenever no game window existed N s after the request, so an open-then-quick-close counted as a failure; #186's own log shows shapes/colors opening and being closed before their noopen reports. Repaired: observeGameOpen watches the actual open (js/tester-detection.js, check reportdetectors). | Owner retest on a device |
| autoplay-r74 | 11 | Same six shrine learning games (letters, numbers, counting, pattern, colors, shapes). 'slow: 0 frames a second' came from accelerated autoplay; now only judged at 1x (js/autoplay.js one()). Walk/close behaviour: see probe result. | See probe column |
| freeze220 | 1 | 125 s gap on iOS Safari at the village with no activity in the last 30 s: consistent with the app being suspended. Repair resets the frame sampler on visibilitychange/pagehide/pageshow/freeze/resume (js/tester.js). | No physical iOS proof |
| freeze261 | 1 | 3.4 s main-thread stall during repeated Ô Ăn Quan taps on Windows Chrome r74. | Not yet reproduced; needs a long-task probe of Ô Ăn Quan sowing |
| well86 | 1 | r70 iOS: tapping the village well showed a white screen and returned to the sign-in screen. | Not yet reproduced; needs a well-interaction probe on a phone viewport |
| roads34 | 1 | World art (roads vs Concept D drawings), labelled on-hold; map rebuild is outside this repair round. | Remains on hold |
| start36 | 1 | Startup slowness (WO-05 points 8-9): Welcome now shows immediately with real progress (check boot). | Packed cold/warm/offline timings on devices pending |

## Every report

| Report | Build | Kind | Title | Viewport | Group | Probe on current source |
|---|---|---|---|---|---|---|
| [#34](https://github.com/nguyentuanphu/Sparkle-Valley/issues/34) | - | manual/other | Roads and dirt roads look poor, not like the Concept D drawings | -  | roads34 | - |
| [#36](https://github.com/nguyentuanphu/Sparkle-Valley/issues/36) | - | manual/other | Start-up is slow every time: 10 to 20 s on a computer, up to a minute  | -  | start36 | - |
| [#77](https://github.com/nguyentuanphu/Sparkle-Valley/issues/77) | r70 | offscreen | [tester] offscreen: English | 430x873 vi | off-match | - |
| [#78](https://github.com/nguyentuanphu/Sparkle-Valley/issues/78) | r70 | offscreen | [tester] offscreen: English | 430x873 vi | off-unmatched | - |
| [#79](https://github.com/nguyentuanphu/Sparkle-Valley/issues/79) | r70 | offscreen | [tester] offscreen: English | 430x873 vi | off-match | - |
| [#80](https://github.com/nguyentuanphu/Sparkle-Valley/issues/80) | r70 | offscreen | [tester] offscreen: Camera dễtự xoay theo con | 430x873 vi | off-match | - |
| [#81](https://github.com/nguyentuanphu/Sparkle-Valley/issues/81) | r70 | offscreen | [tester] offscreen: Luôn ban ngày | 430x873 vi | off-match | - |
| [#82](https://github.com/nguyentuanphu/Sparkle-Valley/issues/82) | r69 | offscreen | [tester] offscreen: English | 1256x1332 vi | off-unmatched | - |
| [#83](https://github.com/nguyentuanphu/Sparkle-Valley/issues/83) | r69 | offscreen | [tester] offscreen: Xóa danh sách | 1256x1332 vi | off-unmatched | - |
| [#86](https://github.com/nguyentuanphu/Sparkle-Valley/issues/86) | r70 | manual/other | [tester] Ấn vào cái giếng bị trắng màn hình và out ra màn hình đăng nh | 428x879 vi | well86 | Not reproduced in emulation: 3 well taps at 428x879 VI on current and R74, no white screen, no sign-in return, no errors, worst frame gap 17-33 ms. iOS Safari memory pressure unverified |
| [#87](https://github.com/nguyentuanphu/Sparkle-Valley/issues/87) | r70 | offscreen | [tester] offscreen: Màn hình hình to | 428x581 vi | off-unmatched | - |
| [#88](https://github.com/nguyentuanphu/Sparkle-Valley/issues/88) | r70 | slow | [tester] slow: 19 frames a second | 428x879 vi | slow | - |
| [#89](https://github.com/nguyentuanphu/Sparkle-Valley/issues/89) | r70 | offscreen | [tester] offscreen: Sau lưng | 428x879 vi | off-match | - |
| [#90](https://github.com/nguyentuanphu/Sparkle-Valley/issues/90) | r70 | slow | [tester] slow: 18 frames a second | 428x879 vi | slow | - |
| [#91](https://github.com/nguyentuanphu/Sparkle-Valley/issues/91) | r70 | offscreen | [tester] offscreen: Giọng nói | 428x879 vi | off-match | - |
| [#92](https://github.com/nguyentuanphu/Sparkle-Valley/issues/92) | r70 | offscreen | [tester] offscreen: Điều khiển bằng giọng nói | 428x879 vi | off-match | - |
| [#93](https://github.com/nguyentuanphu/Sparkle-Valley/issues/93) | r70 | offscreen | [tester] offscreen: 7Festivals9 | 428x879 en | off-match | - |
| [#94](https://github.com/nguyentuanphu/Sparkle-Valley/issues/94) | r70 | offscreen | [tester] offscreen: 7Festivals9 | 428x879 en | off-match | - |
| [#95](https://github.com/nguyentuanphu/Sparkle-Valley/issues/95) | r70 | offscreen | [tester] offscreen: Easy cameraturns by itself | 428x879 en | off-match | - |
| [#96](https://github.com/nguyentuanphu/Sparkle-Valley/issues/96) | r70 | offscreen | [tester] offscreen: English | 428x879 en | off-match | - |
| [#97](https://github.com/nguyentuanphu/Sparkle-Valley/issues/97) | r70 | offscreen | [tester] offscreen: Voice control | 428x879 en | off-match | - |
| [#98](https://github.com/nguyentuanphu/Sparkle-Valley/issues/98) | r70 | offscreen | [tester] offscreen: 7Festivals9 | 428x879 en | off-match | - |
| [#99](https://github.com/nguyentuanphu/Sparkle-Valley/issues/99) | r70 | offscreen | [tester] offscreen: Learn | 428x879 en | off-match | - |
| [#100](https://github.com/nguyentuanphu/Sparkle-Valley/issues/100) | r70 | offscreen | [tester] offscreen: 7Festivals9 | 428x879 en | off-match | - |
| [#101](https://github.com/nguyentuanphu/Sparkle-Valley/issues/101) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-match | - |
| [#102](https://github.com/nguyentuanphu/Sparkle-Valley/issues/102) | r70 | offscreen | [tester] offscreen: 7Festivals9 | 428x879 en | off-match | - |
| [#103](https://github.com/nguyentuanphu/Sparkle-Valley/issues/103) | r70 | slow | [tester] slow: 17 frames a second | 428x879 en | slow | - |
| [#104](https://github.com/nguyentuanphu/Sparkle-Valley/issues/104) | r70 | slow | [tester] slow: 19 frames a second | 428x879 en | slow | - |
| [#105](https://github.com/nguyentuanphu/Sparkle-Valley/issues/105) | r70 | slow | [tester] slow: 20 frames a second | 428x879 en | slow | - |
| [#106](https://github.com/nguyentuanphu/Sparkle-Valley/issues/106) | r70 | slow | [tester] slow: 20 frames a second | 428x879 en | slow | - |
| [#107](https://github.com/nguyentuanphu/Sparkle-Valley/issues/107) | r70 | slow | [tester] slow: 19 frames a second | 428x879 en | slow | - |
| [#108](https://github.com/nguyentuanphu/Sparkle-Valley/issues/108) | r70 | slow | [tester] slow: 12 frames a second | 428x879 en | slow | - |
| [#109](https://github.com/nguyentuanphu/Sparkle-Valley/issues/109) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-match | - |
| [#110](https://github.com/nguyentuanphu/Sparkle-Valley/issues/110) | r70 | slow | [tester] slow: 17 frames a second | 428x879 en | slow | - |
| [#111](https://github.com/nguyentuanphu/Sparkle-Valley/issues/111) | r70 | slow | [tester] slow: 19 frames a second | 428x879 en | slow | - |
| [#112](https://github.com/nguyentuanphu/Sparkle-Valley/issues/112) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-match | - |
| [#113](https://github.com/nguyentuanphu/Sparkle-Valley/issues/113) | r70 | offscreen | [tester] offscreen: Invite | 428x879 en | off-unmatched | - |
| [#114](https://github.com/nguyentuanphu/Sparkle-Valley/issues/114) | r70 | offscreen | [tester] offscreen: Camera8 | 428x879 en | off-match | - |
| [#115](https://github.com/nguyentuanphu/Sparkle-Valley/issues/115) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-match | - |
| [#116](https://github.com/nguyentuanphu/Sparkle-Valley/issues/116) | r70 | slow | [tester] slow: 18 frames a second | 428x879 en | slow | - |
| [#117](https://github.com/nguyentuanphu/Sparkle-Valley/issues/117) | r70 | slow | [tester] slow: 14 frames a second | 428x879 en | slow | - |
| [#118](https://github.com/nguyentuanphu/Sparkle-Valley/issues/118) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-unmatched | - |
| [#119](https://github.com/nguyentuanphu/Sparkle-Valley/issues/119) | r70 | offscreen | [tester] offscreen: Test the connection | 428x879 en | off-match | - |
| [#120](https://github.com/nguyentuanphu/Sparkle-Valley/issues/120) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-unmatched | - |
| [#121](https://github.com/nguyentuanphu/Sparkle-Valley/issues/121) | r70 | offscreen | [tester] offscreen: Start | 428x879 en | off-match | - |
| [#122](https://github.com/nguyentuanphu/Sparkle-Valley/issues/122) | r70 | offscreen | [tester] offscreen: Map1 | 428x879 en | off-match | - |
| [#123](https://github.com/nguyentuanphu/Sparkle-Valley/issues/123) | r70 | autoplay | [tester] autoplay: What Comes Next?: slow: 18 frames a second | 428x879 en | slow | - |
| [#124](https://github.com/nguyentuanphu/Sparkle-Valley/issues/124) | r70 | noopen | [tester] noopen: numbers | 428x879 en | noopen | numbers opened and was won by real autoplay on current (reported-learning-after-96ad.json) |
| [#125](https://github.com/nguyentuanphu/Sparkle-Valley/issues/125) | r70 | noopen | [tester] noopen: letters | 428x879 en | noopen | letters opened and was won on current |
| [#126](https://github.com/nguyentuanphu/Sparkle-Valley/issues/126) | r70 | noopen | [tester] noopen: counting | 428x879 en | noopen | counting opened and was won on current |
| [#127](https://github.com/nguyentuanphu/Sparkle-Valley/issues/127) | r70 | noopen | [tester] noopen: pattern | 428x879 en | noopen | pattern opened and was won on current |
| [#128](https://github.com/nguyentuanphu/Sparkle-Valley/issues/128) | r70 | offscreen | [tester] offscreen: My scrapbook: decorate with stickers and | 1258x1335 en | off-match | - |
| [#129](https://github.com/nguyentuanphu/Sparkle-Valley/issues/129) | r70 | offscreen | [tester] offscreen: What is family play? | 1258x1335 en | off-match | - |
| [#130](https://github.com/nguyentuanphu/Sparkle-Valley/issues/130) | r70 | offscreen | [tester] offscreen: Glider | 1258x1335 en | off-match | - |
| [#131](https://github.com/nguyentuanphu/Sparkle-Valley/issues/131) | r70 | offscreen | [tester] offscreen: The Square Cake and the Round Cake | 1258x1335 en | off-match | - |
| [#132](https://github.com/nguyentuanphu/Sparkle-Valley/issues/132) | r70 | offscreen | [tester] offscreen: Kong Rong Shares the Pears | 1258x1335 en | off-match | - |
| [#133](https://github.com/nguyentuanphu/Sparkle-Valley/issues/133) | r70 | offscreen | [tester] offscreen: What Comes Next?☆☆☆☆ | 1258x1335 en | off-match | - |
| [#134](https://github.com/nguyentuanphu/Sparkle-Valley/issues/134) | r69 | offscreen | [tester] offscreen: Báo cáo của tôi | 1256x1332 vi | off-match | - |
| [#140](https://github.com/nguyentuanphu/Sparkle-Valley/issues/140) | r73 | error | [tester] error: Importing a module script failed. @ main-GMPRN3OC.js:1 | 430x873 vi | import | - |
| [#141](https://github.com/nguyentuanphu/Sparkle-Valley/issues/141) | r73 | error | [tester] error: Importing a module script failed. @ promise.js:0 | 430x873 vi | import | - |
| [#142](https://github.com/nguyentuanphu/Sparkle-Valley/issues/142) | r73 | offscreen | [tester] offscreen: slot on | 430x873 vi | off-unmatched | - |
| [#143](https://github.com/nguyentuanphu/Sparkle-Valley/issues/143) | r73 | offscreen | [tester] offscreen: 2Hoa keo vàng | 430x873 vi | off-unmatched | - |
| [#144](https://github.com/nguyentuanphu/Sparkle-Valley/issues/144) | r73 | offscreen | [tester] offscreen: 6Ớt | 430x873 vi | off-unmatched | - |
| [#145](https://github.com/nguyentuanphu/Sparkle-Valley/issues/145) | r73 | offscreen | [tester] offscreen: 2Nấm | 430x873 vi | off-unmatched | - |
| [#146](https://github.com/nguyentuanphu/Sparkle-Valley/issues/146) | r73 | offscreen | [tester] offscreen: 2Xoài | 430x873 vi | off-unmatched | - |
| [#147](https://github.com/nguyentuanphu/Sparkle-Valley/issues/147) | r73 | offscreen | [tester] offscreen: 2Gạo | 430x873 vi | off-match | - |
| [#148](https://github.com/nguyentuanphu/Sparkle-Valley/issues/148) | r73 | offscreen | [tester] offscreen: 18Táo | 430x873 vi | off-unmatched | - |
| [#149](https://github.com/nguyentuanphu/Sparkle-Valley/issues/149) | r73 | offscreen | [tester] offscreen: Cánh lượn | 430x873 vi | off-match | - |
| [#150](https://github.com/nguyentuanphu/Sparkle-Valley/issues/150) | r73 | offscreen | [tester] offscreen: Quà hội làng | 430x873 vi | off-unmatched | - |
| [#151](https://github.com/nguyentuanphu/Sparkle-Valley/issues/151) | r73 | offscreen | [tester] offscreen: Diều sáo | 430x873 vi | off-match | - |
| [#152](https://github.com/nguyentuanphu/Sparkle-Valley/issues/152) | r73 | offscreen | [tester] offscreen: Đang mặc | 430x873 vi | off-match | - |
| [#153](https://github.com/nguyentuanphu/Sparkle-Valley/issues/153) | r73 | offscreen | [tester] offscreen: Quần áo và phụ kiện | 430x873 vi | off-match | - |
| [#154](https://github.com/nguyentuanphu/Sparkle-Valley/issues/154) | r73 | offscreen | [tester] offscreen: Bạn bè10 | 430x873 vi | off-match | - |
| [#155](https://github.com/nguyentuanphu/Sparkle-Valley/issues/155) | r73 | offscreen | [tester] offscreen: 7Lễ hội9 | 430x873 vi | off-match | - |
| [#156](https://github.com/nguyentuanphu/Sparkle-Valley/issues/156) | r73 | offscreen | [tester] offscreen: Lễ hội ánh sáng Diwali | 430x873 vi | off-match | - |
| [#157](https://github.com/nguyentuanphu/Sparkle-Valley/issues/157) | r73 | offscreen | [tester] offscreen: Tuần lễ NAIDOC | 430x873 vi | off-match | - |
| [#158](https://github.com/nguyentuanphu/Sparkle-Valley/issues/158) | r73 | offscreen | [tester] offscreen: Tuần lễ Hòa giải | 430x873 vi | off-match | - |
| [#159](https://github.com/nguyentuanphu/Sparkle-Valley/issues/159) | r73 | offscreen | [tester] offscreen: Ngày Anzac | 430x873 vi | off-match | - |
| [#160](https://github.com/nguyentuanphu/Sparkle-Valley/issues/160) | r73 | offscreen | [tester] offscreen: Thu hoạch | 430x873 vi | off-match | - |
| [#161](https://github.com/nguyentuanphu/Sparkle-Valley/issues/161) | r73 | offscreen | [tester] offscreen: Chơi một trò | 430x873 vi | off-match | - |
| [#162](https://github.com/nguyentuanphu/Sparkle-Valley/issues/162) | r73 | offscreen | [tester] offscreen: Bưu thiếp 0/2 | 430x873 vi | off-match | - |
| [#163](https://github.com/nguyentuanphu/Sparkle-Valley/issues/163) | r73 | offscreen | [tester] offscreen: Ghé thăm | 430x873 vi | off-match | - |
| [#164](https://github.com/nguyentuanphu/Sparkle-Valley/issues/164) | r73 | offscreen | [tester] offscreen: Ba lô2 | 430x873 vi | off-match | - |
| [#165](https://github.com/nguyentuanphu/Sparkle-Valley/issues/165) | r73 | offscreen | [tester] offscreen: Bản đồ1 | 430x873 vi | off-match | - |
| [#166](https://github.com/nguyentuanphu/Sparkle-Valley/issues/166) | r73 | offscreen | [tester] offscreen: Mặt của con | 430x873 vi | off-match | - |
| [#167](https://github.com/nguyentuanphu/Sparkle-Valley/issues/167) | r73 | offscreen | [tester] offscreen: Ngang phố | 430x873 vi | off-match | - |
| [#168](https://github.com/nguyentuanphu/Sparkle-Valley/issues/168) | r73 | offscreen | [tester] offscreen: Trên cao | 430x873 vi | off-match | - |
| [#169](https://github.com/nguyentuanphu/Sparkle-Valley/issues/169) | r73 | offscreen | [tester] offscreen: Cài đặt phụ huynhnhấn giữ | 430x873 vi | off-match | - |
| [#170](https://github.com/nguyentuanphu/Sparkle-Valley/issues/170) | r73 | offscreen | [tester] offscreen: Giữ để thôi làm người thử | 430x873 vi | off-match | - |
| [#171](https://github.com/nguyentuanphu/Sparkle-Valley/issues/171) | r73 | offscreen | [tester] offscreen: Ông bà | 430x873 vi | off-match | - |
| [#172](https://github.com/nguyentuanphu/Sparkle-Valley/issues/172) | r73 | offscreen | [tester] offscreen: Dễ thương | 430x873 vi | off-match | - |
| [#173](https://github.com/nguyentuanphu/Sparkle-Valley/issues/173) | r73 | offscreen | [tester] offscreen: Tự nhiên | 430x873 vi | off-match | - |
| [#174](https://github.com/nguyentuanphu/Sparkle-Valley/issues/174) | r73 | offscreen | [tester] offscreen: Tiếng động | 430x873 vi | off-match | - |
| [#175](https://github.com/nguyentuanphu/Sparkle-Valley/issues/175) | r73 | offscreen | [tester] offscreen: Nhạc | 430x873 vi | off-match | - |
| [#176](https://github.com/nguyentuanphu/Sparkle-Valley/issues/176) | r73 | offscreen | [tester] offscreen: Tiếng Việt | 430x873 vi | off-match | - |
| [#177](https://github.com/nguyentuanphu/Sparkle-Valley/issues/177) | r73 | offscreen | [tester] offscreen: Bà Rịa–Vũng Tàu | 430x873 vi | off-unmatched | - |
| [#178](https://github.com/nguyentuanphu/Sparkle-Valley/issues/178) | r73 | offscreen | [tester] offscreen: TP. Hồ Chí Minh | 430x873 vi | off-unmatched | - |
| [#179](https://github.com/nguyentuanphu/Sparkle-Valley/issues/179) | r73 | offscreen | [tester] offscreen: Chợ Ba Miền | 430x873 vi | off-unmatched | - |
| [#180](https://github.com/nguyentuanphu/Sparkle-Valley/issues/180) | r73 | offscreen | [tester] offscreen: Hội An | 430x873 vi | off-unmatched | - |
| [#181](https://github.com/nguyentuanphu/Sparkle-Valley/issues/181) | r73 | offscreen | [tester] offscreen: Nhà | 430x873 vi | off-match | - |
| [#182](https://github.com/nguyentuanphu/Sparkle-Valley/issues/182) | r73 | offscreen | [tester] offscreen: Bạn bè10 | 430x873 vi | off-match | - |
| [#183](https://github.com/nguyentuanphu/Sparkle-Valley/issues/183) | r73 | offscreen | [tester] offscreen: 7Lễ hội9 | 430x873 vi | off-match | - |
| [#184](https://github.com/nguyentuanphu/Sparkle-Valley/issues/184) | r73 | error | [tester] error: Importing a module script failed. @ main-GMPRN3OC.js:1 | 430x873 vi | import | - |
| [#185](https://github.com/nguyentuanphu/Sparkle-Valley/issues/185) | r73 | error | [tester] error: Importing a module script failed. @ promise.js:0 | 430x873 vi | import | - |
| [#186](https://github.com/nguyentuanphu/Sparkle-Valley/issues/186) | r73 | manual/other | [tester] broken | 430x873 vi | import | Its log shows shapes/colors opened then closed before 'noopen' was sent (old detector); the import errors are in the import group |
| [#187](https://github.com/nguyentuanphu/Sparkle-Valley/issues/187) | r73 | noopen | [tester] noopen: colors | 430x873 vi | noopen | colors opened and was won on current |
| [#188](https://github.com/nguyentuanphu/Sparkle-Valley/issues/188) | r73 | noopen | [tester] noopen: shapes | 430x873 vi | noopen | shapes opened and was won on current (walk stall separately fixed, #251) |
| [#189](https://github.com/nguyentuanphu/Sparkle-Valley/issues/189) | r73 | autoplay | [tester] autoplay: Nghe Bà Năm kể Sự tích dưa hấu: lỗi: Importing a mo | 430x873 vi | import | - |
| [#190](https://github.com/nguyentuanphu/Sparkle-Valley/issues/190) | r73 | autoplay | [tester] autoplay: Nghe Bà Năm kể Sự tích dưa hấu: lỗi: Importing a mo | 430x873 vi | import | - |
| [#191](https://github.com/nguyentuanphu/Sparkle-Valley/issues/191) | r73 | error | [tester] error: Importing a module script failed. @ c-7YK2XFTA.js:1 | 430x873 vi | import | - |
| [#192](https://github.com/nguyentuanphu/Sparkle-Valley/issues/192) | r73 | error | [tester] error: Importing a module script failed. @ promise.js:0 | 430x873 vi | import | - |
| [#193](https://github.com/nguyentuanphu/Sparkle-Valley/issues/193) | r73 | autoplay | [tester] autoplay: Nghe Bà Năm kể Sự tích dưa hấu: lỗi: Importing a mo | 430x873 vi | import | - |
| [#196](https://github.com/nguyentuanphu/Sparkle-Valley/issues/196) | r74 | offscreen | [tester] offscreen: High up | 430x873 en | off-unmatched | - |
| [#197](https://github.com/nguyentuanphu/Sparkle-Valley/issues/197) | r74 | offscreen | [tester] offscreen: Behind me | 430x873 en | off-unmatched | - |
| [#198](https://github.com/nguyentuanphu/Sparkle-Valley/issues/198) | r74 | offscreen | [tester] offscreen: Grandparent | 430x873 en | off-unmatched | - |
| [#199](https://github.com/nguyentuanphu/Sparkle-Valley/issues/199) | r74 | offscreen | [tester] offscreen: Cute | 430x873 en | off-unmatched | - |
| [#200](https://github.com/nguyentuanphu/Sparkle-Valley/issues/200) | r74 | offscreen | [tester] offscreen: Natural | 430x873 en | off-unmatched | - |
| [#201](https://github.com/nguyentuanphu/Sparkle-Valley/issues/201) | r74 | offscreen | [tester] offscreen: Talking | 430x873 en | off-unmatched | - |
| [#202](https://github.com/nguyentuanphu/Sparkle-Valley/issues/202) | r74 | offscreen | [tester] offscreen: Sounds | 430x873 en | off-unmatched | - |
| [#203](https://github.com/nguyentuanphu/Sparkle-Valley/issues/203) | r74 | offscreen | [tester] offscreen: Music | 430x873 en | off-unmatched | - |
| [#204](https://github.com/nguyentuanphu/Sparkle-Valley/issues/204) | r74 | offscreen | [tester] offscreen: Tiếng Việt | 430x873 en | off-unmatched | - |
| [#205](https://github.com/nguyentuanphu/Sparkle-Valley/issues/205) | r74 | offscreen | [tester] offscreen: English | 430x873 en | off-unmatched | - |
| [#206](https://github.com/nguyentuanphu/Sparkle-Valley/issues/206) | r74 | offscreen | [tester] offscreen: Always daytime | 430x873 en | off-match | - |
| [#207](https://github.com/nguyentuanphu/Sparkle-Valley/issues/207) | r74 | offscreen | [tester] offscreen: My face | 430x873 en | off-match | - |
| [#208](https://github.com/nguyentuanphu/Sparkle-Valley/issues/208) | r74 | offscreen | [tester] offscreen: Street view | 430x873 en | off-match | - |
| [#209](https://github.com/nguyentuanphu/Sparkle-Valley/issues/209) | r74 | offscreen | [tester] offscreen: High up | 430x873 en | off-match | - |
| [#210](https://github.com/nguyentuanphu/Sparkle-Valley/issues/210) | r74 | offscreen | [tester] offscreen: Behind me | 430x873 en | off-match | - |
| [#211](https://github.com/nguyentuanphu/Sparkle-Valley/issues/211) | r74 | offscreen | [tester] offscreen: Grandparent | 430x873 en | off-match | - |
| [#212](https://github.com/nguyentuanphu/Sparkle-Valley/issues/212) | r74 | offscreen | [tester] offscreen: Cute | 430x873 en | off-match | - |
| [#213](https://github.com/nguyentuanphu/Sparkle-Valley/issues/213) | r74 | offscreen | [tester] offscreen: Natural | 430x873 en | off-match | - |
| [#214](https://github.com/nguyentuanphu/Sparkle-Valley/issues/214) | r74 | offscreen | [tester] offscreen: Talking | 430x873 en | off-match | - |
| [#215](https://github.com/nguyentuanphu/Sparkle-Valley/issues/215) | r74 | offscreen | [tester] offscreen: Sounds | 430x873 en | off-match | - |
| [#216](https://github.com/nguyentuanphu/Sparkle-Valley/issues/216) | r74 | offscreen | [tester] offscreen: Music | 430x873 en | off-match | - |
| [#217](https://github.com/nguyentuanphu/Sparkle-Valley/issues/217) | r74 | offscreen | [tester] offscreen: Tiếng Việt | 430x873 en | off-match | - |
| [#218](https://github.com/nguyentuanphu/Sparkle-Valley/issues/218) | r74 | offscreen | [tester] offscreen: Close | 430x873 en | off-match | - |
| [#219](https://github.com/nguyentuanphu/Sparkle-Valley/issues/219) | r74 | offscreen | [tester] offscreen: Send | 430x873 en | off-match | - |
| [#220](https://github.com/nguyentuanphu/Sparkle-Valley/issues/220) | r74 | freeze | [tester] freeze: 99.4 s | 430x873 en | freeze220 | Not reproducible here (needs iOS suspend); sampler reset on suspend is in place |
| [#221](https://github.com/nguyentuanphu/Sparkle-Valley/issues/221) | r74 | offscreen | [tester] offscreen: Beach | 430x873 en | off-match | - |
| [#222](https://github.com/nguyentuanphu/Sparkle-Valley/issues/222) | r74 | offscreen | [tester] offscreen: Friend10 | 430x873 en | off-match | - |
| [#223](https://github.com/nguyentuanphu/Sparkle-Valley/issues/223) | r74 | offscreen | [tester] offscreen: Swap and Trade☆☆☆☆ | 430x873 en | off-match | - |
| [#224](https://github.com/nguyentuanphu/Sparkle-Valley/issues/224) | r74 | offscreen | [tester] offscreen: Wait and Grow☆☆☆☆ | 430x873 en | off-match | - |
| [#225](https://github.com/nguyentuanphu/Sparkle-Valley/issues/225) | r74 | offscreen | [tester] offscreen: Which Is Cheaper?☆☆☆☆ | 430x873 en | off-match | - |
| [#226](https://github.com/nguyentuanphu/Sparkle-Valley/issues/226) | r74 | offscreen | [tester] offscreen: Shopping List☆☆☆☆ | 430x873 en | off-match | - |
| [#227](https://github.com/nguyentuanphu/Sparkle-Valley/issues/227) | r74 | offscreen | [tester] offscreen: Little Shopkeeper☆☆☆☆ | 430x873 en | off-match | - |
| [#228](https://github.com/nguyentuanphu/Sparkle-Valley/issues/228) | r74 | offscreen | [tester] offscreen: Lucky Money Count☆☆☆☆ | 430x873 en | off-match | - |
| [#229](https://github.com/nguyentuanphu/Sparkle-Valley/issues/229) | r74 | offscreen | [tester] offscreen: Three Jars☆☆☆☆ | 430x873 en | off-match | - |
| [#230](https://github.com/nguyentuanphu/Sparkle-Valley/issues/230) | r74 | offscreen | [tester] offscreen: Need or Want?☆☆☆☆ | 430x873 en | off-match | - |
| [#231](https://github.com/nguyentuanphu/Sparkle-Valley/issues/231) | r74 | offscreen | [tester] offscreen: $Coin or Note?☆☆☆☆ | 430x873 en | off-match | - |
| [#232](https://github.com/nguyentuanphu/Sparkle-Valley/issues/232) | r74 | offscreen | [tester] offscreen: Piggy Bank☆☆☆☆ | 430x873 en | off-match | - |
| [#233](https://github.com/nguyentuanphu/Sparkle-Valley/issues/233) | r74 | offscreen | [tester] offscreen: How Do They Feel?☆☆☆☆ | 430x873 en | off-match | - |
| [#234](https://github.com/nguyentuanphu/Sparkle-Valley/issues/234) | r74 | offscreen | [tester] offscreen: My Body☆☆☆ | 430x873 en | off-unmatched | - |
| [#235](https://github.com/nguyentuanphu/Sparkle-Valley/issues/235) | r74 | offscreen | [tester] offscreen: Picture Sudoku☆☆☆☆ | 430x873 en | off-match | - |
| [#236](https://github.com/nguyentuanphu/Sparkle-Valley/issues/236) | r74 | offscreen | [tester] offscreen: Build a Tower☆☆☆☆ | 430x873 en | off-match | - |
| [#237](https://github.com/nguyentuanphu/Sparkle-Valley/issues/237) | r74 | offscreen | [tester] offscreen: Tower Stack☆☆☆☆ | 430x873 en | off-match | - |
| [#238](https://github.com/nguyentuanphu/Sparkle-Valley/issues/238) | r74 | offscreen | [tester] offscreen: Memory Match☆☆ | 430x873 en | off-unmatched | - |
| [#239](https://github.com/nguyentuanphu/Sparkle-Valley/issues/239) | r74 | offscreen | [tester] offscreen: Small to Big☆☆☆☆ | 430x873 en | off-match | - |
| [#240](https://github.com/nguyentuanphu/Sparkle-Valley/issues/240) | r74 | offscreen | [tester] offscreen: Shadow Shapes☆☆☆☆ | 430x873 en | off-match | - |
| [#241](https://github.com/nguyentuanphu/Sparkle-Valley/issues/241) | r74 | offscreen | [tester] offscreen: What Comes Next?☆☆☆ | 430x873 en | off-unmatched | - |
| [#242](https://github.com/nguyentuanphu/Sparkle-Valley/issues/242) | r74 | offscreen | [tester] offscreen: Read With Me☆☆☆☆ | 430x873 en | off-match | - |
| [#243](https://github.com/nguyentuanphu/Sparkle-Valley/issues/243) | r74 | offscreen | [tester] offscreen: Sentence Train☆☆☆☆ | 430x873 en | off-match | - |
| [#244](https://github.com/nguyentuanphu/Sparkle-Valley/issues/244) | r74 | offscreen | [tester] offscreen: Word and Picture☆☆☆☆ | 430x873 en | off-match | - |
| [#245](https://github.com/nguyentuanphu/Sparkle-Valley/issues/245) | r74 | offscreen | [tester] offscreen: Syllable Drum☆☆☆☆ | 430x873 en | off-match | - |
| [#246](https://github.com/nguyentuanphu/Sparkle-Valley/issues/246) | r74 | offscreen | [tester] offscreen: Tone Marks☆☆☆☆ | 430x873 en | off-match | - |
| [#247](https://github.com/nguyentuanphu/Sparkle-Valley/issues/247) | r74 | offscreen | [tester] offscreen: Word Balloons☆☆☆☆ | 430x873 en | off-match | - |
| [#248](https://github.com/nguyentuanphu/Sparkle-Valley/issues/248) | r74 | offscreen | [tester] offscreen: Rhyme Time☆☆☆☆ | 430x873 en | off-match | - |
| [#249](https://github.com/nguyentuanphu/Sparkle-Valley/issues/249) | r74 | offscreen | [tester] offscreen: Word Builder☆☆☆☆ | 430x873 en | off-match | - |
| [#250](https://github.com/nguyentuanphu/Sparkle-Valley/issues/250) | r74 | autoplay | [tester] autoplay: Rainbow Paints: did not close | 1260x1339 en | autoplay-r74 | Rainbow Paints did not close: not reproduced in one run per source |
| [#251](https://github.com/nguyentuanphu/Sparkle-Valley/issues/251) | r74 | autoplay | [tester] autoplay: Shadow Shapes: stuck at 233, -56 (plateau); did not | 1260x1339 en | autoplay-r74 | REPRODUCED and repaired: 8/8 fly-ins stalled at 231,-56 on 96ad676c; clearSpot chose ground past the valley edge beside the shadow theatre. After fix 8/8 reach it (check ownertheatreapproach). R74 hid it by accepting a landing within 8 m |
| [#252](https://github.com/nguyentuanphu/Sparkle-Valley/issues/252) | r74 | autoplay | [tester] autoplay: Number Train: did not close; slow: 0 frames a secon | 1260x1339 en | autoplay-r74 | Number Train did not close: closed normally in one run on R74 and current; 0 fps part judged only at 1x now |
| [#253](https://github.com/nguyentuanphu/Sparkle-Valley/issues/253) | r74 | autoplay | [tester] autoplay: Letter Hunt: stuck at 20, -83 (plateau); slow: 0 fr | 1260x1339 en | autoplay-r74 | Letter Hunt stuck at 20,-83: one real-autoplay run on R74 and current reached it; not reproduced |
| [#254](https://github.com/nguyentuanphu/Sparkle-Valley/issues/254) | r74 | autoplay | [tester] autoplay: Shadow Shapes: slow: 0 frames a second | 1260x1339 en | autoplay-r74 | Shadow Shapes 0 fps: accelerated-autoplay frame count; now judged only at 1x |
| [#255](https://github.com/nguyentuanphu/Sparkle-Valley/issues/255) | r74 | autoplay | [tester] autoplay: Shadow Shapes: did not close | 1260x1339 en | autoplay-r74 | Shadow Shapes did not close: one real-autoplay run on R74 and on current closed normally; not reproduced |
| [#256](https://github.com/nguyentuanphu/Sparkle-Valley/issues/256) | r74 | autoplay | [tester] autoplay: stuck at 233, -56 (plateau) | 1260x1339 en | autoplay-r74 | Same as #251 (stuck at 233,-56): reproduced and repaired |
| [#257](https://github.com/nguyentuanphu/Sparkle-Valley/issues/257) | r74 | autoplay | [tester] autoplay: Number Train: slow: 0 frames a second | 1260x1339 en | autoplay-r74 | Number Train 0 fps: accelerated-autoplay frame count; now judged only at 1x |
| [#258](https://github.com/nguyentuanphu/Sparkle-Valley/issues/258) | r74 | autoplay | [tester] autoplay: Number Train: did not close | 1260x1339 en | autoplay-r74 | Number Train did not close: not reproduced in one run per source |
| [#259](https://github.com/nguyentuanphu/Sparkle-Valley/issues/259) | r74 | autoplay | [tester] autoplay: Letter Hunt: slow: 0 frames a second | 1260x1339 en | autoplay-r74 | Letter Hunt 0 fps: accelerated-autoplay frame count; now judged only at 1x |
| [#260](https://github.com/nguyentuanphu/Sparkle-Valley/issues/260) | r74 | autoplay | [tester] autoplay: stuck at 20, -83 (plateau) | 1260x1339 en | autoplay-r74 | Same as #253: not reproduced in one run per source |
| [#261](https://github.com/nguyentuanphu/Sparkle-Valley/issues/261) | r74 | freeze | [tester] freeze: 3.4 s | 1260x1339 en | freeze261 | Not reproduced in emulation: 162-316 taps over 77-150 s, worst main-thread task 460 ms (current) / 526 ms (R74), idle valley 645 ms (reported-probes-*.json). A first probe counted page start-up tasks (2-4 s) and was corrected. Needs a trace on the reporting Windows device |
| [#262](https://github.com/nguyentuanphu/Sparkle-Valley/issues/262) | r74 | offscreen | [tester] offscreen: ABCFirst Sounds☆☆☆☆ | 1260x1337 en | off-match | - |
| [#263](https://github.com/nguyentuanphu/Sparkle-Valley/issues/263) | r74 | offscreen | [tester] offscreen: Opposites☆☆☆☆ | 1260x1337 en | off-match | - |
| [#264](https://github.com/nguyentuanphu/Sparkle-Valley/issues/264) | r74 | offscreen | [tester] offscreen: First Words: Chinese and Hindi☆☆☆☆ | 1260x1337 en | off-match | - |
| [#265](https://github.com/nguyentuanphu/Sparkle-Valley/issues/265) | r74 | offscreen | [tester] offscreen: Two Homes Words☆☆☆☆ | 1260x1337 en | off-match | - |
| [#266](https://github.com/nguyentuanphu/Sparkle-Valley/issues/266) | r74 | offscreen | [tester] offscreen: ABCLetter Hunt☆☆☆☆ | 1260x1337 en | off-match | - |
| [#267](https://github.com/nguyentuanphu/Sparkle-Valley/issues/267) | r74 | offscreen | [tester] offscreen: Add It Up☆☆☆☆ | 1260x1337 en | off-match | - |
| [#268](https://github.com/nguyentuanphu/Sparkle-Valley/issues/268) | r74 | offscreen | [tester] offscreen: What's the Time?☆☆☆☆ | 1260x1337 en | off-match | - |
| [#269](https://github.com/nguyentuanphu/Sparkle-Valley/issues/269) | r74 | offscreen | [tester] offscreen: Dragon Bridge Count☆☆☆☆ | 1260x1337 en | off-match | - |
| [#270](https://github.com/nguyentuanphu/Sparkle-Valley/issues/270) | r74 | offscreen | [tester] offscreen: 7Days of the Week☆☆☆☆ | 1260x1337 en | off-match | - |
| [#271](https://github.com/nguyentuanphu/Sparkle-Valley/issues/271) | r74 | offscreen | [tester] offscreen: More or Less?☆☆☆☆ | 1260x1337 en | off-match | - |
| [#272](https://github.com/nguyentuanphu/Sparkle-Valley/issues/272) | r74 | offscreen | [tester] offscreen: Number Train☆☆☆☆ | 1260x1337 en | off-match | - |
| [#273](https://github.com/nguyentuanphu/Sparkle-Valley/issues/273) | r74 | offscreen | [tester] offscreen: How to play | 1260x1337 en | off-match | - |
| [#274](https://github.com/nguyentuanphu/Sparkle-Valley/issues/274) | r74 | offscreen | [tester] offscreen: Go there | 1260x1337 en | off-match | - |
| [#275](https://github.com/nguyentuanphu/Sparkle-Valley/issues/275) | r74 | offscreen | [tester] offscreen: 123Count With Me☆☆☆☆ | 1260x1337 en | off-match | - |
| [#276](https://github.com/nguyentuanphu/Sparkle-Valley/issues/276) | r74 | offscreen | [tester] offscreen: Save | 1260x1337 en | off-match | - |
| [#277](https://github.com/nguyentuanphu/Sparkle-Valley/issues/277) | r74 | offscreen | [tester] offscreen: Change player | 1260x1337 en | off-match | - |
| [#278](https://github.com/nguyentuanphu/Sparkle-Valley/issues/278) | r74 | offscreen | [tester] offscreen: + Add a player | 1260x1337 en | off-match | - |
| [#279](https://github.com/nguyentuanphu/Sparkle-Valley/issues/279) | r74 | offscreen | [tester] offscreen: Edit | 1260x1337 en | off-match | - |
| [#280](https://github.com/nguyentuanphu/Sparkle-Valley/issues/280) | r74 | offscreen | [tester] offscreen: Play report | 1260x1337 en | off-match | - |
| [#281](https://github.com/nguyentuanphu/Sparkle-Valley/issues/281) | r74 | offscreen | [tester] offscreen: 中文 | 1260x1337 en | off-match | - |
| [#282](https://github.com/nguyentuanphu/Sparkle-Valley/issues/282) | r74 | offscreen | [tester] offscreen: Off | 1260x1337 en | off-match | - |
| [#283](https://github.com/nguyentuanphu/Sparkle-Valley/issues/283) | r74 | offscreen | [tester] offscreen: TPN | 1260x1337 en | off-unmatched | - |
| [#284](https://github.com/nguyentuanphu/Sparkle-Valley/issues/284) | r74 | offscreen | [tester] offscreen: Remove | 1260x1337 en | off-match | - |
| [#285](https://github.com/nguyentuanphu/Sparkle-Valley/issues/285) | r74 | offscreen | [tester] offscreen: ✓ TPN | 1260x1337 en | off-unmatched | - |
| [#286](https://github.com/nguyentuanphu/Sparkle-Valley/issues/286) | r74 | offscreen | [tester] offscreen: + Add mission | 1260x1337 en | off-match | - |
| [#287](https://github.com/nguyentuanphu/Sparkle-Valley/issues/287) | r74 | offscreen | [tester] offscreen: Save backup | 1260x1337 en | off-match | - |
| [#288](https://github.com/nguyentuanphu/Sparkle-Valley/issues/288) | r74 | offscreen | [tester] offscreen: Test the connection | 1260x1337 en | off-match | - |
| [#289](https://github.com/nguyentuanphu/Sparkle-Valley/issues/289) | r74 | offscreen | [tester] offscreen: Pretty | 1260x1337 en | off-match | - |
| [#290](https://github.com/nguyentuanphu/Sparkle-Valley/issues/290) | r74 | offscreen | [tester] offscreen: Auto | 1260x1337 en | off-match | - |
| [#291](https://github.com/nguyentuanphu/Sparkle-Valley/issues/291) | r74 | offscreen | [tester] offscreen: Fast | 1260x1337 en | off-match | - |
| [#292](https://github.com/nguyentuanphu/Sparkle-Valley/issues/292) | r74 | offscreen | [tester] offscreen: Quick | 1260x1337 en | off-match | - |
| [#293](https://github.com/nguyentuanphu/Sparkle-Valley/issues/293) | r74 | offscreen | [tester] offscreen: Normal | 1260x1337 en | off-match | - |
| [#294](https://github.com/nguyentuanphu/Sparkle-Valley/issues/294) | r74 | offscreen | [tester] offscreen: Slow | 1260x1337 en | off-match | - |
| [#295](https://github.com/nguyentuanphu/Sparkle-Valley/issues/295) | r74 | offscreen | [tester] offscreen: Keep all voices on this device | 1260x1337 en | off-match | - |
| [#296](https://github.com/nguyentuanphu/Sparkle-Valley/issues/296) | r74 | offscreen | [tester] offscreen: Sounds | 1260x1337 en | off-unmatched | - |
| [#297](https://github.com/nguyentuanphu/Sparkle-Valley/issues/297) | r74 | offscreen | [tester] offscreen: Music | 1260x1337 en | off-unmatched | - |
| [#298](https://github.com/nguyentuanphu/Sparkle-Valley/issues/298) | r74 | offscreen | [tester] offscreen: Tiếng Việt | 1260x1337 en | off-match | - |
| [#299](https://github.com/nguyentuanphu/Sparkle-Valley/issues/299) | r74 | offscreen | [tester] offscreen: English | 1260x1337 en | off-match | - |
