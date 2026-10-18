// What the tools that drive the game in a test browser add to the page themselves. The game's own page hooks (__sv,
// __svVoiceLog) and their types are shared with the game: types/globals.d.ts (TypeScript batch 4).
interface Window {
  // tools/voice-harvest.mts: every line said, [language, words]
  __svHeard?: [string, string][];
  // tools/feel-shots.mts: holds each flying coin part of the way
  __hold?: MutationObserver;
}
declare var __sv: SvGame;
