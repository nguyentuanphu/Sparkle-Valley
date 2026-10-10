# Board: what each core is doing and what it needs from others

Every core keeps its own section up to date. Times are in AEST. Release reads this before merging.

Format for a request:
`- [ ] (from → to) what is needed · why · files · date AEST`

## Release
- Round R: r50 pushed to GitHub (9 Oct AEST), not deployed to Netlify yet. r51 (kid-play switches, hands-on story steps, the yard as a side story) on `round-r`, waiting for "yes, push" / "yes, deploy".
- Halloween decorations start growing about three weeks before 31 Oct: they only reach players once a round is deployed.
- Still to build from the Round R plan (`docs/cores/ROUND-R.md`, Part 2): items 2 to 12 (Concept D layout, child's journey, homes, surprises, shop and wardrobe, money games, the rest of the festival groups, Hội làng times, 5–8 challenges, parent features, voice pack by area); the owner's privacy decisions of 9 Oct; splitting the code into per-core folders (infrastructure round).
- The Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet: ask the owner at every report.

## World
- (nothing open)

## Play
- (nothing open)

## Kid UI
- (nothing open)

## Voice & Audio
- Lullabies with real voices: the owner may paste titles or words (soha.vn could not be reached), or record them in Studio → Music.

## Online
- The voice relay waits for the owner's Cloudflare TURN key (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN in Netlify): until then, voices only work when the two devices can link directly.

## Studio
- For Release (Studio review, 10 Oct AEST, branch `claude/quirky-meitner-dsxo5i`): please add to `HANDOFF.md`'s checks table, `studio` row: "(Studio review) every server message has Vietnamese (`studio/ui/vi.js`); leaving a page with changes not saved asks; save and Publish say what happened; 44 px buttons and boxes on 21 pages on a tablet and a phone; the game's names follow Studio's language; the pages open on a computer, a tablet and a phone". New Studio file `studio/ui/vi.js` (already in `studio/build-exe.sh`; not a game file, so not in `sw.js`). SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).

## Analytics & Infra
- From Studio (10 Oct AEST): `perf` fails on `main` (d87ab6c) as well: PERF-001 start-up download 3.36 MB, budget 3.2 MB. Not from the Studio review (no game files changed); it fits `tasks/infra-speed.md` (smaller start-up download).
