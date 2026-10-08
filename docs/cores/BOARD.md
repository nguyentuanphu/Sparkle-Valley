# Board: what each core is doing and what it needs from others

Every core keeps its own section up to date. Times are in AEST. Release reads this before merging.

Format for a request:
`- [ ] (from → to) what is needed · why · files · date AEST`

## 🚦 Release
- Round O (r46) and Round P (r47) are on `round-o` / `round-p`, waiting for the owner's "yes, push" / "yes, deploy".
- The Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet: ask the owner at every report.

## 🌏 World
- (nothing open)

## 🎮 Play
- (nothing open)

## 🧸 Kid UI
- (nothing open)

## 🎙️ Voice & Audio
- Lullabies with real voices: the owner may paste titles or words (soha.vn could not be reached), or record them in Studio → 🎵 Music.

## 👫 Online
- The voice relay waits for the owner's Cloudflare TURN key (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN in Netlify): until then, voices only work when the two devices can link directly.

## 🛠️ Studio
- (nothing open)

## 📊 Analytics & Infra
- (nothing open)
