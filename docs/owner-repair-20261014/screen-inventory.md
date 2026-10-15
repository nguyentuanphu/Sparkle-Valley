# Screen inventory and remaining coverage

This is an explicit inventory, not a universal pass. Source review is separate from actual behavior checks. Listed checks use emulated Chromium; physical devices and production services remain unverified.

| Surface | Source | Current behavior evidence | Still needed |
|---|---|---|---|
| Welcome/loading/retry/update | index.html, launch.js, main.js, sw.js | boot pass; real Welcome images | cold/warm/offline/packed/update/import-failure diagnosis |
| Character selection | ui.js, style.css | ownerround portrait/landscape; matching EN/VI bounds and images | first-player flow, keyboard, long names, safe areas, split screen |
| Profile editor | ui.js | source inspected | stable redraw/footer/focus/privacy capture |
| Grown-ups | ui.js | ownerround body/footer non-overlap | latest matching images, keyboard/long text |
| Quick settings/tester settings | ui.js, tester.js | per-device retention wording repaired | every policy/recovery state |
| Pad Map | ui.js | existing component retained | category/city scrolling and navigation state |
| Pad Bag | ui.js | help/cancel/equip/food tests; real images | every resource/treasure/legacy/prize/glider/pet action and optical bounds |
| Pad Shop | ui.js, shop.js | shop/ownerround pass; matching Pad entry images | purchase/gift/outfit combinations, scroll restoration |
| Pad Wardrobe | shop.js | visible avatar fit; real mirror images | every worn/product comparison; settings preserved |
| Direct stall Shop | shop.js | shop pass | direct-entry return route/scroll repeated cycles |
| Pad Log/Album/Passport | ui.js, passport.js | source retained | folds, long content, footer clearance |
| Pad Camera/Festivals/Friend | ui.js | source retained | focus, modal/tray coordination, offline/error states |
| Play menu/categories | ui.js | menu activity close returns checked | all categories/scroll; NPC origin/error/repeated cycles |
| Activity window | games/frame.js | lifecycle fixture repair, ages pass | broader games/speed1/2/3/5 and interruption |
| Dialogue/how-to | popups.js, howto.js | source retained | long bilingual content/choice overflow and save/update boundaries |
| Story shelf/book/film | tales.js, film.js | source retained | all films rendered; narration/music cleanup; scene individuality |
| Camera eye/place tray | hud.js, wayfind.js | vertical source; explicit compass enable/disable contract passed | collision, orientation, safe areas, touch/focus |
| Horizontal Audio icons | soundsheet.js, hud.js | Three icons only, compact Audio left of chat; bounds/focus/independent states225s and seven-layout quest/navigation235s; active Mic EN/VI48s | Exact3599d24d off/on comparisons complete; newer HUD pictures have working-tree hashes. Physical-device and connected Mic pictures missing |
| Ladybird Tester | tester.js, screencapture.js | report/capture/storage behavior; real images | receipt/status detail, keyboard, composed fallback real Safari |
| Ladybird Autoplay | autoplay.js | tabs/draft preservation; run/stop/restore checked | all speeds/partial/error reporting and live state switching |
| My reports/fixed/rewards | tester.js, testerrewards.js | testerreport pass | honest retest reproduction; long lists/privacy/backend receipt |
| Family photos/pairing/postcards/recovery | familydevices.js | Current bounded pairing/transfer/stale-response/offline/revocation rerun passed229s under Node22; earlier CI failure unresolved | reassignment/recovery decisions, production proof and exact-candidate CI diagnosis |
| Pet adoption/trade/cooking/house/local shops | feature modules and popups.js | source retained | window/action inventory and runtime repeated-cycle cases |
| Studio navigation/dashboard | studio/ui/app.js | current code review | phone/computer keyboard/EN/VI screenshots |
| Studio Releases/categories/devices | studio/ui/app.js | source folds/per-device contracts present | actual visibility/persistence/touch and old policy precedence |
| Studio Sparkle Lab | studio/ui/app.js | online/exe phone/tablet/desktop Studio361s; device policies, complete peeks, isolated saves and no Releases player fetch passed | exact-source menu/control pictures; slow/error/navigation cases and production load timing |
| Studio Analytics/Performance | studio/ui/app.js, players.mjs | current/historical/active version source repair; backend tests | actual screens/empty errors/list cap; production data |
| Studio Tester reports | studio/ui/app.js, tester backend | reporting path source reviewed | receipt-to-issue-to-release-to-retest proof |
| Studio Admins/custom permissions | studio/ui/app.js, admins.mjs | R75 source implementation retained | immediate list behavior; save/failure/enforcement current checks |
| Other Studio pages/dialogs | studio/ui/app.js, studio core | source folding helper present | enumerate every page/content group and error/loading states |
| Public-transport rider/cabin/exit | js/player.js, js/traffic.js, js/vehicles.js, js/rideview.js | six rendered bus/busAU/tramModern age cases83s and visibility restoration; ride54s fares/destinations/exits passed | 24 final exacta246d116 before/after rider/exit captures complete; coach/taxi/driving render, split-screen and physical-device comparisons missing |

No row implies all child-facing or Studio screens have been verified. Complete point-level scope is in audit-matrix.md and requirements.json.

15 Oct 2026 AEDT, exact b09 individual-report reproduction:21 panel/viewport/language cases from171 offscreen reports,20 actual screenshots under evidence/reported-screens-b09. Three checks passed:136 representative exact-label controls were reachable after their real disclosure/tab and native scroll;35 original controls/states remain unmatched. Duplicate labels, original inventory/progress state, physical Safari and matching R74 pictures are not established. These reports remain open; this is bounded current-state evidence, not171 fixes.
