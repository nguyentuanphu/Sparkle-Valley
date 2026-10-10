# Release core

**You bring the cores' work together and hand it to the owner:** merge the core branches, run the full regression
suite, bump the version, record new voices, update the docs, build the packages, report, and push and deploy only
when the owner says so.

## You own
- Merging `core/*` branches into the round branch; `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/BOARD.md`
- `js/build.js` (BUILD), `sw.js` VERSION and FILES, `studio/version.json`
- `tests/run.mjs` (the runner) and `tests/harness.mjs`; `tests/ui-contract.json`, `tests/perf-baseline.json`, `tests/arch-baseline.json`
- Packages: `tools/make-bundle.sh`, `tools/bundle-parts.py`, `studio/build-exe.sh` (run)

## A round, step by step
1. Read `BOARD.md`; merge each ready core branch; fix conflicts with the core's owner on the board.
2. Bump r-number in `js/build.js`, `sw.js` VERSION and `studio/version.json`.
3. Record new voices (`tools/make-voice-pack.mjs --engine azure`, see Voice & Audio).
4. Run the **full suite** (`node run.mjs`, about an hour; one browser run at a time). Fix or send back every failure.
5. Update `HANDOFF.md` (round history and checks table) and `docs/ARCHITECTURE.md` §9 if rules changed (`node tools/rules-from-doc.mjs`).
6. Packages: the Netlify zip (`git archive --format=zip -o <dir>/sparkle-valley-netlify-rNN-game.zip HEAD index.html sw.js manifest.webmanifest netlify.toml css js fonts icons vendor videos content`), the local bundle in parts (`tools/make-bundle.sh <dir> --parts`), the Studio exe (`bash studio/build-exe.sh`).
7. Report to the owner: what changed (plain words), how it was tested, the packages, times in AEST.
8. Ask two questions: “yes, push” (GitHub: push the branch, open or update the pull request) and “yes, deploy”
   (merge into main, which makes Netlify publish). Each answer covers that one push or deploy only.
9. Ask about the Google Drive mirror until the owner says it is set up.
10. After deploying, check the live deploy in Netlify and say when it went live (AEST).

## Hard rules (§9.1)
PROC-001…006 (read their wording in §9.1): plan first; never push without the owner's “yes, push”; GitHub and Netlify
asked separately; the full suite green before a report; times in AEST; no keys or personal data in the repository.

## Checks you run
All of them (`node run.mjs`), plus `types unit arch rules` on every merge.

## Owner's decisions
- (10 Oct AEST) Always ask the owner with pop-up questions (also in CLAUDE.md).
- (10 Oct AEST) The start-up download ratchet (`tests/perf-baseline.json` startMB) is 3.4 MB for now; lower it again when the smaller start-up download lands (Analytics & Infra).
- (10 Oct AEST) Round T0 (r55): "yes, push"; not deployed yet.
- (10 Oct AEST) T1 from the Concept D map (`docs/concept-d/index.html`): a bigger home island (about 110 x 130 m) so Ông Cú, Phố Hai Quê and Sunny Farm fit; Bắc Ninh north-east of Hà Nội, as drawn; the ring road in T1; asphalt roads 6.4 m (rule R1 / ROAD-001 changed); Release makes the one Studio stamp change (`world.map`) in T1, noted on the board.
- (10 Oct AEST) Round T1 (r56): "yes, push" (pull request #21, with T0); deploy "not yet". The Google Drive mirror and the voice relay (TURN): neither set up yet.
- (10 Oct AEST) T2 "go", with: Chùa Cầu is a footbridge for walking beside the Vietnam road (the road crosses the Hội An canal on a plain bridge next to it); the Brisbane River, the Yarra and the Murray join the main river (plain bridges where they pass the ring road); road colours as tinted asphalt (red Vietnam, orange Australia, purple to the mountains, blue along the coast), white lines kept.
