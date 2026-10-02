# Sparkle Valley · Thung Lũng Lấp Lánh — Handoff

A bilingual (English / Tiếng Việt) 3D open-world browser game for the owner's children, aged 2–8.
Attach this file at the start of a new chat. Code: **https://github.com/nguyentuanphu/Sparkle-Valley** (work on a `claude/…` branch, merged into `main` by pull request).

---

## 0. Ground rules (the owner set these — follow them every time)

1. **Do not change, remove or restyle any existing feature or UI unless the owner asks for that change.** Layout, colours, fonts, icons, button order, menu tabs, Grown-ups sections, texts and game rules stay as they are. New work goes *alongside*.
2. **HARD RULE: never `git push`, and never open or update a pull request, until the owner has checked the work and clearly said to push.** Commit locally, report what changed and how it was tested, give the Netlify zip, then wait. One "yes, push" covers one push. (Also in `CLAUDE.md`.)
3. **Run the regression suite before and after every change** (§2). The `contract` check fails if the UI's structure changed; run `--update-contract` only when the owner asked for that UI change, and say so.
4. Every text is bilingual: `T('English', 'Tiếng Việt')`. Spoken lines: `say(en, vi)`. People's titles follow the language (`NAMES_EN` / `NAMES_VI`, `registerName()`); 3D signs take `['English', 'Tiếng Việt']` or a function and redraw on `onLang()`.
5. On every change **bump `VERSION` in `sw.js`** and add new files to `FILES`, or phones keep the old version.
6. **Never put API keys or personal data in the code or the repo.** Keys live only in the grown-up's settings on their device. The ElevenLabs key pasted in an early chat must be replaced after use.
7. **House number 8:** only the number "8" may appear. The street name must never appear in the game or the repo.
8. Test at phone (320–390 px), tablet and desktop sizes, with 1 and 2 players, in both languages, and say plainly what could not be tested.
9. Keep it fun and safe for ages 2–8, girls and boys. Under-5 mode never punishes (no losing, no timers, no reading needed); big kids can have real challenge.

## 1. Run, deploy, install

- **Run:** `python3 -m http.server 8765` in the repo → http://localhost:8765. `window.__sv` is the game object (heroes, world, farm, partners, playGame…).
- **Netlify (main site):** `./build-netlify.sh` zips `index.html sw.js manifest.webmanifest netlify.toml css js fonts icons vendor videos` (+ `voices/` if present). Drag the zip onto the **same** Netlify site's Deploys page. Saves belong to the web address, so a new "Netlify Drop" site starts empty.
- **GitHub Pages** auto-deploys `main` (`.github/workflows/pages.yml`). It needs a one-time setup: repo → Settings → Pages → Source: **GitHub Actions** (a run failed with "Get Pages site failed … Not Found" until this was done). For a private repo on a free plan, Pages is not available; use Netlify only.
- **Phones:** close and reopen the app to pick up a new version. iPhone: play from the Home Screen icon (Safari may clear data of sites not opened for weeks). Backups to iCloud/Drive move progress between devices.

## 2. Testing

`cd tests && npm install && node run.mjs [check …]`. Uses Chromium (`/opt/pw-browsers/chromium` in the cloud sandbox via `CHROMIUM=`). Screenshots go to `tests/out/` (not committed).

| Check | What it proves |
|---|---|
| `boot` | Starts with no errors at phone, tablet and desktop sizes |
| `spill` | No HUD, Sparkle Pad tab or Games hub text runs out of its box at 320/375/1024 px in both languages |
| `language` | Vietnamese mode shows none of the common English labels |
| `two-players` | Split screen: 2 heroes, 2 HUDs, pets for both |
| `games` | All 53 mini-games open and close without errors |
| `features` | 7 cities, 26 kiosks, 7 hosts, ≥ 47 landmarks, house 8, 32 tales, Dragon Bridge walkable, pets/pet yard, chat auto-close, shortcuts, zoom, Games hub → host/storyteller, folk-game chatter |
| `camera` | At every landmark sign facing 4 ways, the camera is not inside or blocked by a building |
| `contract` | HUD buttons, Pad tabs and Games hub sections unchanged (`tests/ui-contract.json`) |
| `roads` | Every city is on a road, a golden gate stands on every named road end (15+), and no collider, building or interactable stands on a road |
| `saves` | The main save wiped from outside the game is restored from the safe copy |
| `multiplayer` | Two devices through a local PeerJS server (cloud relay alongside): see each other, friend chip, "Ask to come", walking to the friend, talk bubbles |
| `cloud` | Devices that can never link directly meet through the cloud relay (local MQTT broker): friend status (place, room, Join), positions, meeting, talk, **photos both ways**, **a third player seen by everyone**, leaving |

`multiplayer` and `cloud` need local servers (commands in `tests/README.md`), otherwise they say "skipped".
Useful extra checks used during development (scratch scripts, not in the suite): render `paintMap()` with roads and interactables to a PNG; list every collider / box / interactable that lies on a road (`roadDist`), which must be none.

## 3. What the game has (keep all of it)

**Players.** Up to 6 children, each with a photo face on a 3D picture-book character (style C: big head, painted eyes, soft outline), age mode (Little under 5 / Big kid 5–8) and difficulty (Easy/Medium/Hard → level offset +0/+1/+2, capped at 5). Outfits (dress, shirt & shorts, áo dài, tunic, overalls, hoodie), hair, skin, hats (crown, cap, bunny ears, flower, bow, nón lá, earned passport hats), wings or cape, gliders, the whistling kite. Photo editor with drag, pinch and circle crop. 1 player, 2 on one screen (split: side by side in landscape, stacked in portrait; shared farm and coins), or online with friends.

**World** (400 × 400, x east, z south):
- Dawn Plateau (0,0) with Ông Cú the owl at the start; Sunny Farm (−26,126); Lotus Village (110,30) with its old cổng làng gate, banyan, pond, story mat; rice fields (112,−38); Mirror Lake (55,125); bamboo forest (−100,85); snowy peaks to the north.
- Two Homes Street (x 12–52, z 32–74, road at z 47, Harbour-style bridge x 44–74): Bà Rịa tube houses, French villa, Sydney weatherboard, park; **Bạch Dinh** (13,72.5), **Nhà Tròn** (36.5,63.5), **house number 8** (11.5,34.5, blue plate "8" only, knock for a welcome).
- Three Regions Market (x 96–146, z 70–96, own red gate), Aussie Corner (x −144…−90, z −40…16), China Town (100,−88), India Village (−112,−84).
- **Seven cities** (`CITIES` in `world.js`, built by `cities.js`): Hà Nội, Bắc Ninh (clock-tower roundabout), Đà Nẵng, Hồ Chí Minh City, Sydney, Melbourne, Brisbane. Every city has the same tidy plan: a main street from its golden gate straight through the paved square, landmarks set back on both sides facing the street with ℹ️ signs at the street edge, two kiosks on the street edges near the gate, and the game host standing by the street.
- **Roads** (`ROADS` in `world.js`, drawn by `roads.js`): asphalt roads join every village and city; dirt roads link quieter places (plateau ramp, Lotus Village lane, rice fields, Bắc Ninh–China past the Potala, Aussie–Melbourne, Aussie–India road, Saigon–lake, farm–lake, farm–west woods, market–lake). Each road names the place at each end (`gates`); a **golden welcome gate** stands exactly on that end, across the road ("Welcome to …" in the chosen language). Junctions get a plain asphalt patch. Lotus Village and the market keep their own gates. Đà Nẵng's golden **Dragon Bridge** carries the road over the river (walkable, puffs fire). Nothing may stand on a road: trees, rocks, gathering spots and heritage sites check `roadDist()`.
- 47 landmarks with postcards: 10 older (Opera House, Harbour Bridge, Uluru, Big Banana, lifesavers' tower, Vũng Tàu lighthouse, Turtle Tower, One Pillar Pagoda, Hội An bridge, Bến Thành clock), 18 UNESCO sites (`heritage.js`), 19 city and Bà Rịa–Vũng Tàu landmarks. 12 shrines, 4 towers, 24 hidden Leafies, 10 secrets.

**Things to do.**
- 53 mini-games (`register({id, icon, origin, name, run(api)})`): 11 thinking games with 5 adaptive levels; strategy (Hanoi, robot planner, maze, blindfold goat, caro, ô ăn quan); learning (letters EN A–Z + 29 Vietnamese letters, numbers, shapes, colours, money in AUD/VND); Vietnamese, Australian, Chinese and Indian folk games; Music Corner; 7 city games (water puppets, Đông Hồ painting, Dragon Bridge count, scooter traffic lights, harbour ferries, tram stops, koala breakfast). Every game has a narrated How-to-play film (`howto.js`; a real `videos/<id>.mp4` replaces it). Combos, lucky stars, 1–3 star rating, gift box.
- Farm: 3×3 field growing in real time, barn animals (need hay), Mr. Bear's shop, 3 daily jobs, cooking (incl. 15 cultural dishes and festival treats), gathering fruit/flowers, cracking rocks for treasures, market stall trading.
- Story: picture-book prologue (Mây Cau Có), 9 chapters, quests told as story pages with a green "▶ Go", sticker book, album, camera, scrapbook.
- **32 fairy tales** (18 Vietnamese, 4 Australian, 5 Chinese, 5 Indian) in the tale theatre: read aloud page by page over animated pictures; Grandma Storyteller at the story mat; "Fairy tales" shelf in the Games hub.
- **26 kiosks**: local food (food passport) and a saying (ca dao, tục ngữ, regional words, Aussie sayings, Chinese and Hindi proverbs spoken in those languages). In the older villages they stand along the main street edge facing it (`STREETS` in `cities.js`).
- Culture: 8 groups of friends playing traditional games who chat in bubbles (`chatter.js`), crops from each culture, doors to knock on, passport (5 stamps per country, a hat), festivals by date (Tết, Mid-Autumn, Diwali, Christmas, Australia Day), counting hunts, Chinese and Hindi first words.
- Pets (2 per child, named; pet yard on the farm; water rescue), ferry round the lake (4 piers), river rafts, water buffalo, glider, towers, shrines, Lotus Statue (4 orbs → heart or stamina).
- Weather (rain waters the farm, puddles, rainbows), seasons, day/night, fireflies, tap-anything reactions, confetti.
- "Go straight to the person": a Games hub card or map place flies the child to the villager who runs it.

**Online play** (`net.js`, `relay.js`):
- Rooms of up to 6 with a 4-digit code; the starter relays messages (star). Direct links via PeerJS/WebRTC with live voice; when the direct link can't open (different networks), the **cloud relay** carries the room through free public MQTT brokers (emqx, hivemq, mosquitto, eclipse — all at once, copies dropped), encrypted AES-GCM with a key from the room code, hashed topics.
- **Photos** cross the cloud relay with a second lock: each pair of players agrees a private ECDH key, so only the friend it is meant for can open it (a 112 px JPEG, sent once per friend).
- The starter introduces every newcomer to everyone (direct and cloud), so in rooms of 3+ everybody sees everybody. Positions are sent on their own clock (10 a second, once a second while a menu or game is open or the app is in the background), so slow phones still keep friends up to date.
- Friend codes, friend status (🟢 online · place · room with ▶ Join, ⚪ offline · how long ago), invites, signal bars + ping + route per friend, wake lock, auto switch-over, "Find / walk / fly / ask to come", trading, removing a player. Voice needs a direct link or a grown-up's own TURN relay.

**For grown-ups** (press and hold; also from ⚙️ quick settings in the game): players, backup/restore (`.txt` via share sheet → iCloud/Drive), language, AUD/VND, sound/music, voices (device, ElevenLabs, Microsoft Azure, Google, family recordings, offline voice pack), captions, text size, calm mode, rain, festival picker, rest timer, camera mode, graphics, credits page, renaming characters, coins top-up, online play (friend codes, TURN relay, connection test), voice control, optional AI villager chat (Anthropic key; model `claude-opus-5-5`).

**Progress is never lost:** saves in localStorage, mirrored a few seconds later to IndexedDB (`sparkle-valley-save`: latest + one per day) and the `sv-save` cache; restored automatically if the main save disappears; `navigator.storage.persist()` requested. Updates only replace the game's own cache; the voice pack (`sv-voices`) and `sv-save` are kept.

## 4. The UI (keep it as it is)

- **Title:** name on a cream storybook card with floating friends, pink/purple lettering with white outline, green "▶ Tap to start", round ⓘ About (top left), "add to home screen" chip (top right), bottom card with English / Tiếng Việt (drawn flags) and 🌏 中文 / हिन्दी learning buttons.
- **Who's playing:** one cream card, three mode tiles (alone / two here / friend far away), player faces, green Let's go; Grown-ups hold button bottom left.
- **HUD per player:** player card (photo, name, hearts) + coins/orbs/leafies chips (top left); quest bar with "▶ Go" (top middle); round minimap with N and a clock (top right); friend chip under the minimap; big zoom ＋/－ (right edge); dock: Games, Map, Bag, Ask, Talk, Call, Music, Sound (SVG icons); Run and Jump (bottom right; Run above Jump on narrow phones); big glowing action button (bottom centre); key badges on computers (G M B K T C N O F P, +/−, E, 1–8, Esc).
- **Sparkle Pad tabs in order:** Map, Backpack, Adventures, Album, Passport, Games, Camera, Friend. Same height on every tab.
- **Style:** bright summer-afternoon toon look, soft outlines, Fredoka (EN) and Baloo 2 (VI), cream and pastel rounded cards, big tap targets (≥ 44–56 px), confetti for rewards.

## 5. How it's built

Plain HTML/CSS/JS ES modules, **no build step**. three.js r160 (`vendor/three.module.js`), PeerJS 1.5.4 (loaded only online), Web Audio (all music synthesised), Web Speech, IndexedDB, Cache API, service worker (offline PWA).

| File | Purpose |
|---|---|
| `index.html`, `css/style.css`, `css/fonts.css`, `fonts/` | Page shell; all styling (tokens in `:root`, `html[lang=vi]` font switch); bundled fonts |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline + install. `VERSION`, `FILES`; keeps `sv-voices` and `sv-save` caches |
| `js/main.js` | Boot, renderer, game loop `frame()`, split screen, tap-to-walk, NPCs, quests, rewards, online partners, keyboard, zoom, music by place |
| `js/world.js` | `heightAt()`, `FLATS`, `CITIES`, `ROADS` + `roadDist()`, regions, sky, trees, Lotus Village, bridges, shrines, towers, Leafies, `groundAt`, `collide`, `paintMap` |
| `js/roads.js` | Road ribbons (3 points across, lifted over bumps), junction patches, golden gates from `ROADS[].gates`, Dragon Bridge |
| `js/cities.js`, `js/games/cities.js` | City plan (street, landmarks, host, kiosks), kiosks everywhere (`KIOSKS`, `STREETS`), Bạch Dinh, Nhà Tròn, house 8; the 7 city games |
| `js/player.js` | `Hero`: walk, run, jump, glide, climb, swim, ride, stamina, calm camera with collision |
| `js/avatar.js`, `js/houses.js`, `js/town.js` | Characters with photo faces; storybook houses; Two Homes Street |
| `js/hud.js`, `js/ui.js`, `js/input.js`, `js/icons.js` | HUD, minimap, friend chip; title, who's playing, Grown-ups, Sparkle Pad, dialogs, recorder sheet; joystick/keyboard/controllers; SVG icons and flags |
| `js/net.js`, `js/relay.js` | Rooms, voice, pings, friends; cloud relay (MQTT over WebSocket, AES-GCM, ECDH photo keys) |
| `js/state.js` | Settings, profiles, shared farm, saving + safe copies + restore |
| `js/voice.js`, `js/recorder.js`, `js/packhash.js`, `js/listen.js`, `js/commands.js` | Speech, family voice, offline pack lookup, voice control |
| `js/farm.js`, `js/pets.js`, `js/gather.js`, `js/trade.js`, `js/ferry.js` | Farm, pets & pet yard, wild gathering, trading, ferry and rafts |
| `js/regions.js`, `js/words.js`, `js/asia.js`, `js/words2.js`, `js/heritage.js` | Market, Aussie Corner, landmarks & postcards, vendors, slang; China Town & India Village; UNESCO sites, culture groups, crops, doors |
| `js/story.js`, `js/learn.js`, `js/tales.js`, `js/talesdata.js`, `js/chatter.js` | Story & quests; story time, counting hunts, rest timer; tale theatre and tales; NPC chat bubbles |
| `js/passport.js`, `js/festivals.js`, `js/weather.js`, `js/fun.js`, `js/secrets.js`, `js/showcase.js`, `js/kite.js` | Passport; festivals; weather; little joys; secrets; landmark camera; whistling kite |
| `js/chat.js`, `js/extras.js`, `js/credits.js`, `js/install.js`, `js/howto.js` | Villager chat (offline brain + optional Claude); Grown-ups extras; credits; add to home screen; how-to films |
| `js/games/*.js` | `frame.js` (shared game frame) + thinking, strategy, vietnam, market, farmgames, folk, folk2, asia, music, cities |
| `tools/voice-lines.mjs`, `tools/make-voice-pack.mjs` | Offline voice pack: every spoken line; maker for ElevenLabs (default) or Azure (`--engine azure`) |
| `tests/run.mjs`, `tests/harness.mjs`, `tests/ui-contract.json`, `tests/README.md` | Regression suite |
| `marketing/` | Ad videos and their source (not in the Netlify zip) |

**Mini-game API:** `api.stage, level, players, two, little, strong, say, show, dots, right, wrong, praise, win({title}), onCleanup, closed`. Start with `G.playGame(i, id, source)` (`'shrine' | 'folk' | 'place' | 'replay'`).

**Save data (localStorage):** `sv2_settings` (language, currency, sounds, voices and keys, camera, graphics, captions, textSize, calm, noRain, festival, restMins, turnUrl/User/Pass, azure*, learnLang, npcNames, friendCode, friends, friendsOn, packSaved, credits…), `sv2_profiles` (per child: name, photo, age, difficulty, look, hearts, stamina, orbs, leafies, shrines, towers, inv, levels, wins, quests, story, stickers, album, pets, postcards, stamps, visited, found, tasted, tales, words, secrets, kite, kiteOn, pos…), `sv2_farm` (shared: coins, plots, seeds, basket, animals, hay, products, petYard, jobs). IndexedDB: `sparkle-valley-voice` (family clips), `sparkle-valley-tts` (cached online voices), `sparkle-valley-save` (safe copies).

**Voice pack:** cast English & Vietnamese woman + man, Chinese & Hindi man. 3,988 files, ~218,880 characters ≈ 109,440 ElevenLabs credits (Flash v2.5) or ≈ US$3.50 on Azure (free F0 tier: 500k chars/month, tool paces ~18 requests/min). `node tools/make-voice-pack.mjs --count` shows the cost without a key. The game downloads the whole pack once and keeps it offline.

## 6. Open items

- The real voice pack (needs a machine that can reach ElevenLabs or Azure).
- A front photo of house number 8 to match colours, roof, gate and balcony (number only, never the street name).
- Real-device testing: iPhone/Android touch and performance, real voices with keys, recording, share-sheet backups, **online play across two real networks** (public MQTT brokers and PeerJS could not be reached from the build machine).
- Optional ideas, only if asked: dark / high-contrast mode, simpler menu for under-5s, bedtime routine, phonics and telling the time, decorating, online co-op tasks, hosted sync, native store apps.

## 7. Decisions and known limits

- Natural voices, voice cloning and AI chat are optional, online and use the parent's own keys; everything works offline without them.
- Online play uses the public PeerJS server to introduce devices; voice goes directly; game messages fall back to the cloud relay. The relay key comes from the 4-digit room code, so names and positions are only lightly protected from someone who knows the scheme; photos have their own pair lock (ECDH). Anyone who joins a room is a player and appears in the room list; the room's starter can remove them (works on both routes, and they can't come back into that room). Only the starter can say "full" or remove someone; ids, looks, friend codes and positions from others are checked before use (they go into the page). Topic names use a slow hash so friend codes can't be read back from them. Worth considering if the owner wants it: the starter approving each newcomer, and longer room codes.
- Graphics follow the setting (Fast / Auto / Pretty); Auto picks Fast on phones.
- iOS Home Screen apps keep storage separate from Safari: use backups to move progress.
- Stamina is counted in wheels (1–3); food and juice give one extra wheel.
- Saves: if the main save is missing and its copy can't be read within 8 s, this session never overwrites the copies (new progress goes to `new-…`), and the restore also looks at the daily copies (the last 10 are kept).
- Leafy spots, shrines and towers are fixed in `world.js`; heritage sites, crops and culture groups find a clear spot (off roads) near their village by themselves.

## 8. History (one line per round)

1–2 Original brief; BotW-style open world, thinking/strategy/Vietnamese games, learning, story, two devices online, family voice. · 3 Recorder fix, easy camera, Go button, Games hub, tap-to-do. · 4 Summer-afternoon look, Two Homes Street, secrets, credits, folk games, how-to films, voices, voice control, villager chat. · 5 Harbour Bridge, Three Regions Market, Aussie Corner, postcards, slang, 7 folk games, quick settings. · 6 Add to Home Screen, ad videos. · 7 Storybook UI and characters, renaming. · 8 Camera, voices per character, coins, language sweep. · 9 Gathering and treasures. · 10 Rooms of 6, friends, trading. · 11 China Town, India Village, 4 games, Chinese/Hindi words. · 12 SVG icons, 18 UNESCO sites, culture groups, crops, doors. · 13 Pets, ferry, passport, festivals, weather, dishes, little joys, story time, Music Corner, rest timer. · 14 Landmark camera, TURN relay, connection test. · 15 Camera collision, captions, text size. · 16 Azure voices, `.txt` backups. · 17 Offline voice pack. · 18 Cities, roads, gates, Dragon Bridge, kiosks, fairy tales, friend finding, shortcuts, calmer camera, pet yard. · 19 Title and who's-playing redesign, ⓘ About, Grown-ups in quick settings, whistling kite. · 20 Recorder sheet on iPhone. · 21 Cloud relay, friend status, signal and ping. · 22 Title lettering, Azure pack, saves never lost. · **23** Road network rebuilt so every village and city is reached by road, gates only where roads enter, roads actually drawn (they were face-down) and following the ground, nothing standing on roads; tidy city plans and kiosks along street edges; house 8 moved off the road onto its own plot; friend photos over the cloud relay (ECDH pair keys), 3+ player rooms over the relay, positions sent while menus are open; friends' photos were black because the photo was copied before it had loaded (fixed). Code review fixes: page injection through a friend's id, anyone could close the room or remove players, removing a player didn't reach cloud players, switching friend sharing off didn't hide the child, a slow restore could overwrite the good save copy, kiosk food set 40 stamina wheels (wheel drawing crashed), a road spiked up the bamboo tower and dived under the Dragon Bridge deck, "Go" could land the child on a tower top, climbing faster than walking, a leftover keyboard listener.
