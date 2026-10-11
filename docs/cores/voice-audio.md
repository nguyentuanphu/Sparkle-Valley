# Voice & Audio core

**You make the game sound right:** the recorded voice pack (English, Vietnamese, Chinese, Hindi), the device voice as
the only fallback, the family's own voice lines, music and tunes, sound effects, and silence when the game is put away.

## You own
- `js/voice.js`, `js/packhash.js`, `js/recorder.js`, `js/audio.js` (tunes, instruments, the Music player)
- The pack: `voices/` (manifest and mp3 files), `tools/make-voice-pack.mjs`, `tools/voice-lines.mjs`, `tools/voice-harvest.mjs`, `tools/voice-extra.json`
- Family music files' format: `content/music/` (uploads come through Studio)
- Vietnamese words inside English lines: `js/viwords.js`

## Making voices
`NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node tools/make-voice-pack.mjs --engine azure`
records every new line the game can say (Azure key from the environment, never in the repository). Run it after any
core adds spoken lines (they are listed on the board).

**Voices are made in Studio only (owner, 9 Oct, PRIV-010).** The child's device never calls ElevenLabs, Azure or
Google, keeps no voice key and never copies anyone's voice: the Grown-ups voice engine, its key fields and "Make a voice
from my family recordings" were removed (round R privacy). A line with no recording is spoken by the phone's own voice
and noted as missing (`sv2_voicemiss`), which reaches Studio's voice inbox in the backup, as before. On load, an old
`ttsKey` and its engine and voice choices are deleted from `sv2_settings` (also from a restored backup), and the old
online-voice cache (IndexedDB `sparkle-valley-tts`) is deleted. Studio's own Azure making (`tools/make-voice-pack.mjs`,
the voice inbox in `studio/core.cjs`) is unchanged. Family recordings stay on the device.

## The pack by area (round R item 12)
- **Own language only:** a device downloads the languages its children hear (the game's language, and the other one
  too when both are spoken); Chinese and Hindi come only with the places and games that speak them.
- **A core of 5–8 MB per language** downloads first on any connection: the start, home, Làng Sen, the menus, the
  Simple screen, numbers 0–20 and the lines said in three or more games.
- **The rest area by area:** `voices/areas.json` (made by `tools/make-voice-pack.mjs`, `--areas` rewrites it without a
  key) lists which lines download with which area: place ids (`village`, `town`, `hanoi`…) and `games`, `stories`,
  `festivals`, `world`. Where a line was heard while playing (`tools/voice-where.json`, written by
  `tools/voice-harvest.mjs`) wins over the file it is written in (`tools/voice-lines.mjs` FILE_AREA). The order: the
  place the child is in (from the event bus, never a position), places the children have been, games, stories,
  festivals, the other places, the rest.
- **Wi-Fi by itself, mobile data after a grown-up's yes** (owner, 10 Oct): `js/packbar.js` asks once the core is in
  (Yes is a press and hold; Not now asks again in a week); Grown-ups → voices has the same switch (`packCell`). A phone
  or tablet that can't tell (iPhone, iPad) counts as mobile data; a computer that can't tell counts as Wi-Fi.
- **Lines from parts:** `say()` lines with `${…}` are templates (manifest `tpl`); their fixed pieces, the words the code
  names for a gap, the gap words found in harvested lines, and the numbers 0–100 are recorded as parts, and
  `js/voice.js` plays them in order. A gap that is a name is never recorded and is left out (HANDOFF rule 11).
- After new lines: `node tools/voice-harvest.mjs`, then `node tools/make-voice-pack.mjs --engine azure` (it rewrites
  the manifest and `voices/areas.json`), then the `voicecover` check.

## Hard rules (§9.6)
VOICE-001…003: the recorded voice is the voice (the device voice only for lines with a name in them); the pack is
downloaded to the device by itself with a small quiet bar; once on the device a start checks a few files and shows
nothing; it plays offline. PRIV rules for family recordings; PRIV-010 (no online voice, voice key or voice copy on the
device).

## Checks you run
`voice voicepack welcomevoice songs quiet voicecover voicearea`

## Talks to
- **Every core** that adds a line a child hears: they list it on the board; you record it.
- **Play**: the song list (`js/content/songs.js`) is theirs, the tunes are yours.
- **Studio**: the Voices and Music pages upload into your formats.

## Owner's decisions to keep
- Azure voices by default (made in Studio); NPC voices match their gender.
- Voices are made in Studio only: no voice keys on children's devices, never clone children's voices (9 Oct).
- Silence in the background (switching app, locked phone) (round M).
- Load the voice pack once; only new voices are downloaded (round O, battery).
- Hát ru: traditional words over original soft tunes until the family adds real recordings (round N).
- Voice pack by area (10 Oct): on Wi-Fi the rest of the voices download by themselves; on mobile data a grown-up is
  asked first ("ask user to allow download over mobile, wifi should automatically"). A device that can't tell (iPhone,
  iPad) is asked too; a computer counts as Wi-Fi. The core pack downloads by itself first, not inside the game's
  install files.
- Check-ins (11 Oct): while working through a list, check the board, the branches and the voice issues every 5 minutes and push when checks pass; paused when waiting for the owner's go, and stopped by the owner at 9:41 am AEST, 11 Oct, until further notice.

## Progress notes
- **11 Oct, 10:36 am AEST, `claude/determined-brown-k9esi5` at 4521090** (voice pack by area, with main r56 merged in; 816 new lines recorded with Azure, 0 missing, core 7.0 MB en / 7.0 MB vi): full suite 88/88 passed, none skipped. Before it: boot, voice, voicepack, voicecover, voicearea, welcomevoice, viwords, simple, quiet, songs, iphone, perf passed.
- **11 Oct, `core/voice-audio` at 9eefe7c** (#39 rain merged with the fade-out fix and the new `rain` check; Hội An and Vũng Tàu in `VN_AREAS`): voice, voicepack, welcomevoice, songs, quiet, rain, iphone, simple, perf passed; full suite not run on this branch (its changes are `js/audio.js`, `js/weather.js`, `js/content/songs.js` and the `rain` check).
- **#35** (`bugfix/voice-audio-35`, robot): iphone, simple, voice, voicepack, welcomevoice, quiet, songs passed; needs a real iPhone tap once live; leave out `.bugfix/result.md` when merging.

## What's left (handover, 11 Oct, 10:50 am AEST)
Both branches are pushed and marked "ready for Release" on the board; no check-ins are running (the owner stopped them until further notice).
- **For Release:** merge `core/voice-audio` (9eefe7c: #39 rain fix and check `rain`; Hội An and Vũng Tàu in `VN_AREAS`) and `claude/determined-brown-k9esi5` (ee4fd03: voice pack by area; bump the version). The two branches do not overlap except `docs/cores/voice-audio.md` (keep both sides) and `tests/run.mjs` (both add checks: keep `rain` and `voicecover`, `voicearea`). Also `bugfix/voice-audio-35` (#35), leaving out `.bugfix/result.md`. Close #35 and #39 once deployed.
- **Not run yet:** the full suite on `core/voice-audio` alone (its core checks pass); Release's merged run covers it.
- **For the owner:** tap the Simple screen's speaker button on the iPhone once #35 is live; listen to the rain before/after recordings (sent in chat); lullabies with real voices still wait for words or recordings (Music page).
- **Later:** when Round T3 adds Vũng Tàu (and later places), run `node tools/voice-harvest.mjs`, then `node tools/make-voice-pack.mjs --engine azure --parallel 4 --per-minute 19`, then the `voicecover` check; give new place files an area in `tools/voice-lines.mjs` FILE_AREA.
