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
| `vendor/anthropic-sdk.mjs` | Official Anthropic JS SDK bundled with esbuild (only loaded when AI chat is on) |

**Mini-game API:** `register({ id, icon, name, run(api) })`.
- `api` gives: `stage`, `level` (1–5), `players`, `two`, `little`, `strong`, `say(en, vi)`, `show`, `dots`, `right`, `wrong`, `praise`, `win({title})`, `onCleanup`, `closed`.
- A game is started with `G.playGame(playerIndex, id, source)`, where `source` is `'shrine'` | `'folk'` | `'place'` | `'replay'`.
- Effective level = the child's level for that game + difficulty offset (Easy +0, Medium +1, Hard +2), capped at 5.

**Save data (localStorage):**
- `sv2_settings`: `{lang, currency, sound, music, voice, voiceEn, voiceVi, bilingual, alwaysDay, quality, camMode, familyVoice, familyPitch, voiceRate, voicePitch, tts, ttsKey, elevenVoice, googleVoiceEn, googleVoiceVi, voiceControl, aiOn, aiKey, credits{creator, forWhom, why}}`. API keys stay on the device.
- `sv2_profiles`: `[{id, name, photo, age, difficulty, look{style,color,hat,back,hair,hairStyle,skin,glider}, hearts, staminaMax, orbs, leafies{}, shrines{}, towers{}, discovered{}, inv{}, dishes{}, stickers[], levels{}, wins{}, quests{}, story{}, glider, album[], pos}]`
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
- More Vietnamese and Australian content: Tết festival event (bánh chưng, lì xì in VND), Trung Thu lantern parade, Australia Day sausage sizzle, đàn bầu mini-instrument, a ride on a scooter, Vietnamese coffee stall.
- Restyle Lotus Village houses with the Two Homes Street builders; real videos in `videos/`.
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
