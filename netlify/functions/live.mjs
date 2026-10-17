// The releases, festivals and content pages Sparkle Studio saved (netlify/lib/live.mjs), for every device that opens the game.
// Public and small; kept for 30 seconds so many devices opening at once ask the store only now and then.
import { readLive, readContent, publicLive } from '../lib/live.mjs';
const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'live', consistency: 'strong' }));
export const makeLive = ({ liveStore = blobs } = {}) => async () => {
  const S = await liveStore(), v = publicLive(await readLive(S).catch(() => ({ releases: {}, festivals: {} })), await readContent(S).catch(() => null)); // (round R privacy) never the admin's name
  // (r81, owner 17 Oct AEDT) with the content pages' live sections (netlify/lib/live.mjs saveContent)
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' } });
};
export default makeLive();
export const config = { path: '/api/live' };
