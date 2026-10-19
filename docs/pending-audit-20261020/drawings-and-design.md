# Drawing and visual-design backlog: additional audit

20 October 2026 AEDT. The first historical audit missed a separate UI-redesign approval and did not give the Concept D art stages or broad how-to rollout their own rows. This adds them explicitly. Implementation remains paused; r87 stays live.

## Three different drawing deliverables

| Deliverable | What exists | What is pending | Owner decision |
| --- | --- | --- | --- |
| **UI redesign drawings / design kit** | Fourteen HTML canvas boards and comparisons, with a saved design-system README and old Now pictures. Original [design artifact](https://claude.ai/artifact/TYdNnTxrKTP8JsNGC4FsbY); [repo source](../ui-redesign-20261016/README.md). Google Drive mirror contains the same owner-review statement. | Review the full proposed HUD, Bag, Mirror and Grown-ups restyle against current screens, preserve all controls and prepare an implementation/verification plan. The new Sticker book/Adventure style and specific r79 fixes shipped, but are not evidence of a blanket whole-interface approval. | **Records still say owner review/approval is outstanding for restyling existing screens.** No later blanket approval found. |
| **Concept D / storybook world drawings and prototypes** | Approved concept page, drawn comparisons, animal/tree prototypes, live map/water/road changes and some model improvements. [Concept page](../concept-d/index.html); tools/art-proto contains standalone prototypes. | **T5 art rollout remains partial/unreconciled:** houses and towns, landmarks, people, plush animal details and region-specific trees/plants. Inventory each promised asset against the actual model, adopt remaining approved details in bounded batches and measure performance/visual parity. Neither a concept drawing nor a prototype proves the whole world art was delivered. | Concept D/art direction was already approved. It needs scoped implementation/evidence; do not ask the owner to choose A/B/C again. Any new restyle outside the chosen direction needs its own concrete review. |
| **Ten drawing games** | A helper reported local source/98 new spoken lines, but the advertised branch/commit still cannot be recovered. | Recover the agreed brief/source; then integrate, convert, record and test. GitHub/local checks and targeted Drive filename searches did not find the missing package. | Recovery input may be needed from the other chat. Replacement scope must be concrete if the original cannot be recovered. |

### UI choices that must remain visible

The mockup's HUD omits the mini-map, clock, microphone, Run and camera; its README explicitly leaves their placement as an owner question. Preserve these capabilities until there is a reviewed decision about visibility/trays. Do not silently implement the drawing as removal permission.

The mockup kit also proposes bouncing/shrinking windows. That conflicts with the later approved fixed-window requirement. Keep panel geometry steady and reconcile the proposal before presenting it as an implementation-ready design. The new 3-by-3/paged choices, new Grown-ups section layout/instant-save behavior and changed touch/type scales are proposed interaction changes, not just colour swaps.

Specific owner-requested Bag/Mirror/HUD fixes already shipped; approval for those fixes is not blanket approval for every drawing/rule in this folder. Conversely, the general restyle hold does not mean those delivered fixes should be undone.

## Further incomplete visual/content work

| Work | Evidence and pending result |
| --- | --- |
| **T6 full roaming-animal design** | ROUND-T.md still lists T6 as a later stage. Riding, pets, animal homes and some behaviours exist. The broader Round R concept includes per-region roaming/day cycles, feed/brush friendship and ride unlocks, mother/baby or companion interactions, selected birds/dolphins/shoulder visits and shared rides. No complete species-by-species delivery/acceptance record found; finish that inventory and the retained behaviours rather than equate the bridge/POV fix with T6 completion. |
| **Full acted/interactive How to play rollout** | The original direction covered roughly 62 guides, not just stories. Current content has four acted guides (O An Quan, counting, marbles, memory), with actual game-driven hand demos on marbles and memory. Other guides use picture cards/fallbacks. Finish the retained per-game acted/interactive guide coverage in reviewed batches. The 33-story-film backlog being shipped does not mean all how-to guides shipped. Optional reading-game 3D guides are a subset of this work. |
| **Opening fly-over shown in the concept** | The concept describes a skippable 30-second dawn fly-over while the world builds. Existing story prologue films are different. No corresponding delivered startup sequence was identified. Treat it as concept scope to reconcile, not an approved instruction to slow startup or hide a long wait. Preserve the immediate, honest Welcome/loading contract. |
| **A–Z illustrated handbook/artifact freshness** | HANDOFF requires the whole-game illustrated artifact to be updated at the end of each round. A link exists, but no current-round update/generated-copy proof was found. Reconcile its source/copy and r87/r88 content; do not confuse the canonical rules handbook Markdown with proof that the separate picture artifact is current. |
| **Older design phases 3–5 labels** | HANDOFF still says these are to come, while later map/art work exists. Resolve these stale phase labels against actual delivered requirements; do not invent three whole new rebuilds from an old summary. |
| **Persistent generated-world cache** | ARCHITECTURE section 14.2 records the owner choosing device-side generation caching. Map pictures/solid caches exist, but the full generated WorldData cache remains a later dependency on pure generation. Keep this explicit within S2/architecture, rather than claim all generation caching is done because the service worker downloads zero KB. |

Other previously identified work remains: the unintegrated 30-house catalogue, Windows build marker, permanent chapter locations, Vung Tau game, full landmark-map art, home decoration placement, family dialogue recording, friends rankings and retained optional ideas. These are listed in the main audit; this addendum does not supersede the r88 bug/testing/performance/TypeScript backlog.

## Additional distribution gap found in Drive

The standalone **Sparkle Valley Studio / SparkleStudio.exe** file in Drive is **86,414,336 bytes**, modified **12 October 2026, 11:48 am AEDT**. The published r87 executable is **93,811,712 bytes**, built **19 October 2026, 4:44 pm AEDT**, with SHA-256 in docs/r87/evidence/studio-publish-verification.json. They are different binaries by size; the Drive copy is not the published r87 binary. Verify/update the intended standalone Drive download in a resumed maintenance pass, preserving the existing file/link if appropriate. No Drive file was modified by this audit.

The GitHub mirror intentionally excludes studio-exe; a successful repository mirror does not prove this separate Studio download was refreshed. This is maintenance work, not a new art approval or evidence that GitHub's r87 Studio publication failed.

## Search scope and limits

Checked repository HTML/SVG/canvas assets and prototype code, relevant history/plans, local library/shared-download folders, known GitHub branches and the connected Drive project folders/mirror. The local library/shared-download folders contain no additional supplied files. Drive found mirrored UI/Concept D/prototype folders and the separate Studio binary; no matching drawing-games package was found in the targeted filename search. This is not a complete content read of every mirrored file.

Public Claude artifact URLs returned an application shell, not their actual canvas/source contents. Existing repository copies were used. Private/unshared Claude conversations and the private raw Studio report inbox remain unavailable here, so this is not a claim to have searched every private conversation or every report record. Unrelated Drive results were not opened or included in the repository.

All implementation and deployment remain paused. [Main audit and owner inputs](STATUS.md).
