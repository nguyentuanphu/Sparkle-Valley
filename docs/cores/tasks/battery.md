# Brief: the battery round (helper chat, branch `core/battery`)

Owner, 12 Oct 2026 AEDT: "my phone gets very hot; on my MacBook it takes almost 10 % at once". Written by the Release chat
that shipped r62 and r64 (`round-t`).

**How this round is released (owner, 12 Oct AEDT):** another chat is the temporary Release for **r65**: the Kid UI chat,
branch `core/kid-ui` ("this chat releases r65 once one more branch is ready"). It merges the ready branches and runs ONE
combined full suite for all of them, this one included. So this chat is a **helper**:
- work on `core/battery` (made from `main`), push it when your checks pass, write **"ready for Release"** in your Now line
  on `docs/cores/BOARD.md` (a new section "Battery (helper)" under Analytics & Infra) with your last commit;
- run your own checks and the full suite on your branch (helper rule 10) and record the result in this file's Progress,
  but the release's full suite, the version bump, the deploy and "yes, deploy" are the temporary Release's: do not bump the
  version, do not merge into `main`, do not deploy;
- if r65 has already gone out when you finish, the next Release chat takes your branch into the round after.
Read `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/analytics-infra.md` and the whole board first.
Plan first and wait for the owner's "go" (pop-up).

## What the code does now (`js/main.js`)
- Phones and tablets are capped at 30 frames a second (`FRAME_MS`); computers are not capped: a 120 Hz MacBook draws up to
  120 a second.
- The renderer asks for `powerPreference: 'high-performance'` (the strongest graphics chip), soft shadows
  (`PCFSoftShadowMap`) unless Graphics is Fast, antialias, and `adaptResolution` raises the pixel ratio up to 2x whenever
  frames are quick.
- `perf` measures about 1,100 draws at home and 700 draws / 785,000 triangles in Lotus Village (budgets 250 and 300,000).
- The first start builds the whole valley (about 20 s at tablet speed), paints the map and water pictures and starts the
  voice download (hundreds of files).

## What to build
1. Quick savers: computers capped at 60 frames a second (30 when Graphics is Fast); `powerPreference: 'default'`; on Auto
   the pixel ratio never above 1.5; the title screen at 20 a second; when nothing moves (no input, no camera motion, no
   animation) draw only a few times a second; the voice download spread out (a pause between batches, nothing while the
   valley is being built).
2. Fewer draws: merge the many small still objects per area (instanced or merged meshes) toward the 250 budget, keeping
   far-culling (`noFar`) working and every position as it is (no world position changes). `tests/perf-baseline.json` is a
   ratchet: lower a number when it improves, never raise it.
3. Battery and frame statistics: each device records frames drawn per minute, average frame time, draw calls, the pixel
   ratio it settled on, minutes played, and the battery level and charging where the browser gives them (Chrome-based
   browsers only; Safari on iPhone and Mac does not). Anonymous, nothing when Analytics is off (`js/players.js`). Studio
   shows them (the Studio chat's brief `docs/cores/tasks/studio-r65.md`: agree the field names on the board).
Allowed files: `js/main.js` (render loop, renderer, title screen), `js/gfx.js`, the builders whose meshes you merge (no
position changes), `js/voicepack.js` (pacing only), `js/players.js`, `tests/run.mjs` (new checks), `tests/perf-baseline.json`
(lower only). Anything else: a request on the board.

## Checks
A new `battery` check (computer capped at 60, idle drawing slows, the pixel ratio capped on Auto, the title screen slower,
the statistics recorded and sent only with Analytics on), then `perf`, `playhub` (phones 30 a second), `startup`, `phone`,
`noemoji`, then the full suite. Rules in `docs/ARCHITECTURE.md` §9 (PERF), then `node tools/rules-from-doc.mjs`.

## Owner's decisions
- (12 Oct, 1:50 pm AEDT) Go with the plan as recommended; the full suite is run by the Release core, not this chat.
- (12 Oct AEDT) This chat may change `js/avatar.js` (people) and `netlify/lib/players.mjs` (the report keeps the numbers).
- (12 Oct AEDT) Nothing moving for 15 s: draw 8 times a second until any input.
- (12 Oct AEDT) Graphics gets two Pretty buttons: Pretty (60 a second) and Pretty+ (as fast as the screen).

## Progress
- **12 Oct AEDT, built (branch `core/battery`).** Measured first: people were two thirds of the draws (each 20 to 30
  parts). Changes:
  - `js/main.js`: computers 60 a second (Fast 30), phones and tablets 30, Pretty 60, Pretty+ uncapped, title 20, after
    15 s still 8 a second (any touch, key or mouse wakes it); one frame gate (`G.battery.gate`) so 120 and 144 Hz screens
    get 60 on average; `powerPreference: 'default'`; on Auto the pixel ratio never above 1.5; `G.battery` counts frames,
    work time, draws, idle frames; far people standing still (20 m from every child, unmoved for two looks) show their
    still copy.
  - `js/avatar.js`: each moving part's plain-coloured pieces merged into one shape (`compact`, the skin recoloured for a
    photo face); a far still copy (`stillOf`); screenshots before and after, near and at 30 m, look the same.
  - `js/voicepack.js`: waits for a built valley, rests 150 ms (core) / 400 ms (the rest) between batches of 6.
  - `js/players.js` + `netlify/lib/players.mjs`: day field `b` and report `battery` (field names on the board).
  - `js/ui.js`, `js/state.js`: Pretty+ (`max`).
  - Draws: home 1,123 -> 507, Lotus Village 704-887 -> 359; `perf-baseline.json` drawCalls 900 -> 420, drawCallsHome
    1100 -> 540. Rule PERF-006 (ARCHITECTURE §9, `rules-from-doc`). New check `battery`.
  - No new words or voices for children (only the Grown-ups button "Pretty+ / Đẹp+").
