# Approved interface reference

Reference is R74 commit 6a6ae885f86ad58a52688782eeba1d5417985fe9, not the rejected enlarged R75 layout.
Matching synthetic baseline screenshots/results: evidence/baseline/. Candidate: evidence/candidate/.
Viewports: phone390x844 EN/VI, tablet820x1180 EN, computer1280x800 EN. Additional ownerround covers844x390 EN/VI.

Use css/style.css canonical tokens: Fredoka EN, Baloo2 VI; --text #3b2558, --cyan #29b6f6, --purple #8a5cf6, --r18px, existing panel/panel2/line/shadow. Reuse art.js drawings and outfit geometry; no system-font island.
Minimum touch targets44px generally64px under5. Compact shell is not permission to shrink targets.
Baseline phone Who:358x397.69 EN;358x447.58 VI. Rebuilding baseline moved y about3–4px at the measured animation frame. Candidate keeps the opening height across redraws with only inner scroll. Compare results.json for exact measurements.
Actions/header/footer remain outside scrolling body; reserve footer space. Review long VI, keyboard and landscape separately.
Bag and Shop share Pad tabs; collection does not silently change recipient. Optical icon/outfit scale must be inspected against worn appearance.
Audio opens relative to its anchor and viewport; ladybird tabs inherit shared tokens. Closing/tray switching must clean listeners and preserve report drafts and live run.
This reference is measured and screenshot-backed only for listed states. Whole-screen inventory and physical-device coverage remain open.
