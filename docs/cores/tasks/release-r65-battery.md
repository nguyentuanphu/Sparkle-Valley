# Release brief: r65, the battery round and the ready branches

Owner, 12 Oct 2026 AEDT. Written by the Release chat that shipped r62 and r64 (branch `round-t`).
For a new Release chat. Read `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/release.md` (Owner's
decisions, the last entries are about this round) and the whole of `docs/cores/BOARD.md` first.

## Where things stand
- Live: **r64** on `main` (12 Oct, 9:03 am AEDT). `round-t` holds only two docs commits on top of it.
- Full suite on r64: 106/107. `startup` is red on the title time only (about 1.8 s against 1.1 s); the first download is
  under its limit (968 KB). It was red the same way on r61, r62 and r63 (World's start-up work, not yet done).
- Owner's decisions for this round: battery first; every release in Studio stays switched on (no weekly schedule).

## Part 1: battery (owner: "my phone gets very hot; on my MacBook it takes almost 10 % at once")
What the code does now (`js/main.js`):
- Phones and tablets are capped at 30 frames a second (`FRAME_MS`), computers are not capped at all: a 120 Hz MacBook draws
  up to 120 a second.
- The renderer asks for `powerPreference: 'high-performance'` (the strongest graphics chip), soft shadows
  (`PCFSoftShadowMap`) unless Graphics is Fast, antialias, and `adaptResolution` raises the pixel ratio up to 2x whenever
  frames are quick.
- The `perf` check measures about 1,100 draws at home and 700 draws / 785,000 triangles in Lotus Village (budgets 250 draws,
  300,000 triangles).
- The first start builds the whole valley (about 20 s at tablet speed), paints the map and water pictures and starts the
  voice download (hundreds of files).

Build:
1. Quick savers: cap computers at 60 (30 when Graphics is Fast or on battery saver); `powerPreference: 'default'`; the
   pixel ratio never above 1.5 on Auto; the title screen drawn at 20 a second; when nothing moves (no input, no camera
   motion, no animation running) draw at most a few times a second; spread the voice download out (a pause between
   batches, none while the valley is being built).
2. Fewer draws: merge the many small still objects per area (instanced or merged meshes), aiming at the 250 draw budget;
   keep `noFar` culling working; `perf` numbers may only go down (`tests/perf-baseline.json` is a ratchet: lower it when
   a number improves).
3. Statistics in Analytics: each device records frames drawn per minute, average frame time, draws, the pixel ratio it
   settled on, minutes played, and battery level and charging where the browser tells it (Chrome-based browsers only;
   Safari on iPhone and Mac does not give websites the battery). Shown in Studio's Analytics per device type (phone,
   tablet, computer). Nothing personal; nothing when Analytics is off.
Checks: a new `battery` check (computer capped at 60, idle drawing slows, pixel ratio capped, title screen slower), `perf`,
`playhub` (phones 30 a second), `startup`, `phone`, then the full suite.

## Part 2: the ready branches (merge into the round branch)
- `core/play-reading`: the reading games trial (ten games in a Reading corner, behind the Studio switch `readingTrial`,
  off by default). Marked ready; its own full suite on r64: 104/105 (`startup` as on main).
- `core/kid-ui`: only the phone friends row (commits `dd41a7a4` and `f7887de2`: the Join button no longer covers the
  friend's status). Its chat is still making a Hồ Gươm film on the same branch: do not take unfinished work; cherry-pick
  or merge only once its Now line says ready.
- `core/voice-audio`: the voice harvest (`tools/voice-extra.json`, `tools/voice-where.json`).
- `claude/exciting-feynman-5nxzz8`: the ad videos and the two films for social media (`marketing/`), files only.
- Not to merge: `core/front-desk`, `studio-draft`, `claude/azure-voice-pack-sparkle-t4unwd` (old).
- `claude/peaceful-hopper-un7oym` holds the Round U plan (`docs/cores/ROUND-U.md`, about 25 items, owner's "go" on 11 Oct,
  nothing built yet): not part of this round.
Record new voice lines with `node tools/make-voice-pack.mjs --engine azure` if `AZURE_SPEECH_KEY` is set (never print it).

## Release steps
- Start of session: `git fetch`, check out the round branch (`round-t`, or a new one the owner names), `git pull --no-rebase`,
  merge `origin/main`. Check `main` again before the version bump: other Release chats have shipped r60, r61 and r63 while
  a round was being built; if the number is taken, take the next one and say so.
- Version: `sw.js` VERSION, `js/build.js`, `studio/version.json`; rebuild the Studio exe (`bash studio/build-exe.sh`).
- The full suite (`cd tests && node run.mjs`, about 1.5 to 2 hours) by Release; every failure fixed or shown to be the
  same on `main`; never weaken a check.
- Screenshots on phone, tablet and computer; docs (`HANDOFF.md` history and checks table, the board's Release Now line,
  `docs/cores/release.md`, rules in `docs/ARCHITECTURE.md` §9 then `node tools/rules-from-doc.mjs`).
- No Netlify zip and no local bundle (owner).
- Report in plain words, then one pop-up: "yes, deploy". That covers pushing, the pull request into `main` (wait for Quick
  checks and the AI review; if the AI review stops early, ask the owner whether to merge without it), and checking that
  Netlify serves the new version.

## After this round (planned, not started)
- Studio: a cleaner Analytics page (five tiles on top, one row per child and per device type, the rest folded); the real
  photos that show broken in Studio before Publish (the downloads are fine: 134 in `studio-draft` are real pictures;
  reproduce in the `studio` check and fix); ads with a live preview of the signboard and the after-game card, a picture
  guide and a checklist.
- A daily GitHub job that records the voice inbox and new lines with Azure onto a branch Release merges each round.
