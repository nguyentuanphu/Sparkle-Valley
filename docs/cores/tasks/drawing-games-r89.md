# Ten drawing games (new brief, r89)

Owner, 23 Oct 2026 AEDT: the helper chat's ten drawing games (`work/drawing-games-20261018`, commits `69df8314` and
`ec932129`) were never pushed and are lost, so this is a new brief. **Owner's go, 23 Oct 2026 AEDT (pop-up): build all
ten for r89; finished lanterns and cards are kept on the device in that child's Album (never uploaded).** Play owns the games; Kid UI the Pictures area; Voice & Audio the spoken lines.

## Where they go

The Play hub's **Pictures** tab (`art` in `js/content/activities.js`), beside Colours, Đông Hồ painting, Rangoli,
Jigsaw and Tangram. None of the ten repeats those five. Each is listed in `GAME_INFO` with an area, a youngest age and a
difficulty, so the Simple screen, Studio's Simple screen page and the checks find it.

## The ten games

| # | id | English / Vietnamese | Youngest | What the child does |
| --- | --- | --- | --- | --- |
| 1 | `dotdot` | Dot to Dot / Nối điểm | 3 | Tap or drag through numbered dots (1 to 5 for little ones, up to 20 for big kids); the picture (a buffalo, a koala, a lantern) fills in and moves. |
| 2 | `trace` | Trace the Picture / Tô theo nét | 2 | Follow a thick dotted outline with a finger; a sparkle follows and a wobble is forgiven. |
| 3 | `mirror` | Mirror Painting / Vẽ đối xứng | 2 | Paint on one half of a butterfly, lotus or kite; the other half copies it. |
| 4 | `colournum` | Colour by Number / Tô màu theo số | 4 | Tap a numbered colour, then the areas with that number (a market stall, Sydney Harbour). |
| 5 | `lanternart` | Decorate a Lantern / Trang trí đèn lồng | 2 | Choose a lantern shape, paint it and add stickers; it then hangs in the village at night (Mid-Autumn). |
| 6 | `card` | Make a Card / Làm thiệp | 3 | Make a card for Tết, a birthday or Mother's Day with stamps and a drawing; it is saved to the child's Album. |
| 7 | `sand` | Sand Drawing / Vẽ trên cát | 2 | Draw on the beach at Vũng Tàu or Bondi; a wave washes it away for a fresh start. |
| 8 | `drawpath` | Draw the Way / Vẽ đường đi | 3 | Draw a line that takes the duckling to the pond around rocks; the duck walks the line. |
| 9 | `shapedraw` | Draw a Shape / Vẽ hình | 4 | "Draw a circle / triangle / square"; the game recognises the shape and says its name in both languages. |
| 10 | `copygrid` | Copy the Picture / Vẽ lại tranh | 5 | Copy a simple picture square by square on a grid (big kids). |

## Rules every game keeps
- English and Vietnamese for everything said or shown; new spoken lines recorded with Azure (lines with a child's
  name are never recorded).
- Touch targets 44 px, 64 px for under-5s; paint with a finger or a mouse; no reading needed to play the little ones.
- Any emoji in the game gets a drawing in `js/art.js`; no emoji in the docs.
- Fixed windows (no bounce), phone, tablet and computer screenshots; the shared game frame (`js/games/frame.ts`) for
  start, level choice, stars, celebration and "next / again".
- New files are TypeScript. Drawings stay on the device; a card goes to the child's own Album only (no upload).
- Autoplay can play each one (so the "autoplay could not work out how to play it" reports do not come back).
- Works offline: every new file in `sw.ts` FILES.

## Checks
A new `drawinggames` check opens each game on phone, tablet and computer, in English and Vietnamese, plays it to the
celebration with autoplay and fails on a page error, a small target, a missing translation or an unrecorded line;
plus `games`, `gameflow`, `gamewinlayout`, `phone`, `bilingual`, `emoji`, `noemoji`, `preload`, `types`, `unit`, and
the GitHub full suite.

## Owner's answers (23 Oct 2026 AEDT)
1. The ten as listed: go.
2. Lanterns (game 5) and cards (game 6) are kept in the child's Album on the device.
