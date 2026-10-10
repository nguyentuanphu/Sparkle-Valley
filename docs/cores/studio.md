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

## How saving works (owner, round P)
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
- Two steps for everyone, the owner too: password, then a TOTP code (`admins.mjs`: HMAC-SHA1, 30 s, one step either
  side, node `crypto`, no package; a code is taken once). The first sign-in returns the secret and an `otpauth://`
  link (shown as text and a link; there is no QR helper in the project and the owner chose no QR codes in round D) and
  is finished with the first code. An admin with a new phone: Admins → New phone. The owner: change `STUDIO_PASSWORD`
  in Netlify and set it up again (the owner's two-step belongs to that password).
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
until Publish; only the family's files change), PRIV rules (no keys in the repository; passwords kept only as hashes;
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

## Owner's decisions to keep
- Five sections, big cards, fast page changes (round K).
- Everything sent back to Studio is labelled “Analytics” (round L).
- Admins have their own accounts: Viewer, Editor, Owner; nobody else needs a GitHub token (round O).
- Saves wait and Publish sends them in one go; ✕ on a real photo takes it off for good (round P).
- Family photos are private, loaded only by the family's devices with a family code; random names (round R privacy).
- Two-step sign-in for everyone (the owner can choose password only for any account, their own too, in Setup → Admins; owner, 9 Oct), 12+ character passwords, lockout, access log, Sign everyone out (round R privacy).
- Studio review (owner, 10 Oct, "go all"): changes not saved ask before leaving; clear results after Save and Publish; everything in Vietnamese; 44 px buttons and boxes; Villagers as cards on a phone or tablet; Releases folds its dates on a phone; Home buttons first on a phone; "Defaults for every device" card; Releases wins over Defaults for the valley's things (said beside them); pictures chosen from the game's drawings.
- Check-ins (owner, 11 Oct): once the owner has said go, the Studio chat checks the board, its branch and the GitHub issues every 5 minutes, acts on anything new, pushes its branch when its checks pass and keeps its Now line current; check-ins pause while it waits for a go. Times in this chat are given in Sydney time (AEDT, UTC+11, in October).
- Round T, Map page (owner's go, 11 Oct): things kept aside from the old map are listed to place again (next to the same place on the new map, through `LEGACY` in `js/content/map.js`) or forget; old move, remove and flat-land circles are not carried over. Villagers and buildings saved from the Map page also store `place` (a `PLACES` id) and `off` (offset from its anchor), as well as x and z.

## Progress notes

- 11 Oct 09:20 AEDT (Sydney), commit d5c24042 (branch `claude/quirky-meitner-dsxo5i`): Map page, things kept aside from the old map. Full suite 86/86 pass (`studio` with the new parked-items part; `multiplayer`, `meet`, `cloud`, `netgames`, `together`, `knock` skipped: no local PeerJS or MQTT server in this chat). Screenshots looked at: Map page kept-aside card on phone 390, tablet 820, computer 1280. No new spoken lines. SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).
