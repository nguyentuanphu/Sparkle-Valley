# Sparkle Studio for Windows

`SparkleStudio.exe` r83, built from `2ac5ca2d` with `bash tools/publish-exe.sh`.

- An exe that has the updater (from r63 on) finds this one by itself: a banner "Update now", or Settings, "Check for updates".
- To download it by hand: open `SparkleStudio.exe` above and press "Download raw file". Put it in the game folder and double-click.
- `version.json` holds the version and the checksum the exe checks before it swaps itself.

This branch only holds the exe for downloading; it is never merged into `main` and never published on the website.
