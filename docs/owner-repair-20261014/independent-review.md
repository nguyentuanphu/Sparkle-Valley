# Independent review of the Release chat's work (point 56)

Reviewer: the third AI chat, 16 October 2026 AEDT, branch `work/owner-repair-learning-20261016`.
Scope: `git log 9afa91e7..origin/work/owner-repair-checkpoint-20261015` (33 commits, 15 Oct AEDT, up to c0bcd0bf). The game code changed in 13 files under `js/`, plus `css/style.css`, `index.html`, `sw.js`, `studio/ui/` and the checks. Docs, pictures and voice files were looked at only where the code depends on them.
Looked at: correctness, kid safety, English and Vietnamese, touch sizes, offline, saves. Line numbers are on c0bcd0bf.

As the prompt asks, none of these files were changed here. Each finding is for Release, and each finding says how it was checked: "reproduced" means it was run in a browser; "read" means it was found by reading the code only.

## Findings

| # | Where | What goes wrong | How bad | How checked |
|---|---|---|---|---|
| R1 | `js/state.js:44-47` (with `studio/ui/app.js:645`) | Opening Sparkle Studio online stops a child's game. The new "one tab at a time" lock claims the game for any page on the same site that loads `js/state.js`, and Studio online runs on the same Netlify site (`/studio/`, `netlify.toml`) and several of its pages load the game's `state.js` (as `/studio/game/js/state.js`): Analytics and the Simple screen's areas through `gameLang` and `js/games/all.js` (`studio/ui/app.js:551-554`, `1341-1344`), and pages that load the game's world. The Studio start page alone does not. A grown-up who opens Studio on the same computer or tablet while a child plays turns the child's game into the full-screen "Sparkle Valley is open in another tab or window" card, and the game stops saving until someone taps "Play here". | High: the child is interrupted, and the grown-up did nothing wrong | Reproduced on c0bcd0bf: game page open; a second page on the same site imported `js/state.js?studio`; 1.5 s later the game showed the `.tab-held` card (script: Playwright, one browser context, two pages). |
| R2 | `js/state.js:9` with `js/state.js:191-195` | While a tab is held, `store.set` returns `false`. `saveProfiles` reads `false` as "storage full" and drops each child's oldest album photo in memory, once per save. Nothing is written while held, and "Play here" reloads from storage, so nothing is lost on the device today. But the code now reads "held" and "full" the same way, and a later change that writes after a hold would delete real photos. | Low now (risk for later changes) | Read |
| R3 | `js/launch.js:28` | With the Studio switch "Update notice" off, `svOfferUpdate` does nothing, and that includes the case where a part of the game is already gone after a deploy (`svModuleGone`, point 11). A story film or festival that fails to load then just fails, with no notice. The switch's Studio text says "the new version starts the next time the game is opened", which is true, but it does not mention that a broken part stays broken until then. | Low to Medium: only when a grown-up turns the notice off | Read |
| R4 | `js/launch.js:28` | `window.svFeatureOn` is set by `js/main.js` only after the world is built. An update found before that (a slow first start on a phone) ignores the Studio "off" switch and shows the notice anyway. | Low | Read |
| R5 | `css/style.css:2675-2676` | An explanation note is cut to two lines (`-webkit-line-clamp: 2`, `overflow: hidden`). The current notes fit, and `ownerheartstap` measures the hearts note. But a longer place name in the daily gift note, or a bigger text setting, can cut the Vietnamese note mid-word with no "..." (`text-overflow: clip`). The voice still says the whole line. | Low | Read; not measured with the longest place names or `body.bigtext` |
| R6 | `css/style.css:2549` | The update notice sits 176 px above the bottom of the screen. In landscape on a phone (390 px tall) that is about the middle of the screen, over the valley. It is hidden during activities (`busy()`), but in the valley it may cover the joystick's area or the goal card. Not covered by the update-notice pictures, which are portrait. | Low (to check) | Read |
| R7 | `tests/run.mjs` `ownerexplainswitches` | The check confirms the Studio switch `explain_voiceAsk` is listed with its "Off" text, but never runs the game on mobile data with the switch off. The only proof of that behaviour is reading `js/voicepack.js:157`. | Low (test gap) | Read |
| R8 | `js/hud.js:86-92` | The hearts now take the tap in the middle of the player card, so that tap no longer opens Settings. Grown-ups who learned "tap the card" now have to tap the picture. The tester check was moved from `.pcard` to `.pav` for this reason. The owner asked for it (point 50), so this is intended, not a bug. It is listed so Release can say so in the round's notes. | Info | Read |

## Checked and found sound

- **Offline:** `js/explain.js` is in the service worker's file list (`sw.js`) and preloaded (`index.html`), so the new explanations work offline. The `offline` and `preload` checks cover it (Full results quoted in `STATUS.md`).
- **English and Vietnamese:** every new line on screen and every spoken line in the 13 changed game files has both languages, including the held-tab card, the update notice, the hearts and the gift note, and every Studio switch text with its "Off" meaning. The Vietnamese hearts line is marked Vietnamese in the voice index (c67f85d2, `voicearea`).
- **Touch sizes:** hearts 44 px tall (`.hud .hearts`, measured by `ownerheartstap`), update-notice buttons 44 px, "Play here" 64 px, voice-question buttons 48 px.
- **Kid safety:** nothing new is sent off the device. The freeze report adds only timings and window events (`js/tester.js:143-153`), no content. Under-5s still never lose hearts; the hearts note says so.
- **Daily gift spot** (`js/kidplay.js:120-128`): it is chosen again once the solid map is ready, and the `solid` check walks to every day's spot for 120 days. A sound fix.
- **Module-gone path** (`js/launch.js` `svModuleGone`, film, festival and festival-hunt loaders): the patterns match Chrome's, Safari's ("Importing a module script failed") and Firefox's ("error loading dynamically imported module") messages.
- **Checks were not weakened:** the tester check's tap moved from the card to its picture (R8, intended). The new checks (`ownerheartstap`, `ownerexplainswitches`, `ownerupdatenotice`, `ownerstudioperms`, and the gift and voice-file assertions in `solid` and `voicearea`) add assertions; none were removed.

## Suggested fixes (for Release)

- **R1:** make only the game page claim the tab. Either start the BroadcastChannel claim from `js/launch.js`, which only `index.html` loads, instead of at the top of `js/state.js`, or skip the claim when `location.pathname` starts with `/studio`. Add a check that opens a same-site page importing `state.js` and expects no `.tab-held` card. The reproduction, in short (Playwright, one browser context):

  ```js
  const game = await ctx.newPage(); await game.goto(URL); await game.waitForTimeout(6000);
  const other = await ctx.newPage(); await other.goto(URL + 'css/fonts.css');
  await other.evaluate(u => import(u + 'js/state.js?studio'), URL); await game.waitForTimeout(1500);
  await game.evaluate(() => !!document.querySelector('.tab-held'));   // true on c0bcd0bf
  ```
- **R2:** have `store.set` report "held" separately (for example return `null`), and have `saveProfiles` drop album photos only on a real `false`.
- **R3 and R4:** let `svModuleGone` show the notice even when the notice switch is off, or say this in the switch's text. Read the switch from `content/custom.json` in `launch.js` instead of waiting for `main.js`.
- **R5 and R6:** take the explanation-note and update-notice pictures with the longest Vietnamese place name, with big text, and in landscape on a phone, before calling them done.

## How this review was done

Read every changed code file in `git diff 9afa91e7 c0bcd0bf` (index.html, sw.js, css, 13 game files, Studio), the new checks in `tests/run.mjs`, and the commit messages. R1 was reproduced in Chromium (the swiftshader setup the checks use) against a copy of c0bcd0bf served locally. No other finding was reproduced. Physical devices were not used.
