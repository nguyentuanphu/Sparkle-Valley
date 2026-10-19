import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { Browser, Page } from 'playwright';
import { open, clear, noWelcome } from './harness.mjs';

async function runUntil(page: Page, step: string, keys: string[]) {
  await page.evaluate(keys => {
    const api = window.__sv.autoplay;
    if (!api || typeof api.start !== 'function') throw Error('autoplay unavailable');
    void api.start(keys, 'x5');
  }, keys);
  await page.waitForFunction(step => !!window.__sv.heroes[0].profile.lanterns.done[step] || !window.__sv.autoplay.running(), step, { timeout: 90000 });
  return page.evaluate(async step => {
    const G = window.__sv, api = G.autoplay, complete = !!G.heroes[0].profile.lanterns.done[step];
    if (!api || typeof api.stop !== 'function' || typeof api.trail !== 'function') throw Error('autoplay controls unavailable');
    const trail = api.trail(); api.stop();
    for (let n = 0; n < 80 && api.running(); n++) await new Promise(resolve => setTimeout(resolve, 100));
    return { complete, stopped: !api.running(), trail, report: JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}') };
  }, step);
}

async function closeResults(page: Page) {
  const close = page.locator('.reporting-form .tp-head .x');
  await close.waitFor({ timeout: 15000 }); await close.click();
  await page.locator('.reporting-form').waitFor({ state: 'detached' });
}

export async function storyQuestFlowCheck(browser: Browser): Promise<string> {
  const dir = 'out/story-quest-flow'; fs.mkdirSync(dir, { recursive: true });
  const live = { releases: { autoplay: { on: true, devices: ['storyflow001'] }, tester: { on: true, devices: ['storyflow001'], revert: 'keep' }, story_ch2: { on: true } }, festivals: {} };
  const P = await open(browser, { w: 430, h: 873, touch: true, lang: 'vi',
    pre: () => {
      localStorage.setItem('sv2_playerid', 'storyflow001'); localStorage.setItem('sv2_tester', JSON.stringify({ at: 1, b: 'r87' }));
      // End notifications are shortened, but every requested MP3 must still fetch and decode.
      speechSynthesis.speak = utterance => { setTimeout(() => utterance.onend?.(new SpeechSynthesisEvent('end', { utterance })), 10); };
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args: Parameters<AudioBufferSourceNode['start']>) {
        if (this.buffer?.length > 1) setTimeout(() => this.onended?.(new Event('ended')), 30);
        return start.apply(this, args);
      };
    },
    route: async ctx => {
      await ctx.route('**/content/custom.json*', route => route.fulfill({ json: {} }));
      await ctx.route('**/api/live**', route => route.fulfill({ json: live }));
      await ctx.route('**/api/tester**', route => route.fulfill({ json: { ok: true, rid: 'synthetic-story-receipt', mine: [], open: [] } }));
    }
  });
  try {
    await clear(P.page); await noWelcome(P.page);
    await P.page.waitForFunction(() => !!window.__sv.autoplay, null, { timeout: 30000 });
    const voices = await P.page.evaluate(async () => {
      const G = window.__sv, L = G.lanterns, h = G.heroes[0]; if (!L) throw Error('story unavailable');
      const u = '/js/content/chapters.js', { CHAPTERS }: typeof import('../js/content/chapters.js') = await import(u);
      const v = '/js/voice.js', V: typeof import('../js/voice.js') = await import(v);
      const s = '/js/state.js', state: typeof import('../js/state.js') = await import(s);
      const beforeFind = CHAPTERS.flatMap<{ id: string }>(ch => ch.steps); const end = beforeFind.findIndex(step => step.id === 'c1_find');
      h.profile.lanterns = { companion: 'dragon', done: Object.fromEntries(beforeFind.slice(0, end).map(step => [step.id, true])), chapters: {}, act: {} };
      L.companions.sync();
      G.paused = true; state.settings.voice = true;
      for (let n = 0; n < 100 && !V.voicePack()?.signatures?.vi; n++) await new Promise(resolve => setTimeout(resolve, 100));
      if (!V.voicePack()?.signatures?.vi) throw Error('VI voice index unavailable');
      V.clearVoiceMisses();
      const heard = (act: () => void) => new Promise<void>((resolve, reject) => {
        let started = false;
        const timer = setTimeout(() => { off(); reject(Error('quest voice did not finish')); }, 10000);
        const off = V.onSpeaking(n => { if (n) started = true; else if (started) { clearTimeout(timer); off(); resolve(); } });
        act();
      });
      const lifted: string[] = [];
      for (let n = 0; n < 5 && !h.profile.lanterns.act.found; n++) {
        const it = G.interactables.find(it => it.id === 'story_leaf' + n); if (!it) throw Error('leaf missing');
        lifted.push(it.id); await heard(() => { void it.act(h, G); });
      }
      const found = G.interactables.find(it => it.id === 'story_c1_find'); if (!found) throw Error('lantern missing');
      await heard(() => { void found.act(h, G); });
      const missing = V.voiceMisses(); state.settings.voice = false; V.hush(); G.paused = false;
      return { lifted, missing, carrying: h.profile.lanterns.carrying, current: G.currentQuest(h.profile)?.id };
    });
    fs.writeFileSync(dir + '/voice.json', JSON.stringify(voices, null, 2));
    assert.equal(voices.carrying, 'ch1'); assert.equal(voices.current, 'L_c1_hang');
    const target = await P.page.evaluate(async () => { const G = window.__sv, target = G.questTarget(G.heroes[0]); await G.landBy(G.heroes[0], target.x, target.z); return target; });
    const hang = await runUntil(P.page, 'c1_hang', ['tap:story_c1_hang']);
    fs.writeFileSync(dir + '/hang.json', JSON.stringify({ target, ...hang }, null, 2));
    // Collect all observations before asserting: the baseline must expose both independent failures.
    await closeResults(P.page);
    if (await P.page.locator('.handpad .hp-x').isVisible()) await P.page.locator('.handpad .hp-x').click();
    await clear(P.page);
    const turtles: object[] = [];
    for (const age of ['little', 'big'] as const) {
      await P.page.evaluate(async age => {
        const G = window.__sv, L = G.lanterns, h = G.heroes[0]; if (!L) throw Error('story unavailable');
        await L.loadHanoi();
        const u = '/js/content/chapters.js', { CHAPTERS }: typeof import('../js/content/chapters.js') = await import(u);
        const steps = CHAPTERS.flatMap<{ id: string }>(ch => ch.steps), end = steps.findIndex(step => step.id === 'c2_vanmieu');
        h.profile.age = age; h.profile.lanterns = { companion: 'dragon', done: Object.fromEntries(steps.slice(0, end).map(step => [step.id, true])), chapters: { ch1: true }, act: {} };
        L.companions.sync();
        const target = G.questTarget(h); await G.landBy(h, target.x, target.z);
      }, age);
      const result = await runUntil(P.page, 'c2_vanmieu', ['quests']);
      turtles.push({ age, ...result }); fs.writeFileSync(dir + '/turtles.json', JSON.stringify(turtles, null, 2));
      await closeResults(P.page);
      await clear(P.page);
    }
    assert.equal(voices.missing.length, 0, 'actual lotus-leaf/carry narration used unrecorded speech: ' + JSON.stringify(voices.missing));
    assert.ok(hang.complete && hang.stopped, 'rope autoplay failed: ' + JSON.stringify(hang));
    assert.ok(turtles.every(result => 'complete' in result && result.complete && 'stopped' in result && result.stopped), 'turtle autoplay failed: ' + JSON.stringify(turtles));
    assert.deepEqual(P.errors, []);
    return 'actual VI leaf/carry narration uses recordings; rope drag hangs chapter-one lantern; under-5 three-turtle and older-child five-turtle quests finish through legal autoplay controls';
  } finally { await P.ctx.close(); }
}
