# Owner review: stable screens, startup, testing and play
Date: 14 October 2026 AEDT. Baseline: main r74, commit 6a6ae885f86ad58a52688782eeba1d5417985fe9.
Branch: docs/family-device-work-order-20261014.
Status: original audit reviewed source, supplied screenshots and all 60 open GitHub issues. The owner subsequently authorized all items in one batch; candidate r75 is implemented on work/owner-round-20261014 and under verification in draft PR #195. Current results and remaining gates are recorded in docs/cores/release.md. No deployment or claim of complete physical-device verification.

## Evidence and limits
The supplied HUD and bug screenshot identify r73. Current released code is r74. Source findings below are still present on r74. Static screenshots demonstrate icon scale and mirror/report problems but cannot establish continuous window movement. Physical iPhone reproduction, authenticated Studio interaction and a complete runtime screen sweep remain required. Previously passing startup/performance checks do not prove a pleasant first paint or a stable keyboard layout.

## Batch 1: reliability and fixed windows
- Render a lightweight static Welcome in index.html with inline critical styles before loading the 3D module graph. The current boot contains a spinner/title, not the full Welcome or resource progress. Defer world building until that shell has painted. Show real stages/counts for required assets, keep optional voice packs separate, and expose retry/offline states; no fabricated percentage.
- Add a small update-available notice. Preserve saves and apply only at an idle safe point or parent-selected restart; never interrupt play. Investigate the r73 Bà Năm watermelon-story repeated module-import failure with the exact failed URL and cache/deploy version. Old-client/new-chunk mismatch is a hypothesis, not a confirmed diagnosis. Test active old tabs through deployment and interrupted/offline downloads.
- Enforce the owner's fixed-window rule across all game and Studio panels: no entrance/exit translation or recentering when content changes. Character selection .who-card uses rise (.5 s); Welcome .title-card uses rise; speech uses dlg-rise; wardrobe uses rise. Remove panel movement while preserving intended scene/character animations. Hold outer panel/header/footer position; scroll only the body; handle keyboard and safe areas without panel bounce.
- Audit Pad, selection/profile modes, settings, recorder, sound, wardrobe, shop, reports, play hub, every mini-game, NPC dialogue, rewards, online and Studio pages on phone/tablet/computer, portrait/landscape, EN/VI and long names. Record each failing screen instead of declaring all screens fixed.
- Grown-ups Save: centered sticky/floating footer within the fixed shell, with enough reserved scroll padding that Note for grown-ups and focused controls cannot be covered. Existing phone surprise hint/Jump overlap also belongs here.
- Play launch must carry an origin and return state: hub launch -> same hub/category/scroll; NPC launch -> close to valley. No accumulating hidden overlays.

## Batch 2: child interface and clothing
- Extend docs/cores/tasks/backpack-item-help.md: normalize visible art bounds for every item, including raw itemSVG, legacy hats, worn items and all food/treasures. Tiny cap, nón, wings and bow versus scarf are visible in the supplied Bag screenshot. Use one icon viewport/optical scale rather than blindly sizing SVG containers.
- Explain all Bag items with picture/name/purpose and spoken EN/VI help. Eating uses one compact card within Bag, with clear Eat/Not now; help must not consume, sell or wear an item. Retain 64 px targets for under-5s, 44 px otherwise, readable text and non-overlapping confirmations.
- Clothes shop: retain one art palette/outline language and preview the actual equipped 3D item, not a misleading flat symbol. Add requested Men/Ladies collections with an All view and a separate gifting recipient; allow any child to choose an item. Inventory ownership and existing purchases remain stable.
- Pad Shop currently closes the Pad then opens another modal (ui.js toShop). Render Shop and wardrobe inside the same Pad shell, preserving back/tab/scroll state; direct stall entry may use the same content renderer.
- Mirror currently means wardrobe (shop.js), not a clear labelled preview. Replace full-height rows of smiley None buttons and enlarged face framing with a stable full-body preview and labelled slots; explicit Remove/Default choice; category pages and one Done button. Avoid transparent overlays that leave competing HUD targets visible.
- Camera eye tray is explicitly horizontal (.ztray row-reverse). Open a bounded vertical tray with collision placement.
- Compass is Where is…? / Show me the way, calling openWhere; it guides to places, distinct from minimap orientation. Label it Find a place and consider moving it beside Map if that is clearer.
- Combine Music, Effects and Voice into one compact expandable Audio control, with three independently labelled switches and visible off states. Do not shrink tap areas to make glyphs discrete. Close other trays when opening a new one.

## Batch 3: Studio and testing
- Releases groups already use native details/summary with persisted fold state. Search/filter intentionally reopens matching groups. Reproduce the reported inability to fold on the affected browser/version, then fix it; do not add a second fold implementation or assume code absence. Audit all long Studio categories with explicit chevron, whole heading tap target and retained fold state.
- Admin custom-role handler redraws the page but reopens permissions only if previously open. Choosing Custom must reveal the granular checkbox list immediately; show loading/empty/error states and retain unsaved selections. New-admin Custom needs the same clear workflow; enforcement remains server-side.
- Merge Startup, frame smoothness and Battery under Performance, with one per-device row and expandable stage diagnostics. Show actual measurements, sample time and unavailable battery data honestly.
- One ladybird Testing entry with Report a problem, Automatic check, Results and Retest. Hide expert options from ordinary child flow.
- Autoplay already calls tester.autoReport for route/results failures. Keep that common backend, deduplicate repeated import errors by cause/version/device, and show queued/sent status rather than imply every report has arrived.
- Device matrix: testing enabled, autoplay enabled, speed, and explicit Keep progress / Restore before each run / Restore when testing ends, selected per device. Explain whether rewards/clothes are retained. Existing revert policy preserves selected rewards even when normal progress is restored, so it is not a complete reset.
- Offer 1x, 2x, 3x, 5x checking by speeding action/wait scheduling, not all simulation and speech. Verify normal-speed behaviour separately; fast runs must not generate fake timing/performance failures or skip required opens.
- Current tester grab() copies WebGL canvas with text footer; it omits DOM/HUD/modal. Capture the complete composed screen before opening Report, with optional scene-only mode, keyboard/overlay state, failed URL, build, dimensions, recent steps and error. Keep personal screenshot data in private reporting storage; GitHub issues can carry sanitized diagnostics.
- Review reports by root cause, not issue count. At audit: 60 open issues, 58 labelled bug, 56 tester; overlapping labels. Many refer to r70 or r73, include offscreen keyboard/background controls, slow frames, noopen and robot-stuck. PR #139 for #87 remains unmerged/unverified for release. Reproduce each cluster on r74; do not close old reports solely because the version changed.
- Tester daily summary #73 says zero open on 12 Oct; it is stale and cannot describe the current queue. Include timestamp/build and ensure summary refresh/health monitoring.

## Reporting and hearts: current behaviour
Reports queue locally when they cannot send, POST /api/tester -> private Netlify Blobs testers store -> Studio Analytics Tester reports. The hourly tester-issues workflow creates/updates GitHub issues. Bug robot handles eligible small issues; bigger design/content work belongs to the relevant core, then Release checks and owner-approved deployment. Filing does not guarantee an automatic safe fix.
G.hurt only deducts hearts for age big + difficulty hard after big falls. At zero G.rescue returns to lastSafe, restores hearts/stamina, with Ông Cú explanation. Younger/easier play is protected. Explain this in Help; consider gentler energy display for protected modes, without adding punishment.

## Batch 4: learning and visual content
Keep existing reading trials. Add original guided listen/touch/drag/answer/retry activities, tappable text narration, phonics/tones, word-picture matching and short story choices, scaled by skill. Khan Kids is a reference for interaction structure, not copied assets/curriculum. Add Big Thinkers pattern prediction, sorting by rule, sequencing, path planning, tangrams and memory logic, with demonstrations and spoken hints.
Audit films individually: brighter face lighting, distinct locations/models/palettes, character action and interactive pause/choice moments rather than repeated houses. Keep measured phone draw/frame budgets; visual variety must not undo startup work.
Additional proposed improvements: brief picture+voice labels for unfamiliar icons; one consistent Back/Close convention; a single queued hint/reward area; clear purchased/worn states; visible save/connection status only when useful; accessible contrast and calm mode.

## Release acceptance
No assertion of zero bugs. Before release require: relevant unit/contract checks, complete existing suite, measured startup/performance, screenshot inspection and physical iPhone/iPad/Android/desktop smoke checks; no changing thresholds merely to pass. Verify warm/cold/offline/update starts, moving between all entry/exit routes, keyboard/rotation, collapsed Studio sections, permissions persistence/enforcement, per-device retention and complete report capture. Keep a screen-level pass/fail list and unresolved risks in the release report.


## Owner collaboration decisions: 14 Oct, 9:00 am AEDT
These refine the plan; implementation is still pending.
1. Autoplay's current Save report action downloads a text file (autoplay.js saveReport). This must become optional Export a copy in advanced results, not the primary reporting action. Detected failures submit through the ladybird reporting queue automatically, without the parent moving/uploading files. A manual Send report uses the same route and can add a note.
2. Show separate Queued on this device, Sending, Sent (with receipt/report ID), and Failed - retry states. The existing local report sent flag cannot prove server delivery; only successful backend acknowledgement marks Sent. Offline reports remain queued and retries do not create duplicate issues. Explain tester eligibility/disabled reporting rather than silently drop reports when autoReport is inactive. Verify error and partial-run/stop paths as well as completion.
3. Hide the compass/Where is function by default for now. Reuse the existing Studio wayfind switch, which currently defaults on. Label it Find a place (compass), with a short explanation of guidance sparkles and the child-facing location. Owner disable must actually remove both button and actionable entry on selected scope/devices, including previously used/kept features; do not let feature grandfathering override explicit owner disable. Turning it on restores it without a rebuild.
4. Studio must be self explanatory: every control has a plain EN/VI label, visible current value, brief description of effect, affected scope/devices, default and save/apply timing. Destructive/reset actions describe what remains and what is removed. Inline essential explanations; expandable detail for advanced options. No tooltip-only help on touch devices. Explain empty, loading, disabled and error states; no silent actions.

## Proposed durable rules for future work
Adopt through the repo's existing CLAUDE.md / HANDOFF / rules / checks workflow when implementing this round; do not maintain conflicting parallel standards.
- Stable outer screen shell: anchored header/actions, scrollable body, reserved footer space; no panel translation/recentering. Intended world animation is separate.
- Shared components and tokens for Pad, shop, wardrobe, report cards, collapsible groups, trays, item artwork and confirmations. Fix components once; new features reuse them.
- EN/VI text and spoken child guidance; readable contrast/text; at least 64 px under-5 targets and 44 px others. Normalize optical icon scale independently of tap area.
- Explicit navigation origin and return state; one active overlay/tray; preserve previous category and scroll. No ambiguous Close destinations.
- One reporting service: automatic/manual capture -> durable queue -> receipt -> private Studio report -> deduplicated issue -> fix -> version-linked retest. Report submission is not proof of a fix.
- Clear per-device test settings and named retention policy; production progress never silently altered by a test. Fast checking and normal-speed performance results distinguished.
- Each optional feature has an understandable Studio switch, explicit disable semantics, existing-data migration and documented rollout/keep behaviour.
- Code and data use stable IDs rather than display names; old saves/ownership survive updates. Family private data remains separate from GitHub code; host changes require a backup/migration.
- New features include cold/warm/offline/update behaviour, failure recovery, resource/performance budget, self-explanatory Studio controls and entry/exit paths.
- Release requires meaningful checks of shared rules plus visual/device review. Keep a per-screen failure list, test current and previous-version clients, and do not relax thresholds just to pass.


## Implementation sequence and ownership · 14 Oct, 9:03 am AEDT
Owner approved writing the rules; this records the implementation plan, not a new deployment or an assertion that cores have started.
Canonical rules now in docs/SO-TAY-THIET-KE.md (UX-001–UX-010), linked from CLAUDE.md and HANDOFF.md. The earlier proposed-rules list is superseded by that approved section.

| Stage | Accountable core | Dependency and deliverable | Completion evidence |
| --- | --- | --- | --- |
| 0. Reproduce and organize | Release + relevant core | Establish current baseline; cluster all reports; inventory screen/route failures; assign one owner to each root cause. Preserve #139 review/check blockers. | Each issue has version, reproduction, owner, priority and current state; no duplicate implementations. |
| 1. Reporting and owner controls | Play + Analytics & Infra; Studio owns controls | Automatic acknowledged report queue, optional export, full interface capture, single ladybird entry, per-device test/retention choices, compass hidden with explicit Studio switch, help and permissions. Use shared shells from stage 2 when available. | Online/offline/retry receipts; duplicate suppression; stopped/failed runs reported; selected-device keep/restore and permission/disable semantics demonstrated. |
| 2. Startup and shared interface | Kid UI + Analytics & Infra; World supports loading | Lightweight Welcome/resource stages; safe updates; fixed panel shell and reserved footer; origin navigation; compact trays and confirmations. One designated editor per shared file. | Screen inventory and cold/warm/offline/update measurements; no overlap/panel movement across required viewports/keyboard modes. |
| 3. Bag, clothing and Studio adoption | Kid UI + Play; Studio owns admin pages; Voice & Audio owns narration | Apply shared components to all Bag items, compact food/help, in-Pad shop and meaningful mirror, clothing collections, Studio collapses and combined Performance. | Every item class and screen inspected; purchases/looks/saves retained; collapse/save/permissions work with explained states in both languages. |
| 4. Learning and films | Play + World + Voice & Audio | Separate content batch after reliability foundations; guided reading/Big Thinkers additions and distinct brighter film scenes. | Demonstrated age/skill progression, touch/voice interactions, original assets/content and measured phone performance. |
| 5. Release candidate | Release | Collect only ready and verified branches; resolve shared-file conflicts; run full GitHub suite and prescribed local performance/screenshots; inspect real-device results. | Reviewable change/test/remaining-risk report and release bundle, then the owner's round-specific deploy approval. |

Priority ordering: reliability/module failures and data/report integrity first; Stage 1 and 2 are the first repair batch, with stage 3 adopted against the shared shell. Content enhancements are later implementation checkpoints within the same round; they must not mask startup/reporting failures.

Coordination: GitHub board and task briefs hold shared status; this table assigns responsibility but does not send messages or start other chats. Each task uses Backlog -> Reproduced -> In progress -> Verified -> Ready for Release -> Released -> Retested. Release records branch/commit, tests and remaining defects; only one core owns a shared-file edit at a time.

Family device linking is included in this same round, using its dedicated brief (docs/cores/tasks/family-device-linking.md): settle pairing approval/recovery/backup and data scope before implementing dependent behaviour. Backpack help is incorporated in Stage 3 with its original brief preserved. Existing 3D world, reading trials and saved ownership remain the baseline.

Estimate policy: report a reliable duration after Stage 0 establishes scope and blockers. Do not promise all fixes in one short session; full-suite duration is only validation time, not total development time.


## Owner scope correction · 14 Oct, 9:07 am AEDT
Owner: "Should include everything on this round." This supersedes earlier wording that separated family linking or deferred content to another round. One combined round covers every request in this discussion. Stages/batches are implementation and verification checkpoints, not separate release rounds. This scope decision is not the final deploy approval.

Round scope:
- Current collected bug/error queue, including startup/import errors, repeated reports and pending #139 subject to its review/check blockers.
- Immediate Welcome and real resource progress; safe update notice and cache/version recovery.
- Fixed panels across game and Studio; overlaps, keyboard/rotation/safe areas; Grown-ups centered Save.
- All Bag items: consistent artwork size, picture/name/purpose/spoken help and compact food confirmation.
- Clothing art consistency, requested collections/gifting, meaningful mirror and Shop/wardrobe within Pad.
- Correct hub/NPC exit destinations; compact vertical camera tray; unified audio; compass hidden and explicitly controlled in Studio; hearts explanation.
- All Studio category folds, immediately visible granular permissions, explanations for controls and combined startup/frame/battery view.
- Unified ladybird/autoplay, automatic acknowledged reporting with complete interface capture, fast checks up to 5x, device selection and explicit per-device progress retention.
- Family-specific private photo collections, self-service pairing, connected-device removal, stable NPC-ID binding through renames, backup/export and hosting migration. Photo connection does not silently add profile/progress sync. All-old-devices-lost recovery remains an open design decision to resolve before implementing that path.
- Additional guided reading/touch/voice and Big Thinkers activities; brighter varied films; consistent icon labels, back/close states and queued hints.
- Approved UX-001–UX-010 rules and verification coverage.

Completion: maintain one scope checklist with evidence for each item; mark open design choices, blocked checks and unresolved defects explicitly. Do not call the round complete or silently omit items if any remain. Produce one consolidated release candidate, test report and review bundle before round-specific deploy approval. Scope is broad; estimate development time after reproduction and detailed content/transfer design, not from suite duration alone.


## Implementation checkpoint · 14 Oct AEDT
Owner authorized the full combined implementation at 9:10 am and requested resume at 11:33 am. Branch: work/owner-round-20261014. Runtime changes remain unpublished.
Implemented first pass: immediate static launch shell and staged progress; panel movement removal and Pad sizing; compact Bag help/eating, normalized item SVGs; in-Pad Shop/wardrobe, explicit clothing collections/gifting and actual avatar preview; vertical camera/audio tray; compass default hidden; origin-aware game exits; acknowledged report queue and retry receipts, shared ladybird/autoplay, composed interface capture; Studio custom permissions/help/folds/per-device restore/speed choices/combined Performance; private family collection/pairing/approval/recovery/export/import and ID-based photos; two reading and three reasoning activities; brighter/varied film props.
Verified before later fixes: boot, contract, phone (ten screens on three viewport kinds), architecture, names, types, bilingual and rules. New direct unit run found missing import in a new test and a service-worker privacy source assertion; fixed, rerun pending. Four viewport/language screen smoke paths passed; new-game win-overlay dismissal needed correction in the smoke script, then rerun. Screenshot inspection found real wardrobe clipping and caption overlap, repaired before recheck. Reporting mocks now return the actual backend receipt ID; tests are being strengthened for acknowledged delivery. Existing failures are not waived.
Remaining work: finish family/rebinding/pairing race and offline handling; all requested screen/Studio explanations and folds audit; inspect current screenshots; verify new games/film performance, source/packed startup and update flow; triage the complete collected issue queue without falsely closing old reports; new Azure lines (key unavailable locally); full GitHub suite and release bundle. No zero-bug claim, and no deploy approval requested before a reviewable candidate exists.
