# Task brief: the next 3D films (Kid UI core)

Written 10 Oct 2026 (AEST). The rules for helper chats are in `CLAUDE.md`; this brief says what to build.

## Goal
Add the next batch of films after the pilot described in `docs/cores/ROUND-R.md`, section "Stories and guides as real animated films": **two story films and two how-to guide films**.

## What is already decided (ROUND-R.md, films section)
- Every page is a short film acted in 3D by the valley's own people, animals, houses and vehicles (`js/film.js`), with faces, moving mouths and the poses the engine has.
- The child helps on 2 or 3 pages; the film waits for the narrator, asks, waits for a tap (carries on by itself after 14 s). Tapping a character makes it hop. Calm mode cuts between shots.
- Films load only when opened; the Studio switch `storyFilms` turns them all off.
- Phones: same models as the valley, a small stage, few lights.
- **New for this batch (the pilot left it out):** the how-to films show the real game playing its first moves by itself, slowly, with a glowing hand showing each tap or drag.

## Choose, then ask
In your plan, name the two tales (from `js/learn.js` or `js/talesdata.js`, suitable for 3 to 8 year olds, nothing frightening) and the two games (ones without a how-to film yet), and wait for the owner's "go".

## You may change
`js/film.js`, `js/content/films.js`, `js/howto.js` (the glowing-hand guide), `js/tales.js` (opening a film), `js/art.js`, `css/style.css` (your block), `tests/run.mjs` (the `films` check), `tests/filmshots.mjs`, `docs/cores/kid-ui.md`, `docs/cores/ROUND-R.md` (films section status).

## Checks
Your core's checks (`docs/cores/kid-ui.md`), plus `films tales emoji noemoji perf`, every page watched with `tests/filmshots.mjs`, then the full suite.

## Report
As in `CLAUDE.md` helper rule 11, plus one screenshot per film page you consider the most important.
