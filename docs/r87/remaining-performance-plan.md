# Remaining performance work: proposed build order

Prepared by Release, 19 October 2026 AEDT. This is a plan, not an implemented startup change or deployment approval.

The r87 handover (§3, S2) explicitly says: “Plan it with the owner first (pop-up), as it changes when places appear.” That applies to making the valley interactive before distant areas finish building. The exact ridge-math optimization already implemented does not change availability.

## Proposed behaviour

1. Build shared terrain, roads/bridges, player movement, save state, the child's starting neighbourhood and its required people/doors before enabling play. Preserve the normal title and honest progress display.
2. Finish the other neighbourhoods in short queued tasks. Preserve their canonical coordinates and all existing content. Do not put solid obstacles into the child's current position; an area finishes before a child enters it.
3. A trip/warp to an unfinished area waits with progress until that area is complete. Traffic, guide markers and multiplayer must not claim an unbuilt destination is ready. No child is silently moved back or allowed through future walls.
4. Keep `bootTimes.ready` for actually playable local readiness and add `bootTimes.allBuilt` for the complete world. Tests that assert distant buildings, colliders, routes, NPCs or map contents wait for allBuilt. Startup measures both; no baseline or check is weakened to hide deferred work.

## Implementation order after owner review

- First map the dependency order among terrain/road levelling, cities, suburbs, homes, interactables, traffic and the solid map. Current functions create several of these together, so simply inserting more pauses is insufficient.
- Keep collision/height decisions deterministic. Extract a canonical area plan before splitting decoration/geometry creation. Do not introduce a second source of map coordinates.
- Add per-area readiness and cancellation, then split one distant city as a reversible trial. Keep the existing full build path until equivalence is demonstrated.
- Compare complete world contents and terrain/collision samples with the full-build path. Exercise walking into a building area, warping, split screen, multiplayer, restoring saves, offline starts and closing/loading games while construction continues.
- Measure title, playable and allBuilt times and frame stalls on the same machine. Only extend to the other areas after the trial improves interaction without increasing stalled frames or changing completed-world content.

## Other independently measurable follow-ups

| Work | Constraint |
|---|---|
| Defer net implementation | Retain synchronous local-player/status interfaces, queue or reject actions honestly while loading, and verify join/leave/disconnect/offline behaviour. Avoid a fake-success facade. |
| Defer sticker descriptions | Keep a compact synchronous reward/name/icon index; the full album descriptions can load when opened. Rewards must not disappear while the album loads. |
| Batch static scene meshes | Preserve spatial culling, outlines, shadows, camera fading, collisions and individually moving/editable objects. Compare rendered geometry and real per-frame draws; the audit's union count is not a median. |
| Physical #341/#355 verification | Current Chromium viewport/stress results do not establish normal frame rate on the owner's Mac or an iPhone reload cure. |

Remaining work stays visible in the board audit. No new appearance or area-availability change has been approved through a generic release checkpoint.
