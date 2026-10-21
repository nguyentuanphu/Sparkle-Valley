import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBotConfig, dueBotSlot } from '../../netlify/lib/child-bots.mts';
import { runScheduledBots } from '../../netlify/functions/child-bots.mts';
import { cleanLive, publicLive } from '../../netlify/lib/live.mts';
import core from '../../studio/core.cts';

const settings = { enabled: true, schedule: 'custom', time: '02:03', count: 2, profile: 'gentle-explorer', duration: 5 } as const;
test('configuration is bounded and private to Studio', () => {
  assert.deepEqual(cleanBotConfig(settings), settings);
  for (const patch of [{ count: 11 }, { duration: 31 }, { duration: 0 }, { profile: 'inject' }, { time: '25:00' }, { schedule: 'arbitrary' }, { enabled: 'yes' }])
    assert.equal(cleanBotConfig({ ...settings, ...patch }), null);
  const live = cleanLive({ releases: { nightlyBots: settings }, festivals: {} });
  assert.equal(live.releases.nightlyBots, undefined);
  assert.equal(publicLive(live, null).releases.nightlyBots, undefined);
});
test('day-night, custom UTC and disabled windows', () => {
  assert.equal(dueBotSlot(cleanBotConfig(settings), new Date('2026-10-21T02:05:00Z')), '2026-10-21T02:03Z');
  assert.equal(dueBotSlot(cleanBotConfig(settings), new Date('2026-10-21T02:08:00Z')), null);
  assert.equal(dueBotSlot(cleanBotConfig({ ...settings, enabled: false }), new Date('2026-10-21T02:03:00Z')), null);
  const daily = cleanBotConfig({ ...settings, schedule: 'day-night' });
  assert.equal(dueBotSlot(daily, new Date('2026-10-21T08:00:00Z')), '2026-10-21T08:00Z');
  assert.equal(dueBotSlot(daily, new Date('2026-10-21T20:04:00Z')), '2026-10-21T20:00Z');
  assert.equal(dueBotSlot(daily, new Date('2026-10-21T12:00:00Z')), null);
});
test('scheduled dispatch only once after successful GitHub dispatch', async () => {
  const data = new Map<string, unknown>([['bot-schedule', settings]]);
  const store = { get: async (key: string) => data.get(key), setJSON: async (key: string, value: unknown) => { data.set(key, value); } };
  const now = new Date('2026-10-21T02:04:00Z');
  let calls = 0;
  const dispatch = async () => { calls++; };
  assert.deepEqual(await runScheduledBots({ liveStore: store, now, dispatch }), { dispatched: true, slot: '2026-10-21T02:03Z' });
  assert.deepEqual(await runScheduledBots({ liveStore: store, now, dispatch }), { dispatched: false });
  assert.equal(calls, 1);
  data.delete('bot-last-slot');
  await assert.rejects(runScheduledBots({ liveStore: store, now, dispatch: async () => { throw Error('GitHub failed'); } }));
  assert.equal(data.has('bot-last-slot'), false);
});
test('manual dispatch validates inputs and never falls back to full suite', async () => {
  const calls: { url: string, options: RequestInit }[] = [];
  const prior = globalThis.fetch;
  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
    calls.push({ url: String(url), options: options || {} });
    return new Response(null, { status: 204 });
  };
  try {
    const studio = core.createStudio({ store: { ok: () => true }, conf: { githubToken: 'mock', githubRepo: 'family/game', githubBranch: 'main' } });
    const run = async (b: unknown) => studio.handle('bot/run', 'POST', Buffer.from(JSON.stringify(b)));
    for (const bad of [{ ...settings, count: 11 }, { ...settings, duration: 31 }, { ...settings, profile: 'unexpected' }]) {
      const result = await run(bad);
      assert.equal(result.code, 400);
    }
    assert.equal(calls.length, 0);
    const result = await run(settings);
    assert.equal(result.code, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /nightly-child-bots\.yml\/dispatches$/);
    assert.deepEqual(JSON.parse(String(calls[0].options.body)).inputs, { count: '2', profile: 'gentle-explorer', duration: '5' });
  } finally { globalThis.fetch = prior; }
});
