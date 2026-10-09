# Task brief: voice pack by area (Voice & Audio core)

Written 10 Oct 2026 (AEST). The rules for helper chats are in `CLAUDE.md`; this brief says what to build.

## Goal
Build `docs/cores/ROUND-R.md` Part 2 **item 12 exactly as written**:
> Voice pack: own language only; a 5–8 MB core pack ships with the game; the rest downloads on Wi-Fi, area by area; name templating and a coverage check so no line is missed.

## What that means
- **Own language only:** a device downloads the languages its children use (English, Vietnamese or both, from the profiles and settings), not every language.
- **A 5–8 MB core pack:** the start, home, Làng Sen, the menus, the Simple screen and the commonest game lines. Measure it.
- **The rest on Wi-Fi, area by area:** each area's lines download when the device is on Wi-Fi (or when a grown-up allows mobile data in Grown-ups), nearest areas first, with the existing small progress bar. Group lines by place id, never by position (the map is being rebuilt).
- **Name templating:** lines with names, numbers or items are recorded as parts so they can be put together, and a line with a child's name is never recorded (HANDOFF rule 11).
- **Coverage check:** a check that every line the game can speak has a recording or a known reason not to.
- Keep: recorded voices always play first on every device including iPhone (HANDOFF rule 11); Vietnamese words inside English lines use the Vietnamese voice (`js/viwords.js`); what is downloaded stays offline; only new voices download (round O).

## You may change
`js/voice.js`, `js/packbar.js`, `js/packhash.js`, `tools/voice-lines.mjs`, `tools/make-voice-pack.mjs`, `tools/voice-harvest.mjs`, `voices/manifest.json` (generated), `sw.js` (voice caching only; tell Analytics & Infra on the board), `js/ui.js` (one Grown-ups setting; tell Kid UI on the board), `tests/run.mjs` (your checks), `docs/cores/voice-audio.md`.

## Checks
Your core's checks (`docs/cores/voice-audio.md`), plus `viwords boot perf iphone`, a new `voicecover` (coverage) and `voicearea` (by-area download) check, then the full suite. Put the start-up download size before and after in the report.
