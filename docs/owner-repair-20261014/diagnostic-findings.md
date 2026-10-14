# Resumed diagnostic findings

14 October 2026 AEDT. Owner includes additional bugs in this same round. No main merge, deployment or release is approved. A source finding is not a completed repair.

| ID | WO | Finding | Reproduction / proof | Disposition |
|---|---|---|---|---|
| DR-01 | WO-12 | Removed family devices still exhaust the 30-device limit and can block replacement or recovery | netlify/lib/family-devices.mjs counts all historical records; new unit regression pending | Preserve revocation records; enforce capacity on active devices; validate before claiming fixed |
| DR-02 | WO-12 | Backup import silently truncates after 60 entries | import action slices incoming entries; oversized-backup regression pending | Reject excessive input before mutation; never silently lose backup entries |
| DR-03 | WO-12 | Backup import can exceed 60 total photos by adding to existing photos | Union-capacity regression pending | Retain the existing limit, validate the combined collection before mutation |
| DR-04 | WO-12 | Revocation clears photos but leaves an unusable connection credential and hides reconnection controls | Two-device ownerfamily regression extended; pending | Clear the rejected connection when status confirms revocation; preserve unrelated game/installation data |
| DR-05 | WO-05/12 | Four fixed family-help lines have no local recorded voice | Expanded voicecover failed on saved code25176e7; workflow artifact11887433748 contains eight MP3 files | Integrate only inspected recordings/index changes, preserve older recordings, rerun coverage |
| DR-06 | WO-18 | AI review wrapper is green without a completed review | Run38556313316 / PR300 comment6167241597 explicitly says review did not finish | No independent-review approval; obtain a substantive verdict later |
| DR-07 | WO-18 | Older pictures lack adequate current source attribution | Historical evidence files do not establish latest source from a build label alone | Capture script now checks served bytes against Git commit and records hashes/time; fresh captures pending |

The local expanded suite owns the machine; no second test run is started beside it. Family regressions above are pending until it completes. The diagnostic GitHub full suite runs separately on eight remote machines at ee145bd1 (run38556313225), not on unpublished local changes.

All216 open bug-labelled reports through#299 remain individually listed in issue-intake.json. Sanitized reported-build/module metadata helps choose reproductions but is not a diagnosis. All remain open; no release/retest disposition is inferred from a version change. General source concerns, such as cross-tab outbox races and simultaneous pairing, remain in the work order until reproduced and resolved.
