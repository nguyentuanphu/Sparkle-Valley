// What the game puts on the page for the checks and for the tools that drive it in a test browser (js/main.js: __sv,
// js/voice.js: __svVoiceLog), and what those tools add themselves: only the parts the tools use. (The whole shared game
// object gets its own type later in the TypeScript plan, with types/.)
type SvHero = { profile: import('../js/state.js').Profile };
type SvThing = { id?: string, x: number, z: number, act(hero: SvHero, game: SvGame): Promise<unknown> | void };
type SvGame = { heroes: SvHero[], interactables: SvThing[], paused: boolean, renderer: { setPixelRatio(ratio: number): void },
  playGame(player: number, id: string, how: string): void, openPad(player: number, tab: string): void, _owlAuto?: boolean };
interface Window {
  __sv: SvGame;
  __svVoiceLog?: (lang: string, text: string) => void;
  // tools/voice-harvest.mts: every line said, [language, words]
  __svHeard?: [string, string][];
  // tools/feel-shots.mts: holds each flying coin part of the way
  __hold?: MutationObserver;
}
declare var __sv: SvGame;
