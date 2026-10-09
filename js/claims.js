// First come, first served (owner, round G): when friends play together online, fruit, flowers, gems, wild treasures
// and things on the ground can be taken by only one of them, whoever is quickest. Every pickup keeps its own "ready
// again at" time (st.ready); when this child takes one, the friends' games are told (message "claim") and hide it for
// the same time; a friend who reaches it a moment later hears that someone got it first. (The two-stone treasure chests
// are opened together, so both helpers get their prize: js/twinchests.js.)
const PICKUP = /^(wf|wl|wr|wd|g)\d+$/;

export function createClaims(G, { net, toast, say, T }) {
  const items = () => G.interactables.filter(it => it.st && PICKUP.test(it.id || ''));
  let wrapped = new WeakSet();
  const perMin = new Map(), MAX_PER_MIN = 30;
  function wrap() {
    for (const it of items()) {
      if (wrapped.has(it)) continue; wrapped.add(it);
      const act = it.act;
      it.act = (h, g) => {
        if (it.st.ready > performance.now() && it.st.by) { toast(h, T(`${it.st.by} got it first!`, `${it.st.by} lấy trước rồi!`)); return; }
        const was = it.st.ready, r = act(h, g);
        if (net.connected() && it.st.ready > was && it.st.ready > performance.now()) net.send({ t: 'claim', id: it.id, ms: Math.min(600000, Math.round(it.st.ready - performance.now())) });
        return r;
      };
    }
  }
  return {
    wrap,
    // a friend took this pickup. (round R privacy, 9 Oct) at most 30 a minute from one player: more than a child could
    // pick, so a stranger's flood can't empty the valley for everyone
    receive(d) {
      const now = Date.now(), list = (perMin.get(d.from) || []).filter(t => now - t < 60000); if (list.length >= MAX_PER_MIN) return; list.push(now); perMin.set(d.from, list);
      const it = items().find(x => x.id === d.id); if (!it) return;
      it.st.ready = performance.now() + d.ms; it.st.by = net.name(d.from); it.st.hits = 0; it.st.digs = 0;
      setTimeout(() => { if (it.st.ready <= performance.now()) it.st.by = null; }, d.ms + 50);
    }
  };
}
