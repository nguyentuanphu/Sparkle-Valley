# Resumed diagnostic findings

14 October 2026 AEDT. Owner includes additional bugs in this same round. No main merge, deployment or release is approved. A source finding is not a completed repair.

| ID | WO | Finding | Reproduction / proof | Disposition |
|---|---|---|---|---|
| DR-01 | WO-12 | Removed family devices still exhaust the 30-device limit and can block replacement or recovery | netlify/lib/family-devices.mts counts all historical records; unit regression failed before; passed after, among102 units | Preserve revocation records; enforce capacity on active devices; validate before claiming fixed |
| DR-02 | WO-12 | Backup import silently truncates after 60 entries | import action slices incoming entries; oversized-backup regression failed before; passed after | Reject excessive input before mutation; never silently lose backup entries |
| DR-03 | WO-12 | Backup import can exceed 60 total photos by adding to existing photos | Union-capacity regression failed before; passed after | Retain the existing limit, validate the combined collection before mutation |
| DR-04 | WO-12 | Revocation clears photos but leaves an unusable connection credential and hides reconnection controls | ownerfamily failed before; passed after including stale-response/offline cache proof | Clear the rejected connection when status confirms revocation; preserve unrelated game/installation data |
| DR-05 | WO-05/12 | Four fixed family-help lines have no local recorded voice | Expanded voicecover failed on saved code25176e7; workflow artifact11887433748 contains eight MP3 files | Integrate only inspected recordings/index changes, preserve older recordings, coverage passed8100 lines with additive index merge |
| DR-06 | WO-18 | AI review wrapper is green without a completed review | Run38556313316 / PR300 comment6167241597 explicitly says review did not finish | No independent-review approval; obtain a substantive verdict later |
| DR-07 | WO-18 | Older pictures lack adequate current source attribution | Historical evidence files do not establish latest source from a build label alone | Capture script now checks served bytes against Git commit and records hashes/time; fresh captures pending |

The expanded suite finished6/7 (full reading passed; voice gaps reproduced). Family and voice repairs passed local focused checks; source changes await remote checkpoint. Diagnostic GitHub run38556313225 finished140/142 with seven service skips at ee145bd1. Its failed Studio fixture and voice coverage were repaired locally; a fresh remote run is still required.

All216 open bug-labelled reports through#299 remain individually listed in issue-intake.json. Sanitized reported-build/module metadata helps choose reproductions but is not a diagnosis. All remain open; no release/retest disposition is inferred from a version change. General source concerns, such as cross-tab outbox races and simultaneous pairing, remain in the work order until reproduced and resolved.

## Owner reports during resumed execution · 15 October 2026 AEDT

| ID | WO | Report / source lead | Required disposition |
|---|---|---|---|
| DR-08 | WO-13/16 | Shared story pages disagree; online together check failed. openTheatre resets fromFriend before its asynchronous draw reads it | Focused received-page/no-echo regression before repair, then actual two-device story proof |
| DR-09 | WO-04/16 | Henry: one owl-request destination sits inside a house and cannot be reached. Chapter ribbon/light placement checks circles but omits building boxes and has an unchecked fallback; quest NPCs may also go indoors at night | Identify reported step when available; audit all quest target geometry, approach and NPC availability; retain world art and real collision |
| DR-10 | WO-09/13/16 | Henry: autoplay clicks randomly and never finishes. Generic target fallback has no solver for strategy activities | Add legal activity-specific progress strategies with completion/retry/stop proof; retain deliberate bounded wrong-answer testing and report unresolved activities honestly |
| DR-11 | WO-13/16 | Henry: Caro colors appear self-relative on each device; pink must identify the same player on both | Reproduce with distinct named players; compare rendered piece/color and assigned seat on both boards and across turns/replay; preserve art |

All are included under Henry's existing authorization. None is yet marked repaired. Owner destination clarification is optional and does not block the other investigations. Local online suite remains active; fresh diagnostic GitHub run38601628166 at dd91f33b runs independently.


New owner scope EXT-04/05: child road crossings/warnings and natural map-wide decoration distribution/road clearance. Existing Aussie raised crossing and festival density controls found; implementation/rendered inventory pending; Henry confirms festival lanterns/flags/poles. EXT-01 expands the Sydney-specific repair to all required quest/story targets and night-state accessibility. Requirements and consolidated work order updated without removing original59 points.

Network focused5/5 now proves actual shared story behavior, stable distinct-player Caro pieces and normal microphone/knock policy at583915e9. Local checked fixes do not make older dd91f33b Full suite38601628166 a pass.

## Latest bounded findings

| ID | WO | Finding | Actual proof / status |
|---|---|---|---|
| DR-12 | WO-08 | Vietnamese Audio tray can touch the phone edge after font/content sizing | New bounds check failed before; source placement/observation fix plus desktop navigation-row placement pass five view cases and resize in focused8/8 |
| DR-13 | WO-01/14 | Town festival decoration road mask used obsolete absolute x bounds | Independent geometry test reproduced10 road violations; real TOWN anchor fix passes130 placements. Natural map-wide distribution still open |
| DR-14 | WO-08/16 | Language change during voice download loses the scheduled recheck; new selected pack can stay unfinished | Bounded synthetic real-downloader regression timed out before source edit; after queued recheck/snapshot repair passed44s within current Node22 focused run. Full run still pending |
| DR-15 | WO-12/18 | Family CI regression failed both shared and isolated runs at dd91f33b; same Node22 local run also failed | First-line wrapper/parser truncation concealed details behind a harmless module warning. Wrapper now keeps stdout/stderr/status as one line; rerun underway. Underlying cause unresolved |

Source-based leads and bounded synthetic proofs do not dispose of all216 reports, replace complete screen evidence or authorize release.

## Wi-Fi consent card

| ID | WO | Finding | Reproduction / scope |
|---|---|---|---|
| DR-16 | WO-08/16 | Mobile-data permission card remains after Wi-Fi becomes available while voices continue downloading | Bounded two-file real-downloader regression timed out before fix. Close on Wi-Fi, suppress delayed prompts and cancel pending grown-up hold so Wi-Fi cannot accidentally grant mobile-data permission. Before failed; after ownerwificard41s plus language-switch45s and static checks pass7/7. Mobile consent remains false even when Wi-Fi arrives during a pending hold. |

## Further exact-candidate findings

| ID | WO | Finding | Disposition / scope |
|---|---|---|---|
| DR-17 | WO-08/18 | HUD structure snapshot expects Audio/Mic/Music after bottom-dock controls | Exact87f9d334 contract failed after owner-authorized below-navigation placement. Reorder only those three snapshot entries; retain all controls/tabs/counts and geometry checks. Local contract passed. |
| DR-18 | WO-09/16 | World autoplay stuck on farm and owl routes in first exact-candidate run; passed only on retry | GitHub38613891343 reports first failures at8,45 and10,-81. Root cause/reliable world routing remain open; do not count retry as unconditional reliability proof. |
| DR-19 | WO-04/16 | Final classic shrine quest has no destination when all discovered shrines are done and others remain unknown | Corrected280-case inventory has zero blocked approaches but missing final marker in light/dark predicates. Keep known-shrine priority, fall back to nearest unfinished shrine; focused rerun active. |

DR20 — newly reported public-transport POV obstruction. Source inspection: bus and coach bodies and dark glass are closed solid meshes; toy models also carry an outline. Current camera sits at child-eye position inside these solids, so the earlier transport check of eye height/distance does not establish an unobstructed windscreen view. Reproduce actual rendered rider view before correcting; check both ages, bus variants, tram, exit, exterior view and split-screen isolation. Pending.

## Further findings,15 Oct AEDT

| ID | WO | Finding | Disposition / scope |
|---|---|---|---|
| DR-21 | WO-08/18 | Small tester navigation grows horizontally, causing Go/minimap visual overlap | Actual320px EN baseline red; all nine hit samples still reached Go. Stack small clock/badge, reserve measured navigation width and move quest below when needed; horizontal Audio avoids quest. Seven-layout check235s and Audio225s pass in focused9/9; active Mic EN/VI48s passes. |
| DR-22 | WO-10/11 | Failed device lookup appears empty and discards unseen policy/level on Lab save | Real authenticated Studio/live-store regression failed with HTTP503. Display saved device IDs and explicit load failure; preserve unshown latest policies/levels and legacy speed choices. Regression now passes2s, full Studio rerun pending. |
| DR-23 | WO-11 | Late Analytics response overwrites Releases after navigation | Held actual players response reproduces wrong page. Render generation and Analytics stale-response guards pass targeted regression; full Studio rerun pending. |
| DR-24 | WO-09/16 | Autoplay attempts walking/flying while still seated in a bus | First fixture exited naturally before reproducing. Tightened actual boarding fixture pauses immediately after boarding and holds station wait100sec; before still carried12.67m from clear12m target after futile path/jump/fly attempts. Normal get-off input before path planning implemented; focused validation pending. Broader random game fallback and first-run world-route stalls remain open. |

DR-24 follow-up: normal public-transport Jump input before path planning passed44s; actual ride51s, Studio360s and103 units also passed in focused11/11. DR-25: existing default Keep tester retention silently changed on Lab Save. Reproduced0/1; explicit Keep default and explanatory scope preserve it, final7/7 passed. Missing physical-device/production proof stays separate.

DR-26: new activity-stage pictures exposed older shared-shell issues on320px VI: header scrolls59px offscreen, floating star box overlaps guidance, and queued valley caption covers game. Exact stricter regression failed all three. Scoped fixed-header/stage scroll and caption clearing implemented;13-check validation active. Initial layout-center checks passed but did not detect these visual defects; retain both results and do not claim the earlier pass was full UI proof.

## DR-19: voice manifest refresh during an updated session

Source audit: sw.js returns the saved sv-voices manifest immediately and refreshes it in the background. js/voice.js loadPack memoizes the first response for the entire page session. There is no fresh-manifest notification/reload path, so newly added recordings may remain unknown until another page session, despite the network refresh succeeding. This is a source-derived update-path risk, not yet a reproduced browser failure. Include in this round: seed an old cached manifest, serve a newer additive manifest, verify prompt replay switches to recordings without requiring a reload or deleting cached voices; retain offline cached-first startup and independent switches. The new learning voice check uses a fresh context and does not prove this update path.

DR-19 reproduction: strengthened same-page/pack-reference/final-line assertion failed: cache refresh completed but running pack remained9928 lines, same object, target absent. voice-refresh-before.json records failure. First probe returned green without sufficient final-state assertion and is explicitly invalidated in voice-refresh-first-probe.json. Repair now notifies open clients only after a changed manifest is cached; voice module guards delayed initial response against a newer refresh; downloader updates its index/areas without registering duplicate listeners and restarts after its current batch.13-check validation active; no pass claimed yet.

DR-19 repaired and focused verification passed in voice-refresh-final-10-checks.json: same-page updated pack, offline cached index, held download refresh and independent selected-language behavior. Earlier false probe and failed12/13 retained. Final GitHub suite and update-device comparisons remain pending.

## Newly verified diagnostic gaps

- DR-20, WO-14/16: exactb09 GitHub filmmusic failed first and alone retry. hush increments sequence/stops a WebAudio node but does not immediately release pending speech counts or stop/cancel the plain iPhone player/watchdogs. Stage a cancellation-ticket fix, cancel actual playback and stale timers, and retain existing music switch/restore assertions. New ownerspeechcancel baseline plus existing filmmusic are running; not fixed/verified yet.
- DR-21, WO-09/16: controlled unreachable approach returned5m away with problems empty. go/walk can accept a path endpoint or landing outside requested range. Also repeated non-advancing quests only add help notes while leaving ok true. Stage explicit failure/range verification and truthful quest reporting; baseline navigation failed, final proof pending.
- DR-22, WO-09: Robot Planner baseline made155 random taps, no correct steps, and timed out93.1s without completion. Stage legal arrow/path/sort plans for Robot Planner, Mountain/Duck Maze and Sort It Out. Full catalogue still unfinished; no synthetic win or check weakening.
- DR-23, WO-16/Online: together passed only on second attempt atb09; first shared tale excerpts differed by one page. Failure retained in github-b09-full-164-checks.json. Root cause and reliable delayed-peer/narration sync still require reproduction; do not dismiss as timing noise.

DR-23 controlled reproduction confirmed: an accepted guest receives page moves before a deliberately delayed gstart; unit and real two-relay-browser checks fail, both pages reset to opening after host choosespage2. Candidate js/netgames.js now buffers32 accepted-inviter moves and replays sorted after authorized onStart; foreign messages remain ignored, refusal clears pending permission. Units106 pass; existing together158s passes first local attempt; delayed-start browser final check is still running. This is a bounded repair, not proof against every shared-story race.

Additional probes prepared (not run, source leads only): initial draw sends page0 independently on each peer; a delayed initial guest message could roll back a host’s manual Next taps even after normal start. Family playClip decodes asynchronously without rechecking cancellation before starting the buffer. Add explicit delayed-initial-page and held-family-decoder baselines before changing those paths. Neither is yet counted as reproduced/fixed.

DR-24 shared-story initial render CONFIRMED: controlled late guest initial page0 leaves host0/guest2 after two real Next taps, no browser errors. DR-25 family cancellation CONFIRMED: held decoder starts cancelled recording after hush (AudioBuffer starts1→2). Stronger exacte75 baseline0/2 retained. Repair16 candidate changes applied; final validation pending, no fix acceptance/full-suite pass claimed.

DR-24/25 final focused9/9 passed: late initial render suppressed; real Back still synchronizes; family decoder completion cannot restart cancelled audio. Existing together, early-start, voice playback/music/contract/106 units also pass. GitHub sourcee75 predates these repairs; exact final-source Full remains required.


## Crossing verification,15 October2026 AEDT

New physical signs initially overlapped existing vendor bubble tap rays. First phone4 actual taps passed after footprint/bubble clearance;10-check regression8/10 retained. Ten sign taps across EN/VI phones and town tablet completed before an oblique tablet approach put v_bev in front of both boards. Test now prefers the normal perpendicular dry approach before oblique alternatives, retaining actual first-ray-hit and physical tap assertions. No blanket all-camera-angle guarantee. Five-view acceptance pending. Existing under-5 bus choices reproduced47px height; scoped64px CSS passes phone/contract/a11y, final real bus cases pending.

Potential additional source lead (UNCONFIRMED): floating Sprite raycast bounds may intercept taps through transparent canvas margins. Do not mark this as reproduced/fixed without checking actual intersection UV/alpha and real taps; no runtime filtering change applied.
