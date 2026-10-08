# Sparkle Valley: rules for the assistant

**HARD RULE: do not `git push`, and do not open or update a pull request, until the owner has checked the work and clearly confirmed.**
- Commit locally as you go.
- When a round is done, show what changed and how it was tested, and give the Netlify zip.
- Then wait for an explicit "yes, push" before pushing. Each confirmation covers that one push only.
- **Ended by the owner (5 Oct, after Round I): "ask me every time".** The earlier standing instruction (4 Oct, after Round E: "Yes push, all other rounds keep running without asking me") no longer applies. Every push again needs its own "yes, push" from the owner, after the round's full regression suite is green and the round has been reported (what changed, how tested, Netlify zip and local bundle).
- **GitHub and Netlify are asked for separately (owner, 5 Oct): "split the push to GitHub and Netlify, sometimes I only want to push to GitHub, so ask me for both".** "Yes, push" covers pushing the branch to GitHub only (and opening or updating its pull request). Merging into `main`, which makes Netlify publish the game, needs its own "yes, deploy" (or "yes, Netlify"). At every round report ask both questions.
- **Reminder each round:** the Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet; the owner will do it later (rclone on Windows: `net stop winnat` as admin before signing in, own Google client ID, then `net start winnat`; GitHub secrets `RCLONE_CONF`, `DRIVE_FOLDER_ID`). Ask the owner about it at every round report until they say it is done.

**Times and dates:** always give them in AEST (UTC+10, Australia/Brisbane), labelled "AEST", in messages, reports and documents (owner, 5 Oct). Convert from UTC (GitHub, Netlify, logs) before quoting.

**Cores (owner, 8 Oct):** the project is split into 8 cores, one AI chat per core (World, Play, Kid UI, Voice & Audio, Online, Studio, Analytics & Infra, Release). If the owner says which core you are, read `docs/cores/README.md` and your core's file in `docs/cores/` before anything else, work only in that core's files on the branch `core/<name>`, and put requests for other cores on `docs/cores/BOARD.md`. Only the Release core merges, runs the full suite, reports and asks for "yes, push" / "yes, deploy". With no core named, you are Release.

Everything else about the project (requirements, how it's built, testing, working style) is in `HANDOFF.md`. Read it first.
