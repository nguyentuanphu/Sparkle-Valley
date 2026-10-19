# Approved bug fixes and TypeScript migration — progress

Owner approved the combined plan on 19 October 2026 AEDT. Release works alone on work/bugs-typescript-20261019; live remains r87. The next version choice is pending in a pop-up; no new deployment is approved. Plan: ../plans/bugs-typescript-20261019.md.

## Batch 1: reporting

- Claimed tester.js, screencapture.js, tester-detection.js and report-outbox.js before changing them. Unchanged rename commit 6b0b59b6; typed contracts and zero-error checks committed in 95c7cada. Four additional game sources migrated (54 TypeScript / 203 JavaScript game files at this checkpoint). Full strict migration remains separate.
- Baseline reproduced static retry feedback, stale queued counts and an unbounded send. iPhone form screenshots show an overly small preview; captured the submitted 430x517 and 430x873 sizes plus landscape.
- Repairs under test: bounded/coalesced sending, live queued/sending/sent/retry feedback, durable per-receipt removal, offline recovery, visualViewport-aware form, 64 px little controls and larger picture viewer. Complete-interface capture draws the world outside foreignObject; full/scene options share one complete on-screen frame and ignore offscreen portrait renders.
- First new reportingflow check passed in 181 s: ten EN/VI layouts, keyboard-visible footer, picture viewing, capture with omitted nested images, timeout/coalescing, reports queued mid-request, offline, invalid receipt and 503 recovery. Types passed (73 explicit files).
- Image review caught an offscreen-render capture path and a screenshot taken during the viewer fade-in. Capture now waits until the on-screen frame is complete; viewer screenshots wait for opening to settle. Related run passed all six checks: unit 175 pass (30 s), types pass (22 s), ownercapture pass (50 s), reportdetectors pass (1 s); reportingflow pass (197 s), reportstorage pass (39 s). A final focused run is strengthening real-world frame and offscreen observations.
- Two early test-launch commands used an incorrect working directory; only checks actually selected/executed are counted. No check assertion or budget has been weakened.
- Chromium viewport tests do not establish physical iOS Safari/keyboard behaviour. Real-device verification remains explicit.

## Next

Finish reporting evidence and push a draft review checkpoint. Then convert the shared game shell and repair completion based on source: valley/quest return outside; Simple/Play retain choices. Continue camera, stability, performance and remaining migration work in the approved plan. A version/deployment answer does not block independent implementation.

### Final first-batch local verification

- Stronger reportingflow passes 242 s and types passes 24 s: 12 EN/VI layouts, 320 px phone, actual nonblank world-frame assertions, 64 px little controls, visible footer during a simulated visualViewport keyboard, larger picture viewer, captured world plus interface, timeout/coalescing, reports queued mid-send, offline/invalid/503 recovery. All 12 normal HUD detector scans return zero offscreen controls; this observed result is now an explicit regression assertion for GitHub.
- Final phone/short/landscape/tablet/computer and expanded-picture images inspected. Before/after images, pixel evidence and results saved under docs/repair-reporting-20261019/.
- Completed receipt batches refresh server report status. No raw captures go to a live backend during tests; fixtures use synthetic identities and intercepted endpoints.
- Related suite: 6/6 pass. Final focused suite: 2/2 pass. Full GitHub suite remains required. No runtime/deployment version assigned; pending owner version pop-up remains unanswered.

## Batch 2: game completion and quest/audio investigation

- Shared frame claim ecb3b70d; unchanged rename 0f4c56e8; typed game/result/online and choice-button contracts 4f61a7b7. Type checking reaches zero before changing completion. Existing hopscotch map annotated as a dependency. Browser build now includes 57 TypeScript sources.
- Implemented, not yet verified: world/NPC/shrine completions return after the celebration; Play/Pad/Simple retain choices. Difficulty restart retains the shrine origin and its orb; Next retains Simple origin. Closing a celebration cancels its listeners/timers and cannot give a second result.
- New gameflow check uses actual counting/number-game answers and the real shrine, Play menu and Simple road. First run passed shrine/two-player/folk assertions but left an earned storybook in front of the Replay button. Second run fixed the book path but raced a self-dismissing reward. Both runs failed; neither is counted as a pass. The fixture now uses real book controls and waits for timed rewards; third run in progress.
- Read #361/#362/#363/#365 in full. Source investigation found autoplay does not see handpad rope controls; Cô Tam's quest target remains at her after the lesson starts; its retry limit also counts legitimate intermediate actions as failed attempts. These are hypotheses to reproduce before repair.
- Vietnamese leaf-found, frog and rope lines have both recordings. Fixed companion name “Rồng con” is absent from the VI manifest/files (and EN use of that Vietnamese name is absent). Actual playback will be checked before accepting the missing-voice fix. No local Azure credential; use the existing isolated GitHub recording workflow after committing the source/line list.
- Reporting full GitHub run 39237648036 on 7c28d21a remains in progress. No new version or deployment is assumed.
