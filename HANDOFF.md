# Sparkle Valley · Thung Lũng Lấp Lánh — Project Brief & Handoff

Attach this file at the start of a new chat so the assistant has the full context.
Code: **https://github.com/nguyentuanphu/Sparkle-Valley** (work happens on branch `claude/sparkle-valley-v2`, merged into `main` by pull request).

---

## 0. START HERE (for the next assistant)

**Ground rules. The owner set these; follow them every time:**
1. **Do not change, remove or restyle any existing feature or any part of the UI unless the owner asks for that specific change.** This includes the layout, colours, fonts, icons, button order, menu tabs, Grown-ups sections, texts and game rules. New work is added *alongside* what exists.
2. **Never `git push`, and never open or update a pull request, until the owner has checked the work and clearly said to push.** Commit locally, report what changed and how it was tested, give the Netlify zip, then wait. One "push" covers one push.
3. **Run the regression suite before and after every change** (see "Testing" below). All 9 checks must pass.
   - The `contract` check fails if the UI's structure changed. Only run `--update-contract` when the owner asked for that UI change, and say so.
4. Every text is bilingual: `T('English', 'Tiếng Việt')`. Spoken lines use `say(en, vi)`.
5. On every change, **bump `VERSION` in `sw.js`** and add new files to `FILES`, or phones keep the old version.
6. Never put API keys or personal data in the code or the repo. Keys live only in the grown-up's settings on their device.
7. Test at phone (320–390 px), tablet and desktop sizes, with 1 and 2 players, in both languages, and say plainly what could not be tested.

**Run the game:** `python3 -m http.server 8765` in the repo, then open http://localhost:8765. `window.__sv` is the game object.

**Testing:** `cd tests && npm install && node run.mjs` (Chromium; in the cloud sandbox it uses `/opt/pw-browsers/chromium`, elsewhere set `CHROMIUM=` to a Chrome path).
| Check | What it proves |
|---|---|
| `boot` | The game starts with no errors at phone, tablet and desktop sizes |
| `spill` | No HUD button, Sparkle Pad tab or Games hub card text runs off screen or out of its box, at 320/375/1024 px in English and Vietnamese |
| `language` | Vietnamese mode shows none of the common English labels (HUD, Games hub, tales shelf) |
| `two-players` | Split screen: 2 heroes, 2 HUDs, pets for both |
| `games` | Every mini-game (53) opens and closes with no errors |
| `features` | 7 cities, 26 kiosks, 7 city game hosts, ≥ 47 landmarks, house number 8, 32 tales (18 Vietnamese), walkable Dragon Bridge, pets adopt / pet yard / bring back, chat closes when you walk away, keyboard shortcuts, zoom, a tale from the Games hub flies to the storyteller, a game card flies to its host, folk-game friends chat |
| `camera` | At every landmark sign, facing 4 ways, the camera is not inside a building or blocked by one (186 of 188 clear this round; Harbour Bridge and Huế graze an edge from one side) |
| `contract` | HUD buttons, Sparkle Pad tabs and Games hub sections are unchanged (`tests/ui-contract.json`) |
| `multiplayer` | Two devices in one room through a local PeerJS server: they see each other, the friend chip shows the distance, "Ask to come" arrives, walking to the friend works, talk bubbles cross (skipped when no server runs, see `tests/README.md`) |

Screenshots of each run go to `tests/out/` (not committed).

**Deploy:** Netlify: run `./build-netlify.sh` (it zips `index.html sw.js manifest.webmanifest netlify.toml css js fonts icons vendor videos`, plus `voices/` when it exists) and drag the zip into Netlify. GitHub Pages also auto-deploys `main`. Phones pick up the new version after closing and reopening the app (because `VERSION` changed).

### Everything the game has now (keep all of it)
- **Players:** up to 6 children, each with a photo face on a 3D character, age mode (under 5 / 5–8), difficulty, outfits, hats, wings or cape and gliders. 1 player, 2 players on one screen (split), or online with friends.
- **World:**
  - Dawn Plateau, Sunny Farm, Lotus Village, rice fields, Mirror Lake, bamboo forest, snowy peaks.
  - Two Homes Street (Bà Rịa × Sydney, with Bạch Dinh, Nhà Tròn and house number 8), the Three Regions Market, Aussie Corner, China Town and India Village.
  - Seven cities, each a paved square with a golden gate, landmarks, a game host and two kiosks: Hà Nội, Bắc Ninh, Đà Nẵng, Hồ Chí Minh City, Sydney, Melbourne, Brisbane.
  - An asphalt main road and dirt roads between all of them, golden welcome gates, and Đà Nẵng's golden Dragon Bridge over the river.
  - 47 landmarks with postcards (10 older ones, 18 UNESCO sites, 19 city and Bà Rịa–Vũng Tàu landmarks), 12 shrines, 4 towers, 24 hidden Leafies and secrets.
- **Things to do:**
  - 53 mini-games (thinking, strategy, farm, Vietnamese, Australian, Chinese and Indian folk games, Music Corner, and 7 city games).
  - 32 fairy tales (18 from Vietnam) read aloud over animated pictures by Grandma Storyteller; 26 kiosks with local food and sayings.
  - Farm with crops, animals and Mr. Bear's shop; cooking (including 15 cultural dishes); gathering and treasures; market stalls and trading.
  - Story chapters, quests with a "Go" button, daily jobs, stickers, album, camera.
- **Culture:**
  - 8 groups of friends playing traditional games (ℹ️ to learn), crops from each culture, doors to knock on.
  - Passport with 5 stamps per country and a hat reward, festivals by date (Tết, Mid-Autumn, Diwali, Christmas, Australia Day), story time with 5 folk tales, counting hunts, Chinese and Hindi first words.
- **Pets:** up to 2 per child, named. They follow, sniff out Leafies and rescue the child in deep water (🆘 → kick).
- **Travel:** free ferry round Mirror Lake (4 piers), 2 river rafts, fly or walk-there (👣) from the map, riding the water buffalo, gliding.
- **Weather:** rain waters the farm, puddles to jump in, rainbows, blossoms and leaves by season; day and night.
- **Little joys:** tap anything for a reaction, confetti, sticker scrapbook, buildings framed by the camera and landmark fly-arounds.
- **For grown-ups (hold the button):**
  - Players, backup to iCloud/Drive (share sheet, `.txt`), language, currency, sound and music.
  - Voices: device, ElevenLabs, Microsoft Azure or Google, family recordings, and the offline voice pack.
  - Captions, text size (3 steps), calm mode, rain on/off, festival picker, rest timer, camera mode, graphics, credits page, renaming characters, coins.
  - Online play: friend codes, relay setting, connection test, removing a player.
  - Voice control and the optional AI villager chat.

### The UI (keep it as it is)
- **Title screen:** the name on a cream storybook card, a green "Tap to start" button, a round ⓘ About button (top left), the "add to home screen" chip (top right), and one card at the bottom with English / Tiếng Việt and the small 🌏 中文 / हिन्दी learning buttons.
- **Who's playing:** one cream card with the three modes as tiles (alone / two here / friend far away), player faces and a green Let's go; Grown-ups hold button at the bottom left.
- **HUD (per player):**
  - Top left: player card (photo, name, hearts) and coins/orbs/leafies chips.
  - Top middle: the quest bar with a green "▶ Go".
  - Top right: round minimap with N, and a clock.
  - Right edge: big zoom ＋/－.
  - Bottom: the dock (Games, Map, Bag, Ask, Talk, Call, Music, Sound) with Sparkle Valley SVG picture icons.
  - Bottom right: Run and Jump (Run sits above Jump on narrow phones). The action button is bottom centre, big and glowing.
  - On computers, small key badges show the shortcuts (G games, M map, B bag, K ask, T talk, C call, N music, O sound, F go, P friends, +/− zoom, E action, 1–8 menu tabs, Esc close).
  - Under the minimap: a blue chip with the nearest online friend's name, distance and direction.
  - The stamina wheel by the hero, and a big pulsing prompt for rescues.
- **Sparkle Pad tabs in order:** Map, Backpack, Adventures, Album, Passport, Games, Camera, Friend. The Pad keeps one height on every tab.
- **Style:** bright summer-afternoon toon look, soft outlines, Fredoka (English) and Baloo 2 (Vietnamese), rounded cards, big tap targets (≥ 44–56 px), cream and pastel panels, and confetti and stars for rewards.

### Not done yet / open items
- **The real ElevenLabs voice pack:** the tools are ready and now make the cast the owner chose (English and Vietnamese: a woman and a man; Chinese and Hindi: a man). `node tools/make-voice-pack.mjs --count` shows the cost without a key: **218,880 characters = about 109,440 credits with Flash v2.5** (or 218,880 with Multilingual v2), 3,988 files, about 64 MB. It needs a machine that can reach api.elevenlabs.io. The key the owner pasted in an earlier chat must be replaced after use.
- **House number 8:** built as a typical two-storey Bà Rịa family house with a balcony, a roll-up shutter, a low front wall and a blue number plate showing only "8". The assistant could not see the real house; a front photo from the owner would let it be matched (colours, roof, gate, balcony). The street name must never appear in the game or the repo.
- From the kids' UI checklist: a dark / high-contrast colour mode, and a simpler menu for under-5s. Both are optional and only if the owner asks.
- Needs real-device testing: iPhone/Android share sheet for backups, ElevenLabs/Azure/Google voices with real keys, online play across different networks (relay), and performance on older tablets.

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

### Round 3 (feedback: hard to find things, camera, recording, UI)
- **Recording fixed:**
  - Recording is now done in `js/recorder.js`, which captures raw sound and saves a small WAV file, so it works on iPhone, Android and computers.
  - Clips are stored as ArrayBuffers (safer on older Safari) and played through Web Audio.
  - The screen goes one line at a time, with a big mic button and a level meter. It stops by itself after a short pause.
  - Clear Vietnamese and English messages explain when the page isn't https, when permission is blocked, or when no microphone is found.
  - **The microphone only works from an https address** (Netlify or GitHub Pages), not from a file opened directly from a folder.
- **Easy camera** (default):
  - A fixed, high view that never spins, and the joystick moves up, down, left and right on screen.
  - ＋/－ zoom buttons, and the mouse wheel zooms too.
  - "Explorer" (drag to look around) can still be chosen in Grown-ups → Camera.
- **Finding things:**
  - The quest box at the top has a picture, can be tapped to hear the goal again, and has a green **"▶ Go"** button. Go walks to the goal (or flies there when far away) and starts it on arrival.
  - A golden light beam with a bouncing ❗ marks the goal, and each player has a glowing arrow and a sparkle trail on the ground.
  - The game starts right next to Ông Cú, who talks automatically.
  - Every activity has a floating picture bubble **with its name**, and big area signs (Làng Sen, Nông Trại…) are visible from far away.
  - The map and minimap show every place from the start (no fog), and you can tap any picture on the map to fly there.
- **🎮 Games hub:** a big pink button on screen opens all games as picture cards grouped by place. Tap a card to play now, or tap 📍 to walk there.
- **Tap to do:**
  - Tapping a bubble, a 💧 water drop, a ripe crop or a field plot walks there and does it.
  - Tapping a water drop near the field waters the plant straight away.
- **New look:**
  - A bright toy-box UI: frosted white cards, gradient buttons, and a bottom dock (🎮 Games, 🗺️ Map, 🎒 Bag, 💬 Talk, 🎵, 🔊).
  - A player card with photo and hearts, and coin pills.
  - Games use sky or village backgrounds.
- **More fun in games:** Ông Cú sits in the corner and jumps or cheers. Every right answer sends a ⭐ flying to a star counter, with sparks.
- **More real:** the ground has a fine grass and soil texture.

### Round 4 (secrets, credits, folk games, voices, chat, "summer afternoon" look, Two Homes Street)
- **New look, inspired by summer-afternoon.vlucendo.com** (from the parent's screenshots):
  - Flat, painterly colours with two-tone light and shade (`MeshToonMaterial` with a 4-band gradient, no tone mapping) and faceted low-poly trees, rocks and houses.
  - Deep blue sky, big cream painted clouds, teal trees, beige boulders, sandy patches and footpaths.
  - A lower, over-the-shoulder easy camera so the horizon and sky show.
- **Two Homes Street / Phố Hai Quê** (`js/town.js`, around (12–52, 32–74), road at z = 47): a street where Bà Rịa meets a Sydney suburb.
  - Vietnamese tube houses (nhà ống) with balconies, roll-up shutters and stainless water tanks.
  - A yellow French-colonial villa with green shutters and arches.
  - An Australian weatherboard cottage with a front verandah, a red-brick house, and a house on stilts.
  - Road markings, a zebra crossing, power poles with sagging wires, street lamps, scooters, wheelie bins, a letterbox, a Hills hoist, jacaranda, gum, banana and frangipani trees, and lanterns.
  - **Cô Sáu's nước mía cart**: buy a glass for energy.
  - **Chú Tư and friends play cards** on the footpath; join them for **Snap!**.
  - **Teenagers kick a shuttlecock** (animated) in the park; join them for **Đá cầu**.
  - The park holds the folk-game kids; Ruby plays marbles on the front lawn of the Aussie house.
- **Secret side quests** (`js/secrets.js`, 10 secrets):
  - Shake apple trees and apples fall, sometimes a golden one.
  - Find the rooftop cat, the bamboo bell, a bottle on the beach and the snowman on the peak.
  - Feed the ducks, catch fireflies at night, make a wish at the statue at night, dance by moonlight and take a long glide.
  - Found secrets are in Album → 🤫; Ông Bầu gives hints.
- **Credits page** (`js/credits.js`): the title screen's ℹ️ About shows rolling credits with the creator's name, the dedication and why the game was made (read aloud). Grown-ups can edit the text.
- **Folk games of Australia and Vietnam** (`js/games/folk.js`), each simple enough for little ones:
  - What's the Time, Mr Wolf? (counting steps; big kids read the clock).
  - Đánh chuyền / Knucklebones.
  - Rồng rắn lên mây (learn the chant, then protect the tail).
  - Bắn bi / Marbles (slingshot physics).
  - Nhảy dây / Skipping (count the jumps).
  - Snap! (card matching).
  - Đá cầu (keep the shuttlecock up).
  - They appear first in the Games hub with flags.
- **📺 How to play** (`js/howto.js`): a narrated mini film for every game. Folk games also tell where the game comes from and how to play it for real with friends. Drop a real video at `videos/<game id>.mp4` and it plays instead.
- **Quests told as stories:** each new goal opens a story page told by a villager, with "▶ Let's go!" (`QUEST_TALES` in `story.js`). Tapping the quest box replays the story. There is a new quest and chapter for Two Homes Street.
- **Smoother voices** (`js/voice.js`):
  - Natural pitch, a speed setting, and long lines split at sentence ends.
  - Optional online natural voice with the parent's own **ElevenLabs** or **Google Cloud TTS** key; every line is cached on the device (IndexedDB `sparkle-valley-tts`).
  - "Make a voice from my family recordings" uses ElevenLabs voice cloning (uploads the recordings, after a confirm).
- **Voice control** (`js/listen.js`, `js/commands.js`): a 🎤 button where the browser supports speech recognition. Children can say "open the map", "chơi bắn bi", "go to the village", "talk to Jack" or "đi thôi"…
- **Villagers who chat** (`js/chat.js`):
  - "💬 Chat" on any villager's speech box opens a conversation with picture questions, 🎤 or typing.
  - The offline brain answers who they are, what to do, how to play, where things are, jokes, stories, simple sums and feelings.
  - With an Anthropic API key in Grown-ups, Claude (model `claude-opus-5-5`, low effort, server-side refusal fallback `fallbacks: "default"`) answers freely, in character and child-safe. The SDK is bundled in `vendor/anthropic-sdk.mjs` and loaded only when used.

### Round 5 (bugs from real iPhone play, both cultures everywhere, livelier games)
- **Bug fixes:**
  - The old river bridge ran into the brick house and had a dip over the water. Two Homes Street's road now crosses the river on a new **Sydney Harbour Bridge**-style steel arch (`BRIDGE` in `world.js`, at z = 47), with railings and level ground at both ends.
  - On iPhone the 3D view sometimes covered only part of the screen; the size is now re-checked on rotate, after the keyboard closes, and every 0.7 s.
  - Voice control could hang. Listening now always stops after 9 s, the bubble can be tapped to cancel, sound is woken up afterwards, and the 🎤 is hidden in iPhone Home-Screen apps (speech recognition isn't reliable there).
  - The microphone stayed on after recording (orange dot, quiet "phone call" sound). It is now released straight after each line.
  - The recording count showed 11/22 even when one language was finished. It now shows each language separately (🇻🇳 11/11 · 🇦🇺 0/11) and explains where the recordings are used.
- **⚙️ Tap your picture** (top-left) for quick settings: language, music, sounds, talking, voice control on/off, camera, always daytime, a voice style (Natural / Cute / Grandparent), and Change player.
- **Chợ Ba Miền / Three Regions Market** (east, `MARKET`): six vendors, each speaking with their own region's words:
  - **North (Bắc):** Bà Hai's phở, and Cô Thu with her shoulder pole of cốm.
  - **Centre (Trung):** O Lài's bánh bèo Huế, and Chú Năm's Hội An lanterns.
  - **South (Nam):** Chú Tám's bánh mì, and Cô Út's coconuts from Bà Rịa.
  - **Landmarks there:** Turtle Tower in a mini Hồ Gươm, the One Pillar Pagoda, Hội An's covered bridge, and the Bến Thành clock tower.
  - **Folk-game hosts:** Bông (Đập niêu), Bà Năm (Chi chi chành chành), Anh Hai (kite flying) and Cô Hạnh (Two Homes Words).
- **Góc Nước Úc / Aussie Corner** (west, `AUSSIE`):
  - Shops and stalls: a milk bar with lollies, fish & chips, a bakery with pies, the Big Banana, an ice-cream van that plays a jingle, and Uncle Robbo's sausage sizzle.
  - A playground with a flying fox, a merry-go-round and a see-saw, plus a cricket pitch, kangaroos and a koala in a gum tree.
  - Folk-game hosts: Noah (sack race), Chloe (pass the parcel) and Liam (backyard cricket).
- **Landmarks with 📮 postcards** (each one tells a short fact):
  - Australia: Sydney Opera House (lake beach), Harbour Bridge, Uluru (far south-west), the Big Banana, and a lifesavers' tower.
  - Vietnam: the Vũng Tàu lighthouse (its beam turns at night), Turtle Tower, One Pillar Pagoda, Hội An covered bridge, and the Bến Thành clock tower.
- **Regional words and slang** (`js/words.js`):
  - Every vendor can "teach me a word" (Bắc/Trung/Nam words, or Aussie slang) and sells a food that gives energy.
  - The album has new pages: Postcards (tap a missing one to fly there), Food passport and Words I learned.
  - Villager chat also teaches slang, and the AI prompt uses each vendor's regional way of speaking.
- **7 new games** (`js/games/folk2.js`): Đập niêu, Thả diều, Nhảy bao bố / Sack race, Backyard cricket, Pass the parcel, Chi chi chành chành, and Two Homes Words. All have How-to-play films.
- **Livelier games** (all games, via `frame.js`):
  - 3 right in a row gives a 🔥 combo with a bonus star, and sometimes a lucky ⭐ +3 appears.
  - At the end there is a 1–3 star rating (little ones always get 3) and a gift box that pops open with a surprise.
- **New quests with story pages:** taste food from all three regions; get a treat at Aussie Corner; collect 5 postcards.
- **Voices that sound more human, for free:**
  - On iPhone, download the English "Premium" voices (Settings → Accessibility → Spoken Content → Voices). Vietnamese only has "Linh".
  - Microsoft Edge on Windows and Android has free natural online voices (vi-VN HoaiMy/NamMinh).
  - Google Cloud TTS has a free monthly allowance (about 1 million characters for Neural voices) and works with the Grown-ups key option. Lines are cached, so each line is fetched once.
  - A ready-made voice file from the internet can't be turned into a speaking voice without a cloning service, and should only be used if it's licensed.

- **Names follow the chosen language** (`NAMES_EN` / `NAMES_VI` in `i18n.js`). `T()`, `say()`, dialogs, story pages, chat, name tags and 3D signs all swap titles: in English "Ông Cú" → "Grandpa Owl", "Bà Hai" → "Grandma Hai", "Cô Mai" → "Auntie Mai", "Chú Tư" → "Uncle Tư"; in Vietnamese "Mrs Kelly" → "Cô Kelly", "Aunty Bev" → "Dì Bev". First names stay. Signs and tags register with `onLang()` and redraw instantly when the language changes. New people: add their title to the two maps; new signs: pass `['English', 'Tiếng Việt']`.

### Round 6 (home screen + ads)
- **📲 Add to Home Screen** (`js/install.js`): a chip at the top right of the title screen and a button at the top of Grown-ups. Where the browser allows it (Chrome / Edge / Samsung Internet on Android, Chrome / Edge on desktop) one tap opens the real install prompt. On iPhone and iPad (Apple doesn't allow pages to install themselves) it opens a 3-step picture guide: Share → "Add to Home Screen" → Add. It hides itself once the game runs from the home screen.
- **Title language row no longer wraps:** the language buttons and ⓘ stay on one line; on narrow phones "About" shrinks to just the ⓘ icon.
- **Two Homes Words:** long answers ("Sunglasses") now wrap inside their buttons.
- **Ad videos** (`marketing/`): three vertical 1080×1920 videos (the story of why the game was made, key features, a 15-second teaser) with English and Vietnamese captions and an original jingle. `marketing/ADS.md` has post captions, hashtags and a voice-over script for Henry to record. The source (screenshots, HTML stage, music synth, render script) is in `marketing/source/`. The `marketing/` folder is not included in the Netlify zip.
- **UI direction:** Option A (soft storybook) was chosen (see Round 7). Still to do from the list: full language separation everywhere, Chinese + Indian villages and languages, dirt roads with cổng chào between villages, gathering fruit/flowers and breaking rocks for gems, a multiplayer market stall with friends and bigger rooms, the Easy-camera fix, adding coins in Grown-ups, more Vietnamese voices.

### Round 7 (new look, names, credits)
- **Option A storybook UI chosen.** Characters use **style C (picture-book)**: a bigger head, big clear eyes with a sparkle, brows, rosy cheeks, a soft brown outline (inverted hull, `outline()` in `gfx.js`), rounded shoes with soles and puffier sleeves. Eyes and mouth are painted straight onto the head (`drawFeatures`), so skin shading matches; photo faces still work. Outlines hide on characters more than 30 m from a player, to keep phones fast (`OUTLINED` in `avatar.js`).
- **Storybook houses** (`js/houses.js`): Bà Rịa tube houses with shops (Corner Shop / Tạp Hóa, Bánh Mì, Coffee / Cà Phê signs that follow the language), the Vũng Tàu French villa, the Sydney weatherboard cottage with a bullnose verandah, and nhà ba gian village houses in Lotus Village. The older brick and raised houses got the same outline.
- **Names:** titles follow the language and names stay as they are in each region ("Grandpa Cú", "Grandma Hai", "Cô Kelly"). **Grown-ups → Character names → Rename characters** lets parents rename anyone, separately in English and Vietnamese (`settings.npcNames`). Every character registers itself with `registerName()` so it shows up in that list.
- **Credits:** the assistant credit line was removed. A new block says Henry wants children in China and India (and everywhere) to learn about Vietnam and Australia, and the default "why" text says it too. Credit fields now save as you type.
- **Grown-ups:** the button at the bottom is now a floating "Save & close".
- **Ads re-rendered** with the new characters and houses; the "why" video has a new scene for kids in China and India.

### Round 8 (camera, voices, coins, language)
- **Easy camera:** it now turns slowly to look the way the child is walking (after a short pause, so small turns don't spin it), sits higher and a little further back, and never goes inside a building: if a house is between the child and the camera, the camera moves in front of it. The stick steers from the camera angle at the moment the child starts pushing, so the turning camera never bends their path into circles.
- **A voice for every character:** dialogs and chat call `setSpeaker(name)`. Titles decide the voice: grandparents speak slower and lower, kids higher, aunties and uncles get a woman's or a man's voice. Several device voices are shared out between characters (Android's Google TTS has 4 Vietnamese voices). With Google Cloud TTS, each character also gets a matching natural voice (vi-VN Neural2/Wavenet, en-AU), unless the grown-up picked one.
- **Grown-ups → Money:** buttons to top up the shared family coins (+$1, +$5, +$20, or the VND equivalent).
- **Language sweep:** an automated scan of every screen in both languages. The title now shows "Sparkle Valley · Two homes · one valley" in English and "Thung Lũng Lấp Lánh · Hai quê hương · một thung lũng" in Vietnamese, and close buttons are translated. What stays in Vietnamese in English mode is on purpose: people's and places' names, foods and folk-game names (with the English meaning beside them).
- **Not done (stopped by the assistant's safety system, not a code problem):** the parents' play-time report, and the dirt roads with welcome gates. Both were stopped while being written and the half-written files were removed. They can be tried again in a new session or built by hand.

### Round 9 (gathering)
- **Out in the wild** (`js/gather.js`): 16 fruit bushes (mulberries / dâu tằm, guava / ổi, wild strawberries / dâu rừng, wild lemon / chanh rừng), 18 flower patches (peach blossom / hoa đào, yellow apricot blossom / hoa mai, golden wattle / hoa keo vàng, hibiscus / hoa dâm bụt) and 14 rocks, placed with a fixed seed in the meadows, the bamboo forest and on the plateau. Pick fruit (2 at a time) and flowers; bushes and patches grow back after 2–2.5 minutes. **Tap a rock 3 times** to crack it open: inside is a pretty pebble, a fossil shell, a purple crystal, a gold nugget or (rarely) a blue gem. Rocks come back after 3 minutes.
- **Album → My treasures:** what each child has ever found (`profile.found`), with ❔ for the ones still to discover.
- **Selling:** Mr. Bear's "Sell my basket and treasures" now also buys wild finds from the backpack (pebble 50c … blue gem $10). Coins go to the family's shared coins.

### Round 10 (playing together: bigger rooms, friends, trading)
- **Rooms of up to 6** (`js/net.js`): the device that starts a room passes messages between everyone (star layout); guests also call each other, so everyone hears everyone. `Net.remotes` holds every friend in the room, and `G.partners` holds their avatars. Full rooms answer "full". Messages can go to one friend with `{ to: id }`.
- **Friends:** each device gets a random 6-character friend code (`settings.friendCode`). Grown-ups or kids can add friends by code, or tap ＋👫 next to someone they played with. If "Friends can invite me" is switched on (off by default), the game listens on that code while it is open, so a friend who has started a room can tap 📨 Invite and they get a "Join?" card. Only names, outfits and positions travel, device to device through PeerJS; no accounts.
- **Trading** (`js/trade.js`): the 🏪 "My market stall" at the Three Regions Market, or 🔄 Trade next to a friend in the online panel. Pick things from the backpack and/or coins to give and what you'd like back, then send the offer. The friend taps Deal! or No thanks. Both sides are checked again before anything changes hands.
- **Testing locally:** the public PeerJS server can be swapped for a local one with `window.SV_PEER = { host, port, path, secure }` (used by the automated 3-device test).

### Round 11 (China Town and India Village)
- **Two new villages in the north** (`js/asia.js`, sites `CHINA` and `INDIA` in `world.js`, flattened ground, on the map and in Travel):
  - **China Town (Làng Trung Hoa):** houses with green tiled roofs, a five-roof pagoda, a little Great Wall with a watchtower, lantern strings and a panda statue. Hosts: Miss Mei (First Words), Jun (Tangram), Grandma Lin (dragon dance).
  - **India Village (Làng Ấn Độ):** pastel flat-roofed houses with arched doors and marigold garlands, a little Taj Mahal with its pool, a big rangoli on the square and an elephant statue. Hosts: Priya (Snakes and Ladders), Grandma Asha (Rangoli), Arjun (First Words).
  - Tapping the pagoda, the Great Wall or the Taj Mahal tells a short true fact.
- **4 new thinking games** (`js/games/asia.js`, with How-to-play films and music):
  - **First Words:** hear a Chinese or Hindi word (20 each in `js/words2.js`: hello, thank you, family, food, animals, numbers), then tap its picture.
  - **Tangram Shapes:** which shape fills the gap? Big kids get turned shapes.
  - **Snakes and Ladders** (Moksha Patam): a 5×5 board with counting aloud. Little ones get no snakes and always get there first.
  - **Rangoli Patterns:** colour the right side to mirror the left.
- **Chinese and Hindi, quietly:** small 🌏 中文 / हिन्दी buttons under the language row on the title screen and in Grown-ups (`settings.learnLang`). They switch on "also learning" that language: First Words focuses on it, and the village friends say the word aloud. The device voice is used if it has zh-CN / hi-IN voices, or Google Cloud voices. The game's menus stay in English or Vietnamese: a full Chinese or Hindi translation of every screen is a separate, bigger job.
- **Still not done:** dirt roads with welcome gates between villages (this was stopped by the assistant's safety system twice in this session; please try it in a new session).

### Round 12 (landmarks, culture, everything tappable)
- **Fixes:** the Opera House was buried on the slope at the map edge, so it now stands on the lake beach. In English, names turn "Bé X" into "Little X", including the character picker and lists. Text no longer spills on small phones when switching language (tabs, friend panel, game headers, who-screen). The zoom ＋/－ buttons are big and always on the right edge.
- **New picture icons** (`js/icons.js`): chunky, rounded Sparkle Valley SVG icons in the game's colours replace the phone emoji on the HUD (games, map, bag, talk, call, music, sound, run, jump, zoom, settings).
- **18 more UNESCO World Heritage sites** (`js/heritage.js`), each with a model, a bobbing ℹ️ sign, a true fact in English and Vietnamese, and a postcard (coins and a sticker the first time):
  - **Vietnam:** Hạ Long Bay (islands in the lake), Huế Imperial City, Mỹ Sơn, Phong Nha caves, Tràng An.
  - **Australia:** Great Barrier Reef (coral in the lake), Three Sisters (Blue Mountains), Royal Exhibition Building, Kakadu rock art.
  - **China:** Forbidden City, Temple of Heaven, Terracotta Army, Potala Palace.
  - **India:** Qutub Minar, Red Fort, Konark Sun Temple, Hampi stone chariot, Mahabodhi Temple.
  - Sites find a clear, flat spot near their village by themselves, so moving things in `world.js` won't bury them.
- **Friends playing traditional games**, animated, each with an ℹ️ to learn about the game: jianzi and xiangqi (China), carrom and the kite festival (India), nhảy dây and cờ tướng under the tree (Vietnam), kick-to-kick footy and lawn bowls (Australia).
- **Crops from each culture:** two harvestable plants of each near its village. They go into the bag and the collection, and can be sold. Pickings regrow after a few minutes.
  - Vietnam: coconut, jackfruit, chilli, water spinach, sweet potato.
  - Australia: macadamia, quandong, finger lime, bush tomato.
  - China: longevity peach, mandarin, bok choy, snow peas.
  - India: mango, brinjal, ginger, marigold.
- **Every house has a door to knock on** (`world.houses`, filled by `town.js`, `world.js` and `asia.js`). The family says something about their kind of home (tube house, French villa, weatherboard cottage, nhà ba gian, Chinese courtyard, Indian home) and gives a small gift once a day.
- **Every character is tappable:** the other children wandering the farm now wave back and say hi. A test checks that no avatar in the world is without an interaction.
- **Still not done:** asphalt and dirt roads with golden welcome gates between villages. The assistant's safety system stopped this twice in that session, so please ask for it in a new session.

### Round 13 (pets, ferry, passport, festivals, weather and lots of little joys)
- **Pets** (`js/pets.js`):
  - Each child adopts up to **2 pets** and names them. Names can be typed, or tapped from a list of ideas for children who can't type yet.
  - Pets: puppy (free), kitty, bunny, panda cub, joey and buffalo calf.
  - Adopt them at Mr. Bear's shop or from Backpack → 🐾 My pets. 🏡 sends a pet to live on the farm to make room.
  - Older saves move over: each child starts with a puppy, and the first child keeps any pets bought before.
  - Pets follow their owner, can be patted, and sniff out hidden Leafies (👃 above them, with a bark).
  - **Water rescue:** if a child runs out of energy in deep water, a big 🆘 "Call <pet>!" button appears. The pet swims out, then the child taps "Kick! Kick!" to swim faster while the pet pulls them to shore.
    - The pet comes by itself after 9 seconds, and the tow never stops, so little ones always get saved.
    - The first rescue gives a "hero" reward. Without a pet, Ông Cú helps as before.
- **Free ferries** (`js/ferry.js`):
  - A blue ferry goes round Mirror Lake, stopping at four piers: North Beach, Sunny Farm, Two Homes Street and the Three Regions Market.
  - Two bamboo rafts cross the river.
  - At the end of a pier, tap "Ride the free ferry", or "Wait" and you board when it arrives. Tap "Get off" at a stop, or ask to get off at the next one.
  - Boats show on the minimap. The Hạ Long islands moved nearer the lake centre to keep the route clear.
- **Passport** (`js/passport.js`, new 🛂 tab in the Sparkle Pad):
  - One page per country with 5 stamps: visit the village, 2 postcards, play one of its games, harvest one of its crops, learn about one of its traditional games.
  - Tapping an empty stamp says how to get it.
  - A full page gives a hat: khăn rằn scarf (Vietnam), Akubra (Australia), silk cap (China), pagri (India). Earned hats appear in the Backpack.
- **Festivals** (`js/festivals.js`), by the device's date:
  - Which festivals: Tết / Lunar New Year, Mid-Autumn, Diwali, Christmas and Australia Day.
  - What changes: decorations round the villages and fireworks at night. A festival table gives a treat or lì xì and a sticker once a day, then offers a matching game.
  - Grown-ups can preview any festival or switch them off. Moon-festival dates are listed up to 2032.
- **Weather and seasons** (`js/weather.js`):
  - Gentle showers grey the sky, rain falls round each player, and the rain waters the farm.
  - Puddles appear; splash in them or jump in for a "Puddle jump!".
  - A rainbow appears afterwards, and the easy camera tilts up for a few seconds so it can be seen.
  - Blossoms drift in January–March and autumn leaves in September–November.
  - Grown-ups can switch rain off.
- **15 new dishes** from the four cultures' crops (rau muống xào, chè mít, banana macadamia bread, quandong pie, bok choy dumplings, aam panna, dal…), plus festival treats (mooncake, ladoo, lamington, sausage sizzle, Christmas cookie).
- **Little joys** (`js/fun.js`):
  - Tap anything for a reaction:
    - Villagers hop and wave, then the child walks over to talk.
    - Farm animals and pets make their sound.
    - Ducks and chickens scurry, butterflies flutter.
    - Trees and bushes wobble and drop leaves, sometimes a bird.
    - Tapping yourself makes your explorer cheer.
  - Confetti on every reward.
  - **Sticker scrapbook** (Album → 📒): 3 pages to decorate with stickers and photos. Drag, resize, turn or bin.
- **For under-5s:** conversations show big 🔁 (hear again) and 👍 (next) picture buttons.
- **Walk there:** on the map, a place can now be walked to as well as flown to, following a trail of 👣 footprints.
- **Learning** (`js/learn.js`, `js/games/music.js`):
  - **Story time** on a mat under the banyan tree in Lotus Village, with five narrated folk tales:
    - Bánh chưng bánh giầy and Sơn Tinh – Thủy Tinh (Vietnam)
    - Tiddalik the frog, credited to Aboriginal storytellers (Australia)
    - Chang'e and the moon (China)
    - The Monkey and the Crocodile from the Panchatantra (India)
  - **Counting hunts:** a 🔎 board in each village (5 lotus flowers, sleepy koalas, red lanterns, peacock feathers). Children count aloud, and also in Chinese or Hindi when that's switched on.
  - **Music Corner** (stall at the market, and in the Games hub): đàn bầu, didgeridoo, guzheng and tabla. Record a tune and play it back.
- **Grown-ups:**
  - Rain on/off, calm mode (quieter music, fewer moving effects), and big text and buttons.
  - Festival picker.
  - **Rest timer** (off/15/30/45/60 minutes a day): the explorer says goodnight on a moon screen, and a grown-up can hold a button for 10 more minutes.
  - Minutes are counted on this device only; nothing is sent anywhere.
- **Still not done:** asphalt and dirt roads, and golden welcome gates between villages. The assistant's safety system stopped this request in an earlier session, so please ask for it in a fresh session.

### Round 14 (seeing landmarks, connecting from far away)
- **Landmarks are easy to see** (`js/showcase.js`):
  - Near a landmark, the easy camera steps back and looks more level. When the child stands still, it turns gently so the landmark is in front.
  - Tapping a landmark's ℹ️ sign first flies the camera slowly round it. It picks the clearest direction (avoiding hills, houses and trees), shows the name, and has a Skip button. Then the fact is read.
  - Each landmark has a size in `SIZE` so the camera knows how far back to go.
- **Playing with friends far away** (`js/net.js`):
  - Why it got stuck: the devices only used STUN, which is enough on simple home Wi-Fi. A friend on mobile data or a strict router needs a relay (TURN), otherwise the link never opens and "Connecting…" never ends.
  - The game now tries free public relays automatically. Grown-ups → Online play has a field for your own relay: either a credentials link (e.g. a free metered.ca account's "turn credentials" URL) or a `turn:` address with a name and password. Both devices need the same relay.
  - Joining never waits forever: after 12 s it says it is still trying, and after 30 s (or as soon as the link fails) it stops with tips.
  - A **🔍 Test the connection** button reports whether this device can reach the play service and whether a relay works.
  - Tested: 3 devices connect through a local server with voice. A real far-away connection can't be tested on the build machine (no internet), so please try it on two phones on different networks.

### Round 15 (camera inside buildings; kids' UI checklist)
- **Bug: the camera could end up inside a building** (a screen full of dark walls). Cause: the camera only avoided a few box-shaped houses, and some older landmarks (Opera House, Uluru) had no walls, with their postcard spot in the middle of the building.
  - **Fix: real camera collision.** The camera checks every solid building, landmark and boat between itself and the child (both sides of each surface), and moves in front of it.
  - The Opera House and lifesavers' tower are now solid. Older landmarks' postcard spots moved outside onto open ground, and Uluru uses its true centre. The Phong Nha cave sign moved out of the cave dome.
  - Test: the child at all 28 landmark signs and 21 house doors, facing 4 ways each. 194 of 196 views are clear; in the other 2 the camera only grazes a surface.
- **Kids' UI checklist (gaps closed):**
  - **Captions** (on by default): every spoken line also shows as text at the bottom, even with the voice off.
  - **Text size** in three steps (Normal, Big, Bigger).
  - The room's starter can **remove a player** (🚪) from an online room.

### Round 16 (Azure voices; backups that really reach iCloud / Drive)
- **Microsoft Azure voices** (Grown-ups → More natural voice → Voice engine: Microsoft Azure):
  - Set up: paste Key 1 and the Location (region) of a Speech service resource. The free F0 tier gives 500,000 characters a month.
  - Characters get their own voices: Hoài My or Nam Minh in Vietnamese, six women's and six men's Australian voices, Carly or Ken for kids, Xiaoxiao for Chinese and Swara for Hindi. Grandparents speak slower and lower, kids higher.
  - Grown-ups can choose the main voices themselves.
  - Like ElevenLabs and Google, each line is fetched once and then kept on the device.
  - Step-by-step help for ElevenLabs and Azure is shown under the key field.
- **Backup to iCloud / Google Drive fixed:**
  - Why it failed: phones only allow some file types in the share sheet, and `.json` is not one of them, so the game silently fell back to a download.
  - Fix: the backup is now a plain `.txt` file, so "Save to Files → iCloud Drive" and "Drive" appear. Open backup accepts `.txt` and older `.json` files.

### Round 17 (offline voice pack from ElevenLabs)
- **The game can play every line from recorded files (`voices/`) instead of the device voice, with no internet.**
  - `tools/voice-lines.mjs` finds every spoken line: 612 lines in English and Tiếng Việt, about 66,000 characters, plus the 40 Chinese and Hindi learning words.
  - `tools/make-voice-pack.mjs` records them with ElevenLabs.
  - Lines with a child's name or other changing words can't be recorded in advance; the device voice says those.
- **Characters:** grandparents play a little slower and deeper, children a little higher, and men use the man's voice when the pack has one (`--cast`).
- **Offline:**
  - Played lines are kept automatically.
  - Grown-ups → 🎙️ Offline voice pack → "Keep all voices on this device" downloads the whole pack (about 5–20 MB) so every line works offline.
  - The pack lives in its own cache, so game updates don't delete it.
- **How to make the pack** (on any computer with Node.js 18+, in the game folder):
  1. `node tools/make-voice-pack.mjs --key YOUR_ELEVENLABS_KEY --dry`: shows how many characters it needs and how many your plan has left.
  2. `node tools/make-voice-pack.mjs --key YOUR_ELEVENLABS_KEY`: makes the files in `voices/`. It stops if there aren't enough characters left. Re-running only makes missing files, and `--limit 300` makes part of it now.
  3. Options: `--voice-f <voice id>` / `--voice-m <voice id>` to choose voices, and `--cast` to add a man's voice (doubles the cost).
  4. Publish: include the `voices/` folder in the Netlify upload.
  - The key is used only while the tool runs and is never written into the game.
- **Not done yet:** the real pack. The build machine's network is not allowed to reach api.elevenlabs.io. The whole pipeline was tested end-to-end against a pretend ElevenLabs server (1,261 files made and played in the game; the test files were then deleted).

### Round 18 (cities, roads, fairy tales, friends online, easier controls)
- **Easier to see and reach:**
  - The action button sits bottom centre above the dock, bigger and glowing, with an `E` key badge on computers.
  - 🎤 Ask is always shown (switch it off in quick settings). Where the device cannot listen (iPhone Home-Screen apps, Firefox) it offers picture questions instead (map, games, bag, let's go, what to do, find my friend, go home). On narrow phones Run sits above Jump so Ask is never hidden under them.
  - Keyboard shortcuts on computers, shown as small badges on each button, and 1–8 / ← → / Esc in the Sparkle Pad.
  - The Sparkle Pad keeps the same height on every tab (it used to jump up and down).
  - Zoom: buttons react on finger-down (they work while the other finger is on the joystick), the range is wider, zooming out lifts the camera above rooftops (before, walls pulled it back in so zoom seemed to do nothing), a toast says when the limit is reached, and the mouse wheel zooms the screen under the pointer.
  - A conversation box closes by itself when the child walks about 9 m away.
  - Calmer camera near houses and trees: it comes in quickly when something is in the way but drifts back out slowly after a pause, rises over obstacles instead of squeezing in, ignores small things like trees and gates, and only swings behind the child after they have walked the same way for a moment.
  - Games hub flags are drawn by the game (China and India showed "undefined"; Windows showed "AU").
- **Pets:** pets sent "to the farm" were being deleted, and older saves could lose pets. Now there is a **pet yard** on the farm where they live and play; tap 🐾 to bring one back. Pets are shown bigger (kitty and bunny were easy to lose in the grass).
- **Friends online:** a blue chip under the minimap shows the nearest friend's name, distance and an arrow; friends are on the minimap edge and on the big map with names. Tap the chip (or a friend on the map, or the online panel) to 👣 walk there along footprints that follow them, ✨ fly there, or 📣 ask them to come (they get a "Walk / Fly / Not now" card). Arriving opens the talk bubbles. Tested with two browsers through a local PeerJS server.
- **Roads:** an asphalt main road with a dashed centre line (`ROADS` in `world.js`, drawn by `js/roads.js`), dirt roads to the quieter places, golden welcome gates (cổng chào) at every village and city, and Đà Nẵng's golden **Dragon Bridge** carrying the road over the river (it puffs fire now and then). Trees keep off the roads; roads are on the maps.
- **Cities** (`CITIES` in `world.js`, `js/cities.js`): Hà Nội (Temple of Literature, water puppet theatre; game Water Puppets), **Bắc Ninh** (the clock tower on its roundabout, Chùa Dâu, Bút Tháp, Đền Đô, Quan họ singers on a boat who sing as you pass; game Đông Hồ Paintings), Đà Nẵng (Golden Bridge with the stone hands, Dragon Bridge; game Dragon Bridge Count), Hồ Chí Minh City (Notre-Dame Cathedral, Central Post Office; game Scooter Traffic Lights), Sydney (Sydney Tower Eye, Luna Park; game Harbour Ferries), Melbourne (Flinders Street Station, a W-class tram; game Tram Stops), Brisbane (Wheel of Brisbane that turns, Lone Pine koalas; game Koala Breakfast). Each has a golden gate, postcards, a host and two kiosks. The 7 games are in `js/games/cities.js`, with How-to-play films.
- **Kiosks** in every city and older village (26): each sells a local food (food passport) and teaches a saying: ca dao and tục ngữ (Ăn quả nhớ kẻ trồng cây, Uống nước nhớ nguồn…), regional words (mô tê răng rứa, dzui quá trời), Aussie sayings (No worries, She'll be right, Hooroo), Chinese and Hindi proverbs (spoken in those languages).
- **Two Homes Street:** Bạch Dinh (the White Villa of Vũng Tàu, 1898) and Nhà Tròn (Bà Rịa's round water tower on eight legs, early 1900s), both with postcards; and **house number 8**, a Bà Rịa family home where only the number shows (knock on the door for a warm welcome).
- **Folk-game friends play and chat together** (`js/chatter.js`): groups take turns saying lines about their game in bubbles (in the chosen language) and turn to each other; the playground and village kids cheer, wave and clap; single hosts call out to children passing by.
- **Go straight to the person:** tapping a game card in the Games hub flies the child to the friend who runs it and starts the game; flying to a place from the map lands next to that place's villager.
- **Fairy tales** (`js/talesdata.js`, `js/tales.js`): 32 tales, 18 from Vietnam (Con Rồng cháu Tiên, Thánh Gióng, Sự tích Hồ Gươm, Cây tre trăm đốt, Sự tích dưa hấu, Cây khế, Tấm Cám, Sọ Dừa, Thạch Sanh, Chú Cuội, Cóc kiện trời, Sự tích cây vú sữa, Ba lưỡi rìu, Chuyện quả bầu, Thầy bói xem voi, Đeo nhạc cho mèo, plus Bánh chưng and Sơn Tinh), 4 from Australia, 5 from China, 5 from India, gently retold. The **tale theatre** reads each page aloud in the chosen language over an animated picture (actors fly, hop, swim, sway; rain, stars and sparkles; a painted stage chosen from the words), with ◀ ▶, 🔊, ⏯ read-by-itself, swipe and arrow keys. **Grandma Storyteller** sits at the story mat in Lotus Village; tales are on her shelf and in a new "Fairy tales" shelf in the Games hub, which flies you to her.
- **Voice pack** (`tools/make-voice-pack.mjs`): English and Vietnamese with a woman's and a man's voice, Chinese and Hindi with a man's voice (`--voice-en-f` … `--voice-hi-m` to choose, otherwise picked from the account's library by language and gender). `--count` shows the cost without a key. After the first visit the game keeps the whole pack on the device by itself (in the voice cache that updates never delete), so it is never downloaded again. `./build-netlify.sh` includes `voices/`.
- **Tests:** `tests/run.mjs` (see the table in section 0) and `tests/harness.mjs`; the old suite was not in the repo, so this one replaces it. `tests/ui-contract.json` was recorded fresh this round.

### Round 19 (title and player screens, About, Grown-ups in settings, the whistling kite)
- **Title screen redesigned** in the storybook style of the rest of the game: the name sits on a cream card with little floating friends (kite, lantern, blossom, star, kangaroo, lotus), the subtitle is a purple pill, a big green "▶ Tap to start" button, and the language choices (now with drawn flags) and the 中文 / हिन्दी learning buttons together on one card at the bottom. **About is now just a round ⓘ button** at the top left; "Add to Home Screen" stays top right.
- **Who's playing redesigned:** everything on one cream card like the Sparkle Pad: the three ways to play as matching tiles, the players' faces, and a green "Let's go!" that is grey until a player is picked. Grown-ups (press and hold) stays at the bottom left.
- **Grown-ups settings inside the game:** the ⚙️ quick settings (tap your picture) now has a "Grown-ups settings" button (press and hold) that opens the full Grown-ups page.
- **The whistling kite (diều sáo)** (`js/kite.js`): winning Kite Flying for the first time gives a red-and-yellow kite with a bamboo flute. It flies on a string in front of and above the child wherever they go, its tail wiggles, and the flute hums softly in the wind now and then (more often when running; quieter in calm mode; silent when sounds are off). Backpack → 🪁 Whistling kite: switch it on or off, or tap 🎶 Whistle!
- Tests: the harness force-clicks the pulsing start button.

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
| `js/voice.js` | `say(en, vi)`, best-voice choice per language, family recordings (IndexedDB, played via Web Audio), pitch estimate |
| `js/recorder.js` | Microphone → WAV recorder that works on iOS and Android, with auto-stop after silence and clear error codes |
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
| `js/games/folk.js` | mrwolf, chuyen, dragon, marbles, skipping, snap, dacau (folk games of Australia and Vietnam) |
| `js/regions.js`, `js/words.js` | Chợ Ba Miền, Aussie Corner, landmarks and postcards, vendors (`VENDORS`, `LANDMARKS`), slang and regional words |
| `js/games/folk2.js` | datnieu, kite, sackrace, cricket, parcel, chichi, words |
| `js/town.js` | Two Homes Street: house builders (`tubeHouse`, `frenchVilla`, `weatherboard`, `brickHouse`, `raisedHouse`), road, wires, props, townsfolk |
| `js/secrets.js` | Secret side quests and falling apples |
| `js/credits.js` | Credits page and its Grown-ups fields |
| `js/howto.js` | How-to-play films (`HOWTO`, `openHowTo`) |
| `js/chat.js` | Villager personas, offline conversation brain, optional Claude chat, chat window |
| `js/listen.js`, `js/commands.js` | Speech recognition and voice commands |
| `js/extras.js` | Grown-ups settings for natural voice, voice control and AI chat |
| `js/heritage.js` | 18 UNESCO sites (models, ℹ️ signs, facts), culture groups playing traditional games, crops from each culture, door knocking |
| `js/houses.js`, `js/asia.js`, `js/words2.js`, `js/games/asia.js` | Storybook houses; China Town and India Village; Chinese and Hindi words; First Words, Tangram, Snakes and Ladders, Rangoli |
| `js/gather.js`, `js/trade.js`, `js/install.js`, `js/icons.js` | Wild gathering and treasures; market stall trading; "add to home screen"; the HUD's SVG picture icons |
| `js/pets.js` | Pets per child (max 2, named), following, sniffing, patting, adopting, water rescue |
| `js/ferry.js` | Lake ferry and river rafts, piers (walkable), boarding and getting off |
| `js/passport.js` | Passport stamps per country, hat rewards, Passport tab |
| `js/festivals.js` | Festival dates, decorations, fireworks, festival table and treats |
| `js/weather.js` | Rain, overcast sky, puddles, rainbow, seasonal petals and leaves |
| `js/fun.js` | Tap-anything reactions, confetti, sticker scrapbook |
| `js/learn.js`, `js/games/music.js` | Story time folk tales, counting hunts, Music Corner stall and game, rest timer |
| `js/showcase.js` | Landmark camera framing and fly-around (`SIZE` per landmark) |
| `js/packhash.js`, `tools/voice-lines.mjs`, `tools/make-voice-pack.mjs` | Offline voice pack: line names, list of every spoken line, ElevenLabs pack maker |
| `tests/run.mjs`, `tests/ui-contract.json` | The regression suite and the recorded UI structure |
| `js/roads.js` | Road ribbons, golden welcome gates (`goldenGate`), the Dragon Bridge |
| `js/cities.js`, `js/games/cities.js` | The seven cities (landmarks, hosts, kiosks), Bạch Dinh, Nhà Tròn, house number 8; the seven city games |
| `js/kite.js` | The whistling kite accessory and its flute sound |
| `js/chatter.js` | Speech bubbles for friends who play and talk together, and hosts calling out |
| `js/tales.js`, `js/talesdata.js` | The tale theatre and the new fairy tales (Story time in `js/learn.js` lists them all) |
| `tests/harness.mjs`, `tests/README.md` | Opening the game in Chromium for the checks; how to run them (and the local PeerJS server for multiplayer) |
| `vendor/anthropic-sdk.mjs` | Official Anthropic JS SDK bundled with esbuild (only loaded when AI chat is on) |

**Mini-game API:** `register({ id, icon, name, run(api) })`.
- `api` gives: `stage`, `level` (1–5), `players`, `two`, `little`, `strong`, `say(en, vi)`, `show`, `dots`, `right`, `wrong`, `praise`, `win({title})`, `onCleanup`, `closed`.
- A game is started with `G.playGame(playerIndex, id, source)`, where `source` is `'shrine'` | `'folk'` | `'place'` | `'replay'`.
- Effective level = the child's level for that game + difficulty offset (Easy +0, Medium +1, Hard +2), capped at 5.

**Save data (localStorage):**
- `sv2_settings`: `{lang, currency, sound, music, voice, voiceEn, voiceVi, bilingual, alwaysDay, quality, camMode, familyVoice, familyPitch, voiceRate, voicePitch, tts, ttsKey, elevenVoice, googleVoiceEn, googleVoiceVi, voiceControl, aiOn, aiKey, credits{creator, forWhom, why}}`. API keys stay on the device.
- `sv2_profiles`: `[{id, name, photo, age, difficulty, look{style,color,hat,back,hair,hairStyle,skin,glider}, hearts, staminaMax, orbs, leafies{}, shrines{}, towers{}, discovered{}, inv{}, dishes{}, stickers[], levels{}, wins{}, quests{}, story{}, glider, album[], pos}]`
- Newer settings: `textSize` (0–2), `captions`, `calm`, `noRain`, `festival`, `restMins`, `playDay`, `playMins`, `lastBackup`, `turnUrl`, `turnUser`, `turnPass`, `azureRegion`, `azureVoiceEn`, `azureVoiceVi`, `learnLang`, `npcNames`, `friendCode`, `friends`, `friendsOn`.
- Newer profile fields: `pets[{kind,name}]`, `postcards{}`, `stamps{}`, `visited{}`, `learned{}`, `found{}`, `tasted{}`, `tales{}`, `hunts{}`, `festivals{}`, `scrapbook[[...],[...],[...]]`, `words{}`, `secrets{}`.
- `sv2_farm` (shared): `{coins, plots[9], seeds{}, basket{}, animals[], hay, products{}, pets[], jobs{day,list}}`
- IndexedDB `sparkle-valley-voice` / store `clips`: key `"en:great"` → `{data: ArrayBuffer (WAV), type}`.

**World map** (x to the east, z to the south; the world is 400 × 400):
- Dawn Plateau (0,0), with the start and the owl.
- Sunny Farm (−26, 126), south of the plateau ramp.
- Lotus Village (110, 30), east across the river bridge.
- Rice fields (112, −38).
- Two Homes Street (12–52, 32–74), with the park at (28, 62) and the Harbour-style bridge at z = 47 (x 44–74).
- Chợ Ba Miền (96–146, 70–96), Aussie Corner (−144 to −90, −40 to 16), Uluru (−128, 152), Opera House (24, 168), Vũng Tàu lighthouse (−10, 160).
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

- Round 3 additions (headless Chromium):
  - Ông Cú greets automatically, "Go" walks to the goal, the Games hub plays a game, and tapping the 💧 waters a plant.
  - Recording with a fake microphone saves a clip.
  - Phone portrait split screen has no overlapping HUD.

- Round 4 additions (headless Chromium):
  - Secrets: apples fall from shaken trees.
  - The credits page opens and closes.
  - All folk games open. Mr Wolf was played to the end; marbles was won.
  - How-to films play.
  - Quest story pages show, and "Let's go" works.
  - Offline villager chat answers correctly.
  - Voice commands parse to the right actions.
  - The sugarcane juice gives energy.
  - The Grown-ups extras panel works.
  - The street renders at desktop and phone sizes.
  - The earlier regression scripts still pass.

**Not yet tested:**
- ElevenLabs/Google voices, voice cloning and Claude chat (they need real keys and internet; the test machine has neither).
- Speech recognition with a real microphone.
- Real iPhone and Android devices: touch feel, performance, voices, home-screen install, and **real microphone recording on iPhone and Android**.
- **Online play between two devices:** the test machine could not reach the PeerJS server.

## 5. Known limits and decisions

- **Natural voices, voice cloning and AI chat are optional and online.** They use the parent's own ElevenLabs, Google or Anthropic keys and cost money per use. Everything works offline without them (device voice and the built-in chat answers).
  - Keys are kept in localStorage on that device only. The browser calls the services directly (there is no server).
- **Voice control** relies on the browser's speech recognition (Safari on iPhone/iPad, Chrome on Android). It usually needs the internet.
- **Online play needs the internet** and uses the free public PeerJS server (`0.peerjs.com`) to introduce the devices; voice then goes directly between them.
  - Devices on different networks may need a relay (TURN). Free public relays are tried automatically, and a grown-up can add their own in Grown-ups → Online play.
  - Microphone permission is only asked when starting a call or recording.
- **Realism vs. performance:** shadows, antialiasing and grass density follow the **Graphics** setting (Fast / Auto / Pretty). Auto picks Fast on phones and 4-core devices. If the tablet is slow, choose Fast.
- The photo face is drawn onto the front of a 3D head; it looks best with a straight-on close-up photo.
- three.js **r160** is used instead of r128 from the original brief. The earlier build's files were lost, so the file layout is new (see the table above).
- iOS home-screen apps keep their own storage, separate from Safari: use backup files to move progress.
- Leafy hiding spots, shrines and towers are fixed positions; new ones go in `world.js`.

## 6. Ideas for next steps (only when the owner asks)

- Already built from earlier idea lists: weather and rainbows, Tết / Mid-Autumn / Australia Day festivals, đàn bầu (Music Corner), a gentle rest time, cloud backup via iCloud/Drive, and a voice-pack pipeline.
- Still open: the real ElevenLabs pack (see section 0), a photo of house number 8, a dark / high-contrast mode, a simpler menu for under-5s, a bedtime routine, phonics and telling the time, decorating the house and farm, co-op tasks online, a hosted sync account, and native store apps (Capacitor).

## 7. How I want the assistant to work

- **Do not change, remove or restyle existing features or UI unless the owner asks for that change** (see section 0). Run `tests/run.mjs` before and after.
- Keep it fun, safe and suitable for ages 2 to 8, for girls and boys, in **English and Vietnamese**.
- Under-5 mode never punishes. Big kids can have real challenge.
- **Test in the browser** (desktop, tablet and phone sizes, 1 and 2 players, both languages) before saying something is done, and say plainly what wasn't tested.
- Keep the existing file structure and code style, and write all text as `T('English', 'Tiếng Việt')`.
- **Bump `VERSION` in `sw.js`** and add new files to its `FILES` list on every change.
- **HARD RULE: never `git push` (and never open or update a pull request) until the owner has checked the work and clearly confirmed.** Commit locally, show what changed and how it was tested, give the Netlify zip, then wait for a "yes, push". A confirmation covers that one push only.
- Explain how to deploy and install updates on Android and iPhone in plain steps.
