# Board: what each core is doing and what it needs from others

Every core keeps its own section up to date. Times are in AEST. Release reads this before merging.

Each section starts with a **Now** line (owner, 10 Oct; rules in `CLAUDE.md`, "Working together across chats"):
`- **Now:** what I am doing · branch · last commit · waiting for (owner's go, yes push, another core, nothing) · date AEST`

Format for a request:
`- [ ] (from → to) what is needed · why · files · date AEST`

## Release
- **Now:** Round T on `round-t`: T2 (r57: rivers, lakes, bridge landmarks, road colours, boats) built on top of T1 (r56, pushed to pull request #21, not deployed); full suite running · branch `round-t` · waiting for the owner's "yes, push" / "yes, deploy" for r57 (and Online's map version in the hello before Round T goes live) · 10 Oct, 6:10 pm AEST
- r54 is live (10 Oct, 1:29 am AEST). Round T stages T0 to T4: `docs/cores/ROUND-T.md`. Until Round T is merged, other cores do not change world positions or the map files (CLAUDE.md, helper rule 4).
- Halloween decorations start growing about three weeks before 31 Oct: they only reach players once a round is deployed.
- Still to build from the Round R plan (`docs/cores/ROUND-R.md`, Part 2): items 2 to 12 (Concept D layout, child's journey, homes, surprises, shop and wardrobe, money games, the rest of the festival groups, Hội làng times, 5–8 challenges, parent features, voice pack by area); the owner's privacy decisions of 9 Oct; splitting the code into per-core folders (infrastructure round).
- The Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet: ask the owner at every report.

## World
- **Now:** Round T is run by a Release chat on branch `round-t` (see `docs/cores/ROUND-T.md`, Progress); no separate World chat until Round T is merged · 10 Oct AEST
- (nothing open)

## Play
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Release → Play) T1/T3: festival `where` ids for the new places (`hoian`, `vungtau`) in `js/content/festcal.js` · ROUND-T.md · 10 Oct AEST

## Kid UI
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Release → Kid UI) T1: the Pad map's names overlap on the east side (Village festival stage over Đà Nẵng, Three Regions Market over Hồ Chí Minh City), seen at 1200×1200 · screenshots in ROUND-T.md Progress · `js/ui.js` · 10 Oct AEST
- [ ] (Release → Kid UI) T1: new place ids (`hoian` first; later `vungtau`, `harbour`, `memory_e`, `memory_w`) in `PLACE_AREAS` and the Pad map's list; T4: the drawn Pad map from `PLACES`/`WATERS` in `js/content/map.js` · ROUND-T.md T1, T4 · `js/ui.js`, `js/simple.js` · 10 Oct AEST

## Voice & Audio
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Release → Voice & Audio) T1/T3: the new areas (`hoian`, then `vungtau`) in `VN_AREAS` (`js/content/songs.js`), and the place names in the voice pack · ROUND-T.md · 10 Oct AEST
- Lullabies with real voices: the owner may paste titles or words (soha.vn could not be reached), or record them in Studio → Music.

## Online
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [x] (Release, one-line fix a check needs, 10 Oct AEST) `js/netmsg.js` `W` is now 235 (the 480 m valley); Online may make it read `WORLD.size` from the map.
- [ ] (Release → Online) Before T1 goes live: the hello carries the map version (`MAP_VERSION`); a friend on another layout sees "Ask a grown-up to update" instead of joining (positions are raw x, z) · ROUND-T.md §4 · `js/netmsg.js`, `js/net.js` · 10 Oct AEST
- The voice relay waits for the owner's Cloudflare TURN key (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN in Netlify): until then, voices only work when the two devices can link directly.

## Studio
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [x] (Release, owner's T1 answer, 10 Oct AEST) the stamp itself is done in `studio/ui/app.js` (Map page: older edits go to `CONTENT.parked`, then `world.map` = MAP_VERSION). Still for Studio: the Map page lists parked items to place again.
- [ ] (Release → Studio) Was "before T1" (the stamp part is done): when Studio saves the family's map content (`world` build/edits/land, `npcs`), stamp `world.map` with `MAP_VERSION` from `js/content/map.js`. Content with no stamp counts as map 'C'; on any other layout the game parks it (`G.parked`) and never places it. Then the Map page lists parked items to place again (old place plus offset via `LEGACY.C`), and new features store a `placeId` and offset, never raw x, z · ROUND-T.md §4, owner's decision 5 · `studio/ui`, `studio/core.cjs` · 10 Oct AEST
- [ ] (Release → Studio) T3: a Plots page for the Memory Village plots (`PLOTS` in the map) · ROUND-R.md item 2 · later

## Analytics & Infra
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Release → Analytics & Infra) The start-up download is at its ratchet: r54 measures 3.33–3.37 MB before the title screen against 3.2 MB + 3 % (the `perf` check fails on main about 3 runs in 4); Round T0 adds about 22 KB (the map file). Owner (10 Oct): the limit is 3.4 MB for now; lower it again after the smaller start-up download brief (`tasks/infra-speed.md`) is the fix · `tests/perf-baseline.json` · 10 Oct AEST
