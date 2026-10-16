# Plan: TypeScript for the server, the Studio and the game (16 Oct 2026 AEDT)

Status: **plan only, nothing built.** Needs the owner's decisions below and a "go" before any work starts. This plan
goes past the owner's 13 Oct AEDT decision ("stay with plain JavaScript", `docs/cores/release.md`,
`docs/SO-TAY-THIET-KE.md` §14.2), so that decision has to be changed first.

## What exists today (checked 16 Oct AEDT on `main`, ad44955c)
- TypeScript 5.9.3 pinned in `tests/package.json`; check `types` (`tests/tsconfig.json`: 16 files with `// @ts-check`,
  8 of them strict in `tests/tsconfig-contracts.json`) and check `names` (TS2304 over all of `js/`). Both pass.
- No `.ts` files, no branch with TypeScript work. Round W part 2 (`@ts-check` on `net.js`, `trade.js`, `shop.js`,
  `parents.js`, save code) is planned, not started.
- Type errors if checking were switched on for all of `js/` (vendor left out): **2,030** light, **15,436** strict, in
  218 of 255 files. 87 files have none. About 85 % of the light ones are TS2339 (a property the checker cannot see,
  mostly the shared game object and globals).
- Node 22.22 runs `.ts` files directly (type stripping, tested). Netlify packs functions with esbuild
  (`node_bundler = "esbuild"`), `studio/build-exe.sh` packs the exe with esbuild, and `tools/bundle.mjs` already packs
  the game with esbuild on Netlify, but with a fallback to the plain `js/` modules if esbuild is missing.

## The three parts and what each needs

| Part | Files | Size | Needs a build step? |
|---|---|---|---|
| Server | `netlify/functions/*.mjs` (7), `netlify/lib/*.mjs` (9) | small | No: Netlify's esbuild reads `.ts` |
| Studio engine | `studio/core.cjs` (59 KB), `studio/studio.cjs` (31 KB) | small | No: esbuild packs the exe; Node runs `.cts` |
| Studio dashboard page | `studio/ui/app.js` (300 KB, browser) | medium | **Yes**, like the game |
| Game (client) | `js/` (255 files, about 4.3 MB), `sw.js` | large | **Yes** |
| Tools, tests | `tools/*.mjs` (15), `tests/*.mjs` (45), `tests/unit/*` | medium | No: Node runs `.ts` |

## Phase 0: groundwork (Analytics & Infra; about half a session)
1. One shared type folder `types/` with `.d.ts` files for what crosses a boundary: the save format (`sv2_*` keys),
   network messages (`js/netmsg.js`), the Studio API, tester reports, family devices. The server, the Studio and the
   game all use the same files, so a change to a message shape breaks the check in all three at once.
2. Root `tsconfig.base.json`: `strict`, `noEmit`, `allowJs`, `erasableSyntaxOnly` (only type notes, no `enum` or
   `namespace`, so Node can strip them), `allowImportingTsExtensions`, `verbatimModuleSyntax`. Child configs per part.
3. Pin Netlify's Node: `NODE_VERSION = "22.22.0"` in `netlify.toml` (type stripping needs 22.18 or newer).
4. Check `types` runs every config; `tests/check-map.json` learns the new file names.

## Phase 1: server to `.ts` (Online + Analytics & Infra; about 1 session)
- `netlify/lib/*.mjs` → `.ts` first (they are imported by the functions and by the tests), then
  `netlify/functions/*.mjs` → `.ts`. Imports use the `.ts` name.
- Update the paths in `tests/studio-check.mjs`, `tests/owner-*.mjs`, `tests/unit/*.test.mjs`, `netlify.toml` comments.
- All strict from the start (two files already pass strict).
- Checks: `types`, unit tests, `studio-check`, the online checks on a deploy preview (they say "skipped" locally).

## Phase 2: Studio engine to `.ts` (Studio core; about 1 session)
- `studio/core.cjs` → `core.cts`, `studio/studio.cjs` → `studio.cts` (stays CommonJS for the exe).
- `studio/build-exe.sh`: esbuild entry `studio.cts`; `netlify/functions/studio.ts` imports `core.cts`;
  `tests/unit/privacy.test.mjs` and `tests/studio-check.mjs` load the new names.
- Checks: `types`, `studio-check`, privacy unit test, build the exe and open it once.

## Phase 3: tools (Analytics & Infra; about half a session) and tests (optional)
- `tools/*.mjs` → `.ts` (run as `node tools/x.ts`). `tools/bundle.mjs` runs on Netlify, so Phase 0 step 3 first.
- Tests: leave `tests/run.mjs` (about 5,400 long lines) in JavaScript with `// @ts-check`; small test files may move.

## Phase 4: the game and the Studio dashboard page (owner's choice, see decision 2)

### Option A (recommended): type-checked JavaScript, types in `.d.ts`
Files stay `.js`, so the phone still runs the repo's own file and nothing else changes. Each file gets `// @ts-check`
and uses the shared `types/` files; the checker is as strict as real TypeScript.
1. A `types/game.d.ts` for the shared game object and globals: removes most of the 2,030 light errors at once.
2. Wave 1: the 87 files with no errors. Wave 2: Round W's files (save, net, trade, shop, parents). Wave 3: each core's
   own files, one core at a time, light then strict. Map files (`js/world.js`, `js/roads.js`, `js/regions.js` and the
   rest of the Round T list) wait until Round T ends.
3. `studio/ui/app.js` the same way.
- Size: 4 to 6 rounds alongside other work; no behaviour change, so `contract` and the screenshots stay the same.

### Option B: real `.ts` files in the browser
Everything in Option A, plus a build step that every part of the project then depends on:
1. `tools/bundle.mjs` becomes required (the fallback to plain modules goes); `build-netlify.sh` needs Node.
2. The test servers (`tests/run.mjs` lines 75 and 5354) and the Studio server (`studio/studio.cjs`, the Netlify
   `/studio` pages) must convert `.ts` on the fly, because the Studio pages import the game's modules by address.
3. `sw.js`'s offline list (about 250 names) is made by the build, not written by hand.
4. Source maps for iPhone debugging: the file on the phone is no longer the file in the repo.
5. Rename 255 files and fix 15,436 strict errors; every core's files change, so every open branch conflicts.
- Size: 8 to 12 rounds or more; must wait for Round T and Round W part 3 (the `main.js`/`ui.js` split).

## Order and who does it
Phase 0 → 1 → 2 → 3, one round each or two together; Phase 4 after Round W part 3, waves per core. Release merges
each phase separately, runs the full suite on GitHub and asks "yes, deploy" per round as usual. Nothing changes what a
child sees or hears, so no new spoken lines and no new art.

## Risks
- A deploy on an old Netlify Node fails to run `.ts` tools: Phase 0 step 3 pins it, and Phase 3 waits for it.
- Paths to renamed files in tests and docs: `check-map.json` and a search for the old names before each merge.
- Option B only: a broken build means a broken site (today the fallback hides it); open branches all conflict.
- Undo: each phase is a set of renames and type notes; reverting the merge brings the `.mjs`/`.cjs` files back.

## Owner decisions needed
1. Allow real TypeScript for the server, the Studio engine and the tools (changes the 13 Oct AEDT decision)?
2. Game and Studio page: Option A (type-checked JavaScript) or Option B (real `.ts` with a build step)?
3. When: start Phase 0 to 2 now, or after Round W?
