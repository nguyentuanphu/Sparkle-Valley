# r90 plan: twice the games and stories, unlocked by playing

Plan by Release, 23 Oct 2026 AEDT, for the owner's brief [`r90-more-games-and-stories.md`](r90-more-games-and-stories.md)
(decisions already made: the whole of r90; "finished 3 times" unlocks; one badge per category; a Studio "unlock all"
switch). **Built by a separate AI working locally in VS Code** on branch `work/r90-more-content` (from `release/r89`).
The names below are proposals: the builder shows the owner the list per category before building that category, and the
owner may swap any of them.

## 1. Unlocking (build this first)

**Rule (owner):** in each category the games open today are the *first set*. The *second set* (the new games) opens for
a child when that child has **finished each first-set game 3 times** (reached its celebration; any level; under-5s count
any finish because they always finish). The same for each story shelf: a story counts when read or watched to its last
page; the new stories open after each first-set story in that shelf was finished 3 times.

- **Where the counts are:** games already count wins per child in `profile.wins[id]` (`js/main.ts`, after `openGame`,
  where `ActivityCompleted` is emitted). Stories keep only `profile.tales[id] = true` (`js/learn.js` ~line 100): add
  `profile.taleReads[id]` (a number), counted at the same place, and treat an existing `true` as 1 (migration in
  `js/state.ts`, like the other profile defaults near line 168). Progress made before r90 counts.
- **One place for the rule:** new `js/content/unlocks.ts` (TypeScript): `FIRST_SET` per category (the ids open today,
  frozen in the file), `secondSetOf(area)`, `progressOf(profile, area) → { done, need, perGame: [{ id, n }] }`,
  `isOpen(profile, id)`, the same for shelves. Categories are the existing areas in `js/content/activities.js` `AREAS`
  (plus the Reading corner `reading`); shelves are `TALE_FLAGS` in `js/learn.js` plus the new **World** shelf.
- **Every place a game or story is offered must ask `isOpen`:** the Play hub (`js/ui.ts` `hubSections`/`gamesIn`), the
  Pad's Games page, the Simple screen (`js/simple.js`) and its Discover/search, "Next game" (`nextGameAfter`), villagers
  and shrines that offer a game (`G.meetAndPlay`, `G.goToGame`, the quest games), the story shelf (`G.taleShelfHTML`),
  Daily Adventure picks, and Studio's Simple screen page (shows locks, read-only).
- **What the child sees:** a locked game or story shows its picture greyed with a padlock drawing (add the padlock to
  `js/art.js` if missing) and no tap action except a short spoken note. At the end of each category and shelf, a card:
  "To unlock more games, finish each game here 3 times" / "Để mở thêm trò chơi, con hãy chơi xong mỗi trò ở đây 3
  lần", with small progress dots per game (filled 0 to 3). Spoken in both languages; 64 px for under-5s.
- **Badge (owner):** unlocking a category's second set gives that category's badge once (a sticker in the sticker book,
  `js/content/stickers.js`, and the shirt badge like the tester badge), with the usual reward pop-up. One badge per game
  category (12) and per shelf (5). Badges mark the unlock; they are not an extra condition.
- **Studio switch (owner):** Releases → "Unlock all games and stories" (`unlockAll`), every device or the ticked ones,
  off by default (`js/content/releases.ts`, `js/custom.js` `featureOn`, Studio card in `studio/ui/app.ts`, the
  `studioswitches` unit test lists it; FEATURES.md section H). Testers and auto play use it.
- **Two children playing together:** a game is open if it is open for either child; a finish counts for both.

## 2. New games (about 111): ids, names, youngest age, what the child does

Same rules as the r89 drawing games (`js/games/drawing.ts` is the model): one TypeScript file per group, loaded when a
game opens (`js/games/catalog.ts` `GAME_CATALOG` and `GAME_LOADERS`), `GAME_INFO` in `js/content/activities.js` with the
area, youngest age and difficulty, `sw.ts` FILES, a plan or `untilRight` so auto play can finish it.

**Animals** (+7, `js/games/animals2.ts`): `crabwalk` Crab Walk / Cua Bò Ngang (2: guide the crab sideways to its hole)
· `whohome` Who Lives Here? / Nhà Của Ai? (2: animal to its home) · `mumbaby` Mums and Babies / Mẹ và Con (2: joey to
kangaroo, nghé to trâu) · `feedzoo` Feed the Zoo / Cho Thú Ăn (3) · `buffalo` Buffalo to the Field / Dắt Trâu Ra Đồng
(3: draw or tap the path) · `reefcount` Reef Count / Đếm Cá Rạn San Hô (3: Great Barrier Reef) · `tracks` Whose
Footprints? / Dấu Chân Của Ai? (4).

**Music** (+5, `music2.ts`): `dantranh` Zither Strings / Đàn Tranh (2: pluck the lit strings) · `bushband` Bush Band /
Ban Nhạc Đồng Quê (3: washboard, lagerphone, spoons in time) · `drumecho` Drum Echo / Trống Đáp (3: copy the rhythm) ·
`loudquiet` Loud and Quiet / To và Nhỏ (2) · `songsteps` Song Steps / Xếp Câu Hát (4: put a known song's lines in
order, e.g. "Kìa con bướm vàng").

**Pictures** (+25, `drawing2.ts`, `crafts.ts`): `stamps` Potato Stamps / In Hình (2) · `weave` Weave a Mat / Đan Chiếu
(3) · `mosaic` Bát Tràng Tiles / Ghép Gốm Bát Tràng (3) · `nonla` Paint a Nón Lá / Vẽ Nón Lá (2) · `aodai` Áo Dài
Designer / Thiết Kế Áo Dài (3) · `kitepaint` Design a Kite / Trang Trí Diều (2) · `shades` Light and Dark Colours /
Màu Đậm Màu Nhạt (3) · `shadowpic` Light and Shadow / Bóng và Hình (2) · `spotdiff` Spot the Difference / Tìm Điểm Khác
(4) · `hiddenpic` Hidden Pictures / Tìm Hình Ẩn (3) · `finishpic` Finish the Picture / Vẽ Nốt Bức Tranh (3) ·
`scene` Sticker Scene / Dán Tranh Cảnh (2) · `paperfold` Paper Folding / Gấp Giấy (4) · `lacquer` Lacquer Painting /
Tranh Sơn Mài (4: gold-leaf reveal) · `scratch` Scratch Art / Tranh Cào (2) · `bubblepaint` Bubble Paint / Vẽ Bong
Bóng (2) · `fingerpaint` Finger Painting / Vẽ Bằng Ngón Tay (2: free painting, kept in the Album) · `weatherpaint`
Colour the Weather / Tô Màu Thời Tiết (2) · `thocam` Brocade Patterns / Hoa Văn Thổ Cẩm (4) · `pixelpic` Pixel Picture
/ Tranh Ô Vuông (4) · `fireworks` Fireworks Painter / Vẽ Pháo Hoa (2: Tết and Sydney New Year's Eve) · `masks`
Mid-Autumn Masks / Làm Mặt Nạ Trung Thu (2) · `makeface` Make a Face / Ghép Khuôn Mặt (2) · `gallery` My Little
Gallery / Phòng Tranh Của Em (3: frame the child's own Album pictures; nothing leaves the device) · `leafrub` Leaf
Rubbings / In Lá (2).

**Numbers** (+7, `numbers2.ts`): `numline` Hop the Number Line / Nhảy Trên Tia Số (3) · `tenframe` Ten Frame / Khung
Mười (3) · `dice` Dice Count / Đếm Xúc Xắc (2) · `evenodd` Pairs or Odd? / Chẵn hay Lẻ? (4) · `measure` Measure with
Blocks / Đo Bằng Khối (4) · `beforeafter` Before and After / Số Trước Số Sau (3) · `halves` Share in Half / Chia Đôi (4).

**Shapes** (+7, `shapes2.ts`): `solids` Ball, Box, Can / Khối Cầu, Hộp, Trụ (3) · `townshapes` Shape Hunt in Town /
Tìm Hình Trong Phố (2) · `tiles` Tile the Floor / Lát Sàn (4) · `turnit` Turn It Round / Xoay Hình (4) · `shapetrain`
Shape Train / Tàu Hình Khối (2) · `linescurves` Lines and Curves / Nét Thẳng Nét Cong (2) · `foldbox` Fold the Box /
Gấp Hộp (5).

**Letters and words** (+5, `words2.ts`): `whichgroup` Which Group? / Thuộc Nhóm Nào? (3) · `storyorder` Story in Order
/ Xếp Tranh Kể Chuyện (4) · `guesswhat` Guess What I Am / Đoán Xem Tôi Là Gì (4) · `actions` Action Words / Từ Chỉ
Hoạt Động (3) · `position` In, On, Under / Trong, Trên, Dưới (3).

**Reading corner** (+12, `reading2.ts`, behind `readingTrial` like the first twelve): `rd_blend` Blend the Sounds /
Ghép Âm · `rd_hats` Vowel Hats / Mũ Cho Chữ (â ê ô) · `rd_endings` Word Endings / Vần Cuối · `rd_compound` Two Words
Make One / Ghép Hai Từ · `rd_labels` Label the Picture / Gắn Tên Cho Tranh · `rd_signs` Signs in Town / Biển Báo
Trong Phố · `rd_questions` Who, What, Where / Ai, Gì, Ở Đâu · `rd_many` One and Many / Một và Nhiều · `rd_caps` Big
and Small Letters / Chữ Hoa Chữ Thường · `rd_poem` Read a Little Poem / Đọc Bài Thơ Nhỏ · `rd_missing` Missing Letter
/ Điền Chữ Còn Thiếu · `rd_book` Make a Little Book / Làm Sách Nhỏ (kept in the Album).

**Me and my family** (+3, `me2.ts`): `myday` My Day / Một Ngày Của Em (2: put the routine in order) · `plate` Healthy
Plate / Đĩa Ăn Lành Mạnh (3) · `kindchoice` Kind Choices / Việc Làm Tốt (3).

**Play outside** (+10, `outside.ts`): `hideseek` Hide and Seek / Trốn Tìm (2) · `duckgoose` Duck, Duck, Goose / Vịt,
Vịt, Ngỗng (2) · `redgreen` Red Light, Green Light / Đèn Xanh Đèn Đỏ (2) · `simon` Simon Says / Simon Bảo (3) ·
`eggspoon` Egg and Spoon Race / Chạy Thìa Trứng (2) · `chairs` Musical Chairs / Ghế Âm Nhạc (2) · `kicktokick` Kick
to Kick / Đá Bóng Qua Lại (3: Australian football in the park) · `nippers` Little Nippers / Bé Tập Cứu Hộ Biển (4: surf
lifesaving at the beach) · `hoops` Rolling Hoops / Lăn Vòng (3) · `tag` Tag! / Đuổi Bắt (2).

**Vietnamese games** (+8, `vietnam2.ts`): `rongran` Dragon Snake / Rồng Rắn Lên Mây (2) · `meochuot` Cat and Mouse /
Mèo Đuổi Chuột (2) · `cuopco` Capture the Flag / Cướp Cờ (4) · `keocua` Sawing Song / Kéo Cưa Lừa Xẻ (2) · `danhdao`
Coin Target / Đánh Đáo (4) · `nemcon` Throw the Còn / Ném Còn (3) · `trongnu` Planting Buds / Trồng Nụ Trồng Hoa (3) ·
`duathuyen` Boat Race / Đua Thuyền (3).

**Going places** (+8, `places2.ts`): `cyclo` Cyclo Ride / Đi Xích Lô (2) · `reunification` The North–South Train / Tàu
Thống Nhất (3) · `lighthouse` Light the Lighthouse / Thắp Hải Đăng Vũng Tàu (2) · `operaseats` Seats at the Opera
House / Xếp Chỗ Nhà Hát (4) · `outback` Outback Road Trip / Đường Xuyên Úc (4) · `floating` Floating Market / Chợ Nổi
Cái Răng (3) · `airport` Airport Helper / Ở Sân Bay (3) · `postcard` Postcards Home / Gửi Bưu Thiếp (3).

**Big thinkers** (+4, `thinking2.ts`): `minichess` Little Chess / Cờ Vua Nhỏ (5) · `cotuong` Chinese Chess Puzzles /
Cờ Tướng Nhỏ (5) · `whosits` Who Sits Where? / Ai Ngồi Đâu? (5) · `pipes` Water Pipes / Nối Ống Nước (4).

**Money and shopping** (+10, `money2.ts`, in the child's home currency like `money.ts`): `savegoal` Saving Goal / Mục
Tiêu Tiết Kiệm (3) · `pocketweek` Pocket Money Week / Tiền Tiêu Vặt Trong Tuần (4) · `pricetags` Price Tags / Gắn Giá
(3) · `busfare` Pay for the Bus / Trả Tiền Xe Buýt (3) · `lemonade` Lemonade Stand / Quầy Nước Chanh (4) · `party`
Party on a Budget / Tiệc Tiết Kiệm (5) · `recycle` Cans for Coins / Đổi Lon Lấy Tiền (3: Australia's 10c return) ·
`tetmarket` Tết Shopping / Đi Chợ Tết (3) · `bank` At the Bank / Ở Ngân Hàng (4) · `sharefair` Share Fairly / Chia
Đều (3).

## 3. New stories (54): shelf, English / Vietnamese title

Each story: pages in both languages (`js/talesdata.js` entry plus `js/tales-content.js` pages), narration recorded with
Azure in both languages, its own 3D film look (`js/content/film-looks.js`, `js/talefilms.js`), the `films` and
`voicearea` checks. Retell gently for under-5s (no frightening or sad endings left unresolved).

- **Vietnam** (+20): The Betel and the Areca / Sự tích Trầu Cau · The White Chrysanthemum / Sự tích Hoa Cúc Trắng ·
  Ba Bể Lake / Sự tích Hồ Ba Bể · The Tết Pole / Sự tích Cây Nêu Ngày Tết · The Catfish and the Toad / Trê Cóc · The
  Sand Crab / Sự tích Con Dã Tràng · Clever Trạng Quỳnh / Trạng Quỳnh Thông Minh · True Friends Lưu Bình and Dương Lễ /
  Lưu Bình Dương Lễ · The Broom / Sự tích Cái Chổi · The Ten O'Clock Flower / Sự tích Hoa Mười Giờ · The Magpie / Sự
  tích Chim Khách · The Giant Who Held Up the Sky / Thần Trụ Trời · The First Grain of Rice / Sự tích Hạt Lúa · The
  Reed-Flag Boy / Cờ Lau Tập Trận · Tích Chu and Grandma / Tích Chu · The Dill Plant / Sự tích Cây Thì Là · The Ban
  Flower / Sự tích Hoa Ban · How the Monkey Came to Be / Sự tích Con Khỉ · The Bamboo-Tube Girl / Nàng Út Ống Tre ·
  The Three Daughters / Sự tích Ba Cô Gái.
- **Australia** (+10, so 16): new stories written for the game about Australian animals and places: Platypus Doesn't
  Fit In / Thú Mỏ Vịt Khác Mọi Người · Why Wombats Dig / Vì Sao Gấu Túi Mũi Trần Đào Hang · Koala's Gum Leaf Day / Một
  Ngày Của Koala · Kookaburra's Laugh / Tiếng Cười Chim Kookaburra · The Little Penguins' Parade / Đoàn Chim Cánh Cụt Nhỏ
  · Turtle Hatchlings on the Reef / Rùa Con Trên Rạn San Hô · The Echidna's Spiky Coat / Áo Gai Của Thú Lông Nhím · The
  Easter Bilby / Chú Bilby Mùa Phục Sinh · The Lyrebird Who Copied Everyone / Chim Lia Bắt Chước · The Lighthouse at the
  Cape / Ngọn Hải Đăng Nơi Mũi Đất. **An Aboriginal story is added only from a published source with the community
  credited, and only with the owner's approval** (the existing Dreaming stories stay as they are).
- **China** (+6): The Monkey King and the Peach Garden / Tôn Ngộ Không và Vườn Đào · Hou Yi and the Ten Suns / Hậu Nghệ
  Bắn Mặt Trời · The Jade Rabbit / Thỏ Ngọc · Brave Mulan / Hoa Mộc Lan · Why We Race Dragon Boats / Vì Sao Có Đua
  Thuyền Rồng · The Old Man Who Moved Mountains / Ngu Công Dời Núi.
- **India** (+6): The Tortoise and the Geese / Rùa và Đôi Ngỗng · The Four Friends / Bốn Người Bạn · Birbal's Clever
  Answer / Câu Trả Lời Thông Minh Của Birbal · Tenali Raman and the Cats / Tenali Raman và Những Chú Mèo · The Golden
  Swan / Thiên Nga Vàng · The Mouse and the Lion's Net / Chuột Gỡ Lưới Cho Sư Tử.
- **World** (new shelf, 12; flag drawing 🌍 in `js/art.js`): The Tortoise and the Hare (Greece) / Rùa và Thỏ · The
  Lion and the Mouse (Greece) / Sư Tử và Chuột · The Ant and the Grasshopper (Greece) / Kiến và Châu Chấu · The Little
  Red Hen (England) / Cô Gà Mái Đỏ · The Gingerbread Man (United States) / Chú Bé Bánh Gừng · Anansi and the Pot of
  Wisdom (Ghana) / Anansi và Hũ Trí Khôn · Stone Soup (Europe) / Món Súp Đá · The Enormous Turnip (Russia) / Củ Cải
  Khổng Lồ · The Three Billy Goats Gruff (Norway) / Ba Chú Dê Đực · The Elves and the Shoemaker (Germany) / Ông Thợ Giày
  và Những Chú Tí Hon · Momotarō the Peach Boy (Japan) / Cậu Bé Quả Đào · The Rabbit and the Turtle's Palace (Korea) /
  Thỏ và Cung Điện Dưới Biển. Only traditional, public-domain stories, retold in our own words.

## 4. Checks
New `unlocks` unit tests (`tests/unit/unlocks.test.mjs`: the rule, migration of `tales`, two children, Studio switch)
and a browser check `unlocks` (a fresh child sees locks and the note; after three finishes of each first-set game the
second set and the badge appear; the switch opens all; phone, tablet, computer; English and Vietnamese). For every new
game: `games` (the count rises), auto play finishes it (`tests/owner-autoplay-plans.mjs --ids=...`), `gameflow`,
`gamewinlayout`, `phone`, `bilingual`, `emoji`, `noemoji`, `preload`, `types`, `unit`, `studioswitches`. For stories:
`films`, `voicearea`, `voice`, `tales`. Then the GitHub full suite (`.github/workflows/full-suite.yml`) on the branch.

## 5. Order of work
1. Unlocking, the note, the badges and the Studio switch, with every place a game or story is offered (section 1);
   checks; push.
2. Games by category, one category per commit (smallest first: Me, Big thinkers, Music, Words, Animals, Numbers,
   Shapes, Going places, Vietnamese games, Play outside, Money, Reading corner, Pictures); checks after each; push.
3. Stories by shelf (World, then Australia, China, India, Vietnam); voices recorded with Azure; films; checks; push.
4. Board line "ready for Release" with the branch, the last commit and every check's result. Release merges it into the
   r90 round, runs the full suite and asks the owner "yes, deploy".
