# Superseded screenshot-card draft

**The owner rejected this screenshot-card approach. Use the [current illustrated campaign](illustrated/README.md) instead: eleven storybook illustrations following the supplied reference, including the under-five Simple screen, landmarks, food stalls and hàng gánh.**

The files below remain only as a historical draft; do not use the old ZIP for the Facebook post.

---

# Seven Vietnamese Facebook cards

Owner request and art direction, 23 October 2026 AEDT: seven Facebook images and a short Vietnamese caption. Make the presentation playful and cartoon-like while preserving Sparkle Valley’s own artwork and theme. The earlier generated illustration direction is excluded from this package.

## Ready to use

Upload the seven numbered PNGs in `images/` as a Facebook gallery, starting with 01. Each is 1080 × 1350 (4:5) with `sparklevalley.au` visible. Copy `facebook-post.txt`. `sparkle-valley-facebook-vi.zip` contains the seven PNGs and caption. `contact-sheet.png` previews the set. Nothing has been posted to Facebook.

1. Vietnam/Australia, bilingual play, ages 2–8.
2. Letters, counting, shapes, listening and colours: opportunities for practice.
3. Vietnamese folk games: Ô Ăn Quan, Kéo Co and Thả Diều.
4. Supported Vietnamese stories, Tết and Trung Thu.
5. Adventures, family tasks and activity-dependent rewards.
6. Parent controls: age/difficulty, language/audio, rest reminders and online choices.
7. Device-local per-child Play report, with sample data prominently labelled **Số liệu minh họa**.

## Art and factual sources

The cards compose actual game images and original `artSVG` icons with the bundled Fredoka/Baloo 2 fonts, game colours, rounded panels and outlined icons. No new characters or repainted scenes. Saved marketing captures come from `../website-review-20261023/assets/game-previews/`; these are existing staged project scenes, not fresh latest-release verification. That folder’s manifest records their original source and hashes. The festival and parent-controls folders have their own source manifests. Parent controls, original icons, and report module are pinned to r88 `781089d6`. The newly captured report uses a fresh isolated example profile, never real family data.

The seven-day chart totals 93 example minutes and 15 rounds. Favourite-game counts are 6 + 5 + 4. The actual report counts played rounds, including early exits; this is not a learning score. No cloud dashboard, screen-time lock, guaranteed learning outcome, or new parent quiz editor is advertised. Website/HUD integration on the separate family-website branch remains pending.

## Reproduce and review

Serve the repo root with `python3 -m http.server 8765`, then run `node docs/facebook-vietnamese-20261023/build.mjs`. The script loads the original game icons at the pinned commit, renders every card with Playwright and checks image loading, text overflow, footer bounds and the exact public URL. `sources.json` records inputs and those checks. `capture-example-report.mjs` reproduces the report capture from a compiled isolated r88 export (see its header); all requests stay in its local browser route and no family API is called.

All seven full-size images and the contact sheet were visually inspected. Vietnamese uses the original font subsets from `css/fonts.css`. The festival landscape image was resized within its layout; the report registry is loaded so example favourite games appear correctly. These were layout corrections during creation, not failed game tests. No game code, spoken lines, release number, live website or child saves changed. No game suite was run for these static promotional assets. Ready for owner review; this branch does not authorize deployment.
