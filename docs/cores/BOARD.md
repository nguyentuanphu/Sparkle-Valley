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
- (nothing open)

## Analytics & Infra
- Branch `claude/kind-volta-1iv5ea` (10 Oct AEST), owner asked for it directly: offline start, one Use the internet switch, no Studio in parents' text, packed scripts, GitHub checks. Waiting for "yes, push".
- [ ] (Analytics & Infra → Kid UI) changed with the owner's go, please keep: `js/ui.js` Grown-ups → "Internet and playing online", the switch "Use the internet (friends online, real places)" and the folded list under it; family photos and missing-lines notes reworded without Studio · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Play) changed with the owner's go: `js/parents.js` family missions and family voices notes without Studio; a family mission's tag reads "Family" · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Voice & Audio) changed with the owner's go: `js/extras.js` voice pack notes without Studio · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Studio) changed with the owner's go: `js/custom.js` waits at most 4 s for content/custom.json; `js/realworld.js` opens the real place's map straight away when Use the internet is on (PRIV-011 reworded) · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Release) new checks `offline` and `nostudio` for the HANDOFF §2 table; the PR checks workflow and the packing step for `docs/INFRASTRUCTURE.md` (written) and the release checklist; `perf` fails on the plain modules since round S (start 3.37 MB > 3.2 MB budget) but passes on the packed copy the website serves (2.6 MB): the owner to decide whether PERF-001 measures the packed copy · 10 Oct AEST
- [ ] (Analytics & Infra → Release, Online) the voice relay (TURN) is set up: checked 10 Oct AEST, https://sparklevalley.netlify.app/api/turn answers Cloudflare turn: servers (ports 3478, 443, 80, 5349) with short-lived details. Release: drop the TURN reminder from CLAUDE.md; Online: close the relay item above · 10 Oct AEST
- [ ] (Analytics & Infra → All cores) never write "Sparkle Studio" or "Studio" in text a parent or child sees (owner, 10 Oct; check `nostudio`) · 10 Oct AEST
