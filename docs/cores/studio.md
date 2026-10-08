# 🛠️ Studio core

**You make Sparkle Studio, the grown-ups' dashboard:** the Windows exe and the same pages online at `/studio/`,
signing in and admins, saving and Publish, and every family page (message, children, album, quiz, stories,
villagers, Simple screen, music, map, real photos, play time, voices, ads, analytics view, website, check, settings).

## You own
- `studio/` (`core.cjs` the engine, `studio.cjs` the exe's server, `ui/` the pages, `build-exe.sh`, `version.json` with Release)
- `netlify/functions/studio.mjs`, `netlify/lib/admins.mjs`
- `js/custom.js` (how the game reads `content/custom.json`) with Kid UI and Play
- `tests/studio-check.mjs`

## How saving works (owner, round P)
Online, a save waits on the website (Netlify Blobs store `studio-pending`) and is read back at once; 🚀 Publish (N)
sends all waiting changes to GitHub as one commit and puts them live; “Drop all waiting changes” forgets them. The exe
saves into the game folder and sends to GitHub in two steps (draft, then Publish). Only the family's files can change
online: `content/`, `voices/`, `photos/`, `tools/voice-extra.json`.

## Hard rules (§9.6)
STUDIO-001 (the exe and online Studio are one program, the same version as the game), STUDIO-002 (online saves wait
until Publish; only the family's files change), PRIV rules (no keys in the repository; passwords kept only as hashes).

## Checks you run
`studio` (runs `tests/studio-check.mjs`: a pretend GitHub and Netlify, the exe and the online Studio side by side)
Build the exe after changes: `bash studio/build-exe.sh`.

## Talks to
- **Analytics & Infra**: the 📊 Analytics page shows their report; Netlify environment variables.
- **Voice & Audio**: voices and music uploads.
- **World**: the map and building page writes their world format.
- **Release**: the exe goes into each round's packages.

## Owner's decisions to keep
- Five sections, big cards, fast page changes (round K).
- Everything sent back to Studio is labelled “Analytics” (round L).
- Admins have their own accounts: Viewer, Editor, Owner; nobody else needs a GitHub token (round O).
- Saves wait and Publish sends them in one go; ✕ on a real photo takes it off for good (round P).
