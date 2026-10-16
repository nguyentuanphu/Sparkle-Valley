# Plan: TypeScript everywhere, and a lighter, faster load (16 Oct 2026 AEDT)

Status: **plan only, nothing built.** Owner, 16 Oct AEDT (pop-up answers): "TS everywhere and plan to make loading
lighter", "go all at once". This replaces the 13 Oct AEDT decision "stay with plain JavaScript"
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
  website pack (`tools/bundle.mjs`, which today falls back to the plain `js/` files if it fails).
- Node 22.22 runs `.ts` files directly (tested).
- The Studio exe copies the game from GitHub into a folder and serves those files (`studio/studio.cjs`), and the Studio
  pages import the game's modules by address (`studio/ui/app.js`).

# Part 1: TypeScript everywhere

## How it will work
- Every `.js`/`.mjs`/`.cjs` file of ours becomes `.ts`/`.mts`/`.cts` **in the same place** (`js/state.ts` next to
  where `js/state.js` was). Imports keep the `.js` name (`import { settings } from './state.js'`): TypeScript finds
  `state.ts`, and the built file keeps the same import, so built files look exactly like today's.
- **The build** (`tools/build.mjs`, new): esbuild turns each `.ts` into a `.js` in `dist/`, one file for one file, with
  the rest of the site (css, fonts, icons, vendor, content, photos, voices links) copied or linked beside it. About a
  second for the whole game. Then `tools/bundle.mjs` packs `dist/` for the website as it does today.
- **The check** `types`: `tsc --noEmit` over everything. esbuild only removes notes; `tsc` is what finds mistakes.
- Settings (`tsconfig.base.json` at the root): `strict`, `noEmit`, `erasableSyntaxOnly` (only notes, nothing Node or
  esbuild must translate), `verbatimModuleSyntax`, `allowImportingTsExtensions`, `target es2022`.
- Shared types in `types/`: the save format (`sv2_*` keys), network messages, the Studio API, tester reports, family
  devices, and the shared game object. Server, Studio and game use the same files, so a changed message shape fails
  the check in all three at once.
- Third-party files in `vendor/` (three.js, peerjs) stay as they are, with type files.

## What changes around the build
| Where | Today | After |
|---|---|---|
| Website (Netlify) | `node tools/bundle.mjs . \|\| true`, site from the repo root | `node tools/build.mjs && node tools/bundle.mjs dist`, site from `dist/`; a failed build stops the deploy (the live site stays as it was) |
| Netlify Node | not pinned | `NODE_VERSION = "22.22.0"` in `netlify.toml` |
| Drag-and-drop zip | `build-netlify.sh`, Node optional | needs Node; zips `dist/` |
| Offline list (`sw.js`) | about 250 names written by hand | made by the build from `dist/` (`sw.ts` source) |
| Tests | serve the repo folder (`tests/run.mjs` servers at lines 75 and 5354) | `suite.mjs` builds first and serves `dist/`; GitHub workflows add the build step |
| Studio exe | copies the game's files from GitHub | copies the built site from a `site` branch that GitHub's workflow fills from `main` after each deploy |
| Studio online | `/studio` pages import `js/…` | import the built `js/…` in `dist/` (same addresses) |
| iPhone debugging | the phone's file is the repo's file | source maps (`.map` files) beside the built files point Safari at the `.ts` lines |
| Check map | `tests/check-map.json` names `.js` | names `.ts`; refreshed from the GitHub run |

## Order: all at once (owner), in one freeze window
"All at once" works only if nobody else changes the same files at the same time, so:
1. **Freeze.** Release asks every core to finish, push and write "ready for Release"; Release merges everything into
   `main` in the usual round. Then the cores stop changing code until step 5 (docs and voices can go on).
2. **Groundwork (step A):** `tools/build.mjs`, `tsconfig.base.json`, `types/`, the build in Netlify, the zip, tests,
   GitHub workflows and the Studio `site` branch, all working on today's `.js` files first, with the full suite green.
3. **Rename (step B):** one script renames every file and fixes paths in tests, docs, `check-map.json` and the exe
   script, in one commit, with no other change. The full suite must be green on it.
4. **Fix types (step C), in this order:** server and Studio engine (small, most already typed) → saves and network
   (Round W part 2's list) → the shared game object type (clears most of the 2,030 at once) → every remaining file
   until the light check shows **0 errors**. Then **strict, file by file**, with a ratchet list like
   `tests/perf-baseline.json`: the number of files not yet strict may only go down. No broad `any`, casts or
   `@ts-ignore` to make a number go down (owner repair rules, 14 Oct).
5. **Unfreeze:** each core merges `main` into its branch and carries on in `.ts`. Helper rules in `CLAUDE.md`,
   `HANDOFF.md` and `docs/cores/*.md` say "`.ts`" where they say "`.js`".
- **Map files:** Round T froze `js/world.js`, `js/roads.js`, `js/regions.js` and the rest of its list. The rename and
  type notes do not move anything, but the owner must allow these files to be touched (decision 2 below).
- Each step is its own round with the full suite on GitHub, screenshots on phone, tablet and computer, and "yes,
  deploy". Nothing a child sees or hears changes, so `contract` and every screenshot must stay the same.

## Size
Step A about 2 sessions; step B 1 session; step C light errors about 3 to 5 sessions; strict about 4 to 6 more rounds
(can run after the unfreeze, file by file). The freeze lasts for steps A to C light: roughly one to two weeks of
Release work. Estimates; the first session of step C will show the real pace.

## Risks
- A build failure stops a deploy; today's fallback hid that. The build runs on every pull request first.
- Every open branch conflicts after the rename: the freeze in step 1 is what prevents that.
- The Studio exe needs the `site` branch to exist before it can update; old exes keep their last copy until rebuilt.
- Undo: revert the rename merge; step A's build keeps working on `.js` files.

# Part 2: a lighter, faster load

Measured 16 Oct AEDT in the repo and from `tests/perf-baseline.json` (budgets PERF-001 to 005).

| Item | Today | What to do | Owner core |
|---|---|---|---|
| S1 Photos | 197 photos, 76 MB; 11 over the 600 KB rule, the largest 7.7 MB (`photos/en-dragon-bridge-da-nang/3.jpg`) | `tools/photo-shrink.mjs`: longest side 1600 px, JPEG quality about 80, keep the original's licence record; Studio saves new photos the same way; a check fails any photo over 600 KB. Expect most of the 76 MB to go (to measure) | Studio |
| S2 Valley build time | 6.6 s from the game's code to a built valley (`worldMs`, test browser) | profile it; build the child's own area first and the rest in small pieces while they play; reuse `js/worldcache.js` more | World (after Round T) |
| S3 Draw calls | 507 at home, 359 in Lotus Village; budget 250 | merge still objects that share a look, more one-shape repeats (instancing) | World |
| S4 Start-up download | 2.6 MB before the title screen (packed, before compression); three.js already minified | see what is in it (esbuild's size report), load films, stories and games only when opened, check Netlify sends it compressed | Analytics & Infra |
| S5 Voice list | `voices/manifest.json` 340 KB | split it per language so a family downloads only its own | Voice & Audio |
| S6 Voice pack | 166 MB English, 165 MB Vietnamese, already small (32 kbit/s, mono) and downloaded area by area | leave for now; a smaller format (Opus) only after testing on old iPhones | Voice & Audio |

Order: S1 and S5 first (no code risk, big saving), then S4, then S2 and S3 once Round T ends. Each item lowers its
number in `tests/perf-baseline.json` (the ratchet) and is checked by `perf`, `startup` and `battery`.
Part 2 can start now; it does not wait for Part 1, and S1 and S5 do not touch game code.

## Owner decisions needed
1. "Go" on this plan (Part 1 with the freeze, Part 2 alongside).
2. May the rename and type notes touch Round T's frozen map files?
3. Push this plan to GitHub so the other chats can read it?
