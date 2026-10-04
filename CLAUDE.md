# Sparkle Valley: rules for the assistant

**HARD RULE: do not `git push`, and do not open or update a pull request, until the owner has checked the work and clearly confirmed.**
- Commit locally as you go.
- When a round is done, show what changed and how it was tested, and give the Netlify zip.
- Then wait for an explicit "yes, push" before pushing. Each confirmation covers that one push only.
- **Ended by the owner (5 Oct, after Round I): "ask me every time".** The earlier standing instruction (4 Oct, after Round E: "Yes push, all other rounds keep running without asking me") no longer applies. Every push again needs its own "yes, push" from the owner, after the round's full regression suite is green and the round has been reported (what changed, how tested, Netlify zip and local bundle).
- **Reminder each round:** the Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet; the owner will do it later (rclone on Windows: `net stop winnat` as admin before signing in, own Google client ID, then `net start winnat`; GitHub secrets `RCLONE_CONF`, `DRIVE_FOLDER_ID`). Ask the owner about it at every round report until they say it is done.

Everything else about the project (requirements, how it's built, testing, working style) is in `HANDOFF.md`. Read it first.
