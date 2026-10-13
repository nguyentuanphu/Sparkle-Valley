# Story films in batches (handoff, 13 Oct AEDT)

Written by the Release chat in case its usage runs out. Start after r70 is live, then send:

> You are the **Release** core. Do `docs/cores/tasks/films-batches.md`.

## Owner's decisions (13 Oct AEDT)
- Every story becomes a 3D film like Thánh Gióng and Cây khế (Round V item 16, `docs/cores/ROUND-V.md`).
- Batches of about 6 films, **Vietnamese stories first**, then Australian, Chinese and Indian.
- "Stories are to be built in batches, don't full suite on each of the batches": each batch runs only the quick checks
  below; the full suite runs once before a release.
- Each release still needs one "yes, deploy" pop-up (CLAUDE.md).

## Owner's notes on the films we have (13 Oct), fix these first, in batch 1
1. **The narration does not cover the whole scene.** After the narrator stops, the scene goes on in silence, which feels as
   if the film is broken. In `js/tales.js` `drawFilm` the page ends when both the voice and the film page (`film.page(k)`,
   its length `S.len` in `js/film.js`) have finished. Fix: no page may run more than about 1.5 s past its narration. Fit each
   page's action to its spoken line (shorten long actions or add a narration line), and measure it: a check that, for every
   film page, compares the page length with the recorded voice length (the voice pack files give the length) and fails on a long silent tail.
2. **Soft background music during films.** A quiet music bed under every film (calm, below the narrator; ducked while
   the narrator speaks), using the game's own synthesised music (`js/audio.js` Music); it stops when the film closes,
   and the previous music comes back (`finish` in `js/tales.js` already plays `prev`). It must follow the music switch
   and calm mode.
3. **Some films do not start by themselves.** Find which ones and why. Suspects: the film loads after the first page has
   been drawn (`ready` race in `js/tales.js`); the first narration waits for a tap on iPhone (audio not unlocked);
   `featureOn('storyFilms')`; a page with `S.help` that waits for a tap and never carries on. Every film must start and
   play through every page with no tap (auto on), on phone, tablet and computer. Add this to the `films` check.

## Films that exist
`js/content/films.js`: duahau, thanhgiong, oanquan, counting, lantern_prologue, lantern_ch1, banhchung, caykhe, hoguom;
`js/content/chapter2films.js`, `js/content/chapter3films.js` (lantern chapters). The how-to guides use the same player
(`js/howto.js`). Script commands are listed at the top of `js/film.js` (S.walk, S.do, S.tw, S.cam, S.help; SETS, PROPS).

## The rest (about 33 tales without a film)
List them: every tale id in the tales content without a `FILMS[id]`. Order: Vietnamese first. Each batch:
1. About 6 film scripts, timed to each page's narration (note 1 above), with the music bed (note 2).
2. New spoken lines recorded with Azure: `node tools/make-voice-pack.mjs --engine azure --key "$AZURE_SPEECH_KEY" --region "$AZURE_SPEECH_REGION"`
   (never print or commit the key; `--count` shows what is missing; no line with a child's name is recorded).
3. Quick checks only: `films`, `tales`, `voice`, `bilingual`, `phone`, the new silent-tail and self-start checks
   (`cd tests && CHROMIUM=/opt/pw-browsers/chromium SV_URL=http://localhost:8765/ node run.mjs films tales …`).
   Film stills: `node tests/filmshots.mjs` for phone, tablet and computer; look at them.
4. Commit and push the working branch; board line; English and Vietnamese for every line; no emoji in docs.
5. When the owner wants a batch live: full suite once, Netlify zip, report, one "yes, deploy" pop-up; bump the version.

## Progress (Release chat, branch `claude/quirky-maxwell-4lm9tv`, started 13 Oct, 10:15 am AEDT)
Owner's decision, 13 Oct about 10:20 am AEDT: **"build everything now"**: the three fixes and every missing film go in
**one batch**, built on top of r70 (this branch started from `claude/great-faraday-weuhjv` at cc54c03f), released
later with its own "yes, deploy". Record progress here as it goes.

Measured before any change (new check `filmtails`, 13 Oct): film pages ran 2 to 13 s past their narration (58 problems
in 9 films; e.g. Thánh Gióng p4: film 18.7 s, voice 5.6 s).

Plan and state (update each step):
1. [ ] Player: `S.say(t, en, vi)` narration lines inside a film (the film waits for the narrator; shown under the
   page's words); the page ends only when the narrator is done; help taps carry on by themselves sooner.
2. [ ] Films that do not start (causes found): the recorded-voice player (`playUrl` in `js/voice.js`) and the pack
   fetch had no time limit, so a stalled clip on iPhone left the narration "speaking" for ever and the page never
   turned; the film scripts loaded with no time limit before the first page. Fix: time limits on both, a cap on the
   narration wait in `js/tales.js`, and each new film in its own small file (`js/content/films/<id>.js`, listed in
   `js/content/talefilms.js`) so opening a story loads only its own film.
3. [ ] Music bed: theme `story` in `js/audio.js` (quiet, slow), lowered while anyone speaks (`Music.under`), the
   previous music back on close; follows the music switch and calm mode.
4. [ ] Checks: `filmtails` (silent tail), `filmstart` (every film starts and plays to the end with no tap), `filmmusic`.
5. [ ] Retime the 9 existing films (narration lines added where the action is long).
6. [ ] 33 new films, Vietnamese first.
7. [ ] Azure recording of the new lines; quick checks; film stills on phone, tablet, computer.

**Progress note, 13 Oct, about 11:40 am AEDT** (commit after this note): steps 1 to 4 built (player, self-start fixes,
music bed, checks; `films`, `tales`, `filmmusic` pass). New films drafted in `js/content/films/` (21 of 33):
rongtien, caytre, tamcam, sodua, thachsanh, chucuoi, cockien, vusua, baluoiriu, quabau, thayboi, nhacmeo, ongtao, cachep, sontinh, rainbowserpent, emu, dotkangaroo, birdcolours, magicpudding, tiddalik. Still to write: the Chinese and Indian tales. Not yet done: recording the new lines (Azure), tuning
each page with `FILMTAILS_EST=1 node run.mjs filmtails`, stills on phone, tablet, computer, retiming the 9 old films.
Dev helpers (not checks): `tests/dbg-film.mjs <ids>` plays every page and prints script errors; `tests/dbg-durs.mjs <ids>`
prints each page's recorded voice length.

**Progress note, 13 Oct, about 12:50 pm AEDT:**
- All 33 films are drafted (`js/content/films/<id>.js`, shared pieces in `js/content/films/kit.js`, listed in
  `js/content/talefilms.js` and in `sw.js`). Each has narration lines (`S.say`) and one or two taps for the child.
- Found and fixed while measuring: after a child's tap, `js/film.js` added the answer's length twice, so every tap page
  stood still about 2 s after its answer (release now keeps the longer of the two).
- The 9 older films got narrator lines where the film ran on in silence; the lantern chapters 2 and 3 no longer hold the
  whole parade still at second 2 until the words end (the tap moved to the end of the scene).
- Voice tools: `tools/voice-lines.mjs` reads `js/content/films/` and `S.say(...)` lines (download area: games, like the
  other films). Azure recording of the new lines started (1124 files).
- Next: when recording ends, `node run.mjs filmtails` with the real lengths, move line times where it reports a gap;
  stills on phone, tablet, computer (`SHOT_ONE=1 SHOT_W=… SHOT_H=… node filmshots.mjs <folder> <ids>`); quick checks.
