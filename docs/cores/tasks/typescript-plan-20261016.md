# Plan: TypeScript everywhere, and a lighter, faster load (16 Oct 2026 AEDT)

Status: **plan only, nothing built.** Owner, 16 Oct AEDT (pop-up answers): "TS everywhere and plan to make loading
lighter"; then "in batches, one core at a time" (replaces "go all at once"). This replaces the 13 Oct AEDT decision "stay with plain JavaScript"
(`docs/cores/release.md`, `docs/SO-TAY-THIET-KE.md` §14.2). Building starts only after the owner's "go" on this plan.

**Plain words:** TypeScript is JavaScript plus notes saying what kind each value is. Phones only run JavaScript, so the
notes are removed before the phone gets the file. TypeScript catches mistakes before a child sees them; it does **not**
make the game load or run faster. Part 2 is the speed work, and it is separate.

## What exists today (checked 16 Oct AEDT on `main`, ad44955c)
- TypeScript 5.9.3 pinned in `tests/package.json`; checks `types` (16 files with `// @ts-check`, 8 strict) and `names`
  pass. No `.ts` files, no branch with TypeScript work.
- Type errors across `js/` if checked today (vendor left out): **2,030** light, **15,436** strict, in 218 of 255 files.
  About 85 % of the light ones are "a property the checker cannot see", mostly the shared game object and globals.
- esbuild 0.25.10 already runs in three places: Netlify functions, the Studio exe (`studio/build-exe.sh`) and the
  website pack (`tools/bundle.mts`, which today falls back to the plain `js/` files if it fails).
- Node 22.22 runs `.ts` files directly (tested).
- The Studio exe copies the game from GitHub into a folder and serves those files (`studio/studio.cts`), and the Studio
  pages import the game's modules by address (`studio/ui/app.js`).

# Part 1: TypeScript everywhere

## How it will work
- Every `.js`/`.mjs`/`.cjs` file of ours becomes `.ts`/`.mts`/`.cts` **in the same place** (`js/state.ts` next to
  where `js/state.js` was). Imports keep the `.js` name (`import { settings } from './state.js'`): TypeScript finds
  `state.ts`, and the built file keeps the same import, so built files look exactly like today's.
- **The build** (`tools/build.mts`, built in batch 0, 17 Oct AEDT): Node's own type stripping makes each `.ts` into
  the `.js` **beside it**, with every line and column unchanged. (Changed from the first draft's `dist/` folder: the
  same addresses as today, so the website, the offline list, the pack, the checks and Studio need no new paths, and
  no source maps are needed, because an error on a phone points at the same line of the `.ts`.) The made `.js` is
  never committed; the tool keeps their list in `.gitignore`. It takes well under a second.
- **The check** `types`: `tsc --noEmit` over everything. esbuild only removes notes; `tsc` is what finds mistakes.
- Settings (`tsconfig.base.json` at the root): `strict`, `noEmit`, `erasableSyntaxOnly` (only notes, nothing Node or
  esbuild must translate), `target es2022`; each check's own tsconfig extends it.
- Shared types in `types/`: the save format (`sv2_*` keys), network messages, the Studio API, tester reports, family
  devices, and the shared game object. Server, Studio and game use the same files, so a changed message shape fails
  the check in all three at once.
- Third-party files in `vendor/` (three.js, peerjs) stay as they are, with type files.

## What changes around the build (done in batch 0 unless marked later)
| Where | Today | After |
|---|---|---|
| Website (Netlify) | `node tools/bundle.mts . \|\| true` | `node tools/build.mts && (node tools/bundle.mts . \|\| true)`; a failed build stops the deploy (the live site stays as it was) |
| Netlify Node | not pinned | `NODE_VERSION = "22.22.0"` in `netlify.toml` |
| Drag-and-drop zip | `build-netlify.sh`, Node optional | builds first; needs Node once any `.ts` exists |
| Offline list (`sw.js`) | names written by hand | unchanged: the `.js` names stay |
| Tests | serve the repo folder | `run.mjs` and `suite.mjs` build first; the same folder is served |
| GitHub Pages, daily voices | serve or publish the repo | build first |
| Studio exe | copies the game's files from GitHub | unchanged; it makes a game file's `.js` from its `.ts` when asked (same type stripping); `build-exe.sh` builds first |
| Studio online | `/studio` pages import `js/…` | unchanged: Netlify built the `.js` |
| iPhone debugging | the phone's file is the repo's file | the same lines and columns as the `.ts` (no source maps) |
| Check picker (`suite.mjs --changed`) | maps `js/*.js` changes | later, with batch 3: map a `.ts` change to its `.js` |
| Check map | `tests/check-map.json` names `.js` | unchanged (the built `.js` is what runs) |

## Order: in batches, one core at a time (owner, 16 Oct AEDT)
esbuild builds `.js` and `.ts` side by side and `tsc` checks both (`allowJs`), so the game works with some files
converted and some not. No full freeze: only the core being converted pauses its code work, for its batch.
1. **Batch 0, groundwork (Release, nobody pauses), built 17 Oct AEDT on `work/ts-batch0-20261017`:** `tools/build.mts`,
   `tsconfig.base.json`, the build in Netlify, the zip, the tests, GitHub Pages, the daily voices and the Studio exe,
   all working on today's `.js` files. (`types/` comes with batch 3, where the first shared types are needed.)
2. **Each later batch, two commits:** (a) rename only, no other change, so git follows the rename and other branches'
   edits still land in the renamed file; (b) type notes and fixes until the light check shows 0 errors for that batch.
   Paths in tests, docs, `check-map.json` and the exe script change in the same batch.
3. **Batches, in this order:**
   1. Server (`netlify/`) and Studio engine (`studio/*.cjs`): smallest, already partly typed
   2. Tools (`tools/`)
   3. Saves and network (Round W part 2's list: state, netmsg, net, trade, shop, parents, save code)
   4. Online and Voice & Audio cores' game files
   5. Play core's files (games, films, stories)
   6. Kid UI core's files and `studio/ui/app.js`
   7. World core's files, including Round T's map files (owner allowed, 16 Oct AEDT: no positions move)
   8. `js/main.js`, `js/ui.js`, `sw.js` and whatever is left (shared most, so last)
4. Before a batch, Release tells that core on `docs/cores/BOARD.md` ("pause code in these files"); the board lists
   which files are `.ts` so far. Each batch is its own round: full suite on GitHub, screenshots on phone, tablet and
   computer, "yes, deploy".
5. **Strict, file by file** after each batch's light check is clean, with a ratchet list like
   `tests/perf-baseline.json`: the number of files not yet strict may only go down. No broad `any`, casts or
   `@ts-ignore` to make a number go down (owner repair rules, 14 Oct).
- Nothing a child sees or hears changes, so `contract` and every screenshot must stay the same.

## Size
Batch 0 about 2 sessions; batches 1 to 3 about 1 session each; batches 4 to 8 about 1 to 2 sessions each; strict
about 4 to 6 more rounds, file by file. Longer in total than one big push, but each core pauses only for its own batch.
Estimates; batch 3 will show the real pace.

## Risks
- A build failure stops a deploy; today's fallback hid that. The build runs on every pull request first.
- Edits on other branches to a renamed file: the rename-only commit lets git follow it; the paused core has none.
- Node's type stripping is marked experimental by Node: pinned to Node 22.22 everywhere; if it ever changes, esbuild can make the same `.js` instead.
- Undo: revert one batch; the build keeps working with that batch back in `.js`.

# Part 2: a lighter, faster load

Measured 16 Oct AEDT in the repo and from `tests/perf-baseline.json` (budgets PERF-001 to 005).

| Item | Today | What to do | Owner core |
|---|---|---|---|
| S1 Photos | 197 photos, 76 MB stored with the game | **owner, 17 Oct AEDT: linked from Wikimedia or Flickr, not stored** (no internet: the viewer says so; seen photos kept on the device); `photos/` removed; Studio saves a copy only as a last resort. Built on `work/photo-links-20261017` | Release |
| S2 Valley build time | 6.6 s from the game's code to a built valley (`worldMs`, test browser) | profile it; build the child's own area first and the rest in small pieces while they play; reuse `js/worldcache.js` more | World (after Round T) |
| S3 Draw calls | 507 at home, 359 in Lotus Village; budget 250 | merge still objects that share a look, more one-shape repeats (instancing) | World |
| S4 Start-up download | 2.6 MB before the title screen (packed, before compression); three.js already minified | see what is in it (esbuild's size report), load films, stories and games only when opened, check Netlify sends it compressed | Analytics & Infra |
| S5 Voice list | `voices/manifest.json` 340 KB | split it per language so a family downloads only its own | Voice & Audio |
| S6 Voice pack | 166 MB English, 165 MB Vietnamese, already small (32 kbit/s, mono) and downloaded area by area | leave for now; a smaller format (Opus) only after testing on old iPhones | Voice & Audio |

Order: S1 (built) and S5 first (no code risk, big saving), then S4, then S2 and S3 once Round T ends. Each item lowers its
number in `tests/perf-baseline.json` (the ratchet) and is checked by `perf`, `startup` and `battery`.
Part 2 can start now; it does not wait for Part 1, and S1 and S5 do not touch game code.

## Owner decisions
- Done 16 Oct AEDT: TypeScript everywhere; in batches, one core at a time; map files may be renamed; push this plan.
- Still needed: "go" on batch 0; the photos question (Part 2, S1).
