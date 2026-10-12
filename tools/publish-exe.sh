#!/usr/bin/env bash
# Builds SparkleStudio.exe and puts it on the GitHub branch "studio-exe" with version.json { studio, sha256, size,
# notes }, so every SparkleStudio.exe that has the updater offers "Update now" (owner, 12 Oct: "the exe i have will get
# updated once there is new function"). Run it from the repo root after a round that changes studio/ is live:
#   bash tools/publish-exe.sh "What is new, in one line"
# The branch is only for downloads: it is never merged into main and never published on the website.
set -euo pipefail
cd "$(dirname "$0")/.."
NOTES="${1:-}"
bash studio/build-exe.sh
V=$(node -p "require('./studio/version.json').studio")
EXE=studio/dist/SparkleStudio.exe
SUM=$(sha256sum "$EXE" | cut -d' ' -f1); SIZE=$(stat -c %s "$EXE")
W=$(mktemp -d)
cleanup() { git worktree remove --force "$W" 2>/dev/null || true; }
trap cleanup EXIT
if git fetch -q origin studio-exe 2>/dev/null; then git worktree add -q -B studio-exe "$W" origin/studio-exe
else git worktree add -q --orphan -b studio-exe "$W"; fi
cp "$EXE" "$W/SparkleStudio.exe"
V="$V" SUM="$SUM" SIZE="$SIZE" NOTES="$NOTES" node -e "require('fs').writeFileSync(process.argv[1], JSON.stringify({ studio: process.env.V, sha256: process.env.SUM, size: +process.env.SIZE, notes: process.env.NOTES, built: new Date().toISOString() }, null, 1) + '\n')" "$W/version.json"
cat > "$W/README.md" <<EOF
# Sparkle Studio for Windows

\`SparkleStudio.exe\` $V, built from \`$(git rev-parse --short HEAD)\` with \`bash tools/publish-exe.sh\`.

- An exe that has the updater (from r63 on) finds this one by itself: a banner "Update now", or Settings, "Check for updates".
- To download it by hand: open \`SparkleStudio.exe\` above and press "Download raw file". Put it in the game folder and double-click.
- \`version.json\` holds the version and the checksum the exe checks before it swaps itself.

This branch only holds the exe for downloading; it is never merged into \`main\` and never published on the website.
EOF
cd "$W"
git add SparkleStudio.exe version.json README.md
git commit -q -m "SparkleStudio.exe $V${NOTES:+: $NOTES}"
git push -q -u origin studio-exe
echo "SparkleStudio.exe $V ($SIZE bytes, sha256 $SUM) is on the studio-exe branch."
