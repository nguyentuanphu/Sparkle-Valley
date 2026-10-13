# Owner review: stable screens, startup, testing and play
Date: 14 October 2026 AEDT. Baseline: main r74, commit 6a6ae885f86ad58a52688782eeba1d5417985fe9.
Branch: docs/family-device-work-order-20261014.
Status: reviewed source, supplied screenshots and all 60 open GitHub issues; proposed implementation batches. No runtime change, release, or claim of complete device verification.

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
