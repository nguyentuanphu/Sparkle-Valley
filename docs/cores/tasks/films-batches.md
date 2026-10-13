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
3. Only the checks for the change (owner, 13 Oct AEDT): `cd tests && node suite.mjs --changed` (it picks `films`, `tales`,
   the voice and language checks, `phone`, and runs `films` in full because film files changed), plus the new silent-tail
   and self-start checks by name if it does not pick them: `node run.mjs <check>`.
   Film stills: `node tests/filmshots.mjs` for phone, tablet and computer; look at them.
4. Commit and push the working branch; board line; English and Vietnamese for every line; no emoji in docs.
5. When the owner wants a batch live: the full suite once (`node suite.mjs`), Netlify zip, report, one "yes, deploy" pop-up; bump the version.
