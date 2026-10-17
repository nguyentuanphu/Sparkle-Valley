# Studio core

**You make Sparkle Studio, the grown-ups' dashboard:** the Windows exe and the same pages online at `/studio/`,
signing in and admins, saving and Publish, and every family page (message, children, album, quiz, stories,
villagers, Simple screen, music, map, real photos, play time, voices, ads, analytics view, website, check, settings).

## You own
- `studio/` (`core.cjs` the engine, `studio.cjs` the exe's server, `ui/` the pages, `build-exe.sh`, `version.json` with Release)
- `netlify/functions/studio.mjs`, `netlify/lib/admins.mjs`, `netlify/lib/accesslog.mjs`
- Family photos with Analytics & Infra: `netlify/lib/family.mjs`, `netlify/functions/family.mjs` (`/api/family/<name>`)
- `js/custom.js` (how the game reads `content/custom.json`) with Kid UI and Play
- `tests/studio-check.mjs`
- In-game ads made in Studio: `js/ads.js` (off unless Studio turns them on)

## How saving works (owner, round P; r81: the content pages are live, see Owner's decisions)
Online, a save waits on the website (Netlify Blobs store `studio-pending`) and is read back at once; Publish (N)
sends all waiting changes to GitHub as one commit and puts them live; “Drop all waiting changes” forgets them. The exe
saves into the game folder and sends to GitHub in two steps (draft, then Publish). Only the family's files can change
online: `content/`, `voices/`, `photos/`, `tools/voice-extra.json`.

## Family photos are family-only (owner, round R privacy, 9 Oct)
Photo faces and Family album pictures never go into `content/` (the site publishes "." and GitHub keeps every file).
`core.cjs` puts each one in a private family store under a random name (24+ characters from `crypto`) and
`content/custom.json` names it `family:<name>`. Studio shows them through `/studio/api/familyphoto/<name>`.
- Online: Netlify Blobs store `family-photos` (`netlify/lib/family.mjs`). The game fetches `/api/family/<name>` with
  the header `x-family-code`; the code is compared in constant time with `FAMILY_CODE` (Netlify) or the one Studio
  made (Blobs). Ten wrong codes lock a connection for 15 minutes; 300 requests a connection in 10 minutes; the answer
  is `Cache-Control: private, no-store`.
- Family → Family code: shows the code (any editor or owner) and makes a new one (owner). A grown-up types it once on
  each child's device (game: Grown-ups → Children → Family photos). A new code stops every device until the new one is
  typed; the next time a device is online its kept copies are cleared.
- The exe: never writes photos into the game folder. When the website and a Studio key are set in Settings, each photo
  is sent to the website's private store (`/studio/api/family/upload` with `X-Studio-Key`), because the children's
  devices can only reach the website. A copy stays in `%APPDATA%\SparkleStudio\family-photos` (outside the game
  folder, so never zipped, drafted or published), and the game run from the exe reads it from there
  (`/studio/game/api/family/<name>`, this computer only, no code). With no website set, photos stay on that computer
  only and only the game run from the exe shows them (the Family code page says so).
- Moving old photos: "Move family photos to private storage" (Family code, Family album and Villagers pages; the Check
  page warns while any are left) moves every `content/faces` and `content/album` file into the private store, rewrites
  `custom.json` and removes the public files. Online the removals wait for Publish; in the exe, "Save a draft" now also
  deletes `content/faces` and `content/album` files from GitHub that are gone from the folder. Old copies remain in
  GitHub history and old Netlify deploys until the owner removes them there.
- Saving the content pack deletes from the store any family photo it no longer names.

## Signing in online (owner, round R privacy, 9 Oct)
- Two steps for every admin: password, then a TOTP code (`admins.mjs`: HMAC-SHA1, 30 s, one step either
  side, node `crypto`, no package; a code is taken once). The first sign-in returns the secret and an `otpauth://`
  link (shown as text and a link; there is no QR helper in the project and the owner chose no QR codes in round D) and
  is finished with the first code. An admin with a new phone: Admins → New phone. **The owner signs in with
  `STUDIO_PASSWORD` only** (owner, 11 Oct: "only admins need this"; it was a choice in Setup → Admins).
- Passwords: 12 characters or more for admins; a `STUDIO_PASSWORD` shorter than 12 makes sign-in refuse with the reason.
  An admin whose old password is shorter is asked to get a new one from the owner.
- Ten wrong passwords or codes on an account or from a connection lock signing in for 15 minutes (Blobs store `guard`,
  `netlify/lib/guard.mjs`; only a keyed hash of the connection is kept).
- Access log (Blobs store `studio-log`): sign-ins, failed tries, lockouts, two-step set up or cleared, every opening of
  the Analytics, Sign everyone out, new family codes, Studio keys. Town and country from Netlify's geo, never the
  address. Setup → Access log (owner) lists the last 200; the newest 1,000 are kept.
- Setup → Security (owner): Sign everyone out (a generation counter in `studio-admins` signs every cookie and exe key),
  and Studio keys for SparkleStudio.exe (`svk.<id>.<secret>`, shown once, kept as a hash; they reach only the players
  report, the missing-lines inbox, device names and the family photos). The exe no longer sends `STUDIO_PASSWORD`.

## Studio review (owner, 10 Oct: "go all")
- Pages where you change things (Message, Missions, Children, Album, Quiz, Stories, Villagers, Releases, Festivals,
  Simple screen, Music, Map, Defaults, Ads, the exe's Settings) show "Not saved yet / Saved / No changes" by Save; leaving
  (another section, Back, the browser's Back, the language, reload, closing) asks first, and leaving without saving puts
  the family's content back as it was.
- Saving and Publish say clearly what happened and what comes next (a bigger message, above the bottom bar on a phone);
  after Publish the waiting count at the top clears at once. Releases and Festivals say at the top whether Save puts it
  live at once (online) or needs Publish (the exe).
- Everything in Vietnamese: the game's own names (games, areas, places) follow Studio's language, and every message the
  servers send is shown in Vietnamese (`studio/ui/vi.js`; the `studio` check fails if a server message has none).
- Every Studio button and box is 44 px or more on a phone and a tablet (checked on 21 pages). Villagers is one card per
  person on a phone or tablet; Releases on a phone shows name, on/off and More (the dates fold under More); one quick
  start-day list replaces the four small buttons. Home on a phone shows the buttons first and the numbers small.
- The "Play time" card is now "Defaults for every device", like its page; the Setup section is "Thiết lập" in
  Vietnamese (Settings stays "Cài đặt"). The valley's things can be switched on Defaults and in Releases: when Releases
  has a setting, it wins (as `featureOn` in `js/custom.js` already did), and Defaults says so beside that switch.
- Stories and the Family quiz choose pictures from the game's drawings (+ Picture); the chosen ones show as drawings.
- The Voices page reads the game's files once while Studio is open (↻ reads them again).

## Hard rules (§9.6)
STUDIO-001 (the exe and online Studio are one program, the same version as the game), STUDIO-002 (online saves wait
until Publish, except the content pages, live at once since r81; only the family's files change), PRIV rules (no keys in the repository; passwords kept only as hashes;
PRIV-012 family photos family-only; PRIV-013 two-step sign-in, lockout and access log).

## Checks you run
`studio` (runs `tests/studio-check.mjs`: a pretend GitHub and Netlify, the exe and the online Studio side by side),
`unit` (`tests/unit/privacy.test.mjs`: two-step, lockout, access log, keys, family photos, no browser), `familyphotos`
Build the exe after changes: `bash studio/build-exe.sh`.

## Talks to
- **Analytics & Infra**: the Analytics page shows their report; Netlify environment variables.
- **Voice & Audio**: voices and music uploads.
- **World**: the map and building page writes their world format.
- **Release**: the exe goes into each round's packages.

## Owner's decisions
- (17 Oct AEDT, r81) **The content pages go live at once, without Publish.** Message, Missions, Quiz, Our stories, Villagers (names, voices, photo links), Story characters, Memory Villages, Simple screen, Defaults and Ads settings save to the website's live store (`/studio/api/live/content`, Blobs store `live`, key `content`; needs "Change pages") and reach every device through `/api/live` (about 30 seconds); a live section wins over `content/custom.json`, which stays the fallback. SparkleStudio.exe saves them in its folder (Publish still works) and sends them with its Studio key when the website and a key are set. Music, the map and buildings, recorded voices, real photos, ad pictures and game code stay on Publish. Each page says "Live" or "Needs Publish" in English and Vietnamese. Code: `netlify/lib/live.mjs` (`cleanContent`, `saveContent`), `netlify/functions/studio.mjs`, `netlify/functions/live.mjs`, `netlify/lib/admins.mjs`, `studio/ui/app.js`, `studio/core.cjs`, `studio/studio.cjs`, `js/custom.js`, `js/main.js` (Message and Defaults follow `onLive`), `js/ads.js` (an ad whose picture is not published yet is not shown); checks `tests/unit/live-content.test.mjs`, `studiolive`, `studio`.
- (14 Oct AEDT) **Admins get permissions one by one** ("for admin and owner give them more granular access level in details which can be granted"). Setup → Admins shows each person's permissions as ticks: See Analytics, Name devices, See tester reports, Mark tester problems, Open pages (look only), Change pages (waits for Publish), Make and record voices, Switch features and festivals (live at once), Family photos and code, Make a new family code, Publish, Rebuild the website, Put code live. The roles Viewer, Editor and Owner are ready-made sets that do what they did before; ticking one box makes the role "Chosen". Managing admins, Security and the Access log come only with Owner, so nobody can give themselves more. Code: `netlify/lib/admins.mjs` (PERMS, PRESETS, needs, allowed), `netlify/functions/studio.mjs`, `studio/ui/app.js`; checks `tests/unit/perms.test.mjs` and the `studio` check. The owner said Release may push and deploy it when it fits.
- (14 Oct AEDT) Studio's Releases page is readable in dark mode on phones, and Analytics no longer times out (504): the report reads the store many at a time and tidies once a day (`fix/studio-dark-analytics`).
- **11 Oct AEDT: no two-step for the owner.** The owner signs in with `STUDIO_PASSWORD` only; two-step is for admins (`netlify/functions/studio.mjs`, Setup → Admins shows the owner as "password only"). to keep
- Five sections, big cards, fast page changes (round K).
- Everything sent back to Studio is labelled “Analytics” (round L).
- Admins have their own accounts: Viewer, Editor, Owner; nobody else needs a GitHub token (round O).
- Saves wait and Publish sends them in one go; ✕ on a real photo takes it off for good (round P).
- Family photos are private, loaded only by the family's devices with a family code; random names (round R privacy).
- Two-step sign-in for admins (the owner can choose password only for any admin in Setup → Admins; owner, 9 Oct); the owner signs in with the password only (owner, 11 Oct), 12+ character passwords, lockout, access log, Sign everyone out (round R privacy).
- Studio review (owner, 10 Oct, "go all"): changes not saved ask before leaving; clear results after Save and Publish; everything in Vietnamese; 44 px buttons and boxes; Villagers as cards on a phone or tablet; Releases folds its dates on a phone; Home buttons first on a phone; "Defaults for every device" card; Releases wins over Defaults for the valley's things (said beside them); pictures chosen from the game's drawings.
- Check-ins (owner, 11 Oct): once the owner has said go, the Studio chat checks the board, its branch and the GitHub issues every 5 minutes, acts on anything new, pushes its branch when its checks pass and keeps its Now line current; check-ins pause while it waits for a go. Times in this chat are given in Sydney time (AEDT, UTC+11, in October).
- Round T, Map page (owner's go, 11 Oct): things kept aside from the old map are listed to place again (next to the same place on the new map, through `LEGACY` in `js/content/map.js`) or forget; old move, remove and flat-land circles are not carried over. Villagers and buildings saved from the Map page also store `place` (a `PLACES` id) and `off` (offset from its anchor), as well as x and z.
- r65 Studio round (owner's go, 12 Oct AEDT, "all three"): a cleaner Analytics page (five tiles, one row per child and per kind of device, the rest folded under "More detail"; battery and frame numbers shown as "not reported yet" until the battery chat sends them, field names on the board); the broken real photos fixed (Vietnamese letters in folder names, photos too big to send, photos listed but gone) and proved in the `studio` check; ads get a live preview of the signboard and the after-game card, a picture guide from real screenshots (`docs/ads-guide/`) and a checklist before an ad can go live.

## Progress notes

- 11 Oct 09:20 AEDT (Sydney), commit d5c24042 (branch `claude/quirky-meitner-dsxo5i`): Map page, things kept aside from the old map. Full suite 86/86 pass (`studio` with the new parked-items part; `multiplayer`, `meet`, `cloud`, `netgames`, `together`, `knock` skipped: no local PeerJS or MQTT server in this chat). Screenshots looked at: Map page kept-aside card on phone 390, tablet 820, computer 1280. No new spoken lines. SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).
- r60 Studio round (owner, 11 Oct AEDT): wait for r60 on main before starting (done 16:54); build all three (map stamp, Story characters, Plots page) in this round; add start-up times to the Analytics page (asked by Analytics & Infra). Story characters sits in the Game section, Memory Villages (the Plots page) in the Family section, which now has nine cards.
- 11 Oct 21:00 AEDT, commit f0e38c56 (branch `core/studio`, from main r60): Story characters page (`looks`), Memory Villages page (`plots` by plot id, spare plots found by opening the game out of sight), start-up times on Analytics; the Map page stamps `world.map`. `studio` pass (new parts: looks saved and taken off, a home on a plot saved and taken off, spare plots found, start-up lines shown, Family nine cards). Full suite 95/97: `startup` fails the same on main r60 (PERF-001 firstKB 1088 > 1035, firstTitleMs 1650 > 1130; Analytics & Infra), `hoilang` failed once and passed on a rerun (on main and this branch); skipped: `multiplayer`, `meet`, `cloud`, `netgames`, `together`, `knock`, `mapver` (no local servers). Screenshots: Story characters and Memory Villages on phone 390, tablet 820, computer 1280. No new spoken lines. SparkleStudio.exe needs rebuilding.
- 12 Oct 16:45 AEDT, commit 4df94541 (branch `core/studio`, from main r64 + `round-t`): r65 Studio round. Analytics: five tiles, a row per child and per kind of device, the rest folded under More detail, battery and frame numbers from the report's `power` fields (names on the board) or "not reported yet". Real photos: the cause was found in the real `studio-draft` photos (185 listed): 49 in folders named with Vietnamese letters were refused by Studio's file door (403; the game itself took them), 10 over 4 MB (up to 13.6 MB) cannot come back from a Netlify function, 3 were listed with their file gone; fixed in `studio/core.cjs` and the Photos page, and the `studio` check reproduces it (with the old rule it fails on `photos/vi-hải-đăng-vũng-tàu/1.jpg`) and proves every saved thumbnail opens online and in the exe. Ads: live preview of the signboard and the after-game card, a checklist before going live, a picture guide from real game screenshots (`docs/ads-guide/`), the ad videos linked. Checks: `studio`, `nostudio`, `phone` pass. Full suite 106/107: `startup` fails on the title time only, the same on main r64 (firstTitleMs 1863 > 1203 on main; 2303 > 1345 here alone; in the full run the second start was slow too, not on a rerun); online checks skipped as before (no local PeerJS or MQTT server: `multiplayer`, `meet`, `cloud`, `netgames`, `together`, `knock`, `mapver`). Screenshots looked at: Analytics and Ads on phone 390, tablet 820, computer 1180; the guide's game screenshots (computer and phone). No new spoken lines. SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`; the guide pictures are in its file list).
- 12 Oct 17:20 AEDT: r65 (the reading games) went out meanwhile; main r65 merged into `core/studio` (9e871aac, only the release notes conflicted: both kept). `studio`, `nostudio`, `phone` pass again on the merge. So this round goes into the next release (r66 or later).

Owner steering (this chat, 15 Oct AEDT): the combined Tester/Autoplay tool becomes Sparkle Lab, with its own Studio menu immediately beside Releases. Preserve device policies, permissions, schedules and unrelated release settings. Improve Releases and Analytics loading; no main merge or deployment approved. Latest Audio correction is a horizontal row of only Music, Sounds and Voice icons.
- 17 Oct 10:25 AEDT, commit 96d783f6 (branch `work/studio-live-20261017`, from `work/r80-20261017`; draft pull request #330): r81 Studio live, the content pages go live without Publish. Checks: `unit` (145, with the new `live-content.test.mjs`), `studiolive` (new), `studio` (now proves the online Message goes live with nothing waiting, and the exe's Message goes live with its Studio key), `nostudio`, `phone`, `rules`, `arch` pass; `types` skipped (no npm install here). `suite --changed` chose the full suite: GitHub run 38981057532 on the pull request. Pictures looked at: Message, Defaults, Ads, Music on phone 390, tablet 820, computer 1280, and Message in Vietnamese, before and after (`docs/owner-repair-20261014/evidence/studio-live-*`). No new spoken lines. SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).
- 17 Oct about 11:05 AEDT (takeover chat, branch `work/studio-live-20261017`): owner's pop-up "Both": `js/launch.js` update-notice switch follows the kept live copy (`sv2_live` `content.features`), Studio's Simple screen page also loads `js/games/readingmenu.js` so the 12 reading games are listed in the Reading corner ("only while the reading trial is on" on its heading, EN and VI). Commits `ecd35764`, `19279246`; `origin/work/r80-20261017` and `main` (r80 live) merged in. The owner then asked this chat to act as Release: version r81. Checks (17 Oct AEDT): `studiolive` pass (and fails without the launch.js change: `noticeLiveOff` true), `studio` pass (12 reading games listed, Vietnamese names), `unit` 145 pass, `nostudio`, `phone`, `rules`, `arch`, `ground` (build r81) pass; `types` skipped (no npm install here). `suite --changed` chose the full suite (`netlify/functions/live.mjs` named by no check): GitHub run on pull request #330 (the earlier run 38981057532 was cancelled by the push). Pictures looked at: Simple screen's Reading corner on phone 390, tablet 820, computer 1280, phone in Vietnamese. No new spoken lines. SparkleStudio.exe needs rebuilding after r81 goes live (Release).
- 17 Oct about 12:15 pm AEDT, code at `e327320c` (branch `work/studio-live-20261017`, release r81): GitHub's `types` was red on the first chat's code (`studio/core.cjs` LocalHelpers had no `live`), fixed. GitHub full suite run 38984664586: 198/200; `voicecover` and `ownerfamily` failed there, both pass here on r81 and are r80's flaky checks (r80's own run passed them only on the second try). GitHub quick checks and Checks pass. Speed checks here: `perf`, `battery` pass; `startup` fails on r81 (title 1785 ms, ready 25.1 s) and worse on live r80 on the same machine (1862 ms, 33.1 s): not this round's. Pictures `docs/owner-repair-20261014/evidence/r81-release/`. Waiting for the owner's "yes, deploy".
