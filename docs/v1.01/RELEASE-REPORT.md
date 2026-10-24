# v1.01 release review — in progress

24 October 2026 AEDT. Branch `release/r91`, draft PR [#506](https://github.com/nguyentuanphu/tpn/pull/506). Live remains r90, publicly v1, at main `ef330bc0`. No deployment has been approved in this session.

## Collection and scope audit

Helper `work/r91-front-desk` at `60645b8d` merged cleanly. It contained changes for brief items 1–3 and the ResizeObserver filter from item 8, not all eight items. Release repaired review findings and collected additional owner-reported voice work.

| Brief item | Current state |
|---|---|
| 1. Ladybird fixes | In code and targeted check passes: fixed-report tab, one/all answers, count badge, quiet coins. Release fixed tab links/keyboard navigation, added the visible coin amount and hid historical internal r version labels. |
| 2. Floating controls | Helper removed white strips/shadows and made the quick-settings title scroll; Release subsequently fixed the offscreen sticky close button, separated the floating Save & close action from the white parent panel, and prevented focus scrolling from shifting its header. Six EN/VI device layouts pass geometry checks. |
| 3. One backup | Save/Load a copy accepts legacy v2 files with validation and replacement confirmation. Release removed duplicate backup-date writes and preserves the current device identity when a legacy copy has no id. |
| 4. Simple screen Home | Added by Release: Home in the top sound/parent control group, 64px controls, floating website preserved. Simple targeted check passes. |
| 5. Cloud photos | Helper did not change this. Release reproduced a same-key hello/async-photo race in a deterministic regression and repaired it without removing admission/encryption/key checks. Cloud browser check passed (443s), including both devices’ own rendered face pixels. Physical-device owner confirmation remains outstanding. |
| 6. Simple unlock rules | Added by Release: activities filter through shared isOpen/isHeld rules. Targeted second-set check passed (45s). |
| 7. Family code | Plan only. Owner approved the short EN/VI privacy wording; creation/joining/QR/hash feature is not implemented or claimed ready. |
| 8. Tester issues | Narrow ResizeObserver delivery-notice filter and negative/positive unit tests added. Robot Planner x5 replay, remaining freeze/slow reproduction and Play Outside tap-wait investigation remain pending. No unrelated issues closed. |

## Added owner voice work

Female remains the default. Male preview now awaits actual playback rather than resetting its requested slot immediately. Previewing male does not opt the family into male downloads. Optional male selection retains the shared service callback. Explicit offline downloads use a shared background task and the game-wide progress bar; a settings window can close/redraw without owning or cancelling the task. Reopening joins the same job. The game must remain open; no promise is made about downloads while the browser/app is closed by the operating system. Automatic mobile-data policy remains in place; an explicit Download tap starts the requested download.

Real recordings in the pack: English female Natasha/male William; Vietnamese female Hoài My/male Nam Minh. Browser regression has verified distinct female/male MP3 requests, opt-in staying off for previews, and cache growth/shared progress after Save & close. No new spoken lines were introduced.

## Checks recorded so far

- Baseline merged code: cloud passed locally (342s); the reported failure is intermittent. A deterministic unit regression failed against the old photo implementation, then passed with the repair. Privacy negatives cover removed recipients, changed keys, changed rooms and waiting knockers.
- Unit: 225 pass. Emoji, preload and architecture: pass. Types: pass after review annotations were corrected (no broad any, casts or ignores added).
- Voice/background browser check: pass (84s). Its initial fixtures used a nonexistent Grown-ups shortcut and an async wait predicate that Playwright 1.56 treated as truthy; fixtures corrected before the pass. This is not an unchanged flaky check passing on retry.
- Updated testerrewards: pass (310s), with all prior badge/gear/sticker/coin assertions retained and the owner-requested quiet/list behaviour replacing the removed speech expectation.
- Simple: pass (275s), including floating website and return to play.
- GitHub full suite: [40067054592](https://github.com/nguyentuanphu/tpn/actions/runs/40067054592), current candidate `afbb89dc`, in progress. Superseded run cancelled. Latest fast and website checks pass. The old fast failure was phone-emoji characters quoted in the brief; corrected in the document.
- Local sequential speed checks: battery PASS (148s); perf FAIL (worldMs 11044 > 6600); startup FAIL on timing (title 1356ms, first ready 37162ms, cached ready 35652ms, cached freeze 9013ms). Cached download passes: secondKB = 0. Limits were not changed. Full values are saved beside this report. Comparison against live v1 on the same machine has NOT run.
- Screenshots: 42 full-game PNGs (seven panels, EN/VI, phone/tablet/computer), seven visually reviewed contact sheets, plus 18 final parent-panel PNGs and geometry checks. The final 18 parent images still need a visual review. Initial screenshot defects were fixed; before evidence is retained.
- Runtime fixes after afbb89dc are local commits through e8887bb5 and will be pushed with the handover. They have NOT completed full regression. Still required: final GitHub full suite, final testerrewards assertions, Robot Planner replay, speed baseline investigation, current GitHub code-map files and verified Netlify ZIP.

## Open reports and approvals

The largest open freeze/slow group in the issue audit is the story-film theatre (15 reports across older rounds); other contexts include the Pad, drawing activities, dialogs, website, report/print UI and several games. This grouping is evidence for investigation, not a claim of cause or a fix. Existing r90 blur/visibility handling already addresses the native print/share-sheet gaps; the remaining issues need replay before changes.

Family-code privacy wording is approved; implementation remains pending. GitHub repository privacy remains the owner's later decision. Physical iPhone/audio listening and the owner's two-device photo case cannot be replaced by software-rendered Chromium evidence.

After verification, supply the Netlify ZIP and final report, confirm v1.01 and ask one pop-up “yes, deploy”. Only that approval permits PR readiness/merge and production deployment. Studio remains online-only; no exe build/publish is part of this round.

## Stopped at owner request

Owner requested stop and upload on 24 October 2026 AEDT. See [takeover instructions](../cores/tasks/release-takeover-v1.01-20261024.md). This is an interim evidence package, not a deployment-ready report. No Netlify ZIP has been built.
