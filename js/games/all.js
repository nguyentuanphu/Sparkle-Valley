import './learning-meta.js';
// Keep menu metadata synchronous; fetch each implementation group only when a game opens.
import { register, GAMES } from './registry.js';
import { GAME_CATALOG, GAME_LOADERS } from './catalog.js';
const loads = new Map();
for (const group of Object.values(GAME_LOADERS)) {
  const load = () => {
    if (!loads.has(group)) loads.set(group, group.load().catch(e => { loads.delete(group); throw e; }));
    return loads.get(group);
  };
  for (const id of group.ids) {
    const def = GAME_CATALOG.find(d => d.id === id);
    register({ ...def, load, async run(api) {
      await load();
      if (!api.closed) return GAMES[id].run(api);
    } });
  }
}
