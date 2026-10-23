type Consent = 'yes' | 'no' | null;
type EventName = 'page_view' | 'action_click' | 'link_click' | 'scroll_milestone' | 'active_time' | 'play_conversion';
type ParentEvent = { name: EventName; route: string; action?: string; milestone?: string; seconds?: number; lang: string; device: string };

const KEY = 'sv_parent_analytics_consent';
const queued: ParentEvent[] = [];
let routeNow = '/';
let lastTick = performance.now();
let lastInput = performance.now();
let secondsActive = 0;
let previousRoute = '';
let seen = new Set<number>();
let initialized = false;

export const consent = (): Consent => {
  const value = localStorage.getItem(KEY);
  return value === 'yes' || value === 'no' ? value : null;
};

// (owner, 23 Oct AEDT: "always on by default, don't need to ask, it's part of the analytics in game anyway") first-party
// visit counts run unless this device once said no
const counting = () => consent() !== 'no';

export const setConsent = (value: Exclude<Consent, null>) => {
  localStorage.setItem(KEY, value);
  if (value === 'no') queued.length = 0;
};

const device = () => innerWidth < 600 ? 'phone' : innerWidth < 1000 ? 'tablet' : 'desktop';
const language = () => document.documentElement.lang === 'vi' ? 'vi' : 'en';

export function track(name: EventName, route: string, action?: string, milestone?: string, seconds?: number) {
  if (!counting()) return;
  if (name === 'page_view' && previousRoute === route) return;
  if (name === 'page_view') previousRoute = route;
  queued.push({ name, route, action, milestone, seconds, lang: language(), device: device() });
  if (queued.length >= 10) void flush();
}

export function trackLink(route: string) {
  track('link_click', route);
}

async function flush() {
  if (!counting() || !queued.length) return;
  const events = queued.splice(0, 50);
  try {
    await fetch('/api/parent-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ events })
    });
  } catch {
    // Best-effort counts: never persist or accumulate failed requests.
  }
}

function tick() {
  const now = performance.now();
  if (counting() && !document.hidden && now - lastInput < 30_000)
    secondsActive += Math.min(1, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;
}
function reportTime() {
  tick();
  if (secondsActive >= 1) track('active_time', routeNow, undefined, undefined, Math.floor(secondsActive));
  secondsActive = 0;
}
function reportScroll() {
  if (!counting()) return;
  const height = document.documentElement.scrollHeight;
  const percent = (scrollY + innerHeight) / Math.max(1, height) * 100;
  for (const milestone of [25, 50, 75, 100]) {
    if (percent >= milestone && !seen.has(milestone)) {
      seen.add(milestone);
      track('scroll_milestone', routeNow, undefined, String(milestone));
    }
  }
}
export function startAnalytics(route: string) {
  reportTime();
  if (routeNow !== route) seen = new Set();
  routeNow = route;
  track('page_view', route);
  reportScroll();
  if (initialized) return;
  initialized = true;
  for (const name of ['pointerdown', 'pointermove', 'scroll', 'focus'])
    addEventListener(name, () => { lastInput = performance.now(); }, { passive: true });
  addEventListener('scroll', reportScroll, { passive: true });
  setInterval(tick, 1000);
  setInterval(() => { reportTime(); void flush(); }, 20_000);
  addEventListener('visibilitychange', () => { reportTime(); void flush(); });
  addEventListener('pagehide', () => { reportTime(); void flush(); });
}
