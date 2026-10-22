# Plan: player-reported bugs, remaining work and TypeScript completion

Prepared 19 October 2026 AEDT, from live r87/main de8cc0ed. Owner requested a combined plan. This document proposes work; it does not choose the next version number or approve deployment. Release works alone under the standing owner instruction.

Implementation approved by the owner on 19 October 2026 AEDT. The owner subsequently chose r88 for the next reviewed release batch. Work progresses in the ledger at ../cores/tasks/bugs-typescript-progress-20261019.md; r88 deployment remains unapproved.

## Current position

- GitHub has 46 open bug issues, including 23 offscreen reports; 34 are marked robot-stuck. All latest submitted reports identify r86. No issue was filed after the verified r87 deployment at the time of this audit. This does not establish that reports are fixed or that Studio has no unprocessed reports.
- r87's final full suite passed 222/222 without retries. That does not establish zero user bugs. Reproduce reported device/entry paths on current code before changing or closing an issue.
- Source inventory: game 50 TypeScript / 207 JavaScript; Netlify 16 / 0; Studio 3 / 1 owned JavaScript plus third-party lame.min.js; tools 18 / 2; tests 10 / 80; marketing 0 / 17. These areas contain 307 remaining owned JavaScript sources. Generated JavaScript is excluded. Third-party files receive an explicit reviewed allowlist.
- Browser TypeScript build output is current. Existing checks cover selected files, and most configurations are not strict. Server conversion is complete; full-project conversion and strict checking are separate unfinished deliverables.
- Local r87 performance: download 2.519 MB, cached startup transfer 0 KB and battery check pass; world-build and startup timing assertions fail. Physical Mac/iPhone verification and perceptual audio review remain open.

## Work order

The rows are workstreams, not a promise that each fits one release. Split large conversions into reviewable batches; each runtime batch gets its own checks and deployment decision.

| Order | Work and reports | Result required before completion |
|---|---|---|
| 1 | Repair the reporting flow: #375 reporting UI/capture, #372 queued-report retry and the 23 offscreen issues listed below. Convert affected tester, capture and outbox sources to TypeScript first. | Reproduce 430x517 and 430x873 iPhone layouts, including keyboard/rotation/safe areas; stable shell with accessible Send/Close and a scrolling body. Implement the requested capture visibility correctly against an actual screenshot. Queued/Sending/Sent/Retry reflect durable storage and server receipts; timeout/offline/repeated retry preserves reports without duplicates. Distinguish inaccessible visible controls from intentionally hidden controls in the detector. |
| 2 | Repair game exit/quest/audio behaviour: #375 game-ending request; #350, #339, #337, #361-#363 and #365. Convert the affected game shell, quest/autoplay and voice-content sources. | Valley/NPC/quest launch returns to its origin on completion; Simple/Play launches retain the intended Next/Repeat flow. Preserve progress/rewards, category/scroll and two-player behaviour. Check the turtle-counting and lantern tasks from actual entry paths; verify the missing Vietnamese recordings and real playback, not merely manifest presence. Retest the already-shipped O An Quan and tester-overlay fixes before deciding whether changes are needed. |
| 3 | Repair camera occlusion: #369 gate; retest #368 electric-vehicle windscreen and #354 bridge/left-vehicle behaviour already addressed in live code. Verify the existing road-art work against #34. Convert affected world/occlusion sources. | Gate fading exposes the child/route without making collisions disappear; restore objects for other cameras and render errors. Reproduce the 430x517 report position/orientation, actual vehicle and view. Preserve exterior geometry, split screen, bridge crossing and parked-vehicle rules. Obtain owner visual confirmation for road appearance instead of assuming issue closure. |
| 4 | Investigate runtime freezes, slow frames and restarts: #355, #341, #364, #367, #370, #371, #373, #374 and #394. | Group repeat reports by trigger/device; profile reporting/capture bursts, game transitions, geometry/shader work and resource lifetimes separately. Repair demonstrated bottlenecks/leaks and verify normal-speed movement plus repeated windows/games. Record physical-device results separately; keep the iPhone/Mac cure unverified until tested there. |
| 5 | Improve startup and world rendering: #36 and remaining S4/S2/S3. Convert touched world builders and startup dependencies. | Finish measured network/sticker deferral while retaining offline code and honest loading states. Batch compatible static meshes while preserving culling, outlines, shadows, collision and editing. For staged construction, first map dependencies; build the starting area before play, finish distant areas safely, and wait before entering/warping to an unfinished area. Measure playable-ready and all-built separately, retaining complete-world checks and the unchanged budgets. Compare cold/cached/offline/update starts on the same machine and on available real devices. |
| 6 | Complete remaining first-party game, world, content and UI TypeScript. Earlier rows cover affected modules first; convert the remaining sources in bounded subsystem batches. | Shared entity/profile/message contracts, typed content registries and checked module boundaries. Rename-only commit before type/behaviour edits; preserve persistent IDs, saved data, map coordinates, rules and EN/VI. Every newly converted source participates in an explicit type-check configuration. |
| 7 | Convert remaining tests, two tool prototypes, Studio translation source and marketing scripts. | Test/workflow/package-script references use the correct Node .mts/.cts or built browser .js paths. Existing assertions and discovery continue to run. Add an inventory check that rejects unapproved owned JavaScript source and TypeScript missing from the build/check coverage. Browser output, vendor libraries, generated bundles, HTML/CSS and appropriate shell/Python scripts stay in their normal formats. |
| 8 | Finish strict checking and reconcile pending feature work. | Extend strict checking by subsystem, with a ratchet that cannot increase unchecked/non-strict files. No broad any, suppressions or unchecked casts to hide errors. Retain explicit runtime validation for saves, storage, API and user content. Separately resolve the missing ten-drawing-game brief/source, permanent chapter locations and Vung Tau game before implementation; TypeScript completion does not mean those features exist. |

## Verification and release rules

1. Reproduce each report on current r87 or the new candidate, preserving its device, viewport, language, activity origin and keyboard state. Record whether it is reproduced, already fixed, duplicate, or still needs a real device. Consolidate duplicates using a parent issue without losing the original evidence. Review robot-stuck reports individually; automatic retry is not proof of repair.
2. Write a regression only when it verifies the reported behaviour or a meaningful shared contract. Preserve existing assertions and performance limits. Keep the original bug separate from a newly discovered issue.
3. Make an unchanged-content rename commit before converting each JavaScript source. Type-check that batch to zero errors; distinguish this from being strict. UI bug fixes and performance changes should have reviewable commits separate from mechanical migration.
4. Run relevant checks sequentially with tests/suite.mjs. If --changed selects the full suite, run it on GitHub. Never run two local suites/browser checks together. Each release runs the full GitHub suite, then local perf,battery,startup one at a time, and inspect EN/VI phone/tablet/computer screenshots, including landscape and keyboard where relevant.
5. Keep saves, purchases, profiles and private-family data intact. Test restore/update/offline paths when those contracts change. Do not log private keys or child-identifying data in public issues.
6. Completion means all intended first-party JS source is migrated and included in checks; strict completion additionally means the strict ratchet is finished. Keep the two statuses visible. A green subset check is not a claim that the whole repository is typed.
7. Report failures, retries, limitations and remaining issues; build the Netlify zip. Choose a round/version with the owner rather than assuming r88. Nothing reaches main or deploys without the round's explicit yes, deploy. Studio changes include the matching executable publication after deployment.

## Effort and checkpoints

- Planning allowance: roughly 6-10 conversion batches, with user-bug reproduction/fixes adding work; allow about 8-12 combined implementation/verification batches before strict completion is assessed. This is not a fixed number of releases or a time guarantee.
- Expect several days of focused work. The largest unknowns are actual iOS reproduction, shared world/entity types, remaining strict errors and the staged-world dependency split. Full GitHub release runs add roughly an hour each; avoid running a release suite after every mechanical file rename.
- Complete workstream 1 as the first pilot and use its measured effort/errors/regressions to revise the remaining estimate. Publish progress as actual files migrated, sources still remaining, strict coverage, reproduced/fixed bugs and unresolved device cases.
- Staged-area behaviour in row 5 is a concrete owner-review item because it changes when places become available. It keeps the normal map/content and never marks unfinished distant areas ready. The detailed contract remains in docs/r87/remaining-performance-plan.md. Independent bug/type work proceeds while that choice waits.
- Missing drawing code/brief and unavailable physical devices are real dependencies. Keep them explicit while independent work proceeds; do not invent the previously agreed ten games or claim a physical-device pass.

## Complete open-bug snapshot

This is an inventory, not 46 confirmed distinct defects. All issue links are in the Sparkle-Valley GitHub repository. Offscreen reports should be reproduced/grouped before choosing fixes.

| Issue | Report |
|---|---|
| [#34](https://github.com/nguyentuanphu/Sparkle-Valley/issues/34) | Roads and dirt roads look poor, not like the Concept D drawings |
| [#36](https://github.com/nguyentuanphu/Sparkle-Valley/issues/36) | Start-up is slow every time: 10 to 20 s on a computer, up to a minute on a tablet |
| [#337](https://github.com/nguyentuanphu/Sparkle-Valley/issues/337) | [tester] Auto play: a button counted as covered by the tester's own report window (r82) |
| [#339](https://github.com/nguyentuanphu/Sparkle-Valley/issues/339) | [tester] autoplay: Chơi một trò dân gian với Tèo: một nút bị che: Chơi! (Chơi!) |
| [#341](https://github.com/nguyentuanphu/Sparkle-Valley/issues/341) | [tester] Slow frames on a tester's computer (3 to 17 a second, r82) |
| [#350](https://github.com/nguyentuanphu/Sparkle-Valley/issues/350) | [tester] Ấn lung tung không đúng rules |
| [#354](https://github.com/nguyentuanphu/Sparkle-Valley/issues/354) | Riding: animals and vehicles stop at every bridge; a vehicle left behind stays where it was left |
| [#355](https://github.com/nguyentuanphu/Sparkle-Valley/issues/355) | The game restarts by itself or goes to a white screen while playing (iPhone and computer) |
| [#361](https://github.com/nguyentuanphu/Sparkle-Valley/issues/361) | [tester] autoplay: Treo đèn lồng ở đình làng: cần giúp: tự chơi chưa làm xong nhiệm vụ này |
| [#362](https://github.com/nguyentuanphu/Sparkle-Valley/issues/362) | [tester] autoplay: Lật lá sen để tìm đèn lồng: chưa thu âm: vi |
| [#363](https://github.com/nguyentuanphu/Sparkle-Valley/issues/363) | [tester] autoplay: Lật lá sen để tìm đèn lồng: chưa thu âm: vi |
| [#364](https://github.com/nguyentuanphu/Sparkle-Valley/issues/364) | [tester] freeze: 5.4 s |
| [#365](https://github.com/nguyentuanphu/Sparkle-Valley/issues/365) | [tester] autoplay: Đếm rùa đá ở Văn Miếu cùng Cô Tam: cần giúp: tự chơi chưa làm xong nhiệm vụ này |
| [#367](https://github.com/nguyentuanphu/Sparkle-Valley/issues/367) | [tester] freeze: 3.4 s |
| [#368](https://github.com/nguyentuanphu/Sparkle-Valley/issues/368) | [tester] On xe điễn the point of view of front view is blocked by windscreen |
| [#369](https://github.com/nguyentuanphu/Sparkle-Valley/issues/369) | [tester] The gate blocks the view and doesnt fade out |
| [#370](https://github.com/nguyentuanphu/Sparkle-Valley/issues/370) | [tester] freeze: 2.0 s |
| [#371](https://github.com/nguyentuanphu/Sparkle-Valley/issues/371) | [tester] freeze: 2.2 s |
| [#372](https://github.com/nguyentuanphu/Sparkle-Valley/issues/372) | [tester] The retry queue reporrt in lady bug buttons seems doesnt do anything |
| [#373](https://github.com/nguyentuanphu/Sparkle-Valley/issues/373) | [tester] slow: 0 frames a second |
| [#374](https://github.com/nguyentuanphu/Sparkle-Valley/issues/374) | [tester] freeze: 4.5 s |
| [#375](https://github.com/nguyentuanphu/Sparkle-Valley/issues/375) | [tester] At the user report interface, the report screen is too small so user wont be able to see, also when clicking on |
| [#376](https://github.com/nguyentuanphu/Sparkle-Valley/issues/376) | [tester] offscreen: Idea |
| [#377](https://github.com/nguyentuanphu/Sparkle-Valley/issues/377) | [tester] offscreen: Sound |
| [#378](https://github.com/nguyentuanphu/Sparkle-Valley/issues/378) | [tester] offscreen: Words or voice |
| [#379](https://github.com/nguyentuanphu/Sparkle-Valley/issues/379) | [tester] offscreen: Looks wrong |
| [#380](https://github.com/nguyentuanphu/Sparkle-Valley/issues/380) | [tester] offscreen: Broken |
| [#381](https://github.com/nguyentuanphu/Sparkle-Valley/issues/381) | [tester] offscreen: Retry queued reports |
| [#382](https://github.com/nguyentuanphu/Sparkle-Valley/issues/382) | [tester] offscreen: Auto play |
| [#383](https://github.com/nguyentuanphu/Sparkle-Valley/issues/383) | [tester] offscreen: Tester |
| [#384](https://github.com/nguyentuanphu/Sparkle-Valley/issues/384) | [tester] offscreen: Gửi |
| [#385](https://github.com/nguyentuanphu/Sparkle-Valley/issues/385) | [tester] offscreen: Ý tưởng |
| [#386](https://github.com/nguyentuanphu/Sparkle-Valley/issues/386) | [tester] offscreen: Âm thanh |
| [#387](https://github.com/nguyentuanphu/Sparkle-Valley/issues/387) | [tester] offscreen: Chữ hoặc giọng |
| [#388](https://github.com/nguyentuanphu/Sparkle-Valley/issues/388) | [tester] offscreen: Trông sai |
| [#389](https://github.com/nguyentuanphu/Sparkle-Valley/issues/389) | [tester] offscreen: Bị hỏng |
| [#390](https://github.com/nguyentuanphu/Sparkle-Valley/issues/390) | [tester] offscreen: Gửi lại báo cáo đang chờ |
| [#391](https://github.com/nguyentuanphu/Sparkle-Valley/issues/391) | [tester] offscreen: Tự chơi |
| [#392](https://github.com/nguyentuanphu/Sparkle-Valley/issues/392) | [tester] offscreen: Người thử |
| [#393](https://github.com/nguyentuanphu/Sparkle-Valley/issues/393) | [tester] offscreen: Đóng |
| [#394](https://github.com/nguyentuanphu/Sparkle-Valley/issues/394) | [tester] freeze: 2.2 s |
| [#395](https://github.com/nguyentuanphu/Sparkle-Valley/issues/395) | [tester] offscreen: NhảySpace |
| [#396](https://github.com/nguyentuanphu/Sparkle-Valley/issues/396) | [tester] offscreen: ChạyShift |
| [#397](https://github.com/nguyentuanphu/Sparkle-Valley/issues/397) | [tester] offscreen: Ba lôB2 |
| [#398](https://github.com/nguyentuanphu/Sparkle-Valley/issues/398) | [tester] offscreen: Bản đồM |
| [#399](https://github.com/nguyentuanphu/Sparkle-Valley/issues/399) | [tester] offscreen: Vui chơi: trò chơi, lễ hội, truyện và bà |
