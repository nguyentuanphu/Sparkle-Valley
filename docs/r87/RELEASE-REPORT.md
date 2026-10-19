# r87 release — deployed 19 October 2026 AEDT

Runtime candidate: `50c1a344` on `release/r87`, [PR #366](https://github.com/nguyentuanphu/Sparkle-Valley/pull/366). Owner approved “Deploy”; PR #366 merged as 9576a97c. Live r87 verified at 4:43 pm AEDT, 19 October 2026. Matching Studio exe r87 is published (studio-exe b6bddab0). The rebuilt Netlify zip (266,930,863 bytes) is available in the workspace; its checksum and package verification are committed here. Final GitHub run 39185040930 passed 222/222 with no retries on reviewed PR head 799c2ec1.

## What changes

- Rider-eye cameras stay inside actual cabin windows. High/Street choices and zoom work while riding; zoom changes the lens rather than moving the eyes out of the seat. Buffalo horns are hidden only for their own rider, with original exterior geometry retained. Car interior proxies follow the actual windscreen slope.
- The ten animal-recognition calls wait for real recordings. Missing clips hold with a 64 px retry; repeated taps stop the previous call; closing cancels queued/playing game audio. Spoken prompts and Story Helpers praise wait for animal calls. Recordings bypass the synth compressor/quiz boost. Raw clips are unchanged; listening quality has not been certified in this workspace.
- Music Corner keeps one recorded-tune replay at a time, across tab redraws, and cancels future notes on close/new recording. Under-5 note, tab and recording controls are at least 64 px; narrow phones show the same eight notes in two rows. All four existing synthesised instrument timbres remain as before.
- Under-5 Ô Ăn Quan has 64 px pits/direction controls, a vertical narrow board, highlighted selection and revised recorded instructions. Rules are preserved. Studio Home/Publish explain live, connected desktop and local-folder saves correctly. Voice downloads count cached and newly saved files across resumption.
- Help, chat and Grown-ups implementations load when opened. Muted starts with automatic voice downloads off skip the background voice-index preload; first tap/speech requests still load it. Packed download ratchet lowered from 2.65 to 2.55 MB after two measured reductions.
- Closed settings windows unsubscribe voice callbacks; install buttons use weak references; Pad Friends handlers/timers clean up. Slow active frames now count toward playing seconds instead of being discarded at 250 ms; title/idle/covered/hidden time is excluded. Automatic adventure clues wait behind busy windows and active speech, drain one line at a time and discard stale queued steps. Friends help awaits Grown-ups before expanding Internet settings.
- Memory Village/spare plots build saved homes with names, owners and visitable interiors. All six styles fit real geometry bounds and follow levelled terrain. Family buildings/villagers prefer validated place+offset anchors; stale raw coordinates stay parked.
- Exact ridge bounds reduce irrelevant terrain work. Owl/gourd guide solids batch from 13/7 draws to one each. Daily recordings from PR #357 and four revised instruction recordings are integrated. All version markers are r87.

## Verification

| Check | Result |
|---|---|
| Riding cameras | Pass: 22 driver/animal and ten public-boarding model-age cases; eye bounds, actual forward pixels, restoration after render failure, High/Street and POV zoom |
| Animal playback | Pass, latest 98 s: ten actual clips, delayed/cancelled pig, missing-file retry/recovery, label fit and 64 px target, replay/close cleanup and Story Helpers ordering |
| Music Corner | Pass, 50 s: 64 px under-5 controls and 32 pads, exact recorded notes, repeated taps/tab redraws and close cancellation |
| Road voice / Daily Adventure | Pass: EN/VI recorded crossing instructions (132 s); full Daily Adventure (249 s) |
| Deferred UI / chat | Parents, walkaway, grownupsui, nostudio, feel, onlineoff and five-screen offscreenpanels pass; original assertions retained |
| Reading | Pass first try: all 90 EN/VI age/level cases, 1,700 s. Camera/audio-only changes verified separately |
| Voice coverage / recordings | voicecover 9,527 lines, ten animal files, six-story storyhelp, voice-download resumption, first-language selection (29 s) and held-download refresh (57 s) pass |
| Types / contract / architecture | Explicit game/check source list type-checks; contract unchanged; zero import-cycle groups at architecture checkpoint; preload passes |
| Terrain / guide geometry | 104,859 exact terrain-height comparisons; equivalent owl/gourd geometry with original shadows retained |
| Remembered homes / anchors | All six styles, occupied spare plot, foundations, visible approach, owner/interior and real NPC/building placements pass; 66 default plots pass |
| Stability | 30 windows + 20 games pass: zero retained settings windows, DOM/canvas growth zero; collected heap +1.52 MB, geometry/texture objects +2 each; no context loss/navigation |
| Battery | Pass on final candidate, 154 s (earlier repaired run 173 s): caps/gates, idle/wake, far still people, pixel ratio and Analytics-off assertions unchanged; recorded playing seconds now nonzero |
| Performance | **World-time assertion fails**: final candidate 11.368 s (earlier 10.736/11.900 s); same-machine exact r86 check also fails at 10.659 s. Other limits pass: final packed download 2.519 MB (earlier 2.518/2.500) versus r86 2.612; final home 450 draws versus r86 460; final village 367 draws / 727,551 triangles; heap +0 MB and DOM +2 after ten games |
| Startup | Final **968 KB first / 0 KB cached**, no unwanted muted voice-index requests. **All four time assertions fail**: title 1.957 s, first ready 39.956 s, cached ready 48.259 s, freeze 12.919 s (machine x1.22). Existing time limits remain unchanged |
| GitHub full suite | [Final run 39185040930](https://github.com/nguyentuanphu/Sparkle-Valley/actions/runs/39185040930): **222/222, no retries**, on 799c2ec1. Earlier 4ba8a5b9 needed ownerfamily/festhunt retries; causes fixed and both pass first try in final CI |
| Netlify zip | Built and verified from runtime 50c1a344; archive integrity, all offline-listed paths, ten animal MP3s and r87 markers pass; checksum in netlify-zip.sha256 |
| AI review | **Did not finish.** Run 39149385863 produced no verdict; bot says usage or time may have run out. Green workflow is not an AI pass; no automatic usage retry |

Fresh-context ABBA diagnostic (same supplied content, not the cached perf verdict): r86 20.004/11.706 s, r87 12.993/11.402 s. Small, variable samples do not establish a precise speedup. Exact-check and resource evidence is under `evidence/`.

## Failures and retries

- Preload needed regeneration after adding positioning code, then passed. Expanded home checks caught palms/cottage extensions crossing plot boundaries; fitting now uses real bounds with unchanged limits.
- An early home photo moved only the camera, causing normal distance culling. Corrected check brings the child near and requires actual geometry draw/foundation alignment.
- Early stress diagnostics retained Playwright handles and DevTools objects. Those counts were invalid as application leak sizes; corrected probes and caveats are preserved. Real subscription/install/Friends-handler retention paths were repaired.
- The service-worker guard initially rejected a unit fetch stand-in; corrected guard then passed all 175 units.
- New camera selection initially included an intentionally unrideable cargo bike, then expected a public taxi unavailable in this map. Coverage now discovers actual actions; forward-pixel/eye/restoration assertions remain enforced.
- Deferred-panel/chat checks awaited fixed delays. They now await actual opening. onlineoff additionally exposed a real runtime section-expansion race, fixed in main.ts.
- The road recording was interrupted by an automatic adventure clue; automatic announcements now wait. The no-device-voice assertion passes.
- New Music Corner check initially ignored the recording’s first-note delay, then counted a tab’s tap sound as an extra instrument note. It now preserves timing and uses the existing tap-feedback switch for isolation; exact complete-note and cancellation assertions remain.
- Battery initially reported zero playing seconds on slow frames; source accounting repaired, unchanged check passes. Startup first download initially reached 1,033 KB; unwanted muted background index preload removed, final 968 KB with an explicit no-preload assertion. Time failures are reported rather than rerun until green.
- Screenshot review caught Retry inheriting the oversized picture-choice font. Standard text-button styling and a label-fit assertion fix it. Earlier screenshots taken during opening transitions are not the final UI verdict.
- The first resumed local run was interrupted; unfinished results were not counted. A server restart from the wrong folder was corrected and that attempt excluded. Invalid cache-comparison harness attempts were excluded before the fresh-context diagnostic.

- GitHub ownerfamily passed only on retry: token cleanup missed revocation between successful status and a rejected photo request. Deterministic race regression and fix pass locally (438 s), together with types (22 s) and festhunt (122 s). The latter local pass preceded the fixed-calendar test edit; final CI verifies it. festhunt passed only on retry after its one-day schedules expired across UTC midnight; fixed-calendar fixture preserves the full assertions.

## Remaining owned work and limits

- Missing helper drawing-game branch/commits and its detailed agreed brief remain unavailable; ten agreed games are not claimed complete. Camera work above follows the owner’s direct request independently.
- Further net/sticker deferral, staged world readiness (appearance plan awaits owner review), the 250-draw target, permanent chapter story locations and the Vũng Tàu game remain in `backlog-audit.md` and `remaining-performance-plan.md`.
- Physical Mac/iPhone verification for #341/#355 remains outstanding. Chromium viewport/stress tests do not establish a device cure.
- Technical decoding/routing tests do not establish animal recognisability, pronunciation or instrument authenticity. Source-clip review: `audio-review.html`.

Owner approved “Deploy” on 19 October 2026 AEDT; the round is published. Live service worker, Studio version and pig recording return 200; Studio exe version/checksum and Windows GUI header verified. Windows execution, perceptual listening and reporting Mac/iPhone confirmation remain unverified. Live verification and Studio publication evidence are in evidence/.
