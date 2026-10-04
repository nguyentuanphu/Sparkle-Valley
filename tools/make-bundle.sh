#!/usr/bin/env bash
# The local test bundle, made every round (docs/INFRASTRUCTURE.md §6.1):
#   SparkleValley-<build>-local.zip = game/ (every tracked file of HEAD, voices included) + SparkleStudio.exe
#   + HANDOFF.md, INFRASTRUCTURE.md, ARCHITECTURE.md, SO-TAY-THIET-KE.md + START-HERE.txt
# Usage: tools/make-bundle.sh [output folder] [--parts]   (commit first: the game comes from HEAD, not the working tree)
#   --parts  also splits it into parts under 28 MB that all unpack into the same folder (tools/bundle-parts.py), for sending where one 190 MB file is too big
set -e
cd "$(dirname "$0")/.."
OUT_DIR="${1:-.}"
BUILD=$(sed -n "s/.*BUILD *= *'\([^']*\)'.*/\1/p" js/build.js)
NAME="SparkleValley-$BUILD-local"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/$NAME/game"
git archive HEAD | tar -x -C "$TMP/$NAME/game"
[ -d photos ] && cp -r photos "$TMP/$NAME/game/" 2>/dev/null || true
cp HANDOFF.md docs/INFRASTRUCTURE.md docs/ARCHITECTURE.md docs/SO-TAY-THIET-KE.md "$TMP/$NAME/"
if [ -f studio/dist/SparkleStudio.exe ]; then cp studio/dist/SparkleStudio.exe "$TMP/$NAME/"; EXE=yes; else EXE=no; echo "note: studio/dist/SparkleStudio.exe not built (bash studio/build-exe.sh)"; fi
cat > "$TMP/$NAME/START-HERE.txt" <<EOF
Sparkle Valley $BUILD, local test bundle (commit $(git rev-parse --short HEAD), $(date +%Y-%m-%d))

1. The game: open a terminal in the "game" folder and run
       python3 -m http.server 8765
   then open http://localhost:8765 in Chrome, Edge or Safari.
   (Any static web server works. Counting players and the online Studio are not
   available locally: they run on Netlify. "netlify dev" in the game folder runs them.)

2. Sparkle Studio: $( [ "$EXE" = yes ] && echo "copy SparkleStudio.exe into the \"game\" folder and double-click it." || echo "not built in this bundle; run  node studio/studio.cjs  (Node 22) in the game folder." )
   It opens at http://127.0.0.1:7777.

3. Read HANDOFF.md first, then INFRASTRUCTURE.md (hosting, keys, testing),
   ARCHITECTURE.md (the code) and SO-TAY-THIET-KE.md (the design handbook).
EOF
(cd "$TMP" && zip -qr "$NAME.zip" "$NAME")
mv "$TMP/$NAME.zip" "$OUT_DIR/"
echo "Ready: $OUT_DIR/$NAME.zip ($(du -h "$OUT_DIR/$NAME.zip" | cut -f1))"
if [ "$2" = "--parts" ]; then python3 tools/bundle-parts.py "$OUT_DIR/$NAME.zip" "$OUT_DIR"; fi

