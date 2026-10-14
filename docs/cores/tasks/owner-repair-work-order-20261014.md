# Sparkle Valley — consolidated repair work order and AI handoff

Version: WO-1.0
Prepared: 14 October 2026, AEDT (Australia/Sydney)
Owner: Henry
Status: owner accepted and instructed implementation. Current progress, checks, gaps and next action are in [STATUS.md](../../owner-repair-20261014/STATUS.md). Historical planning statements below describe the document's creation; implementation is now authorized. Release approval is still separate.

## 1. Purpose, inputs and authority

Combine these inputs into ONE traceable work order:
1. Henry's original bug/improvement note, reproduced in the conversation.
2. Sparkle-Valley-Independent-Audit-Prompt.md, last observed modification 14 October 2026 at 2:28 pm AEDT. Preserve its 59 numbered points and engineering sections 6–7.
3. Henry's newer requirements: compact selection windows; in-Pad Shop/clothing matching the game artwork; one Audio tray including the adjacent Music control; one ladybird window with Tester and Autoplay tabs; stable device identity across versions.
4. The repository's current code, governing rules and relevant task briefs. Historical reports and completion statements are claims to verify.

Latest explicit owner decisions override older conflicting notes. The audit's rejection applies only to the previous AI's draft work, not approved game work. This document does not authorize implementation or deployment. Review first; owner approval of the repair/design plan precedes disputed visual implementation. Release approval is separate and applies to an exact candidate.

Repository: https://github.com/nguyentuanphu/Sparkle-Valley
Reference baseline: 6a6ae885f86ad58a52688782eeba1d5417985fe9
Audit-subject draft: 74b918c6c4c52db2e42d24dc69fe2945f1907e3d
Draft branch: work/owner-round-20261014
Draft PR: https://github.com/nguyentuanphu/Sparkle-Valley/pull/195

Refresh main, candidate branches, PRs and board before implementation. Do not assume these identities remain current. Do not replace the baseline with the rejected draft or blanket-revert unrelated approved work.

Read first: CLAUDE.md, HANDOFF.md, docs/SO-TAY-THIET-KE.md, docs/ARCHITECTURE.md, docs/cores/README.md, docs/cores/BOARD.md, docs/cores/release.md and applicable core/task files. Retain the distinction between implemented, proposed, historical and unresolved text. This review inventoried/scanned 51 Markdown files on main, read governing/relevant sections, and inspected affected baseline/draft code; it was not a complete runtime audit or a claim of line-by-line historical-document verification.

## 2. Scope and completion contract

All 59 audit points remain in scope. The latest five requirements refine them and add device identity/version accuracy. Stages below are checkpoints within one combined work order, not silent deferrals or separate approvals. A consolidated candidate may be presented only with every item accounted for as verified, partial, blocked, missing or awaiting an owner decision.

The work must preserve the game's recognizable UI, existing approved 3D world, working reading trials, bilingual text/voice, saved inventory, purchases, earned progress and compatible cached clients. No whole-project rewrite or unrelated UI redesign.

No promise of zero bugs. The acceptance standard is demonstrated behaviour, meaningful regression checks, inspected visual evidence, explicit uncovered cases and no unexplained relevant failures. Automated browser passes do not certify physical iPhone/iPad/Android/Safari or production services.

## 3. Complete requirements matrix

Every original audit number is mapped below. Each grouped row must be expanded into separate point-level evidence entries during Stage 0; grouping must never hide an unresolved point.

| Work ID | Audit points / newer input | Required outcome and acceptance |
|---|---|---|
| WO-01 | 1–4; new compact-window requirement | Build a screen inventory across game and Studio. Preserve existing compact selection-window dimensions and approved appearance. Stable outer shells, anchored header/actions, scrolling inner content. No shell bouncing, dragging or recentering as selections/content/fonts change. Test keyboard, rotation, safe areas, large text, long EN/VI names and split-screen. Keep intended character/world animation separate. List each affected screen with source finding and runtime result. |
| WO-02 | 5 | Grown-ups Save & close centred in a floating/anchored footer with reserved body space; never covers the grown-ups note, keyboard focus or controls. Do not enlarge the whole panel to solve overlap. |
| WO-03 | 6; new in-Pad artwork requirement | Shop and wardrobe render inside the same Pad shell. Preserve tab/category/scroll/back state. Direct stall entry reuses the same content renderer with a defined return route. No delayed close/reopen into a competing window. |
| WO-04 | 7 | Play-menu activity completion/cancellation returns to its original category and scroll state. NPC launch exits to the valley. Verify repeated cycles, errors and interrupted launches; no hidden stacked overlays. |
| WO-05 | 8–11 | Immediate lightweight Welcome before expensive imports/world work; real resource stages/counts; mandatory vs optional loading; retries and offline states. Measure first paint, Welcome and playable readiness for cold/warm/offline starts. Small safe-update notice; preserve saves and avoid activity interruption. Reproduce Bà Năm's module-import failure with failed URL/cache/build evidence; hypotheses are not diagnoses. |
| WO-06 | 12–16 | Every Bag category gets picture/name/purpose, short spoken EN/VI help and correct actions: resources, ingredients, foods, treasures, clothes, worn/legacy items, festival prizes, pets, kites/gliders. Normalize optical artwork bounds. Compact food confirmation consumes exactly one item only on Eat. Help, Not now, tab switch and close change nothing. Verify quantities, selling, wear/remove and all extension handlers. |
| WO-07 | 17–21; new artwork requirement | Reuse existing game art/fonts/outline/palette/button language. Compare each Shop/Bag drawing with actual equipped appearance. Meaningful labelled mirror with useful outfit preview and explicit Wear/Remove/Default. Men/Lady collections plus clearly separate gift-recipient choice; preserve purchases, outfits, ownership and hats/back/top/bottom/shoes combinations. Avoid tiny previews and excess whitespace. Show disputed design before implementing. |
| WO-08 | 22–25; new Audio-tray requirement | Camera eye tray opens vertically with collision-aware placement. Compass/place guidance hidden by default for this round; explicit Studio enable/disable wins over old saved/used state. One compact Audio entrance replaces duplicate Music/Sound entrances: independent Music/Effects/Voice switches, clear states, Songs access and existing keyboard behaviour preserved. Child-friendly hit areas despite discrete visuals; coordinated trays and predictable close. |
| WO-09 | 26–32; new two-tab ladybird requirement | One compact ladybird window, Tester and Autoplay tabs, same game styling. Preserve report drafts and live run on tab changes; explicit Pause/Stop. Common automatic/manual reporting flow; export optional. Queue partial/stopped/failed runs where relevant. Queued/Sending/Sent-with-receipt/Failed-retry are honest, deduplicated and durable. Full composed-interface capture selectable, scene-only labelled. 1x/2x/3x/5x interaction checks; separate normal-speed/performance validation. |
| WO-10 | 33, 38 | Per-device Tester/Autoplay enablement and explicit retention policy: Keep, Restore after each run, Restore when tester mode ends. Explain exactly which coins/progress/rewards/clothing/stickers/manual earnings remain. Audit old global policy precedence, reload/stop/crash recovery, disabled-device behaviour and cached clients. Never call reward-preserving restoration a complete reset. |
| WO-11 | 34–37 | All Studio categories genuinely collapsible with touch-friendly indicators and persistent state; audit search/filter reopening. Controls explain purpose, scope/devices, default, current value, apply timing and consequences, with visible empty/loading/error/disabled states. Custom admin immediately shows permissions for existing/new accounts; saved permissions enforced backend-side. Combine startup stages/frame/battery into coherent per-device Performance view, labelled units/timestamps and unavailable measurements. Online and desktop Studio stay aligned. |
| WO-12 | 39–45 | Self-service private family-photo collections and device pairing, without contacting the site owner. Explain photo access vs progress transfer. Stable character IDs survive renaming; deletion/recreation has explicit reassignment. Verify isolation, approval, expiry, revocation and offline cache behaviour. Backups/export/migration/recovery explicit; never commit private photos/secrets to GitHub. Audit the draft recovery implementation and obtain decisions where unresolved; controlled tests are not production proof. |
| WO-13 | 46–48 | Keep working reading trials; add original interactive listening/touch/drag/answer/retry activities with spoken demonstrations/hints, appropriate difficulty and clear exits. Khan Academy Kids informs interaction structure; do not copy its assets/content. More Big Thinkers reasoning activities and coherent progression; five draft activities are not a complete curriculum. Define the proposed content list and acceptance before implementation. |
| WO-14 | 49 | Review every relevant story film for brighter readable faces, distinct locations/building forms/props/characters/actions and recognizable story identity. Demonstrate real rendered scenes; a few colour changes are not a completed redesign. Preserve narration/music cleanup and measured phone draw/startup budgets. |
| WO-15 | 50 | Verify/document current hearts: older children on Hard lose hearts after large falls; at zero rescue returns to lastSafe and restores hearts/stamina. Younger/easier modes are protected. Explain existing mechanics; any health redesign requires a separately reviewable owner decision and must preserve under-5 non-punishment. |
| WO-16 | 51 | Inventory all collected reports/open issues/failing checks, group by cause, assign accountable owner and disposition. Reproduce clusters on the chosen baseline/candidate. Link report -> issue -> fix commit -> containing release -> retest. Do not close merely because a version changed or call all errors fixed with unresolved failures. |
| WO-17 | 52 | Separate optional proposals: short picture/voice icon explanations, consistent Back/Close, one queued hint/reward area, clear Owned/Wearing states and additional engaging activities. Present before implementation; no scope creep. |
| WO-18 | 53–59 | One consolidated work order, checkpointed progress, exact GitHub suite/run/candidate links and accurate failure/skip/retry reports. Compare quality through fidelity, regressions, evidence and device behaviour. Final table maps original points to real matching before/after pictures, source/tests and remaining defects. Missing evidence marked missing. Independent review must return a substantive verdict; owner design approval and separate exact-candidate release approval remain gates. |
| WO-19 | New device-identity requirement | Preserve existing installation ID across game builds. Studio distinguishes latest observed version, active sessions and historical version usage; unique installations are not summed device-days. Offline activity retains originating build/session metadata, not upload-time build. Old tabs/delayed batches cannot misleadingly overwrite newer observations. Explicit linking handles separately stored installations when wanted; do not infer physical identity from IP/name/screen fingerprint. |

## 4. Current source findings — not completed fixes

- Baseline Pad Shop closes Pad and later opens a separate Shop window.
- Baseline camera tray expands horizontally.
- Baseline wardrobe uses a vertical entrance animation; autoplay has a draggable shell and separate system-font styling.
- Rejected draft enlarges selection/Pad/settings shells, replaces parts of shared UI/handlers, and links reporting to a separate autoplay window rather than two tabs.
- Rejected draft hides Music through CSS; preserve a discoverable Songs entrance when combining controls.
- Current analytics uses localStorage sv2_playerid for persistent installation identity. Studio's weekly builds summary sums device-days, so historical multiple-version usage must not be labelled unique current devices.
- Analytics sends queued play with the currently executing BUILD rather than retaining its originating build in each bucket. Version attribution needs migration-compatible repair.
- Current progress restoration preserves selected rewards/look/settings. Policy labels must disclose this.
- Hearts behaviour above is supported by the source, but runtime rescue paths still need checking.
- Complete screen failures, production report/pairing delivery, physical-device behaviour and historic-report disposition are unverified.

Audit-recorded draft blockers to reproduce: wearbag, bagitems, voicecover, ages (api?.onCleanup is not a function), reading, rollout/default compass, hoilang; investigate first-attempt film-music failure. Audit-recorded suite was 133/140 with seven failures and seven service checks skipped. These are historical observations about the pinned draft, not a fresh run here. Review/check status of PR #139 must be refreshed rather than inferred.

## 5. Staged execution and accountable roles

Roles describe repository ownership; no other chats or agents have been launched by this plan. Assign one editor per shared file/task; use the board for dependencies.

| Stage | Lead / supporting roles | Deliverables / exit |
|---|---|---|
| 0. Baseline and reproduction | Release; affected core owners | Refresh refs/instructions/board; separate baseline/draft/newer work; expand every original point and WO ID into acceptance cases; screen/issue inventory; asset/service gaps; measured compact sizes and design reference; focused reproductions. Audit findings and bounded repair proposal ready for owner review. |
| 1. Identity, reporting and recovery | Analytics & Infra + Studio; Play/Kid UI | WO-09/10/16/19 contracts, durable queue/receipts, version attribution and per-device policy; full capture; family-data decisions/isolation/recovery foundations WO-12. Meaningful failure/retry/migration tests pass in stated environment. |
| 2. Shared compact interface | Kid UI; Analytics & Infra/Voice & Audio | WO-01–05/08: compact stable shells, reserved footer, origin navigation, Welcome/update recovery, vertical camera and Audio trays. No indiscriminate global CSS resizing or animation removal. Before/after evidence for required screen states. |
| 3. Bag, Shop and Studio adoption | Kid UI + Play + Studio; Voice & Audio | WO-06/07/11; two-tab ladybird shell from shared components. All item types, purchases/worn state, mirror/collections/gifts, category folds/permissions/performance view verified. Family UI WO-12 integrated after design decisions. |
| 4. Learning, films and explanations | Play + World + Voice & Audio | WO-13–15, retain trials; original guided content and distinct film scenes; hearts explanation. Content list/design reviewed; new spoken lines recorded or explicitly blocked. |
| 5. Candidate integration and review | Release | Collect only verified work; inspect combined diff/contracts/type coverage; prescribed GitHub full suite plus local speed checks and screenshots; independent substantive review; consolidated per-point evidence/remaining-gaps table and package. Then request exact-candidate release approval. |

Stages may be interleaved where dependencies allow, but shared-file edits and performance checks must not race. Scope does not disappear because a session ends.

## 6. UI and rule consistency controls

Before touching UI, create docs/owner-repair-20261014/design-reference.md from the approved running baseline:
- Measured compact screen bounds at reference viewports/states, anchoring, scroll regions and footer clearance.
- Existing Fredoka/Baloo 2 language font behaviour, sizes/weights, colours, outlines, shadows, radii, spacing, button/tab hierarchy and drawn icon system.
- Item optical scale and actual worn-item appearance.
- Entry/exit routes, independent audio states, calm mode and touch targets (existing rules: >=44px generally, >=64px for under-5 controls).
- Real screenshots of baseline and adjacent screens, same viewport/language/state. No generated mockup used as implementation evidence.

Reuse css/style.css tokens, existing artwork/component systems and small shared renderers. Fix the owning component before adding feature-specific overrides. Never create a separate visual language for autoplay/wardrobe/new games. No universal 900px panels, broad !important patches or blanket removal of game animation as a shortcut.

Each changed shared function/component gets a contract record: prior behaviour, callers, change, saved-data impact, compatible clients and regression case. Distinguish file deletion from removal/replacement of function bodies/handlers. No blanket rewrite or revert.

Applicable rules are recorded with canonical IDs and source links. Where an older document conflicts, record the newer owner decision and why it wins; avoid duplicate competing rules. Update canonical rules/checks together where behaviour intentionally changes. Contract snapshots change only for the owner's requested UI changes and only after the diff is reviewed.

Incremental type checking: map compiler inputs/import coverage; use selected // @ts-check + JSDoc and suitable TypeScript contracts where supported. Type lifecycle cleanup/cancellation, identity/session/build metadata, queues/receipts, persisted policies and family responses. Validate external JSON and old storage at runtime. No whole-project conversion, broad any/casts/ts-ignore or weakened compiler settings to claim success. Report exact compiler/version/scope and remaining gaps.

## 7. Device identity and version contract

Keep these concepts distinct:
- Installation ID: existing persistent device/browser-store identity, independent of build.
- Session ID: one running tab/app session, so concurrent old/new clients can be represented.
- Build identity: exact game build and candidate attribution for the observation/run.
- Batch/report ID: retry-safe deduplication identity.

Preserve existing IDs and selected-device configuration. New metadata must be backward-compatible with old clients. Record activity time and originating build before queuing; do not retag offline history at upload. Update latest-observed state with a documented ordering policy and display concurrent active versions honestly. Preserve batch IDs through retries and do not double-count resend.

Test: update same installation; reload; EN/VI; orientation; Wi-Fi/mobile switch; two tabs on different builds; offline old batch uploaded after update; lost acknowledgement; storage failures; normal backup restored to a new device without cloning another device's analytics identity.

A web app cannot reliably infer the same physical phone across separate browsers/origins/isolated installations or after all identity storage is cleared. Use explicit parent/admin linking if grouping is required. Names/IPs/screen sizes are not identity keys. Such grouping must preserve raw installation provenance and avoid double-counting overlapping sessions. Private photo pairing is not automatically progress sync or analytics identity merging.

## 8. Verification and release evidence

Use the repository's actual runner and current CLAUDE.md policy:
- Focused reproductions first; relevant unit/contract/behaviour checks after each bounded change.
- cd tests && node suite.mjs --changed --list, then the appropriate changed checks.
- Before release: required GitHub full-suite workflow on the exact candidate; local perf,battery,startup with one job, alone; inspected phone/tablet/computer screenshots.
- No concurrent heavy runs beside suite.mjs; no full reruns with identical inputs unless failures/new changes justify them.
- Voice/media/offline checks require actual omitted assets; physical-device and production-service gaps remain visible.
- Preserve meaningful failing assertions; an outdated test requires documented contract evidence before amendment.
- Check code, packed build, cold/warm/offline/update, repeated interactions, keyboard/focus/safe areas, split-screen and both languages as applicable.
- Investigate flaky retries separately; green wrappers with errored AI reviews do not count as independent approval.

Evidence states are separate: Planned; Reproduced; Implemented; Focused checked; Regression checked; Visually inspected; Physical-device checked; Production-service checked; Owner design approved; Release approved; Released; Retested. Blocked/partial can apply at any stage.

Final evidence table columns: original audit point; WO ID; finding/source/commit; baseline picture; candidate picture; reproduction/acceptance case; command/run/result; service/device scope; remaining issue; owner decision. For backend requirements substitute real redacted receipt/persistence/retry evidence, not a picture of a button.

## 9. Saving, checkpoints and AI-to-AI handoff

GitHub on an isolated working branch is the shared code/documentation history. Do not depend on another chat seeing this conversation or transient local files. The saved work order is also supplied as a downloadable document. Never store secrets, private family photos, tokens or raw personal report data in the public repository.

Proposed repository paths for implementation:
- docs/cores/tasks/owner-repair-work-order-20261014.md — this work order.
- docs/owner-repair-20261014/STATUS.md — short current checkpoint and next action.
- docs/owner-repair-20261014/requirements.json — one row per original point plus engineering/new requirements.
- docs/owner-repair-20261014/decisions.md — dated owner decisions, superseded rules and approval scope.
- docs/owner-repair-20261014/design-reference.md — approved compact UI/art reference.
- docs/owner-repair-20261014/CHANGELOG.md — bounded changes, contracts and evidence links.
- docs/owner-repair-20261014/evidence/index.md — evidence table; sanitized pictures/results under evidence/.
- Existing docs/cores/BOARD.md and appropriate core progress notes — branch, task owner, last verified commit, dependencies and readiness. Link canonical records rather than copy divergent status.

Only the work-order document is created by this planning step. Other paths are created/populated during authorized implementation. Never mark them created or populated until that happens.

Checkpoint after each reviewable change, completed check, material failure and before ending a session; target small checkpoints approximately every 10–20 minutes of implementation, without interrupting tests unnecessarily. Local commits protect coherent work; remote draft-branch checkpoints follow current repository authorization and successful relevant checks. A local-only commit is not available to a new remote AI chat: report it as local/unpushed. Do not push unchecked game code merely to manufacture a checkpoint. Preserve a clearly labelled unfinished patch via an authorized durable route when needed.

STATUS.md must contain:
- Work-order version, Sydney timestamp, role and active WO/original point.
- Baseline and current branch/commit; remote-pushed SHA; dirty/uncommitted files.
- Implemented vs verified items and remaining issues; precise evidence links.
- Commands, environment, assets, tests, pass/fail/skip/retry and compiler scope.
- Running process/run IDs and log paths, or explicit no ongoing job.
- Owner approvals/decisions and blocked dependencies.
- NEXT ACTION: one exact actionable step and its prerequisites.
- Changes that must not be repeated/reverted and known shared-file ownership.

Resume protocol for the next AI:
1. Read this work order, STATUS, decisions, matrix, board and governing rules.
2. Fetch remote refs; verify source commit and whether main/other branches changed.
3. Inspect the current diff and dirty state before writing. Do not reset away work or assume a local patch was pushed.
4. Confirm/check any recorded still-running job rather than start a duplicate suite.
5. Resume NEXT ACTION; rerun only checks invalidated by new changes or unresolved failures.
6. Update checkpoint and evidence; no assumed owner approval inherited beyond its recorded exact scope.

Timeout handling: use bounded commands/jobs with saved logs and process/run IDs. Persist outputs when a command completes; checkpoint before long checks. An interface timeout is not a test failure or permission to restart a running job. Diagnose repeated transport/service failures, record them and continue independent tasks where possible. Do not run infinite retries or overlapping suites. The next chat resumes from documented outputs, not a reconstructed conversation.

## 10. Current planning checkpoint and next action

Completed now: consolidated scope/59-point mapping, newest requirement reconciliation, proposed consistency/verification/checkpoint rules and handoff instructions. Documentation only.

Not completed: complete runtime screen inventory, issue triage, repair implementation, fresh tests, candidate screenshots, physical-device checks, production pairing/report delivery, independent candidate review or owner release approval.

NEXT ACTION after the owner accepts this plan: Stage 0 — refresh repository/PR/board state, capture approved compact UI references and reproduce the highest-risk startup/import, overlapping-panel, reporting and version-identity cases. Present the specific keep/revise/revert findings and disputed visual proposals before implementation.

Before any main merge/deployment: an exact reviewed candidate, complete evidence table, substantive independent review, prescribed verification and the owner's separate explicit release approval.
