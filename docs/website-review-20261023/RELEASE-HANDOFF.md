# Release handoff: family website, parent controls and game integration

Owner request, 23 October 2026 AEDT. Integration branch: **`work/family-website-20261023`**, based on main r88 `781089d6`. No new release version or main deployment is approved by this handoff. Fetch the branch's latest head; the earlier design branch is `docs/learning-banner-20261021`.

[Open the private rendered preview](https://sparkle-valley-family-preview-20261023.henry-tpnguyen.chatgpt.site) · [Website/game rules](WEBSITE-RULES.md) · [Parent controls and play reports](parent-controls-guide.md).

## What is finished, and what is still integration work

- Website implementation/prototype: four main destinations; full EN/VI information, game pictures, Vietnamese folk games/stories, complete quest guide, parent-created quiz instructions, festival directory, prizes/badges, parent settings and per-child report explanations. This is an interactive design, not the production `/home/` replacement yet.
- Parent reporting already exists in main: Grown-ups → Children → the child's Play report; weekly family notes when enabled. The website now explains these existing features and includes a clearly labelled illustrative report graph. Keep its “made-up data” label in both languages, including when embedded. No new statistics backend, private parent dashboard, cross-device aggregation or self-service quiz editor was implemented.
- Generation/checking tooling is implemented on this branch: source-backed catalogues, artwork, tokens, fonts and release metadata; a review gate for changed runtime/content/assets; proposed CI rebuild/artifact workflow. Production build integration and making that check required remain for Release.
- **No game runtime files were changed by this branch.** In particular, moving Home and raising the quest bar are owner-requested integration work below. The preview represents the intended Welcome/Settings entry; it does not prove the live game has changed.
- Local screenshot captures use an isolated, empty example profile, not real children. Parent controls/report captures must show r88; older r87 captures were replaced. The actual report captures are empty. A separate interactive graph uses owner-requested, clearly labelled invented example data: 93 minutes/15 recorded rounds over seven days, plus example favourite activities from saved history. It is a demonstration, not a child report or educational score.

## Owner's placement decision: Home moves into Settings

Keep a website entry on the Welcome screen. During play, move the website/Home entry **out of the HUD and into Settings**. Do not remove the separate About/credits control or confuse this with the device's “Add to Home Screen” install button. Use the house-and-star Website artwork, with an EN/VI label. Quick Settings is enough for the informational website entry; sensitive family controls and reports retain their existing press-and-hold protection.

The quest bar should move up to use the space released by the HUD Home button, **where the current layout safely permits it**. Preserve other controls, long objective text, folded goals, the daily adventure and family-mission rows. Do not blindly subtract a fixed number of pixels or raise every desktop/split-screen layout.

## Exact integration files and conflict risks

| Area | Existing source on r88 | Required care |
| --- | --- | --- |
| HUD Home | `js/hud.js`, constructor `.homebtn` and its click binding | Remove markup **and** unconditional `this.q('.homebtn').onclick`. Leaving the latter will dereference null and break HUD construction. Convert a touched JS source to TypeScript first under the project's policy, using the proper type declarations/build updates. |
| Quest geometry | `js/hud.js`: `fitQuest()`, `layout()`, ResizeObserver; `css/style.css` quest rules | Preserve desktop gap fitting and mobile navigation reserves. Review the phone `+48px` base and `+104px` companion-row rule, `--quest-below-top`, `.quest-below-nav`, landscape `.adv-on`, safe areas and each player's rectangle. Measure visible rows; don't stack another unconditional offset override. |
| Left HUD stack | `css/style.css`: `.hud-tl`, `.hud-btns`, `.homebtn` and phone stacking rules | Remove Home-specific spacing without disturbing Big pictures, companion controls or the portrait/gear Settings entry. Do not leave an empty wrapper reserving the old height. |
| Welcome | `js/ui.ts`: `showTitle()` and its whole-screen click handler | Add a labelled website entry and exclude its click from starting the game. Keep About, language, learning-language, install and Start behaviors. Load optional website code lazily so it does not delay Welcome. |
| Settings | `js/ui.ts`: Quick Settings; `js/ui-settings.ts`: protected Grown-ups | Add Website to Quick Settings, preserving scroll/close/focus return and current selections. Do not bypass the grown-up gate to reports, backups, family data or permissions. |
| Floating website | Existing shared `js/popups.ts`/UI modal lifecycle; a deferred website module if needed | Use the approved stable shell and a separate scrolling surface. Preserve current play/ride/quest state; block gameplay input behind the website; follow normal modal pause/accounting behavior so reading the website is not counted as active play. No game restart or new tab. |
| Standalone website | `home/index.html`, `home/app.ts`, `home/style.css`, `home/analytics.ts` | Adapt the reviewed design into the real app. **Do not ship `prototype.html` unmodified**: its demo Website/Welcome/In-game switcher, fake stage and Play behavior are review controls. Standalone Play must enter the real game; embedded Play/Back closes the website and returns to the existing session. Preserve existing privacy/consent behavior. |
| Packaging/version | `build-netlify.sh`, `netlify.toml`, service-worker source and game build metadata | Package the generated website from the exact release SHA with the game. Check `/home`, direct section links and asset paths, Git builds and drag/drop zip. Release owns version changes; do not choose a version from this note. |

Coordinate/claim those shared files on `docs/cores/BOARD.md` before editing and inspect other active branches/PRs. This branch does not claim another chat's runtime work. Preserve current camera/ride/sound improvements and parent-data contracts; do not overwrite whole shared files from the older design branch.

## Floating view and private data boundary

- Keep website styles/scripts isolated from the canvas and game UI. A same-origin iframe or isolated document must not copy parent saves/statistics into the marketing content. Keep keyboard, pointer, touch and focus inside the active website view.
- Preserve the opener, Settings scroll/state, current language, selected player, quest, inventory, ride position and session. Close/Back/Escape should restore the existing view and input once; no retained listeners or duplicate dialogs after repeated opens.
- If using frame messages, allow only explicit close/play navigation requests; validate both exact origin and `event.source` against the opened frame. Do not accept arbitrary commands, quest/reward claims or family-data payloads.
- Keep local Play reports separate from the game's Analytics setting. Reports include recorded play, including left-early activities; they are not school marks. Enabled Analytics may send profile first names/age groups and device/activity information. Do not advertise it as wholly anonymous.
- Backups are manually saved/opened files; no automatic Drive/iCloud sync was added. Family Quiz editing still requires protected editor access. Optional family features depend on rollout/access settings. Bedtime currently uses the game's labelled AEST clock, not Sydney daylight-saving time.

## Required acceptance checks for Release

1. Start from latest main, merge this branch into an isolated release branch and inspect the diff. The incoming website artifacts/tooling should not replace runtime game files. Resolve board/core-note conflicts by keeping the latest release state and the new website request, not by taking an entire old document.
2. Implement the entry/floating/build changes above, recording source claims and existing branch conflicts. Keep all detailed copy and four main destinations; no new nested maze of top-level menus.
3. Check EN/VI at phone, tablet, computer, narrow phone and phone landscape; inspect screenshots. Include under-5/older profiles, long objectives, folded/unfolded goals, daily adventure on/off, companion row present/absent, two-player same-device and face-to-face layouts, safe areas and rotation.
4. Measure quest/nav/player rectangles for overlap **after** removing Home. Confirm the quest bar is higher where space was released, with no lost objective/repeat/go controls. Welcome Website must not start the game; Settings Website must not open a new tab or close/reset play.
5. Test floating open/scroll/language/menu/deep-link/Back/Close/Escape/focus return repeatedly. Confirm input blocking, saved state, modal accounting, frame-message rejection and bounded listeners. Check standalone Play and embedded return behave differently and correctly.
6. Run `SV_WEBSITE_SOURCE=<release-sha> node docs/website-review-20261023/sync-website.mjs`. Review changed source files, descriptions and affected captures before `--record-reviewed`; commit the review lock and explanation updates together. Verify game/cache/editor/site versions agree. Add the website consistency result to required release/branch protection checks; committing the workflow does not configure protection.
7. Use the repository's changed-check selection. If it selects the full suite, run it on GitHub per CLAUDE.md; never run two suites together and never weaken a check. Runtime integration needs relevant HUD/phone/contract/offline/update/website tests, GitHub full suite, local serial speed checks, screenshots and the Netlify zip before the owner's release approval. Old design QA is not proof of these runtime checks.
8. Test cold/warm/offline/old-cache update and the actual built `/home/` assets. Avoid adding the entire picture-heavy website to the game's eager startup cache: use the approved lazy/offline strategy and measure the budget. Explain offline availability truthfully.
9. Report changed behavior, every pass/fail/retry/skip, production gaps, AI review status and performance limitations. Obtain the owner's current round/version and explicit per-round “yes, deploy” before main/Netlify. This handoff and prior r88 approval do not approve a new release.

## Current validation

Parent controls/report and navigation checks pass five layouts; original photo/quest/Family Quiz/printing regression also passes five layouts. Current-main changed-file suite: **9/9 pass, 187 unit tests**, serial run of seven minutes. The new illustrative graph has its own day-selection, total, language/state, narrow-screen and disclosure checks in `check-parent-controls.cjs`. Reward/festival results are reused from the prior unchanged r88 preview, not presented as a new run. Runtime integration/full-suite/offline/update checks remain pending as listed above.

## Rebuild and local review

From the repository root:

```sh
SV_WEBSITE_SOURCE=origin/main node docs/website-review-20261023/sync-website.mjs
python3 -m http.server 8765
```

Run browser checks **one at a time**: `check-parent-controls.cjs`, `check-navigation.cjs`, `check-preview.cjs`, `check-rewards.cjs`, `check-festivals.cjs` in this folder. The parent-only addition is checked with parent, navigation and original quest/photo/Family Quiz/printing regressions. Reward/festival checks were previously green on the same r88 source and were not rerun for the parent-only content addition. These results are not a new full game suite.

The private Sites preview's ID, URL and deployment record are in `private-preview.json`. It is owner-private and a separate review deployment, not the public site or an automatic main mirror. Source credentials are never saved in this repo.
