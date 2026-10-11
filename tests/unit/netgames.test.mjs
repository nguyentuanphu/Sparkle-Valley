// Games with friends online (js/netgames.js), on a pretend network of 3 devices: invitations, seats, moves, leaving.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNetGames, rpsWinners } from '../../js/netgames.js';

function room(ids, answer = () => true) {
  const devs = {};
  for (const id of ids) {
    const log = { asks: [], starts: [], ends: [] };
    const net = { ids: () => ids.filter(x => x !== id), send: d => { const out = { ...d, from: id }; for (const to of d.to ? [d.to] : ids.filter(x => x !== id)) queueMicrotask(() => devs[to].g.receive(out)); } };
    const g = createNetGames({ net, me: () => id, waitMs: 50, onAsk: d => { log.asks.push(d); g.answer(d, answer(id, d)); }, onStart: s => log.starts.push(s), onEnd: who => log.ends.push(who) });
    devs[id] = { g, log };
  }
  return devs;
}
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));

test('Caro: one friend is asked, says yes, both get the same seats', async () => {
  const d = room(['A', 'B', 'C']);
  d.A.g.invite('caro', 2, 'B'); await tick();
  assert.equal(d.B.log.asks.length, 1); assert.equal(d.C.log.asks.length, 0);
  const sa = d.A.g.session, sb = d.B.g.session;
  assert.deepEqual(sa.seats, ['A', 'B']); assert.deepEqual(sb.seats, ['A', 'B']); assert.equal(sa.mine, 0); assert.equal(sb.mine, 1); assert.equal(sb.level, 2);
  assert.equal(d.C.g.session, null);
});
test('Caro: moves arrive in order on the other device', async () => {
  const d = room(['A', 'B']);
  d.A.g.invite('caro', 1, 'B'); await tick();
  d.A.g.move(0, 4); assert.equal(await d.B.g.next(0, 0), 4);
  const wait = d.A.g.next(1, 1); d.B.g.move(1, 7); assert.equal(await wait, 7);
});
test('Oẳn tù tì: everyone is asked; those who say no are left out; all hands are shown together', async () => {
  const d = room(['A', 'B', 'C', 'D'], id => id !== 'C');
  d.A.g.invite('oantuti', 1); await tick(80);
  assert.deepEqual(d.A.g.session.seats, ['A', 'B', 'D']); assert.equal(d.C.g.session, null);
  d.A.g.move(0, 0); d.B.g.move(0, 1); d.D.g.move(0, 1);
  const hands = await d.A.g.all(0); assert.deepEqual(hands, [0, 1, 1]); assert.deepEqual(rpsWinners(hands), [1, 2]);
});
test('a player who leaves ends their waits with null, and the others are told', async () => {
  const d = room(['A', 'B']);
  d.A.g.invite('caro', 1, 'B'); await tick();
  const wait = d.A.g.next(0, 1); d.B.g.leave(); assert.equal(await wait, null); assert.deepEqual(d.A.log.ends, ['B']);
});
test('nobody says yes: the inviter is told, no game starts', async () => {
  const d = room(['A', 'B'], () => false);
  d.A.g.invite('caro', 1, 'B'); await tick();
  assert.equal(d.A.g.session, null); assert.equal(d.A.log.starts[0], null);
});
test('moves from someone not in the game, or for another game, are ignored', async () => {
  const d = room(['A', 'B', 'C']);
  d.A.g.invite('caro', 1, 'B'); await tick();
  d.A.g.receive({ t: 'gmove', gid: d.A.g.session.gid, n: 0, mv: 3, from: 'C' }); d.A.g.receive({ t: 'gmove', gid: 'other', n: 0, mv: 5, from: 'B' });
  assert.equal(d.A.g.session.moves.size, 0);
});
test('rpsWinners: rock, paper, scissors for any number of hands', () => {
  assert.deepEqual(rpsWinners([0, 0]), []); assert.deepEqual(rpsWinners([0, 1, 2]), []);
  assert.deepEqual(rpsWinners([0, 1]), [1]); assert.deepEqual(rpsWinners([1, 2]), [1]); assert.deepEqual(rpsWinners([2, 0]), [1]);
  assert.deepEqual(rpsWinners([2, null, 1]), [0]);
});
test('(round R privacy) a game opens only after this child said yes to the one who asked', async () => {
  const d = room(['A', 'B', 'C'], id => id !== 'C');
  d.B.g.receive({ t: 'gstart', gid: 'zzz', game: 'caro', level: 1, seats: ['B', 'C'], from: 'B' }); // (nobody asked C)
  d.C.g.receive({ t: 'gstart', gid: 'zzz', game: 'caro', level: 1, seats: ['B', 'C'], from: 'B' });
  assert.equal(d.C.g.session, null);
  d.A.g.invite('caro', 1, 'C'); await tick(); // C says no
  assert.equal(d.C.g.session, null);
  d.A.g.invite('caro', 1, 'B'); await tick(); // B says yes; a gstart for that game from someone else is still ignored
  assert.equal(d.B.g.session.seats.join(), 'A,B');
});
test('Caro (r63): the board size the inviter chose reaches every device, and a size out of range is dropped', async () => {
  const d = room(['A', 'B']);
  d.A.g.invite('caro', 3, 'B', { size: 15 }); await tick();
  assert.equal(d.B.log.asks[0].size, 15); assert.equal(d.A.g.session.size, 15); assert.equal(d.B.g.session.size, 15);
  const e = room(['A', 'B']);
  e.A.g.invite('caro', 3, 'B', { size: 40 }); await tick();
  assert.equal(e.A.g.session.size, undefined); assert.equal(e.B.g.session.size, undefined);
});
