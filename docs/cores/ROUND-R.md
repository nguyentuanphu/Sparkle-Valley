# Round R plan (owner's decisions, 8 Oct AEST)

One big round, in two parts. Nothing is pushed until the owner says "yes, push", and Netlify needs its own "yes, deploy".

## Part 1 (first, about 3–4 days): festival calendar and Halloween
**Built (8 Oct, r48):** `js/lunar.js`, `js/content/festcal.js` (24 festivals in four groups), `js/festivals.js` (3D decorations that grow over 3 weeks, each festival in its own places, the day's timetable, the evening show on the real clock, Halloween trick-or-treat and the pumpkin-lantern keepsake), the calendar in the Pad, the Play hub, the Festivals screen and the Simple screen; Studio Ra mắt (Releases) and Festivals pages saving live to `/api/live` (`netlify/functions/live.mjs`); checks `festcal`, `studio`, unit tests.
Reported to the owner on its own, so Halloween can go live around 12–14 Oct.
- **Lịch lễ hội** (Festival calendar) in the Pad and on the Simple screen: the next festivals with a countdown, today's timetable, and a "come back at 18:30" reminder.
- **Dates work themselves out:** lunar dates use Hồ Ngọc Đức's Vietnamese calendar (UTC+7), plus Easter and "nth Sunday" rules, so there is no yearly table to update.
- **Build-up:** party festivals decorate for at least 3 weeks, more each week. Quiet days (Anzac Day, Vu Lan, Giỗ Tổ, Reconciliation Week) show only a few days before, with no fireworks.
- **Overlaps:** each festival decorates its own area, so two can run at once.
- **On the day:** 08:00 greeting and treat, 15:00 festival game, 18:30 lanterns, parade or fireworks (17:30 for under-5s).
- **Halloween:** cute only, nothing scary for under-5s. Pumpkins, costumes, trick-or-treat at houses, and a pumpkin-lantern keepsake.
- **Studio Ra mắt (Releases) page, first version:** switches on the website, start in N days, on for N days only, "New" badge for N days, and the "New!" moment (see `FEATURES.md`). Festivals are its first switches. Part 2 adds every other feature.
- **Studio Festivals page:** the year's calendar; switch any festival on or off, move a date, change the build-up length, preview the decorations.

## Part 2: the rest, in this order
1. **Faster launch:** the title screen shows early, the world builds in steps (target well under 15 s on a phone).
2. **New valley layout, Concept D** (owner, 8 Oct; drawings: https://claude.ai/artifact/JHJUUBRk3GSGSMBpYgD2C8). Built before the homes, so the guide and homes are built on the new map once.
   - **Two banks:** Vietnam on the east bank, Australia on the west, each north to south like the real country (Hà Nội, Bắc Ninh, Làng Sen, Đà Nẵng, Hội An, Chợ Ba Miền, TP. HCM; Brisbane, Aussie Corner, Sydney, Melbourne, Uluru). Home and Ông Cú on an island in the middle; Phố Hai Quê on the main bridge.
   - **Ring and colours:** a ring road around the home island; roads in each region's colour (red Vietnam, orange Australia, purple mountain road to China and India, blue coast road).
   - **Journey stops:** numbered first-week stops, one new place each day.
   - **More water:** the main river; Sông Hồng, Sông Hàn, the Hội An canal and Sông Sài Gòn (Vietnam side); the Brisbane River, the Yarra and the Murray (Australian side); the Mekong delta; lakes Hồ Gươm, Sydney Harbour, Hồ Gương, a billabong; a southern coast with Bondi beach.
   - **Every bridge landmark crosses real water** (owner, 8 Oct): Cầu Rồng over Sông Hàn, Chùa Cầu over the Hội An canal, Long Biên over Sông Hồng, the Harbour Bridge, the Story Bridge over the Brisbane River, Princes Bridge over the Yarra; two bridges join the home island to the banks.
   - **Boats connect and are checked:** the river raft runs the main river with a stop at every bridge; a Sydney Harbour ferry; a boat from TP. HCM down Sông Sài Gòn to Vũng Tàu; a coast boat past the Mekong delta. Every pier joins a road; a check rides every boat end to end and fails if a boat touches land or a stop has no road.
   - **Bà Rịa–Vũng Tàu** (owner, 8 Oct): a coastal village south-east of TP. HCM, by road and boat. Vũng Tàu Lighthouse on the hill, Bạch Dinh, Bãi Sau beach, fishing boats, bánh khọt stalls. The lighthouse and Bạch Dinh move here; Nhà Tròn stays on Phố Hai Quê. First-week stop 8.
   - **Mountains:** snowy northern peaks with the China and India towns, the Trường Sơn range with the Hải Vân pass, the Great Dividing Range with the outback beyond.
   - **Village pattern** everywhere: gate, market street with kiosks on one side, square with the host, stage at the end, houses on back lanes, nature and a footpath loop outside.
   - **Ground and water looks** (drawings on the concept page): Vietnam main road with yellow centre dashes, white motorbike edge lines, red lamp posts and bougainvillea; Australia main road darker with white dashes, concrete footpaths, zebra crossings, gum trees; Vietnamese village streets in red brick with lanterns, Australian towns in pale paving; dirt paths in red earth (đất đỏ) with wheel tracks, edging stones and flowers (orange near Uluru, bark chips in forests); paddy dikes; rivers with sandy banks, depth colour, moving ripples, reeds and water hyacinth, each river its real colour (Sông Hồng red-brown); a coast with a moving foam line and basket boats; no glare spots. Footsteps sound different on each surface. Water movement is one shared cheap effect; the draw-call budget stays the same.
   - **Animals that roam and can be ridden** (owner, 8 Oct): each country's animals live in their own landscape, follow a day (graze, drink, rest, sleep) and become friends after a few feeds; then the gentle ones can be ridden. Ride: trâu (already), Hmong horse, elephant (wades rivers), ox cart, kangaroo, emu, camel, brumby, sea turtle (swimming), Indian festival elephant, unicorn (secret), and the dragon companion when grown (flies). Not ridden but interactive: duck flocks, red-crowned crane, red-shanked douc, Hồ Gươm turtle, dolphins, koala (on your shoulder), wombat, platypus, kookaburra, cockatoo, panda, peacock. Never scary, never hurt, no dangerous wild animals near paths; a spoken fact each ride; friends see each other riding and can share a cart or elephant; only nearby animals move (phones stay fast).
   - **Art direction, "storybook toy world"** (drawings on the concept page; done place by place with the new map, speed check after each step):
     - Houses by place: nhà ba gian with curved tile roofs and a yard in villages; colourful nhà ống tube houses with balconies, awnings and wires in towns; yellow Hội An shophouses with lanterns; Queenslanders on stilts with verandahs; red-brick Sydney bungalows; Melbourne terraces with iron lace; China grey brick and moon gates; India colourful flat roofs and arches. Every building with a door can be entered; windows and lanterns glow at night.
     - Landmarks keep their real shape, a little shorter and rounder, with their famous features made bigger. Australian cities get shops, cafés, a Melbourne tram and a Brisbane CityCat in place of grey squares.
     - Characters: bigger round heads, real hair shapes, shiny eyes, eyebrows, blush, faces that show feelings and mouths that move when talking; softer bodies with bendy arms; clothes by job and place (nón lá, áo bà ba, áo dài, school uniforms, Akubra).
     - Animals: soft plush-toy style, big eyes with a shine, expressions (happy, sleepy, hungry), babies following mothers, small friends riding along.
     - Trees: clusters of soft clumps, lighter on top, gentle sway; species by region (cây đa, feathery bamboo, banana, coconut, phượng vĩ; gum, jacaranda, wattle; willow, plum blossom); flowering with the real season and festivals (hoa mai and hoa đào at Tết, jacaranda in Oct–Nov).
     - Phones stay fast: simple merged shapes, colours in the model, one draw per kind of tree or animal, simpler versions far away.
   - **More designs** (owner picked all four, 8 Oct; drawings on the concept page):
     - Name tags: only the nearest few (at most 4) show a small tag that fades with distance; a pink "!" marks who has something for you; ⓘ only when close; tags never overlap each other or a face.
     - Pad map: a drawn picture of the new valley, regions tinted, round picture badges with one name each (never overlapping), zoom for town names and shops; you, friends, today's festival, the next first-week stop, clouds over unvisited places.
     - New screens in one shared frame (big card, drawn title, ≥ 64 px targets for under-5s, round ✕, nothing that needs reading): shop and wardrobe, home upgrade, festival calendar, What's new card, mystery box, rankings, collectibles book, treasure map.
     - Vehicles in toy style with rolling wheels and helmets: family motorbike, xích lô, bus, little car, Melbourne tram; bamboo raft, ferry, thúng chai. They keep to roads, go slowly and stop for children.
     - Street things: xe đẩy and gánh stalls, striped kiosks, lantern lamps (VN) and street lamps (AU), picture signposts, benches, bins, red letterbox. Power poles and wires are switched off (Studio switch, done).
     - Sky by real time (dawn, day, sunset, starry night with the real moon phase), gentle rain then a rainbow, no glare; grass with wildflowers instead of bare sand, round rocks, snowy peaks, beaches; small life (butterflies, dragonflies, frogs, jumping fish, birds).
     - Companion: Lấp Lánh the glowing firefly; the baby dragon hatches from an egg and grows (baby, young, grown) until it can fly the child. Pets in plush style with tricks, a bed and a bowl. Calm mode keeps weather gentle and daytime.
   - Picture signposts at every junction; landmarks at road ends; kiosks in groups; map labels never overlap.
   - **Room for family memories** (owner, 8 Oct): the owner plans to add families' own houses and buildings on request later, so the land is planned now.
     - Two Memory Villages (Làng Kỷ Niệm), one on each bank beside the home island, about 20 plots each, plus 2–3 spare plots in every town and village: about 60 plots.
     - Plot sizes: small (stall, shrine, bench), house, big (school, shop, café). Each is flat, joined to a road, with an address.
     - An unused plot is a small garden (flowers, bench, tree); a building replaces it.
     - Every player sees family buildings. They show only a family nickname, never children's photos, full names or real addresses, and go up only when the owner places them in Studio (a Plots page: pick a plot, pick or upload a design).
   - Hard road and village rules stay. The valley grows by about a fifth (about 480 m) to fit the water, mountains and plots, as long as the speed checks pass on phones.
3. **New child's journey:**
   - The child picks a companion when making a character: Lấp Lánh the firefly or a baby dragon (rồng con). They can swap at home.
   - One button at a time, clouds over unvisited places on the map, a "Làm gì bây giờ?" button, a new place each day in the first week.
   - 9 starter quests (Ông Cú → companion → house key → plant a seed → name the pet → first friend → first purchase → first decoration → first game prize → goodnight sticker), then the existing adventure.
   - Children who already play get the companion, the cottage and the surprises, and skip the basics.
4. **Homes:** cottage (start), treehouse (finish the plateau), riverside stilt house (ride the raft to every stop). Each has 5 levels, built with materials found in the world plus quest stamps; Bác Thợ builds them. Rooms: bedroom, kitchen, pet corner, trophy shelf, sticker wall, garden. Plants and pets grow over real days and never die or get sad.
5. **Surprises** (at most about 3 per session, never "missed"): rare rainbow lotus, golden butterfly, treasure map in 3 pieces, hidden path to a fairy glade, rainbow after rain, shooting stars, rare visitors (crane, koala, fairy).
6. **Shop and wardrobe:**
   - Only 2 default outfits (boy and girl); hair chosen at creation or in Grown-ups → Children → Edit.
   - Shop: hats and nón, necklaces, tops, bottoms, shoes and sandals, back items; about 2× the options for boys and girls.
   - Backpack button teleports to the shop.
   - Prices: about one day of play for a nice item.
   - **Built (round S, 9 Oct, branch round-s-sa):** the clothes shop stall by Chợ Ba Miền (placed with `openSpot`, off the roads), the shop screen in the new shared big card (picture tabs, coin pictures and numbers, 64 px for under-5s), 50 things in six kinds balanced for girls and boys, prices from `DAY_COINS` (70 coins a day of play: 30, 70, 120), `profile.owned.clothes` (what a child already wore counts as owned), the wardrobe of owned things, every new piece drawn on the 3D character as one merged shape (`js/avatar.js`), two default outfits when making a character, the Bag button going to the shop. Files: `js/shop.js`, `js/content/shop.js`; Studio switch `shop`; check `shop`, unit tests `tests/unit/shop.test.mjs`. Details in `play.md`.
7. **Money games (all, AUD or VND, game coins only):** Heo Đất, Coin or Note?, Need or Want?, Ba Hũ (Save/Spend/Share), Lì Xì Count, Bé Bán Hàng, Shopping List, Which Is Cheaper?, Wait and Grow, Đổi Hàng.
8. **Festivals:** all four groups.
   - Vietnamese lunar days.
   - Vietnamese calendar days (1/6, 20/11, 2/9).
   - Western: Halloween, New Year's Eve, Easter, Mother's Day, Father's Day.
   - Australian and multicultural: Anzac Day, Harmony Day, Clean Up Australia Day, NAIDOC Week, Reconciliation Week, Holi.
9. **Hội làng:** every host game free any time; the 3-coin skip is removed. 3 big events a day at 9:00, 16:00 and 19:00 (17:30 for under-5s), with a parade, crowd and a special prize. Prizes like the kite for games and quests.
10. **For 5–8 at Medium/Hard:**
   - Mystery boxes: 1 free a day plus 1 earned from a quest. Boxes can't be bought; duplicates turn into stars.
   - Rankings, family and friends only: stars and quests, collections, kindness, learning.
   - Collectibles: fairies, dragons, stickers, decorations.
   - Never real money.
   - **Built (round S, 9 Oct, branch round-s-sa):** for big kids at Medium or Hard, a gift chip under the name card opens mystery boxes (one free a day by the AEST day, one more for a finished quest, at most one a day, never sold; a second one becomes stars), the family rankings (every child on this device; four boards) and the collection book (25 fairies, dragons, stickers and decorations). Files: `js/boxes.js`, `js/content/boxes.js`; Studio switches `mysteryBox`, `rankings`, `collectibles`; check `boxes`, unit tests `tests/unit/boxes.test.mjs`. Not yet: friends' numbers online (TODO in `play.md`), decorations placed in homes.
11. **Parent features:** family missions (a grown-up ticks ✓), family voices recorded in Studio, a weekly note, cards to print, a dance break after 20 min, bedtime mode, an optional birthday (kept on the device only).
12. **Voice pack:** own language only; a 5–8 MB core pack ships with the game; the rest downloads on Wi-Fi, area by area; name templating and a coverage check so no line is missed.

## Notes
- Tết 2030: the game's table says 3 Feb, but the Vietnamese calendar (UTC+7) gives 2 Feb; 3 Feb is the Chinese date. Check this when the calendar takes over.

## Stories and guides redesign (proposal, 8 Oct; drawings and an animated sample on the concept page)
- **A living pop-up book:** every page is a composed shot (wide, medium, close-up) of layered paper cut-outs that move with depth as the camera drifts; page turns like a real book.
- **Characters who act:** each one different (age, clothes, face), acting the words; mouths move with their lines; faces show feelings. Props are used in the action (rice falls into the pot, the cake is wrapped), never floating.
- **Words light up** as they're read; tap a word to hear it; the other language can show underneath.
- **The child helps** every 2–3 pages (tie the bánh chưng, wake the turtle, choose the boat's way); under-5s: anything tapped wiggles and makes a sound.
- **Three ways to read:** read to me, read myself, grown-up reads (no voice, bigger words).
- **A book for each place:** Đông Hồ print colours for Vietnamese tales, bush watercolours for Australian, red paper-cut borders for Chinese, rangoli borders for Indian.
- **Endings:** a one-line lesson, a "what would you do?" question, a keepsake sticker, and the story's place in the valley.
- **How-to guides:** watch → the companion's glowing hand shows each move on the real game screen → "Tới lượt con!" with the first move guided; under 30 s; folk games add a drawn clip of children playing it and a how-to-play-at-home card for grown-ups.
- **Opening story:** a 30-second narrated fly-over of the real 3D valley at dawn (mist, Ông Cú's lantern, lanterns waking, landing at the child's home), played while the world loads; skippable; replayable from the Pad.
- Calm mode: no camera moves, gentle fades. Phones: a shared library of sets, characters and props moved with cheap transforms; Studio family stories use the same book.

## Stories and guides as real animated films (owner, 8 Oct: "the animations should be detailed and comprehensive, not just drawings standing for the scenes; children won't understand anything")
The proposal above still builds each page from separate pictures. That is replaced by this plan: every page is a short film where the story really happens on screen.
- **Acted in 3D with the valley's own people, animals, houses and vehicles** (`js/film.js`, new). Each page is a scene script: the set (a riverbank, a palace yard, a rice field, the sea), the actors and props, and what they do, in order and timed to the narration. Example, Sự tích dưa hấu page 4 ("a bird dropped black seeds; she planted them"): a bird flies in across the sky, black seeds fall and bounce on the sand, Mai An Tiêm turns, walks over, kneels, picks them up, digs, plants, pats the soil, waters it; the camera follows her and closes in on her hands.
- **Actions the actors can do:** walk or run to a spot, turn, point, wave, pick up, carry, give, put down, dig, plant, water, cook, wrap, eat, sit, kneel, sleep, cry, laugh, hug, bow, jump, swim, row, ride (horse, buffalo, any vehicle), fight with a stick, fly (birds, dragons, fairies). Faces show feelings (happy, sad, scared, surprised, angry, sleepy) and mouths move with their lines.
- **Things change on screen:** seeds grow into vines and watermelons, a cake is wrapped in leaves and tied, eggs hatch, water rises, a boy grows into a giant, day turns to night, rain and storms come.
- **Camera like a cartoon:** wide shot to show where we are, then medium and close-ups on what matters (hands, faces, the object the line talks about), gentle moves between them. Calm mode: cuts only, no camera moves.
- **Narration and captions stay** (voice pack, word-by-word highlight, ◀ ▶ pages, auto-play). The child helps every 2–3 pages by tapping something in the scene (water the seeds, tie the cake, wake the turtle).
- **How-to guides become films of the real game:** the game itself plays its first moves by itself, slowly, with a glowing hand showing each tap or drag and a short spoken line for each move, then "Tới lượt con!" and the child does the same move with the hand guiding. Folk games played outside (đá cầu, nhảy dây, ô ăn quan, kéo co…) also get a 3D clip of village children playing them in the valley.
- **Size:** about 42 stories (about 220 pages) and 62 guides. Pilot first: 2 stories (Sự tích dưa hấu; Thánh Gióng) and 2 guides (Ô ăn quan; one learning game), for the owner to watch and judge. Then the rest in batches of about 8 stories and 15 guides per round, Vietnamese stories first.
- **Phones:** the films use the same models as the valley (already on the device), drawn in a small stage with few lights, so they run smoothly on older phones and need no download.
- **Pilot built (8 Oct):** `js/film.js` (the engine: actors from the valley's people with poses kneel, dig, plant, water, eat, point, talk, bow, hug, carry, give, pull, swing, throw, stretch, ride; faces happy, sad, surprised, sleepy, and mouths that move while they speak; sets: island and moving sea, village with mud house and bamboo, rice field, mountains, palace yard, shrine; props: birds that fly, seeds, watermelons that grow and split open, vines, a sailing boat, the messenger's horse and the iron horse with fire, bamboo that turns gold) and `js/content/films.js` (the scripts). Sự tích dưa hấu and Thánh Gióng are films page by page; the Ô ăn quan and counting how-tos are films card by card. The child helps twice in each story (water the seeds, open the melon, push it out to sea; feed Gióng, pull up the bamboo): the film waits until the narrator has finished, asks, and waits for a tap anywhere on the picture (it carries on by itself after 14 s). Tapping any character makes it hop. Calm mode cuts between shots. Studio switch `storyFilms` turns all films off (back to the picture stage). Not yet in the pilot: the real game playing its first moves with the glowing hand (planned with the next batch of guides).

## Part 2, item 1: faster launch (9 Oct)
Measured in the test browser (390 px phone; the slow-phone figures use a 4x slower processor):
- **Title on screen: 4.5 s → 1.8 s; slow phone 17 s → 2.7 s.** The title and "Who's playing?" now show first; the valley is built behind them in steps with a breath between steps, so taps are answered. Pressing Go before the valley is ready shows "Getting the valley ready…" for the moment left.
- **The first picture no longer freezes the title:** every material's shader is prepared in the background (`renderer.compileAsync`) before the valley is drawn.
- **The mini-map picture** is painted once the valley is built (it used to run in the middle of start-up).
- **All start-up scripts are fetched at once** (`<link rel="modulepreload">` list made by `tools/preload.mjs`; check `preload`).
- Not changed: the valley takes about the same time to build (about 3.5 s here, 14 s on a slow phone). Making it faster (building far areas later) belongs with the new Concept D layout, item 2.

## Owner's decisions, 9 Oct (AEST): story, cast, order of work
- **Main story "Đèn Lồng Thung Lũng"** (the wind blows the valley's lanterns away; each region is a chapter ending with a festival night and its landmark lighting up; Tết is the finale): write it as a full plan for the owner to approve before building.
- **Core cast:** Ông Cú, the companion (Lấp Lánh / rồng con), Tèo, **Chi** (the half-Australian, half-Vietnamese friend; a new character: the jump-rope girl Lan stays), Cô Tam, Bà Năm, Jack and Ruby, **Anh 2** (a new story character; Bác Sơn stays in the valley as he is), bà Huệ and ông Nghi.
- **Quest chain for bà Huệ and ông Nghi:** when they started out they helped the younger ones, bringing them from Hà Tĩnh to work with them, building jobs in transport, construction and hauling earth and stone. 5 to 6 steps: meet the coach from Hà Tĩnh, welcome the younger ones, give each a job, drive a dump truck (xe ben) with earth and stone, dig with an excavator, build a house together; a transport and construction yard next to their shop. The relatives use placeholder names until the owner sends the real names and jobs.
- **Landmarks of a chapter:** under soft mist until the chapter is done, then a short film as they light up, then open for visits.
- **Releases:** as planned: r49 Halloween, Ch1 Làng Sen mid Oct, Ch2 Hà Nội late Oct, Ch3 Sydney Nov, Ch4 Huế and Đà Nẵng Dec, Ch5 Melbourne and Uluru Jan, Tết finale Feb, then Season 2.
- **Order of work:** story plan, then infrastructure, then the new layout (with performance), then a visual audit of everything.
- **Infrastructure:** bundle and compress the code; GitHub CI with deploy previews; split main.js into the 8 cores. (Voices and exe stay in git for now.)
- **Studio:** faster pages with undo/history, a content calendar, a quest and story editor, family voices with a plain-words dashboard, and a better page layout with new and improved features.
- **Privacy review:** the owner asked for more detail first.

## Story: prologue and chapter 1 built (owner, 9 Oct: "Approve, start building")
- `js/lanterns.js` runs the chapters in `js/content/chapters.js`: the child's goal is the first step not yet done in the first released chapter; when none is open the old adventures (`QUESTS`) carry on. Progress lives in `profile.lanterns`.
- **Prologue:** Ông Cú's film (the lanterns glow on the banyan, Mây Cau Có blows them away), then the child picks a companion: Lấp Lánh the firefly or Rồng con the baby dragon (`js/companion.js`), who flies beside them and carries the lantern once found.
- **Chapter 1, Làng Sen:** fly to the village, ask Bà Năm, fetch water at the old well, beat Tèo at a folk game, hear the watermelon story, find the lantern among the lotus leaves, hang it at the đình. The đình (`js/dinh.js`) sits under soft mist until then; hanging the lantern plays the festival-night film, lights it up and gives the keepsake lantern for the child's house.
- **Where the đình stands:** Làng Sen is full of houses and stalls, so the game picks the flat spot with the most room round it, in or at the edge of the village, facing the village middle (many real đình stand at the village edge). The `story` check keeps every building at least 5 m away.
- **Voices:** the step speeches and film pages are recorded (Azure). Lines that show the child's name speak a version without it, so one recording works for every child.
- **Switches:** Studio > Releases: `story_prologue` and `story_ch1` (on by default).

## Story: bà Huệ and ông Nghi's yard (built 9 Oct)
- `js/yard.js` (content in `js/content/yard.js`): a transport and building yard on open, flat ground near the Huệ Nghi shop (found with `js/openspot.js`, which the đình also uses), with a site office and sign, a stone pile, a building site, a coach (xe khách), a dump truck (xe ben) and an excavator (máy xúc) (new models in `js/vehicles.js`). Anh 2, their son, runs it.
- **The side story** (the child starts it by asking bà Huệ; owner, 9 Oct: a side story with its own list, Pad → Adventures → Side stories, with Follow; it never takes the goal bar from the lantern story unless the child follows it): bà Huệ tells how she and ông Nghi brought the young ones from Hà Tĩnh; meet the coach; ask each relative what they are good at and give them the right job (a wrong one is turned down kindly); haul earth and stone in the dump truck and tip it at the site; dig the foundations with the excavator; lay the bricks and lift the roof together; the house-warming meal at the shop. Afterwards the truck and the excavator are open for free play.
- **Placeholder names** until the owner sends the real ones: Chú Tư (driver), Cô Sáu (builder), Anh Bảy (digger operator). Change them in `js/content/yard.js`.
- Voices recorded (Azure). Studio switch `story_yard` (on).
- **Test start:** the harness now starts the checks without Ông Cú's prologue film (it plays by itself for a new child); the welcome-voice check follows the story's welcome ("Who will fly with you, …?").

## Fixes from the r50 full run (10 Oct)
- **Placement rules** (moving the trees for the yard plot shifted other things): trees keep 5 m from every Leafy; UNESCO landmarks keep clear of Leafies and of other landmarks' signs, only pick a spot whose sign stands on open ground, and look further out before falling back to their planned spot; gathering spots and dig spots never sit under a building or landmark.
- **Start-up size (PERF-001):** the story and the yard load while the valley is built; the voice pack's list (`voices/manifest.json`) now names only the lines that are not English (`other`, per language) instead of every line's language (`langOf`): 211 KB to 144 KB. The game, `tools/make-voice-pack.mjs` and Studio read both forms.
- **Map picture cache:** the service worker no longer clears `sv-world` (the cache deletes old builds' pictures itself); the perf check waits until the picture is saved instead of a fixed 0.8 s.
- **Checks:** `films` also plays the story films.

## Owner's decisions, 9 Oct (AEST): the family and privacy
- **The yard family:** bà Huệ and ông Nghi brought chú Thuận, chú Trung, O Thủy, anh Quân, chú Hùng, chú Sơn Diệu and chú Sơn Cường from Hà Tĩnh; bà Huệ also brought cậu Tâm and chị Huyền. The other Two Homes Street families (O Thương and dượng Dũng, Cô Tam's family, Bác 2/3/4, anh Ba) are not part of it. In the yard story (owner: "you choose"): chú Thuận drives the dump truck, chú Hùng builds, anh Quân digs; chú Trung, O Thủy, chú Sơn Diệu and chú Sơn Cường come on the coach too. Cậu Tâm hauls sand and stone like chú Thuận (mợ An is his wife); chị Huyền is a niece who works at a school, her husband is anh Trọng: the three come to the house-warming meal.
- **Privacy** (review: claude.ai artifact "Sparkle Valley Privacy Review", 9 Oct):
  - Family photos: **family-only** (stored privately, loaded only by the family's devices with a family code from Studio, random file names).
  - Play report: **keep as is** (on by default, with first names; Grown-ups can switch it off).
  - Online play: **off until a grown-up turns it on**, longer room codes, a "who's here" list a grown-up can check.
  - Chat character key: **keep as is**.
  - Also: voices made in Studio only (no voice keys on children's devices, never clone children's voices); landmark photos served from our own site; Studio admin two-step sign-in, long passwords, a log of who opens the players report; a short privacy notice in Grown-ups.

## What keeps little ones playing (owner 9 Oct: "add these in and add to the studio so we can switch on/off")
Each is a Studio switch in the new group **For little ones** (Ra mắt page), all on:
- **yardHands:** the yard by hand. Tap the stones to load the truck, hold the green pedal to drive (the child walks beside it and the camera follows), pull the lever down to tip; drag the excavator handle down and up to dig four scoops; tap nine times to lay the bricks, then drag the roof down onto the house. Off: the old speech-box buttons.
- **simpleStart:** under-5s start on the Simple screen until they choose (this was already the rule; now it can be switched off). Tap-to-walk in the valley was already there.
- **storyActions:** chapter 1 steps have something to do: catch three wind ribbons on the way into Làng Sen (walk through them or tap), lift the lotus leaves to find the lantern (a different leaf each day; a frog under the others), pull the rope to raise the lantern at the đình. Off: as before.
- **companionGrow:** a Feed button beside the coins, once a day; every two days of food the companion grows a little and glows warmer; from size 3 the button asks for a loop-the-loop.
- **saveGoal:** a coin goal beside Feed: hats for the companion in order (party hat 30, flower crown 45, little nón lá 60, golden crown 80); when there are enough coins it pulses and a tap buys it. On a phone it shows only when it can be bought.
- **dailySurprise:** a gift box by a different landmark each day (AEST); the child is told where on their first look of the day; opening it gives 15 coins.
- **shortTalk:** Bà Năm's request and bà Huệ's story in one line each, and a big Skip button on the story's own films.
- Checks: `kidplay` (new), `yard` and `story` now play the hands-on parts like a child would.

### Also in this round (9 Oct)
- **Side stories list:** goal order is a followed side story, then the lantern chapter, then an active side story, then the older quests (`currentQuest` in js/main.js; `G.sideStories()`; Follow saved as `profile.follow`). Check `yard` proves the goal bar stays on the lantern story after the yard starts and that Follow works.
- **Long speeches kept:** the Studio switch "Short talk" (`shortTalk`) picks separate short lines (`startShort`, `talk.short`); the long ones stay in the files and come back when it is off.
- **Voice list loaded later:** voices/manifest.json loads on the first tap or key, or after 8 s, so start-up stays under the PERF-001 download budget.
- **Code audit (9 Oct), fixed:** a photo from another player could carry code into the page (photos now only plain base64 pictures, also checked where they are shown); the lotus-leaf step could lock for good when the day changed (the right leaf is now chosen once per child); Skip in story films sat on top of Next (now in the top bar); hands-on panels had no way out (✕ Later puts the machines back, the step can be tried again); the lantern could be hung twice; the finished yard house's roof floated; the companion's loop-the-loop drifted into the sky and its glow never changed; English lines said "ông Nghi", "chị Huyền", "Mẹ" (now Grandpa Nghi, Huyền, Mum; 12 new recordings); the yard showed in Side stories with its switch off; the service worker fetched js/content files apart from the rest of the game (could break the first open after a deploy); the "playing now" ping sent a name with names switched off; backups carried API keys; a Studio editor could merge code or bring back an old deploy (owner only now); Wikimedia captions read as an inert document.
- **Audit findings waiting for the owner's privacy round:** online rooms (4-digit codes, the cloud relay key made from the code, friend codes taken on trust, the public PeerJS ids) are open to a determined stranger; family album photos are public files; Studio sign-in has no second step or log; /api/hello has no limit. The owner's decisions of 9 Oct (online off until a grown-up turns it on, longer codes, who's here, family-only photos, Studio 2-step) answer most of these.
- **Not done yet:** the code is not yet split per core (docs/cores only describes them; task: infrastructure round).
