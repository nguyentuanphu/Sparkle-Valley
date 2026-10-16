# Bug intake — owner-approved combined repair round

Latest refresh:15 October2026 AEDT.216 open bug-labelled issues through#299, no newer reports at this refresh. All remain included and open; individual dispositions remain unfinished. Diagnostic draftPR300 full38658819569 passed157/157 atf47546d5; all eight shard results were audited with no retry flags. Later learning/shared-frame checkpoint636c8ce8 has focused proof and still needs its own full-suite validation. Historical counts and environment blocker below are superseded; execution is available.

Current groups: offscreen171; freeze2; autoplay15; error6; noopen6; manual/other4; slow12. Full bodies/private diagnostics are not copied into the repository.

## Historical intake (superseded by refresh above)

Captured at 2026-10-14T06:38:22.328Z (UTC); owner-facing timezone Australia/Sydney, AEDT.
Source: both pages of the repository's open issues endpoint, 100 records/page. Pull requests excluded from bug counts.

## Scope and refreshed source
- Main remains 6a6ae885f86ad58a52688782eeba1d5417985fe9.
- Rejected draft remains 74b918c6c4c52db2e42d24dc69fe2945f1907e3d; PR #195 open, draft, unmerged.
- 168 open issues, of which 166 are labelled bug.
- 54 bugs created after the audit prompt's last observed modification (2026-10-14T03:28:36Z): #196–#249.
- New batch: 53 offscreen reports and one freeze report (#220). Included in this round.
- Counts are a point-in-time intake, not an assertion of 166 independent causes or a live monitoring service.
- Full sanitized issue-to-work-order inventory: issue-intake.json. No raw report bodies, child names, screenshots, credentials or private Studio data copied here.

## Initial grouping
| Report category | Open bug issues |
|---|---:|
| offscreen | 133 |
| freeze | 1 |
| autoplay | 4 |
| error | 6 |
| noopen | 6 |
| manual/other | 4 |
| slow | 12 |

## Source findings and reproduction hypotheses
1. Baseline js/tester.js offscreen detection compares all matching buttons to the browser viewport without establishing whether a control is intentionally outside a scroll container's visible area, belongs to a background panel, or remains reachable by scrolling. New #223–#249 are a burst of Play-list entries. Investigate detector false positives AND genuine unreachable controls; do not suppress every offscreen report or close issues from source review alone.
2. Baseline playGame wrapper checks for any .gl window after a timeout. It does not remember that the specific activity opened and was subsequently closed by the user. The public trace in #249 shows Balloon Flight opening, user Leave/close, then noopen balloon. A lifecycle-aware detector is required; also reproduce genuine failed/delayed opens, concurrent invocations and cancellation. Capturing mutable lastGame at timeout may attribute the wrong activity.
3. #220 is a long freeze report on r74. Verify visible real freezes separately from iOS page suspension/resume. Baseline already resets on visibilitychange: absence of that handler is NOT the diagnosis. Reproduce pagehide/pageshow/suspension and actual main-thread stalls before choosing a fix.
4. Import errors and Bà Năm failures remain high-priority WO-05/16 cases, including #140/#141/#184/#185/#189–#193. Establish failed URLs/assets/cache/build evidence; no unsupported stale-cache diagnosis.
5. Existing manual crash #86, startup #36, held road-design #34 and fixed-on-branch #87 remain accounted for. Inclusion in intake does not silently lift a deliberate owner design hold or authorize merging an unchecked branch.
6. Many core labels were assigned heuristically by the issue workflow. Root-cause triage may require a different accountable core; do not blindly change ownership or start multiple implementations.

## Next steps once execution is available
- Capture approved baseline UI at reported iOS-like viewport plus phone/tablet/desktop EN/VI.
- Reproduce visible unreachable controls vs legitimate scroll content.
- Demonstrate successful-open-then-close does not become noopen; demonstrate genuine failures still report.
- Reproduce genuine freeze and suspension/resume separately.
- Repair shared causes on an isolated candidate with focused meaningful tests; preserve reports and link every original issue.
- Record observed behaviour, tests, before/after evidence and remaining limitations. Keep all issues open until dispositions have proof.
- Refresh intake before final candidate validation to include reports arriving during implementation.

## Execution blocker
The selected environment is unavailable. No shell/browser tools are available in this turn. GitHub reads and documentation writes work. No local game execution, code repair, tests, new screenshots, production Studio reports or physical-device checks have been performed in this checkpoint.

Individual technical-context refresh:171 offscreen reports map to50 Pad,44 Play hub,33 quick Settings,28 Grown-ups,15 Tester panels, and one unknown-panel report#118. Exact technical OS/browser/viewport/language/build fields are added per issue in issue-intake.json; no private notes/names/device identities/photos copied. Eight viewport/language combinations and21 panel cases are now under real-control investigation. A matched current control must be scrolled into view and pass center hit/viewport checks; missing/state-dependent matches stay unresolved. This is not a blanket detector dismissal or issue closure.
