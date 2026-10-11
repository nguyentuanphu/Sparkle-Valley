// Games with friends online (owner, round G: "more games for 2 or more people"). In a room, a child invites a friend
// (Caro, turn by turn) or everyone (Oẳn tù tì, all at once); each one asked sees "… wants to play …: Play / Not now".
// Whoever says yes gets a seat; the inviter starts the game for all of them, and the game opens on every device with
// the same seats in the same order. Moves travel as small messages (kinds gask, gyes, gno, gstart, gmove, gbye; each
// checked by js/netmsg.js). If a player leaves, the others are told kindly and the game ends.
// The transport is passed in, so the same logic runs with the real network (js/net.js) and in tests.
//   createNetGames({ net, me: () => myId, name: id => name, onAsk, onStart, toast })
import { GAMES } from './games/registry.js';
// games made for playing together; every other game is played side by side (a race: js/games/frame.js), and a tale
// ('tale-<id>') is read together, page by page
export const ONLINE_GAMES = { caro: { max: 2, all: false }, oantuti: { max: 6, all: true }, memory: { max: 4, all: true }, tienlen: { max: 4, all: true } };
const newGid = () => Math.random().toString(36).slice(2, 10);

const defOf = game => ONLINE_GAMES[game] || (GAMES[game] ? { max: 6, all: true, race: true } : /^tale-[\w-]{1,40}$/.test(game || '') ? { max: 6, all: true, tale: true } : null);
export { defOf as onlineDef };

export function createNetGames({ net, me, onAsk, onStart, onEnd, waitMs = 12000 }) {
  const asks = new Map();      // gid → { game, level, yes: Set, no: Set, asked: Set, timer } (I invited)
  const said = new Map();     // gid → who asked (round R privacy, 9 Oct: a game opens only after this child said yes to that one)
  let session = null;          // the game being played: { gid, game, seats, mine, level, moves: Map(n → Map(seat → mv)), waiters }
  const api = {
    get session() { return session; },
    // invite one friend (to) or everyone in the room (to omitted) to a game
    // (r63) opts.size: Caro's board, chosen by the one who invites (3 to 19 squares a side)
    invite(game, level, to, opts = {}) {
      const def = defOf(game); if (!def || session) return null;
      const gid = newGid(), asked = new Set(to ? [to] : net.ids());
      if (!asked.size) return null;
      const size = Number.isInteger(opts.size) && opts.size >= 3 && opts.size <= 19 ? opts.size : undefined;
      const a = { gid, game, level, size, yes: new Set(), no: new Set(), asked };
      asks.set(gid, a);
      for (const id of asked) net.send({ t: 'gask', to: id, gid, game, level, size });
      a.timer = setTimeout(() => go(gid), waitMs);
      return gid;
    },
    // my answer to an invitation
    answer(d, yes) { if (yes) { said.set(d.gid, d.from); if (said.size > 20) said.delete(said.keys().next().value); } net.send({ t: yes ? 'gyes' : 'gno', to: d.from, gid: d.gid }); },
    // a move of mine for step n (a Caro square, an Oẳn tù tì hand…)
    move(n, mv) { if (!session) return; record(session.mine, n, mv); net.send({ t: 'gmove', gid: session.gid, n, mv }); },
    // the move of seat s for step n, when it arrives (null if that player left)
    next(n, s) {
      if (!session) return Promise.resolve(null);
      const got = session.moves.get(n); if (got && got.has(s)) return Promise.resolve(got.get(s));
      if (session.gone.has(s)) return Promise.resolve(null);
      return new Promise(res => session.waiters.push({ n, s, res }));
    },
    // everyone's moves for step n (Oẳn tù tì): resolves once every seat still here has moved
    async all(n) { const out = []; for (let s = 0; s < session.seats.length; s++) out[s] = await api.next(n, s); return out; },
    // every move as it arrives (races and tales): f(seat, n, mv)
    onMove(f) { if (session) session.listeners.push(f); },
    leave() { if (!session) return; net.send({ t: 'gbye', gid: session.gid }); session = null; },
    // (from the network)
    receive(d) {
      if (d.t === 'gask') { if (!defOf(d.game) || session) return api.answer(d, false); onAsk && onAsk(d); return; }
      if (d.t === 'gyes' || d.t === 'gno') { const a = asks.get(d.gid); if (!a || !a.asked.has(d.from)) return; (d.t === 'gyes' ? a.yes : a.no).add(d.from); if (a.yes.size + a.no.size >= a.asked.size || a.yes.size + 1 >= defOf(a.game).max) go(d.gid); return; }
      // (round R privacy, 9 Oct) before, any player could open a game here by naming this child in the seats; now only the
      // one who asked, and only after this child said yes (the child who invites starts it themselves, in go())
      if (d.t === 'gstart') { if (session || !Array.isArray(d.seats) || !d.seats.includes(me()) || said.get(d.gid) !== d.from) return; said.delete(d.gid); begin(d.gid, d.game, d.level, d.seats, d.size); return; }
      if (!session || d.gid !== session.gid) return;
      const s = session.seats.indexOf(d.from); if (s < 0) return;
      if (d.t === 'gmove') record(s, d.n, d.mv);
      if (d.t === 'gbye') { session.gone.add(s); session.waiters = session.waiters.filter(w => { if (w.s === s) { w.res(null); return false; } return true; }); onEnd && onEnd(d.from); }
    },
    // a friend left the room
    left(id) { if (session) api.receive({ t: 'gbye', gid: session.gid, from: id }); }
  };
  function record(s, n, mv) {
    if (!session.moves.has(n)) session.moves.set(n, new Map());
    const m = session.moves.get(n); if (m.has(s)) return; m.set(s, mv);
    session.listeners.forEach(f => { try { f(s, n, mv); } catch (e) { } });
    session.waiters = session.waiters.filter(w => { if (w.n === n && w.s === s) { w.res(mv); return false; } return true; });
  }
  function go(gid) {
    const a = asks.get(gid); if (!a) return; asks.delete(gid); clearTimeout(a.timer);
    if (!a.yes.size) { onStart && onStart(null, a); return; }
    const seats = [me(), ...[...a.yes].slice(0, defOf(a.game).max - 1)];
    for (const id of seats.slice(1)) net.send({ t: 'gstart', to: id, gid, game: a.game, level: a.level, size: a.size, seats });
    begin(gid, a.game, a.level, seats, a.size);
  }
  function begin(gid, game, level, seats, size) {
    session = { gid, game, level, size, seats, mine: seats.indexOf(me()), moves: new Map(), waiters: [], gone: new Set(), listeners: [] };
    onStart && onStart(session);
  }
  return api;
}

// who wins a round of Oẳn tù tì among any number of hands (0 rock, 1 paper, 2 scissors; null: left):
// the seats that won, or [] for a draw (all the same, or all three shapes out)
export function rpsWinners(hands) {
  const live = hands.map((h, s) => [h, s]).filter(([h]) => h === 0 || h === 1 || h === 2), kinds = new Set(live.map(([h]) => h));
  if (kinds.size !== 2) return [];
  const [a, b] = [...kinds], win = (a + 1) % 3 === b ? b : a; // paper beats rock, scissors beat paper, rock beats scissors
  return live.filter(([h]) => h === win).map(([, s]) => s);
}
