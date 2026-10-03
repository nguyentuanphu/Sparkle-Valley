# Sổ tay thiết kế · Sparkle Valley Design Handbook

The one place for **how Sparkle Valley must look, sound, behave and be built**. Every round (human or AI) reads it with `HANDOFF.md` before changing anything.

- **HARD** means never broken without the owner saying so in writing.
- **Checked by `x`** means a test in `tests/run.mjs` fails if the rule is broken. A new rule should get a check whenever it can be measured.
- Rules marked **(to decide)** are proposals the owner has not chosen yet: ask before building them (HANDOFF rule 14).

Sources merged here:
- the owner's ground rules (HANDOFF §0);
- the owner's "Vietnamese Village Hard Prompts" (round 30, G0–G11, R1–R12);
- the measurable rules the game already enforces;
- the useful parts of an outside technical assessment (round 30, reviewed in §14).

---

## 1. Who it is for · Dành cho ai

- Children aged **2–8**, girls and boys, playing in **English and Vietnamese**, on phones, tablets and computers, alone, with a sibling on the same screen, or with family online.
- **One world, two depths:**
  - **Little ones (2–4, "under-5 mode")**: explore, tap, hear, discover. No reading needed, no losing, no timers.
  - **Big kids (5–8)**: the same places with more to do: counting, reading, puzzles, building, quests.
- A child should be able to **start, explore, finish an activity and come back without a grown-up explaining anything**.

## 2. Style · Phong cách (G0, G1, G9)

**G0 Style anchor**: put this at the top of every art or feature brief:
> Colourful polished Vietnamese village game art, soft warm afternoon lighting, clean toon shading with soft dark-brown outlines (#3a2a20), chunky rounded shapes, harmonious saturated pastels (pink #ff6fae, purple #8a5cf6, leaf green #43c463, gold #ffb020, sky #29b6f6, paper cream #fff6e4), no clutter, readable silhouettes, friendly for children aged 2–8.

- **G1 Toon:** `toonVC()` / MeshToonMaterial + `outline()`; rounded shapes; no realistic or PBR textures; no sharp spikes at child height.
- **G9 Detail = silhouette and colour, not polygons:** small props ≤ ~2,000 triangles; repeats use InstancedMesh; everything works at quality "Fast".
- **2D pictures (menus, icons, tales):** drawn SVG in `js/art.js`: 48×48, outline `#3b2a4f`, chunky, a small gentle animation that stops in calm mode. **HARD: no phone emoji on screen**: every picture goes through `pic()` / `labelArt()` / `sprite()` (HANDOFF rule 13).
- **G8 Safe:** no weapons, blood, scary faces, animal fights, real logos, phone numbers or addresses. House 8 shows only "8" (HARD, rule 7).
- Calm, not flashy: no strobing, no fast camera swings, few things animating at once near the child.

## 3. Scale and placement · Tỉ lệ và vị trí (G2, G4, G6, G7, G11)

- **G2:** 1 unit = 1 m.
  - People: child 1.6 m (3 heads tall), adult 2.0 m, grandparents 1.8 m and slightly bent.
  - Doors are at least 1.4 × 2.4 m; steps are at most 0.4 m.
- **G4:** everything stands on the ground (`heightAt` ± 0.05 m). Footprints are levelled (`FOOTPRINTS`, `levelUnderBuildings`). Every village, town and city is one flat level (**HARD**, checked by `flat`).
- **G6:** fronts face the nearest road or yard; the place to tap is on the road side.
- **G7 Interactables:** a floating icon, a ~2.5 m tap radius, one main action. They never sit inside something solid (checked by `solid`).
- **G11 No clutter:**
  - at most one big focal object per 10 m of street;
  - at least 40 % open ground;
  - nothing blocking a walking line.
- **Solid world (HARD, round 30):** nobody walks through houses, walls, fences, rocks, kiosks, statues or furniture.
  - `js/solids.js` makes a 0.5 m solid map from the real meshes; `world.collide` uses it.
  - New things need nothing extra, as long as they are still meshes. Things that move use their own round colliders.
  - Checked by `solid`.

## 4. Roads · Đường (R1–R12, G5)

| Rule | What | Checked |
|---|---|---|
| R1 | Classes, constant width end to end: asphalt 5.2 m, dirt 3.4 m, footpath 1.6 m | (footpaths to build) |
| R2 | Continuous curvature, no zigzags; min radius 10 m asphalt / 6 m dirt / 3 m footpath; no S-bends within 15 m. **Done with true circular arcs (fillets 24 m / 16 m)**, not Chaikin | `roadshape` (no step turn > 8°) |
| R3 | Surface on the ground (never > 0.3 m above it); grade limits | `roadshape`, `ground` (see §13: limits to decide) |
| R4 / G5 | Corridor `w/2 + 1.5 m` clear: no props, trees, rocks, grass, flowers, pickups, NPC spots; trees ≥ `w/2 + 2.5 m`; buildings 2–4 m back | `roads` (colliders, boxes, interactables, grass and flowers) |
| R5 | T-junctions: a side road leaves at **60–120°**, stops at the main road's edge, straight ≥ 6 m; Y only for an even split; one plain asphalt patch | `roads` (angle of every side road) |
| R6 | Outside towns only T-junctions; junctions ≥ 20 m apart; parallel roads ≥ 12 m apart; no crossing without a junction | (to add) |
| R7 | A named road end = its gate (0 m gap); surface runs 2 m through the gate; gate square, opening ≥ road + 1 m each side; bilingual sign ≥ 0.8 m letters | `roads` (gate on every named end) |
| R8 | Every village and city reachable by asphalt; dead ends only at a gate, landmark or pier; real geography north → south | `roads` |
| R9 | River crossings within ± 20° of square, straight ≥ 6 m each side; nothing on bridge decks | (to add) |
| R10 | Lines only on asphalt, plain at junctions; zebra crossings only in towns | visual review |
| R11 | Pond footpaths 1.5–2.5 m from the water, gaps end at a bench, pier or bridge | Phase 2 |
| R12 | Soft edges: a 0.3–0.5 m blend from road to grass, flowers along the verge | visual review |

- **HARD (round 29):** roads are straight runs joined by perfect curves, run straight into every gate, have every change of slope rounded, take the village's level inside it, and never fill the river.
- A test for a new road rule must be shown failing on the old world before the fix (as with R5 in round 30: 45°, 42° and 50° before; 66°+ after).

## 5. Places, buildings, people, animals · Làng, nhà, người, vật

- **Village houses (Vietnam):**
  - curved red tile roof with a small thatched porch;
  - warm wood or ochre walls with a small painted flower panel;
  - stone base, potted flowers, a short bamboo fence;
  - nothing modern in villages.
  - Cities keep their own types (tube houses, villas, weatherboards, Queenslanders).
- **Kiosks:**
  - fixed 2.4 × 1.6 m, or a wooden push cart 2.2 × 1.2 m on two wheels; counter 0.9 m;
  - in Vietnam: a red-and-yellow striped canopy, red, yellow and green paper lanterns, and ≤ 3 baskets of fruit;
  - a bilingual handwritten-style sign with letters ≥ 0.25 m;
  - along street sides, never in the road.
- **Market day (chợ phiên):** 3–6 cloth-awning stalls, aisles ≥ 3 m, one product per stall.
- **Vehicles:**
  - on dirt roads and footpaths, only buffalo carts, bicycles with baskets, and cyclos, at ≤ 1 m/s;
  - on asphalt, only buses and scooters (riders in helmets), at ≤ 6 m/s; keep right in Vietnam, left in Australia;
  - every vehicle waits for a child within 4 m ahead and never knocks anyone.
- **Animals:**
  - buffalo, hen, dog, cat, duck…: happy faces, big eyes, flat toon colours;
  - they never bite, fight or get hurt;
  - tap = sound + bilingual name.
- **People:**
  - áo bà ba, farmer clothes, nón lá; warm skin tones; gentle idle poses;
  - bilingual titles follow the language (Bà/Grandma: `NAMES_EN` / `NAMES_VI`);
  - never caricatured; they never block an entrance.
- **Village landmarks:** cây đa, giếng nước, sân đình: a banyan with a small shrine at its foot, a stone well with a tiled roof, and the village gate on its anchor. Be respectful near shrines.
- **River:**
  - a đò with a rower in nón lá, thuyền thúng, and lotus near the banks (never in ferry lanes);
  - piers ≥ 6 m with rails and a life ring;
  - children never drown; the raft lets them choose a destination.
- **Culture:** names, food, games, clothes and buildings are checked against real references and never mixed carelessly. A short spoken explanation is offered, never a forced lesson.

## 6. The two age profiles · Hai lứa tuổi

| | Little ones (2–4) | Big kids (5–8) |
|---|---|---|
| Moving | Tap-to-go and the joystick; easy camera from above | Same, plus explorer camera |
| Text | Never needed; every label is spoken | Short text + voice |
| Activities | Notice → tap → discover → hear → try again; one thing at a time | Multi-step tasks with optional hints |
| Mistakes | Never punished: no losing, no fail screens, no timers | Real challenge allowed, always "try again", never shaming |
| Rewards | A smile, a flower, a sound, a sticker | Milestones, stamps, hats; never streak pressure |
| Quests | None required | Clear start, visible goal, hints, stop and come back |

- The **under-5 mode** decides it (`little`), the same world for both.
- **(to decide)**: an explicit profile switch per child with its own defaults, and gentle adaptive help (a demo after 3 misses).

## 7. Text and language · Chữ và ngôn ngữ (G3)

- **HARD:** every text is bilingual: `T('English', 'Tiếng Việt')`; 3D signs take `['EN', 'VI']` and redraw on `onLang()`. Checked by `language`.
- Lines for little ones are **short** (aim ≤ 12 words), warm and concrete: "Mango! Quả xoài!"
- Vietnamese is natural Vietnamese, not word-for-word translation; titles and kinship words are right (ông, bà, cô, chú, con).
- Names the family renamed (Studio, `names`) win everywhere; `swapNames()` applies them before speaking.
- Never put a child's name into a line that goes into the voice pack (it would change the line's hash).

## 8. Voice and sound · Giọng và âm thanh

**HARD (rounds 29–30): the downloaded, recorded voices are the voice, on every device.**
- **Order:** a family recording of that exact line → the recorded pack (`voices/`, Azure) → a natural online voice with the grown-up's key → the device's own voice **only** for a line with no recording.
- **On iPhone and iPad:**
  - sound is woken on every tap until it works;
  - if Web Audio is still asleep, a primed plain audio player plays the same recording;
  - the voice list is served from the saved copy at once (slow phone data never means the phone voice);
  - Grown-ups shows why a recording could not play (`voiceDiag`).
  - Checked by `voice`: a recorded line never uses the phone voice, also with Web Audio asleep.
- **Every new spoken line goes into the pack in the same round:** `tools/voice-harvest.mjs`, then `tools/make-voice-pack.mjs --engine azure`.
  - Lines a device still says with the machine voice reach Sparkle Studio's **inbox** by themselves (never a line with a child's name).
  - One click records them.
- **Voices:** a woman's voice for women, girls and grandmas, a man's for men, boys and grandpas. Grandparents a little slower, children a little higher.
- The whole pack is kept on the device after the first visit (the child's language first), so it works offline.
- **Sound effects are synthesised** (no files), soft and short, never harsh "wrong" buzzers for little ones. Music is calm; calm mode lowers it.

## 9. Screens and controls · Màn hình và nút (G10)

- **HARD (rule 1):** the existing UI stays as it is: layout, colours, fonts, icons, button order, tabs, texts. New things go alongside. The `contract` check fails if the structure changes; re-record only when the owner asked for that UI change.
- Touch targets ≥ 56 px for main buttons (aim 56–72), well apart, never hugging the screen edge. Close/Save/Next always visible on a 320–390 px phone (checked by `phone`, `spill`).
- Every screen can be left with one obvious button, or by tapping outside. Leaving never loses progress.
- **Test desktop and phone side by side, every round** (HARD, rule 12): `phone` check + screenshots at 390 × 760 touch and 1180 × 760.
- Accessibility already in: calm mode, text size, captions, reduced motion. **(to decide):** one "simpler controls" switch for little hands.

## 10. Data, privacy and safety · Dữ liệu và an toàn

**HARD:** no API keys or personal data in the code or the repo (rule 6). Keys live:
- in the grown-up's device settings;
- in `%APPDATA%\SparkleStudio` for the exe;
- in Netlify environment variables online.

What may leave the device:

| What | Where | Rule |
|---|---|---|
| Player count hello | `/api/hello` (Netlify Blobs) | Random id, build, language, number of profiles, minutes, games started, stories opened, device type, installed, minutes with friends, ≤ 15 machine-voice lines without names. **Never** names, photos, places or anything typed. Off switch: Grown-ups → Advanced → Count players |
| Online play | PeerJS + cloud relay | Room code is a meeting point, **not** a secret; photos have their own pair lock (ECDH); every message is checked before use |
| Backups | The family's own Drive/iCloud | Never to our server |
| Studio online | GitHub (draft branch) | Behind `STUDIO_PASSWORD`; only `content/ voices/ photos/ tools/voice-extra.json` can change |

- Every incoming thing (network messages, backups, content packs, Studio requests) is checked for type, size and range before use.
- No ads aimed at children unless the Studio switches them on; a link opens only after a grown-up sum. No purchases, no streaks, no "come back!" pressure.
- **(to decide):** a starter-approves-newcomer step for online rooms, and longer room codes.

## 11. The world as data · Thế giới là dữ liệu

- **Define each thing once and use it everywhere.** Places: `CITIES`, `VILLAGE`, `TOWN`, …; roads: `ROADS`; flats: `LEVELS` / `FLATS` / `FOOTPRINTS`; landmarks: `LANDMARKS`. These feed the 3D world, the map (`paintMap`), the Studio map editor and the tests.
- Things are placed with a free-spot search (no collider, box or interactable within r; outside the road corridor).
- A family change (Studio `world.build / edits / land`) goes through the same rules and tests.
- **(to decide, recommended):** one world validator that runs in tests and in the Studio Map page:
  - duplicate IDs;
  - missing translations;
  - things outside the world;
  - unreachable activities;
  - NPCs inside buildings;
  - bridges without a valid crossing;
  - map markers with no world object.

## 12. Building and releasing · Xây dựng và phát hành

- Plain JavaScript modules, three.js, no build step, no new dependency without a clear reason. Netlify functions are the only server code.
- **One version everywhere:** `js/build.js` BUILD = the end of `sw.js` VERSION = `studio/version.json` (checked by `ground` and `studio`). Bump them every round; add new files to `FILES`.
- **Sparkle Studio** is one program in two places:
  - the exe (`studio/studio.cjs`) and online (`/studio/`, `netlify/functions/studio.mjs`);
  - the same pages (`studio/ui`) and the same engine (`studio/core.cjs`);
  - rebuild the exe whenever `studio/` changes (checked by `studio`).
- **HARD (rule 2):** the AI never pushes or opens a pull request without the owner's "yes, push". Each round:
  1. the suite runs before and after;
  2. before/after screenshots;
  3. a local commit;
  4. the Netlify zip;
  5. a report;
  6. wait.
- The owner's own Studio Publish is the owner's explicit action. Online it saves to a draft first. **(to decide):** make the exe save to the same draft branch too, so both work the same way.
- **Definition of done:**
  - it works on phone and desktop in both languages;
  - nothing else changed;
  - data checked;
  - resources cleaned up;
  - save compatibility kept;
  - offline OK;
  - checks pass, with a new check for anything new that can be measured;
  - version bumped;
  - HANDOFF updated;
  - a rollback path exists (the previous Netlify deploy, or git revert).

## 13. Decisions still open · Cần chủ quyết định

1. **Road grades.**
   - Your R3: 8 % asphalt / 12 % dirt.
   - Round 29 rule: 10 % / 14 %.
   - The `roadshape` test allows 12.5 % / 15.5 % where two fixed places are too close.
   - Choose one; then the test enforces exactly that, and the steep spots get flattened.
2. **R1 widths.**
   - Asphalt is 5.2 m and dirt 3.4 m today.
   - Footpaths (1.6 m) don't exist yet: add them in villages and round ponds (Phase 2)?
3. **Online safety:** starter approves newcomers; 6-character room codes.
4. **Two age profiles:** an explicit per-child profile, with adaptive help.
5. **Voice pack download:** keep downloading the whole pack after the first visit (now: the child's language first), or only the child's language unless a grown-up asks for more.
6. **Studio exe Publish:** straight to `main` (today), or through the draft branch like online.
7. **Typed safety net:** add `// @ts-check` + JSDoc to the riskiest modules (saves, net messages, Studio core). This gets type checking with no build step; it is the no-rewrite version of "TypeScript".

## 14. Review of the outside assessment (round 30)

**Agrees with ours, already done:**
- the stack (JS + three.js, no rewrite, no engine change);
- offline PWA;
- the voice-first pack;
- no unnecessary dependencies;
- road and building rules backed by checks;
- Studio local-server checks (localhost Host and Origin only, safe paths, size limits);
- no-punishment under-5 mode;
- no streaks or dark patterns;
- desktop + phone testing.

**Right, and worth doing (in order):**
1. **Online safety:** a 4-digit room code is not a secret.
   - HANDOFF §7 already says so.
   - Add newcomer approval and longer codes; keep message checks (already validated) and add rate limits.
2. **One world validator** (§11) running in tests and in Studio.
3. **Mini-game lifecycle:** `js/games/frame.js` is the shared frame. Add a test that opens and closes every game and checks nothing is left behind (timers, listeners, sounds).
4. **Save schema:**
   - saves carry `v: 2` and keep daily copies;
   - add explicit migrations and a test that loads an old save.
5. **Explicit age profiles** (§6) and adaptive hints.
6. **Performance budgets on a real phone:**
   - first load;
   - frames per second;
   - memory after 10 mini-games.
7. **Release discipline for Studio:** the online Studio already saves to a draft; the exe could do the same (§13.6).

**Not right for us, or already different:**
- "Treat the handoff as the source": it reviewed only HANDOFF, not the code. Several "to inspect" items are already done (validation of net messages, ECDH photos, Host and Origin checks).
- Full TypeScript: `@ts-check` + JSDoc gives most of the benefit with no build step (§13.7).
- "Don't add analytics": the owner chose an anonymous counter. It is minimal, has an off switch, and keeps no names.
- "Don't auto-download voice packs": the owner's HARD rule is recorded voices by default. We keep it, ordered by the child's language.

## 15. More rules recommended for consistency · Đề xuất thêm luật

Proposals; the owner decides.

1. **Performance budget (HARD once agreed):**
   - first playable ≤ 8 s on a mid phone over 4G;
   - ≥ 30 fps at quality Auto;
   - < 250 draw calls in a village;
   - textures ≤ 1024 px;
   - one new prop ≤ 2,000 triangles;
   - a `perf` check records these every round.
2. **Asset rule:** every photo, sound or picture records its source and licence (photos already do); no file > 600 KB without a reason; names are predictable.
3. **Mini-game rule:**
   - every game has an id, both languages, a how-to film, an under-5 version (no fail), Next/Stop at the end, and cleans up after itself;
   - a `games` check opens and closes each one.
4. **Text rule:**
   - under-5 lines ≤ 12 words;
   - the Vietnamese is checked by a native speaker (the owner) for anything cultural;
   - new names go through `registerName()`.
5. **Network rule:** every message type has a size limit, a rate limit and a validator. Nothing from another device goes into the page without escaping.
6. **Save rule:** every new saved field has a default and survives loading an older save; never delete a save without a copy.
7. **Studio rule:** the exe and online are one version (checked); every action that changes the live site asks "Are you sure?"; keys never leave their place (device, `%APPDATA%`, Netlify env).
8. **Bug rule:** a bug found on a phone gets a check that reproduces it before it is fixed (as `voice` and `solid` in round 30).
9. **Screenshot rule:** fixed camera spots for before/after (junctions, gates, village centre, market, map, Grown-ups, Studio), same size, desktop and phone.
10. **Round rule:**
    - one round = one branch and one pull request;
    - the report lists what changed, how it was tested, what could not be tested, and the open suggestions;
    - the owner chooses (rule 14).
