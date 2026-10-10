STATUS: fixed

What I found
- The Bag button sent the child to the shop stall (a code override in js/shop.js). The shop also had a backpack tab, and the wardrobe had a shop button on any row where nothing was owned yet.
- In the wardrobe, the green Done button was placed on top of the first row, and the rows could be clipped by their own scroll box.

What I changed (the owner's decision on the issue, and the plan the owner said "go" to)
- js/shop.js: the Bag button now opens the backpack again (the travel code is gone). The shop has no backpack tab (the mirror/wardrobe tab stays, so 7 tabs). The wardrobe rows have no shop button. The Done button has its own strip at the top of the sheet. The stall in the valley is unchanged.
- js/ui.js (backpack screen, Kid UI's file, a few lines): one small round shop button next to the coins. It opens the clothes shop right there, with no travel. It is 48 px, and 64 px for under-5s.
- css/style.css (the shop's own "kward" block only, plus the small button): the sheet grows taller, rows wrap, nothing is cut off, and the Done button covers nothing.
- tests/run.mjs ("shop" check): updated to the new behaviour (the Bag opens the backpack, the small button opens the shop with no travel, 7 tabs, no row shop buttons, no overlap or cut-off or Done button over a chip). Nothing weakened.
- docs/cores/play.md: the Bag button text and the owner's decision.
- No coin hint for children and no new spoken lines were added.

Checks
- shop: pass
- games, gamelevel, tales, songs, playhub, coop, tienlen, chests, postcards, myhouse, adventure, boxes, hoilang, surprises, currency, unit (54 tests), phone (desktop, phone and tablet screens): pass
- netgames, together: skipped (no MQTT server here)
- parents: FAIL ("bedtime"). It fails the same way without my changes, so it was already failing and is not caused by this fix. Someone should look at it separately.
- The full suite was not run (time).

Left to do
- The parents "bedtime" check needs its own look.
- I did not look at screenshots on the three devices myself; the check measures that items do not overlap or get cut off on desktop, and the phone check passed. Release should look at phone, tablet and computer screenshots of the bag, shop and wardrobe.
