# Sparkle Valley · Thung Lũng Lấp Lánh — Project Brief & Handoff

Paste or attach this file at the start of a new chat so the assistant has the full context.
Code lives at **https://github.com/nguyentuanphu/Sparkle-Valley**. Clone it, and keep committing and pushing: an earlier build was lost because it was never saved anywhere.

---

## 1. Who it's for

- **Players:** my children, **aged 2 to 8**, girls and boys.
  - Each child has an **age mode**:
    - **Little (under 5):** nothing depends on reading, everything is spoken, and nobody can lose.
    - **Big kid (5 to 8):** harder levels, more text, and computer opponents that really try to win.
  - Each child also has a **difficulty**: **Easy / Medium / Hard**.
- **Devices:** an Android tablet and an iPhone, in portrait and landscape. Also works on a computer with keyboard, mouse or game controller.
- **Grown-up:** me (the parent). I set up players and photos, choose settings, record my voice, and move saves between devices.
- **Languages:** **English and Vietnamese** everywhere (text and voice), plus an optional *bilingual voice* that says each line in both languages.
- **Money:** **AUD ($, cents)** or **VND (đồng)**, chosen in settings.

## 2. Requirements (everything asked for so far)

### Original brief (kept)
- **Characters:** each child is the hero, with **their face photo** on a 3D character.
  - Up to **6 players**, added and removed by grown-ups.
  - Clothes: dress or shirt and shorts (plus áo dài, explorer tunic, overalls, hoodie) in any colour, hair style and colour, and skin tone.
  - **Accessories:** crown, cap, bunny ears, flower, bow, nón lá, plus **fairy wings** or a **superhero cape**.
  - Photo editor: drag to move, **pinch** or slider to zoom, circle crop.
- **Fun and safe:** for little ones there is no losing, no game over, no timers, no reading needed, big tap targets (56px or more), confetti and sparkles, and gentle feedback (wiggle, soft sound, spoken hint).
- **Sound:**
  - Lots of sound effects, with music that changes by area: farm "Old MacDonald", pond "Row Your Boat", thinking, flying, 3 dance-party songs.
  - Animal sounds: woof, meow, moo, baa, oink, quack, cluck, neigh, squeak, ribbit, hoot.
- **Natural voice:**
  - Web Speech API with the best installed voice picked automatically. Grown-ups can choose and test voices, and there are tips for installing Enhanced or Premium voices.
  - **Family voice:** grown-ups record the common lines, which the game plays in their real voice (see §5).
- **Thinking games, each with 5 adaptive levels (up one level after 2 wins):**
  1. What comes next?
  2. Memory cards (with the kids' photos)
  3. Build a tower
  4. Sort it out
  5. Shadow match
  6. Duckling maze
  7. Photo jigsaw
  8. Feed the bunny
  9. Odd one out
  10. Copy the tune
  11. Order board
- **A real open world, not menus:**
  - Tap to walk, or use the joystick.
  - Floating bubble icons mark things to do, and walking near one shows a big action button.
  - The map can quick-travel to any place, and has "Change player".
- **Harvest Moon farm:**
  - **3×3 field:** plant → water (💧 shows when needed) → grows in real time → harvest. Crops keep growing while the game is closed.
  - **Crops:** carrot (free), strawberry, tomato, corn, sunflower, pumpkin.
  - **Barn animals:** chicken, cow, sheep, pig and unicorn make egg, milk, wool, mushroom and sparkle dust, but only while the **hay box** has hay.
  - **Pets** (puppy, kitty, bunny) follow you.
  - **Mr. Bear's market:** sell one item at a time (coins counted aloud) or everything at once, and buy seeds, animals and pets.
  - **3 daily jobs:** each pays 5 coins and a sticker. Each child has a sticker book.
- **Other activities:**
  - Hot-air balloon: tap to rise, bounce off clouds (never crash), fly through rainbow rings.
  - Dance stage: dance automatically, tap to make notes, 🎶 changes the song.
  - Pond: feed the fish and watch the ducks.
  - Bubble machine.
  - Wardrobe with a close-up camera.
- **Two players on one device (co-op):** **only when chosen**.
  - Split screen: side by side in landscape, top and bottom in portrait.
  - Each child has their own camera, controls and HUD.
  - Farm and coins are **shared**. Stickers, levels and story belong to each child.
  - Children who aren't playing wander around the farm.
- **Saving:** automatic.
  - Backup file export and import in Grown-ups.
  - "Start the farm over" keeps the players and stickers.
- **Standalone PWA:**
  - Installable, works offline (service worker), needs no account.
  - Nothing is uploaded; photos and recordings stay on the device.
- **Design:** glassy rounded panels with soft shadows, a friendly font (Fredoka, bundled), and the **Grown-ups** area opens with **press-and-hold**.

### Added in this round
- **Breath of the Wild-style open world and UI:**
  - **Mechanics, mirrored as closely as possible:**
    - cel-to-realistic 3D valley, hearts, a **stamina wheel**, a circular **minimap** with fog of war
    - **towers** that reveal the map, **shrines** (orange = unsolved, blue = solved) that give **Sparkle Orbs**
    - the **Lotus Statue** trades 4 orbs for a heart or more stamina
    - a **Leaf Glider**, climbing steep slopes, swimming, riding a **water buffalo**
    - a **cooking pot** with recipes, and hidden **Leafies** (like Koroks) under rocks and on peaks
    - a day/night cycle with stars, fireflies and glowing lanterns
    - region-name banners, an adventure log, fast travel, and a camera for photos
    - an owl guide, Ông Cú, who starts the quest on a plateau
  - **Visual style:** the "Sparkle Pad" pause menu (Map, Backpack, Adventures, Album, Games, Camera, Friend) uses BotW-style dark glass panels with cyan glow.
  - **Not copied:** Nintendo's names, characters and assets. Everything is original.
- **Games that train thinking and strategy:**
  - Tower of Hanoi (with an optimal-move hint)
  - Robot planner (plan a sequence of arrows, then run it: early coding)
  - Mazes
  - Blindfold Goat (deduce from hoof-print arrows)
  - Caro (noughts and crosses / four in a row)
  - Ô ăn quan
- **Vietnamese traditional games:**
  - **Ô ăn quan** (mandarin square capturing, full sowing and capturing rules)
  - **Cờ caro**
  - **Nhảy lò cò** (hopscotch: hop in order and skip the stone)
  - **Kéo co** (tug of war)
  - **Bịt mắt bắt dê** (blindfold goat)
  - In two-player mode they become head-to-head.
- **Learning:**
  - letters: English A–Z and all 29 Vietnamese letters with their school names (a, á, ớ, bờ…) and picture words
  - numbers and counting (Number Train)
  - shapes, colours and colour mixing
  - **money with real AUD coins and notes or VND notes** (Market Helper)
- **Voice in English and Vietnamese**, with voice choice per language.
- **Two players on two devices:**
  - Join with a 4-digit room code, peer-to-peer (WebRTC via the free PeerJS service), and **talk with a live voice call** with a mute button.
  - See each other in the world, send talk bubbles, and "Fly to my friend".
- **Talking between players on one device:** 💬 quick phrases ("Come here!", "Look!", "Help me!"…) show as a bubble and are spoken aloud.
- **Ages 2 to 8:** age mode plus Easy / Medium / Hard per child.
- **Mute buttons:** on-screen 🎵 (music) and 🔊 (sounds and voice), as well as in settings.
- **New songs for the games:**
  - Thinking Time, Clever Plan (strategy), Market Bounce (money), Village Dance (Vietnamese pentatonic style)
  - "Kìa con bướm vàng" (Frère Jacques tune) for folk games, Twinkle Twinkle for learning games
  - a đàn bầu-style generative village theme, and a quiet piano-like field theme
- **As realistic as possible:**
  - Natural child proportions (about 3 heads tall) instead of chibi, PBR materials, ACES tone mapping, image-based light, real sun shadows that follow the player, and glossy water.
  - The UI is glassy and polished.
- **Story:**
  - A narrated picture-book prologue: the grumpy cloud *Mây Cau Có* put the valley to sleep.
  - **9 chapters** unlock as quests are finished, each with coins and a sticker.
  - Ending: the cloud becomes a rainbow friend. Chapters can be re-read from the Album.
- **Family voice:** grown-ups read 11 prompted lines in each language. The game plays those recordings, and tunes the device voice's pitch towards the recorded voice for everything else.

## 3. How it's built

**Tech:**
- Plain HTML, CSS and JavaScript ES modules with **no build step**.
- **three.js r160** (`vendor/three.module.js`), PeerJS 1.5.4 (`vendor/peerjs.min.js`, loaded only for online play), and `vendor/RoomEnvironment.js` (soft lighting).
- Web Audio (all music and sound synthesised), Web Speech API, MediaRecorder + IndexedDB (family voice), localStorage (saves), and a service worker (offline).

**Run locally:** `python3 -m http.server 8765` in the repo folder, then open http://localhost:8765.
**Debug:** `window.__sv` is the game object (heroes, world, farm, playGame…).

| File | Purpose |
|---|---|
| `index.html` | Page shell (stage, HUD layer, toast, song button, boot screen) |
| `css/style.css` | All styling. Design tokens in `:root`; `html[lang=vi]` switches to the Vietnamese font |
| `css/fonts.css`, `fonts/` | Bundled Fredoka (English) and Baloo 2 (Vietnamese; Fredoka has no Vietnamese letters) |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA install and offline. **Bump `VERSION` in `sw.js` and add new files to `FILES` on every change** |
| `.github/workflows/pages.yml` | Auto-deploy to GitHub Pages when `main` changes |
| `js/main.js` | Boot, renderer (tone mapping, shadows), game loop, split-screen viewports, tap-to-walk, NPCs and their talks, quests, rewards, wandering kids, online partner, music by place |
| `js/world.js` | Terrain `heightAt()`, regions, sky and day/night, trees and grass (instanced), Lotus Village, bridge, shrines, towers, Leafies, buffalo, critters, `groundAt`, `collide`, `paintMap` |
| `js/player.js` | `Hero`: walk, run, jump, glide, slope-climb, swim, ride, tower climb, stamina, camera follow, tap-to-walk goal, wardrobe close-up |
| `js/avatar.js` | Realistic child character with photo face (`buildAvatar`, `animate`), owl and gourd NPC models, default drawn face |
| `js/farm.js` | Sunny Farm: field and crops, barn, hay, animals, pets, Mr. Bear (sell/buy), daily jobs (`jobProgress`), animal models |
| `js/places.js` | Dance stage + xylophone, puppet theatre, frog on the lily pad, beach treasure chest |
| `js/story.js` | Prologue + chapters (`showStory`, `storyCheck`) |
| `js/hud.js` | Per-player HUD: hearts, coins/orbs/leafies, minimap, clock, objective, stamina wheel, action and move buttons, 🎵/🔊, 💬 quick phrases; `fogMapFor` |
| `js/ui.js` | Title, Who's playing (modes: alone / two here / friend far away), Grown-ups, player editor, dialogue box, reward pop-up, Sparkle Pad, cooking, Cô Mai's shop, wardrobe, family-voice recorder |
| `js/input.js` | Floating joystick per screen half, camera drag, taps, keyboard for two players, game controllers |
| `js/net.js` | Online play: room codes, data channel, voice call, talking meter |
| `js/audio.js` | `SFX` (including animal sounds), generative themes and sequenced `SONGS`, `Music.play(key)` |
| `js/voice.js` | `say(en, vi)`, best-voice choice per language, family recordings (IndexedDB), pitch estimate |
| `js/i18n.js` | `T(en, vi)` inline translations, alphabets, letter names and words, number words, colours |
| `js/money.js` | AUD and VND denominations, formatting, spoken amounts. Wallet unit "xu": 1 xu = 10c = 2.000đ |
| `js/data.js` | Items, recipes, Cô Mai's shop, gather spots, stickers, main quest list |
| `js/state.js` | Settings, profiles, **shared farm**, saving, backup import and export |
| `js/gfx.js` | Materials, geometry merging, emoji sprites, blob shadows |
| `js/games/frame.js` | Mini-game frame: layer, title, progress dots, spoken help, right/wrong feedback, win celebration, per-game music |
| `js/games/thinking.js` | pattern, counting, letters, numbers, shapes, colors, sorting, memory |
| `js/games/strategy.js` | hanoi, robot, maze (also used by duckmaze), goat |
| `js/games/vietnam.js` | oanquan, caro, hopscotch, tug |
| `js/games/market.js` | market (pay exact amounts in AUD or VND) |
| `js/games/farmgames.js` | order, sortout, bunny, jigsaw, oddone, tune, tower, duckmaze, balloon, bubbles |

**Mini-game API:** `register({ id, icon, name, run(api) })`.
- `api` gives: `stage`, `level` (1–5), `players`, `two`, `little`, `strong`, `say(en, vi)`, `show`, `dots`, `right`, `wrong`, `praise`, `win({title})`, `onCleanup`, `closed`.
- A game is started with `G.playGame(playerIndex, id, source)`, where `source` is `'shrine'` | `'folk'` | `'place'` | `'replay'`.
- Effective level = the child's level for that game + difficulty offset (Easy +0, Medium +1, Hard +2), capped at 5.

**Save data (localStorage):**
- `sv2_settings`: `{lang, currency, sound, music, voice, voiceEn, voiceVi, bilingual, alwaysDay, quality, familyVoice, familyPitch}`
- `sv2_profiles`: `[{id, name, photo, age, difficulty, look{style,color,hat,back,hair,hairStyle,skin,glider}, hearts, staminaMax, orbs, leafies{}, shrines{}, towers{}, discovered{}, inv{}, dishes{}, stickers[], levels{}, wins{}, quests{}, story{}, glider, album[], pos}]`
- `sv2_farm` (shared): `{coins, plots[9], seeds{}, basket{}, animals[], hay, products{}, pets[], jobs{day,list}}`
- IndexedDB `sparkle-valley-voice` / store `clips`: key `"en:great"` → recorded audio Blob.

**World map** (x to the east, z to the south; the world is 400 × 400):
- Dawn Plateau (0,0), with the start and the owl.
- Sunny Farm (−26, 126), south of the plateau ramp.
- Lotus Village (110, 30), east across the river bridge.
- Rice fields (112, −38).
- Mirror Lake (55, 125), with the beach chest at (10, 146).
- Bamboo forest (−100, 85).
- Snowcap peaks to the north.
- 12 shrines and 4 towers are listed in `world.js`.

## 4. Tested so far (headless Chromium)

- Desktop 1180×820, tablet landscape, phone portrait 390×844 and phone landscape, in 1 player and split-screen 2 players, in English and Vietnamese.
- **No console errors.** All 27 mini-games open.
- Bunny game won twice: coins +8 each, sticker on first win, level 1 → 2.
- Farm: plant, water and growth work. Mr. Bear, jobs, wardrobe and dance stage work. Story prologue and chapter unlock work.
- Family-voice recording saves (fake microphone). Tower climb works.

**Not yet tested:**
- Real iPhone and Android devices: touch feel, performance, voices, home-screen install.
- **Online play between two devices:** the test machine could not reach the PeerJS server.

## 5. Known limits and decisions

- **Voice cloning:** making a full synthetic copy of a parent's voice needs an online AI voice service (for example ElevenLabs), which would upload the recordings and needs an account.
  - That conflicts with "offline, private, no server", so it was not done.
  - Instead, the recordings play for the lines they cover, and the device voice's pitch is matched for the rest.
  - Possible upgrade: let the parent record *every* spoken line, or pre-generate natural audio files for all lines offline and ship them with the app.
- **Online play needs the internet** and uses the free public PeerJS server (`0.peerjs.com`) to introduce the two devices; voice then goes directly between them.
  - Some strict networks block WebRTC. A TURN server would fix that but costs money.
  - Microphone permission is only asked when starting a call or recording.
- **Realism vs. performance:** shadows, antialiasing and grass density follow the **Graphics** setting (Fast / Auto / Pretty). Auto picks Fast on phones and 4-core devices. If the tablet is slow, choose Fast.
- The photo face is drawn onto the front of a 3D head; it looks best with a straight-on close-up photo.
- three.js **r160** is used instead of r128 from the original brief. The earlier build's files were lost, so the file layout is new (see the table above).
- iOS home-screen apps keep their own storage, separate from Safari: use backup files to move progress.
- Leafy hiding spots, shrines and towers are fixed positions; new ones go in `world.js`.

## 6. Ideas for next steps

- Bedtime routine at night (brush teeth, story), seasons on the farm, weather (rain waters crops, rainbows).
- More Vietnamese content: Tết festival event (bánh chưng, lì xì in VND), Trung Thu lantern parade, "Rồng rắn lên mây" chasing game, đàn bầu mini-instrument.
- Phonics (letter sounds), simple words, opposites, telling the time with the in-game clock.
- Recorded or pre-generated natural audio for all lines. Parental play-time limit with a gentle "time to rest". Weekly progress report per child.
- Decorating the house and farm. Trading co-op tasks in online play (send a gift, build together).
- Native store apps with Capacitor (an iPhone app needs a Mac and an Apple developer account).
- A TURN server or a hosted backend for cloud sync and more reliable calls.

## 7. How I want the assistant to work

- Keep it fun, safe and suitable for ages 2 to 8, for girls and boys, in **English and Vietnamese**.
- Under-5 mode never punishes. Big kids can have real challenge.
- **Test in the browser** (desktop, tablet and phone sizes, 1 and 2 players, both languages) before saying something is done, and say plainly what wasn't tested.
- Keep the existing file structure and code style, and write all text as `T('English', 'Tiếng Việt')`.
- **Bump `VERSION` in `sw.js`** and add new files to its `FILES` list on every change.
- Commit and push to GitHub as you go (branch, then a pull request).
- Explain how to deploy and install updates on Android and iPhone in plain steps.
