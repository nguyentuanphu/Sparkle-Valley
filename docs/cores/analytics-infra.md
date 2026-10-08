# 📊 Analytics & Infra core

**You keep the game's website running and report how it is used:** the anonymous analytics (per device and child,
online now, problems), the Netlify functions and settings, offline caching (service worker), privacy, and the
infrastructure notes.

## You own
- `js/players.js` (what a device sends), `netlify/lib/players.mjs` (what the website keeps and the report),
  `netlify/functions/hello.mjs`, the Netlify side of `netlify/functions/turn.mjs`
- `netlify.toml`, `manifest.webmanifest`, `sw.js` with Release (the VERSION line is Release's)
- `docs/INFRASTRUCTURE.md`, `.github/workflows/` (including the Google Drive mirror waiting for the owner)
- The analytics view's data shape (Studio draws it)

## Hard rules (§9.6)
PRIV-001…005 (no addresses, GPS, photos or keys; a grown-up can switch analytics off: Grown-ups → Advanced → 📊
Analytics; first names only, nothing else about a child), PERF rules on network use (a “still here” every two minutes,
nothing while hidden).

## Checks you run
`studio report saves cloud photo boot`
(`studio` covers the players report, online-now, admins and the voice relay function on a pretend Netlify.)

## Environment variables (set by the owner in Netlify, never in the code)
`STUDIO_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`, `AZURE_KEY`, `AZURE_REGION`, `NETLIFY_TOKEN`,
`CF_TURN_KEY_ID`, `CF_TURN_KEY_TOKEN` (or `METERED_DOMAIN`, `METERED_API_KEY`).

## Talks to
- **Studio**: the Analytics page.
- **Online**: the voice relay.
- **Release**: deploys and the live site check (Netlify).

## Owner's decisions to keep
- Analytics per device and per child, with first names, device and browser, city and country (round L).
- 🟢 Playing now / ⚪ Offline per device in Studio (round O).
- GitHub and Netlify are separate steps: “yes, push” then “yes, deploy”.
