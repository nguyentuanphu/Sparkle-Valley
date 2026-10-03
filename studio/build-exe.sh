#!/usr/bin/env bash
# Builds studio/dist/SparkleStudio.exe: Windows Node (same version as the node running this script) with
# studio.cjs and the dashboard files packed inside (Node "single executable application").
# Needs: node 22+, npx, curl, unzip. Run from the repo root: bash studio/build-exe.sh
set -euo pipefail
cd "$(dirname "$0")"
V=$(node -p process.version)
mkdir -p dist .build
if [ ! -f ".build/node-$V.exe" ]; then
  curl -sSfL -o .build/node.zip "https://nodejs.org/dist/$V/node-$V-win-x64.zip"
  want=$(curl -sSfL "https://nodejs.org/dist/$V/SHASUMS256.txt" | grep " node-$V-win-x64.zip$" | cut -d' ' -f1)
  [ "$(sha256sum .build/node.zip | cut -d' ' -f1)" = "$want" ] || { echo "node.zip checksum does not match"; exit 1; }
  unzip -qo -j .build/node.zip "node-$V-win-x64/node.exe" -d .build && mv .build/node.exe ".build/node-$V.exe" && rm .build/node.zip
fi
cat > .build/sea-config.json <<EOF
{ "main": "studio.cjs", "output": ".build/studio.blob", "disableExperimentalSEAWarning": true, "useSnapshot": false, "useCodeCache": false,
  "assets": { "index.html": "ui/index.html", "app.js": "ui/app.js", "style.css": "ui/style.css", "lame.min.js": "ui/lame.min.js" } }
EOF
node --experimental-sea-config .build/sea-config.json
cp ".build/node-$V.exe" dist/SparkleStudio.exe
npx --yes postject@1.0.0-alpha.6 dist/SparkleStudio.exe NODE_SEA_BLOB .build/studio.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
ls -la dist/SparkleStudio.exe
