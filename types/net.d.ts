// Shared shapes of what travels between friends' games (owner, 16 Oct AEDT: TypeScript, batch 3). Type notes only:
// the game's .ts files import them with `import type`, which the build removes, so nothing here reaches a phone.

/** one side of a trade: up to 12 kinds of things (1–99 each), up to 9,999 coins, up to 6 clothes (Round V) */
export interface TradeSide { coins?: number; items?: Record<string, number>; clothes?: string[] }

/** a message from another device after js/netmsg.ts checkMsg cleaned it: its kind (t), who it is from and to, and the
 * fields that kind may have (SCHEMA); anything else was left out */
export interface Msg { t: string; from?: string; to?: string; mid?: string; [k: string]: any }

/** another player in the room, as js/net.ts keeps them (Net.remotes): who they are, their picture and key, and how the
 * link to them is going */
export interface Remote {
  id: string; name?: string; look?: any; friend?: string | null; pub?: string | null; photo?: string | null;
  /** last heard from (ms), a weak link, when a direct link last answered (ms), and which way it travels ('direct' or 'cloud') */
  last?: number; weak?: boolean; direct?: number; route?: string;
  [k: string]: any;
}
