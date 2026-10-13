# New 3D characters: a sketch saved for later

Owner, 13 Oct 2026 AEDT: "I want to improve the character, now it is just a cylinder face ... it doesn't look like a full
3D character with expression and all that." The Play chat made a sketch (not in the game). The owner looked at it and
said **"Not now", save it for later**, together with the two open questions below.

- `sketch-lineup.png`: today's character (left) beside the new one waving, cheering, shy and walking.
- `sketch-faces.png`: the five expressions: smile, laugh, wow, wink, sleepy.
- `charproto.js` and `charproto.html`: the sketch's code (three.js, the game's own `js/gfx.js` materials). To see it,
  copy this folder to `tests/out/`, add `tests/out/charproto-all.js` with
  `export * from './charproto.js'; export { THREE } from '../../js/gfx.js';`, serve the repo on port 8765 and open
  `tests/out/charproto.html?view=line` or `?view=faces`.

## What the new character would have
- A rounder chest and tummy with shoulders, arms that bend at the elbow, legs that bend at the knee, mitten hands with
  a thumb, rounded shoes; walking, running, jumping and waving use the bends.
- A head with cheeks, a small nose and ears; shiny 3D eyes that blink, eyebrows and a mouth.
- Expressions that follow the game: a smile when walking, a laugh on a win, "wow" on something new, a wink for a
  friend's tap, sleepy when tired or at bedtime, the mouth moving while talking.
- Every shop outfit, hat, wing, cape, backpack and the tester badge refitted; far people still one baked shape
  (battery round, PERF-003), so phones stay as fast.

## Open questions for the owner (asked again when this is picked up)
1. Who gets it: everyone (children and villagers), or the children first.
2. A child with a photo: a cartoon face with colours from the photo (the photo stays on the card, name tag and
   friends list), the photo on the new face, or a switch for grown-ups.

Files it would touch: `js/avatar.js` (Kid UI's), the animations in the same file, the shop's clothes shapes.
Checks: `avatar`, `shop`, `phone`, `perf`, `battery`, close-ups of every skin and hair colour on phone, tablet and computer.
