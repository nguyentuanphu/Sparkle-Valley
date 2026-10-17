#!/usr/bin/env sh
# Builds a clean folder (and zip) containing only the files the game needs,
# ready to drag onto https://app.netlify.com/drop
set -e
cd "$(dirname "$0")"
OUT=netlify-site
# (owner, 16 Oct AEDT: TypeScript, batch 0) every .ts becomes the .js beside it first (tools/build.mjs); with .ts files
# in the game this needs Node, and the zip is not made without it
if command -v node >/dev/null 2>&1; then node tools/build.mjs
elif find js studio/ui -name '*.ts' ! -name '*.d.ts' 2>/dev/null | grep -q . || [ -f sw.ts ]; then echo "Node is needed to build the game's TypeScript files (tools/build.mjs)"; exit 1; fi
rm -rf "$OUT" sparkle-valley-netlify.zip
mkdir -p "$OUT"
cp -r index.html manifest.webmanifest sw.js netlify.toml css fonts icons js vendor videos content "$OUT"/
rm -rf "$OUT"/content/old   # Sparkle Studio backups stay on the computer
# the offline voice pack (made with tools/make-voice-pack.mjs), when there is one
[ -d voices ] && cp -r voices "$OUT"/
[ -d photos ] && cp -r photos "$OUT"/   # real photos saved by Sparkle Studio
# pack the start-up scripts (tools/bundle.mjs: smaller start-up download; js/ stays for Sparkle Studio's pages).
# Without Node or esbuild the site keeps the plain modules, which work the same.
if command -v node >/dev/null 2>&1; then node tools/bundle.mjs "$OUT" || echo "bundle step failed: the zip keeps the plain modules"; fi
(cd "$OUT" && zip -qr ../sparkle-valley-netlify.zip .)
echo "Ready: $OUT/ and sparkle-valley-netlify.zip"
