// The releases and festival changes Sparkle Studio saved (netlify/lib/live.mjs), for every device that opens the game.
// Public and small; kept for 30 seconds so many devices opening at once ask the store only now and then.
import { readLive, publicLive } from '../lib/live.mjs';
const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'live', consistency: 'strong' }));
export const makeLive = ({ liveStore = blobs } = {}) => async () => {
  const v = publicLive(await readLive(await liveStore()).catch(() => ({ releases: {}, festivals: {} }))); // (round R privacy) never the admin's name
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' } });
};
export default makeLive();
export const config = { path: '/api/live' };
