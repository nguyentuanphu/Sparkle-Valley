# Resumed diagnostic findings

14 October 2026 AEDT. Owner includes additional bugs in this same round. No main merge, deployment or release is approved. A source finding is not a completed repair.

| ID | WO | Finding | Reproduction / proof | Disposition |
|---|---|---|---|---|
| DR-01 | WO-12 | Removed family devices still exhaust the 30-device limit and can block replacement or recovery | netlify/lib/family-devices.mjs counts all historical records; unit regression failed before; passed after, among102 units | Preserve revocation records; enforce capacity on active devices; validate before claiming fixed |
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
