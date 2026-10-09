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

## Hard rules (§9.6)
VOICE-001…003: the recorded voice is the voice (the device voice only for lines with a name in them); the pack is
downloaded to the device by itself with a small quiet bar; once on the device a start checks a few files and shows
nothing; it plays offline. PRIV rules for family recordings; PRIV-010 (no online voice, voice key or voice copy on the
device).

## Checks you run
`voice voicepack welcomevoice songs quiet`

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
