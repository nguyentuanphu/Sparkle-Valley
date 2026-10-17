# Four owner-assigned fixes

Owner assigned this chat on 18 October 2026 AEDT to #341 slow gameplay, #350 Ô Ăn Quan, the Friends status map check, and #34 road appearance. The owner said to proceed. Branch: `claude/codex-last-four-20261018`. This is a helper handoff to the existing Release chat, with no merge or deployment authorization.

## Changes under verification

- #341: an automatic-report burst shares one composed-screen capture, keeping separate report details. Concurrent repeats of the same problem share one pending report. A later event gets a fresh capture. Reproduction with 12 simultaneous detector reports: baseline 24 canvas encodes (12 captures), fixed 2 encodes (one capture); all 12 distinct reports retained. This removes reporting overhead; it does not establish the cause of every slow frame on the owner's Mac.
- #350: an empty end pit can be skipped to capture beyond it; an end pit containing its mandarin stone cannot be skipped during chained captures. Autoplay receives legal square/direction choices and waits through sowing and the opponent's turn. Sowing redraws only the changed pit instead of replacing all twelve pits on every seed. Pending taps are cleaned up when the game closes.
- Friends: `G.shareStatus` explicitly includes `Net.mapVersion`. Note: the encrypted envelope already adds a default map version and batch 3 already made `_openFriend` retain it; the board's claim that no status ever carries a map was partly stale. New verification covers the shared status and both same/different-map Join states without requiring a live relay.
- #34: Concept D's darker Australian asphalt and grey Vietnamese asphalt, retaining ROAD-014's subtle region tint; stone kerbs on Vietnam roads. Existing dirt red earth, wheel tracks, grass and edging stones from Round T already match that portion of the reference. No road geometry, map positions, materials count, or collision change.

## Validation

Before changes: unit (162), types, rules and arch passed. Focused new checks `reportburst` and `oanquanrules` passed; a complete two-player game used 18 legal square/direction taps. Three rule unit cases pass. Full changed-check selection requests GitHub's full suite, per CLAUDE.md; local full suite is not run.

Local device and regression verification is in progress. No new spoken lines. No game version bump: Release owns the version, offline/preload integration and final combined release checks.
