# Repair evidence index

Real emulated-browser screenshots with synthetic Demo players and null photos; controlled custom/live/report services.
Baseline R74 is pinned; candidate R76 is the repair working branch. Images are not generated.
Do not treat these captures as complete round evidence or proof of production services.

| Work order | Matching files under baseline/ and candidate/ | State | Remaining evidence |
|---|---|---|---|
| WO-01 | phone-en-selection.png, phone-vi-selection.png, tablet-en-selection.png, computer-en-selection.png | Actual selection captures, measured redraw invariants | Fresh visual inspection; keyboard/split-screen/real devices |
| WO-05 | corresponding *-welcome.png | Welcome screen | Timed cold/warm/offline/packed/update, import-error diagnosis |
| WO-06 | corresponding *-bag.png | Backpack initial category | Every item/action/category and quantities, worn comparison |
| WO-03/07 | corresponding *-shop.png | Shop in Pad | Mirror/outfit/gift/collection combinations |
| WO-08 | corresponding *-audio.png | Compact Audio | Collision/safe areas/touch target/keyboard cases |
| WO-09 | candidate/*-tester.png and *-autoplay.png | Shared tabs; draft retained by assertion | Matching baseline tester capture missing, run-state/receipt evidence |
| WO-19 | tests/unit/device-version.test.mjs | Backend controlled-store tests6/6 | Studio actual screens; production usage/session migration |
| Other work orders | missing | Not evidenced yet | Must not be marked complete |

Each image group has results.json containing actual bounds/errors and (fresh runs) build. Capture script tests/owner-repair-evidence.mjs specifies reproducible routing/state.
Final table must expand all original59 points using requirements.json and link exact candidate commit/tests. Missing evidence stays marked missing.
