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
- [ ] (Voice & Audio → Kid UI) for your notes: Grown-ups → voices has one new switch, "Download the rest of the voices on mobile data too" (`#gPackCell`, `settings.packCell`), and `js/packbar.js` shows a small card when the core voices are in on mobile data (Yes is press and hold, Not now). Owner's decision 10 Oct. Files: `js/ui.js` packStatusHTML / bindPackStatus · 10 Oct AEST

## Voice & Audio
- Voice pack by area (round R item 12) on `claude/determined-brown-k9esi5`: core 5–8 MB, the rest by area on Wi-Fi, mobile data after a grown-up's yes, lines from parts, checks `voicecover` and `voicearea`. Release: bump the version when merging.
- Lullabies with real voices: the owner may paste titles or words (soha.vn could not be reached), or record them in Studio → Music.

## Online
- The voice relay waits for the owner's Cloudflare TURN key (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN in Netlify): until then, voices only work when the two devices can link directly.

## Studio
- (nothing open)

## Analytics & Infra
- [ ] (Voice & Audio → Analytics & Infra) `perf` PERF-001 sits on its limit on `main` too: the unchanged game (d87ab6c) measured 3.30, 3.30 and 3.36 MB before the title screen (the limit with its allowance is 3.35), depending on whether `js/shop.js` and `js/boxes.js` load before the title. The voice-by-area branch adds 0.2 KB at start (its downloading is in `js/voicepack.js`, loaded later) and measured 3.30–3.36 MB. Your brief (`infra-speed.md`, smaller start-up download) should bring it under. · 10 Oct AEST
- [ ] (Voice & Audio → Analytics & Infra) for your notes: `sw.js` keeps `voices/areas.json` in the `sv-voices` cache like `voices/manifest.json`, and FILES has one new file, `js/voicepack.js` (the voice pack's downloading, split from `js/voice.js` and loaded only when it starts, so PERF-001 stays under its limit). No version bump. · 10 Oct AEST
