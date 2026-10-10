STATUS: fixed

What I found
The Simple screen (for under-5s) opened each tab on groups, then a group's path, then a back arrow. It also had two destination buttons: one at the top next to the speaker and Khám phá at the bottom.

What I changed
- js/simple.js: each bottom tab (Trò chơi, Truyện, Nơi chốn) is now one long road that scrolls down. A category's stops end and the next category starts on the same road, after a drawn heading stop (picture and name, spoken in both languages). The group pages, the back arrow, the "more" and "next group" signposts are gone. The top destination button is gone, as the owner decided. Khám phá stays as the one search and jump button, and its cards now scroll to that category on the road. In places, China and India always come last (sorted inside the screen, so Play's file is untouched). Ông Cú and the glowing next stop work along the whole road.
- css/style.css: removed the top button and back-arrow styles, added the heading stop look (purple ring, name 20 px, picture 64 px or more).
- tests/run.mjs: the simple, adventure and songs checks now test the new design (one road, headings in order, China and India last, one Khám phá button, no top button, Discover scrolls to the category). Replaced, not weakened.
- docs: docs/cores/kid-ui.md (rules and owner's decisions), docs/ARCHITECTURE.md (A11Y-003, A11Y-006 wording), docs/cores/BOARD.md (request to Play to reorder PLACE_AREAS and TALE_AREAS so the source order matches).
No Round T map files touched, no version bump, no new spoken lines (the headings reuse the existing recorded group names).

Checks (11 Oct, AEST, on this branch)
- simple: pass
- adventure: pass
- contract: pass (no re-record needed)
- language: pass
- phone: pass (10 screens on desktop, phone and tablet)
- a11y: pass
- firstplayer, playhub, iphone, emoji, names, quiet, welcomevoice, ages, songs: pass
- parents: FAIL ("bedtime"). It fails the same way on the code without my change, so it is not from this fix.
- Full suite and online checks: not run in this helper session.

Not done / for later
- I did not look at screenshots myself; the phone check (phone, tablet, computer) passed.
- Play still needs to reorder the lists in js/content/activities.js (board request written). Stories still show China and India before "Our own stories", as the issue only asked for places.
- The parents bedtime check needs its own look.
