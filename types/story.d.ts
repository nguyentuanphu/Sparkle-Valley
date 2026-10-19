import type { Profile } from './save.js';
import type { SvMain } from '../js/main.js';

export type StoryPair = [string, string];
export type StoryIntro = [string, string, string, string];
export interface StoryTalk { who: string; label: StoryPair; lines?: StoryPair[]; short?: StoryPair[] }
export interface StoryStep {
  id: string; icon: string; en: string; vi: string; at: string;
  owl?: boolean; big?: boolean; visit?: string; act?: string; game?: string[]; gameLittle?: string[];
  tale?: StoryIntro; taleLittle?: StoryIntro; tale_id?: string; talk?: StoryTalk;
  ribbons?: number; leaves?: number; lights?: number; clues?: number; find?: boolean; hang?: boolean;
  job?: boolean; lesson?: boolean; words?: boolean; challenge?: { big?: StoryPair; little?: StoryPair };
  act_en?: string; act_vi?: string; actL_en?: string; actL_vi?: string;
  light?: StoryPair; lightsAll?: StoryPair;
}
export interface StoryChapter { id: string; en: string; vi: string; steps: StoryStep[]; landmark?: string; keepsake?: string; reward?: number; trick?: string }
export interface StoryTale { id: string; flag: string; title: StoryPair; pages: [string, string, string][] }
export interface StoryActions {
  rib?: number[]; lifted?: number[]; right?: number; found?: boolean; lesson?: boolean; counted?: number[];
  looked?: number[]; clue?: boolean; looked3?: number[]; clue3?: boolean;
  [key: `rib_${string}`]: number[];
}
export interface LanternProgress { companion?: 'firefly' | 'dragon'; done: Record<string, boolean>; chapters: Record<string, boolean>; carrying?: string | null; act?: StoryActions; tricks?: string[]; secret?: Record<string, boolean> }
export type StoryCurrent = { ch: StoryChapter; s: StoryStep };
export type StoryHero = SvMain['heroes'][number];
export interface StoryContext {
  current(p: Profile): StoryCurrent | null; isOn(p: Profile, id: string): boolean;
  A(p: Profile): StoryActions; st(p: Profile): LanternProgress; big(p: Profile): boolean; gamesOf(p: Profile, s: StoryStep): string[];
  say: typeof import('../js/voice.js').say; save(): void; dialog: typeof import('../js/popups.js').dialog;
  reward: typeof import('../js/popups.js').reward; actions(): boolean; finish(h: StoryHero, id: string): void;
  companions(): ReturnType<typeof import('../js/companion.js').createCompanions>;
  plan: typeof import('../js/games/playwatch.js').setPlan;
}
