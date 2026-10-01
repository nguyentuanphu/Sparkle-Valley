#!/usr/bin/env sh
# Builds a clean folder (and zip) containing only the files the game needs,
# ready to drag onto https://app.netlify.com/drop
set -e
cd "$(dirname "$0")"
OUT=netlify-site
rm -rf "$OUT" sparkle-valley-netlify.zip
mkdir -p "$OUT"
cp -r index.html manifest.webmanifest sw.js netlify.toml css fonts icons js vendor videos "$OUT"/
(cd "$OUT" && zip -qr ../sparkle-valley-netlify.zip .)
echo "Ready: $OUT/ and sparkle-valley-netlify.zip"
