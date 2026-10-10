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
8. Ask one pop-up question per round: “yes, deploy”. It covers pushing the release branch and merging it into main
   (which makes Netlify publish), for that round only (owner, 10 Oct: Release is the master release; helper chats push
   their own branches without asking).
9. Ask about the Google Drive mirror until the owner says it is set up.
10. After deploying, check the live deploy in Netlify and say when it went live (AEST).

## Hard rules (§9.1)
PROC-001…006 (read their wording in §9.1): plan first; nothing reaches main without the owner's “yes, deploy” (one per
round); the full suite green before a report; times in AEST; no keys or personal data in the repository.

## Checks you run
All of them (`node run.mjs`), plus `types unit arch rules` on every merge.

## Owner's decisions
- 10 Oct AEST: Release is the master release of all work. Helper chats push their own branches without asking; Release collects every branch, merges, runs the full suite, reports, and asks one pop-up "yes, deploy" per round, which covers pushing and merging into `main`.
- 10 Oct AEST: every question to the owner is a pop-up question with clickable choices (`CLAUDE.md`, HANDOFF rule 19).
- 10 Oct AEST: Release checks every branch once an hour (routine "Release: hourly branch collection", about 26 minutes past each hour): fetch, read each branch's Now line, merge the core branches marked "ready for Release" into the Release branch locally and run `types unit arch rules`; never pushes or merges into main without the round's "yes, deploy". `studio-draft` and old `claude/*` branches are merged only after asking the owner.
- 10 Oct AEST: no double suite runs. Release reruns the full suite only when the merged code differs from what a helper tested (two or more branches merged, or Release changed code itself); otherwise it runs the quick checks (`types unit arch rules ground studio`) and relies on the helper's recorded full-suite result (commit id and every check, in that core's progress notes).
- 10 Oct AEST: r55 (chapter 2) deployed at the owner's "Deploy now" with the full suite still running (2 of 81 checks done, both passed); the rest reported when it finished.
