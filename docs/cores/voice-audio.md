# 🎙️ Voice & Audio core

**You make the game sound right:** the recorded voice pack (English, Vietnamese, Chinese, Hindi), the device voice as
a fallback, the family's own voice lines, music and tunes, sound effects, and silence when the game is put away.

## You own
- `js/voice.js`, `js/packhash.js`, `js/recorder.js`, `js/audio.js` (tunes, instruments, the Music player)
- The pack: `voices/` (manifest and mp3 files), `tools/make-voice-pack.mjs`, `tools/voice-lines.mjs`, `tools/voice-harvest.mjs`, `tools/voice-extra.json`
- Family music files' format: `content/music/` (uploads come through Studio)

## Making voices
`NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node tools/make-voice-pack.mjs --engine azure`
records every new line the game can say (Azure key from the environment, never in the repository). Run it after any
core adds spoken lines (they are listed on the board).

## Hard rules (§9.6)
VOICE-001…003: the recorded voice is the voice (the device voice only for lines with a name in them); the pack is
downloaded to the device by itself with a small quiet bar; once on the device a start checks a few files and shows
nothing; it plays offline. PRIV rules for family recordings.

## Checks you run
`voice voicepack welcomevoice songs quiet`

## Talks to
- **Every core** that adds a line a child hears: they list it on the board; you record it.
- **Play**: the song list (`js/content/songs.js`) is theirs, the tunes are yours.
- **Studio**: the 🎙️ Voices and 🎵 Music pages upload into your formats.

## Owner's decisions to keep
- Azure voices by default; NPC voices match their gender.
- Silence in the background (switching app, locked phone) (round M).
- Load the voice pack once; only new voices are downloaded (round O, battery).
- Hát ru: traditional words over original soft tunes until the family adds real recordings (round N).
