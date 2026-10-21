// First-party privacy-conscious parent website analytics ingestion
// Strictly allowlisted events, privacy-preserving aggregation, no PII, no full URLs, no keystrokes.
import { ipOf, ipKey, count } from '../lib/guard.mts';

const store = () => import('@netlify/blobs').then(m => m.getStore({ name: 'parent-analytics', consistency: 'strong' }));
const guardBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'guard', consistency: 'strong' }));

const LIMIT = 120;
const WINDOW = 10 * 60e3; // 120 requests per 10 minutes per IP

const ALLOWED_EVENTS = new Set([
  'page_view',
  'action_click',
  'link_click',
  'scroll_milestone',
  'active_time',
  'play_conversion'
]);

const ALLOWED_ROUTES = new Set([
  '/',
  '/play-learn',
  '/countries-traditions',
  '/quests-stories',
  '/memory-villages',
  '/for-parents',
  '/safety-privacy',
  '/help-about'
]);

const ALLOWED_ACTIONS = new Set([
  'hero_play',
  'nav_play',
  'card_play',
  'lang_switch',
  'theme_toggle',
  'release_click'
]);

const ALLOWED_MILESTONES = new Set(['25', '50', '75', '100']);
const ALLOWED_DEVICES = new Set(['phone', 'tablet', 'desktop']);
const ALLOWED_LANGS = new Set(['en', 'vi']);

export const makeParentAnalytics = ({ analyticsStore = store, guardStore = guardBlobs, now = () => Date.now() } = {}) => async (req: Request, ctx: any) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });

  const G = await guardStore();
  const ip = await ipKey(G, ipOf(req, ctx));
  if (!await count(G, 'parent_analytics/' + ip, LIMIT, WINDOW, now())) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '600' }
    });
  }

  const text = await req.text();
  if (text.length > 32000) return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });

  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const events: any[] = Array.isArray(body?.events) ? body.events : [];
  if (!events.length || events.length > 50) {
    return new Response(JSON.stringify({ error: 'Invalid event batch' }), { status: 400 });
  }

  const S = await analyticsStore();
  const dayStr = new Date(now()).toISOString().slice(0, 10);
  const key = `sum/${dayStr}`;

  // Read today's aggregate summary or start fresh
  const sum: any = (await S.get(key, { type: 'json' }).catch(() => null)) || {
    date: dayStr,
    totalEvents: 0,
    pageViews: {},
    actionClicks: {},
    linkClicks: 0,
    scrollMilestones: {},
    activeTimeTotalSec: 0,
    playConversions: 0,
    languages: {},
    devices: {}
  };

  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    const { name, route, action, milestone, seconds, lang, device } = ev;

    if (!ALLOWED_EVENTS.has(name)) continue;

    sum.totalEvents = (sum.totalEvents || 0) + 1;

    const safeLang = ALLOWED_LANGS.has(lang) ? lang : 'unknown';
    sum.languages[safeLang] = (sum.languages[safeLang] || 0) + 1;

    const safeDevice = ALLOWED_DEVICES.has(device) ? device : 'unknown';
    sum.devices[safeDevice] = (sum.devices[safeDevice] || 0) + 1;

    if (name === 'page_view') {
      const safeRoute = ALLOWED_ROUTES.has(route) ? route : 'unknown';
      sum.pageViews[safeRoute] = (sum.pageViews[safeRoute] || 0) + 1;
    } else if (name === 'action_click') {
      const safeAction = ALLOWED_ACTIONS.has(action) ? action : 'other';
      sum.actionClicks[safeAction] = (sum.actionClicks[safeAction] || 0) + 1;
    } else if (name === 'link_click') {
      sum.linkClicks = (sum.linkClicks || 0) + 1;
    } else if (name === 'scroll_milestone') {
      const safeM = ALLOWED_MILESTONES.has(String(milestone)) ? String(milestone) : 'unknown';
      sum.scrollMilestones[safeM] = (sum.scrollMilestones[safeM] || 0) + 1;
    } else if (name === 'active_time') {
      const sec = typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 && seconds <= 3600 ? Math.round(seconds) : 0;
      sum.activeTimeTotalSec = (sum.activeTimeTotalSec || 0) + sec;
    } else if (name === 'play_conversion') {
      sum.playConversions = (sum.playConversions || 0) + 1;
    }
  }

  await S.setJSON(key, sum);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export default makeParentAnalytics();
export const config = { path: '/api/parent-analytics' };
