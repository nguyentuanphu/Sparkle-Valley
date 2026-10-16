// @ts-check
// (owner, 13 Oct AEDT) the auto play check plays games like a child (js/autoplay.js): it hears each right and wrong
// answer and the win, and while a game waits for the right one (untilRight) it can see which buttons it is choosing from.
// A game may also offer a plan: the next legal button to tap (real UI taps, never a synthetic win), and how many taps it
// needs at most, so the check allows a child's thinking and finger time. Both end when the game's window closes.

/**
 * @typedef {(kind: string, element?: Element | null) => void} PlayListener
 * @typedef {{ els: Element[], check?: (element: Element) => boolean }} PlayAsk
 * @typedef {() => Element | null | undefined} PlayPlan
 * @typedef {{ on: PlayListener | null, ask: PlayAsk | null, plan: PlayPlan | null, maxActions: number }} PlayWatch
 */

/** @type {PlayWatch} */
export const playWatch = { on: null, ask: null, plan: null, maxActions: 0 };

/** tell the auto play check what happened (a broken listener never breaks the game) @param {string} kind @param {Element | null} [element] */
export function tell(kind, element) { if (playWatch.on) try { playWatch.on(kind, element); } catch (x) { } }

/**
 * A game's plan for the auto play check; returns the cleanup the game window runs when it closes. A later game's plan is
 * never cleared by an earlier game's cleanup. The allowance is a count of taps: anything else counts as none.
 * @param {PlayPlan} plan @param {unknown} [maxActions] @returns {() => void}
 */
export function setPlan(plan, maxActions = 0) {
  playWatch.plan = plan; playWatch.maxActions = typeof maxActions === 'number' && Number.isFinite(maxActions) && maxActions > 0 ? maxActions : 0;
  return () => { if (playWatch.plan === plan) { playWatch.plan = null; playWatch.maxActions = 0; } };
}
