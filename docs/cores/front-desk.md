# Front Desk

**Current owner: Analytics & Infra (owner, 11 Oct 2026, 7:40 pm AEDT).** The separate Front Desk is no longer in service. Analytics & Infra uses the intake procedure below to listen, find the owning core and file issues for the bug robot. Release still integrates and deploys only after the round's explicit approval.

The old Front Desk prompt is historical. Start the Analytics & Infra chat using `docs/cores/README.md`; read this procedure, `CLAUDE.md` and the whole board.

## Owner's decisions (10 Oct)
- **Historical, 10 Oct:** only the Front Desk added bugs. **Superseded on 11 Oct, 7:40 pm AEDT:** Analytics & Infra now does this intake under the same procedure.
- **The bug robot** (`.github/workflows/bug-fixer.yml`) starts the moment a bug is filed or labelled, or the owner
  comments "go" on a plan, with a 5-minute timer as a backup (owner, 10 Oct 11:30 pm AEDT; was every 30 minutes). Up to
  8 bugs per run, 4 worked on at once. When there is no bug to work on it does not start Claude, so it uses no Claude usage.
- **Small bugs are fixed and pushed to GitHub without asking**, only to a branch `bugfix/<core>-<issue>` with a draft
  pull request. **Big bugs get a plan first** and wait for the owner's "go".
- **Nothing goes to Netlify by itself.** Only Release merges into `main`, under the round's "yes, deploy".
- The robot runs on the Claude account whose key is the GitHub secret `CLAUDE_CODE_OAUTH_TOKEN`
  (`CLAUDE_CODE_OAUTH_TOKEN_BACKUP`, another account, is tried if the first fails). The owner's other accounts are
  not used by the robot.

## What you do
1. **Listen.** Let the owner describe the bug in their own words (English or Vietnamese; answer in the same language).
2. **Ask only what is missing** (one short message): which device (phone, tablet, computer; iPhone or Android), where
   in the game, what happened, what should have happened, and whether it happens every time. Never ask for a child's
   real name, photo or address, and never put them in an issue.
3. **Look before you file.** Search the open issues for the same bug (`bug` label). If it is already there, add the new
   details as a comment instead of a new issue.
4. **Find the core** with the map below; read the core's file in `docs/cores/` and, if needed, the code, just enough
   to be sure. A bug that spans two cores becomes two issues, one per core, each saying what the other does.
5. **Decide the size** with the small-bug rule below.
6. **Open the issue** (GitHub tools, repository `nguyentuanphu/Sparkle-Valley`) with the body format below and the
   labels `bug`, the core label and `small` or `big`. Add `urgent` when a child could be hurt, frightened, shown to a
   stranger or charged money; then also tell the owner to ask Release now, without waiting for the robot.
7. **Tell the owner** in a few lines: the issue number and link, which core, small or big, and that the robot has started (it starts the moment the bug is filed).

## The small-bug rule
A bug is **small** only if all of these are true; otherwise it is **big**:
- the fix is in one core's own files;
- it does not touch the Round T map files (`js/world.js`, `js/roads.js`, `js/regions.js`, `js/cities.js`,
  `js/town.js`, `js/homes.js`, `js/vendors.js`, `js/hawkers.js`, `js/places.js`, `js/solids.js`, `js/content/map.js`);
- it needs no version bump and no new spoken lines;
- the fix is about 30 lines or fewer.

The robot checks this again; if a "small" bug turns out big it writes a plan and waits for "go" instead.

## Which core
| The owner notices... | Core label |
|---|---|
| Walking through walls, falling through the ground, a building, road, village or landmark missing or wrong, the 3D world slow | `world` |
| A mini-game, story, festival, song, level, quest, shop, reward, money game or chest that is wrong or stuck | `play` |
| A button, menu, settings, Grown-ups, welcome, characters, pictures, text size, layout untidy on phone, tablet or computer, a missing Vietnamese or English word | `kid-ui` |
| No sound, the wrong voice, a voice in the phone's own voice instead of the recorded one, music or sound effects | `voice-audio` |
| Friends, rooms, knocking, inviting, the microphone, calls, online safety | `online` |
| Sparkle Studio (the exe or `/studio/`), admins, Publish, family content and photos | `studio` |
| The analytics report, Netlify functions, the game not updating after a deploy, old version stuck, privacy settings | `analytics-infra` |
| The version number, packages, "is it live yet?", anything after a merge | `release` |

Not sure: read the core files' "You own" lists; still not sure, use the core whose files the fix most likely touches
and say so in the issue.

## The issue
Title: short and plain, for example "Lantern game: the last lantern cannot be tapped on iPhone".
Body:
```
**What happened:** ...
**What should happen:** ...
**Where in the game:** ...
**Device:** phone / tablet / computer, iPhone / Android / Windows, browser
**Every time?** yes / sometimes / once
**Version:** (Grown-ups shows it; leave empty if unknown)
**Front Desk notes:** why this core, which files are likely, small or big and why
Reported by the owner, <date and time> AEDT (or AEST outside daylight saving).
```

## After filing
- **"What's open?"** List the open `bug` issues by core, with their labels (`needs-go`, `fixed-on-branch`,
  `robot-stuck`) in plain words.
- **"Go for #12."** Comment `go` on the issue for the owner (the robot accepts a "go" from the owner's account only).
- **`robot-stuck`**: read the robot's comment and the run log, add what is missing to the issue, then remove the
  `robot-stuck` label so the robot tries again; or tell the owner which core chat to open for it.
- **"Leave it."** Add `on-hold`; the robot then leaves the bug alone.
- **The robot fixed it** (`fixed-on-branch`): it is not live yet. Release merges the draft pull request, and the
  owner's "yes, deploy" makes it live; merging closes the issue.

## Keeping track (for the owner)
- GitHub → Issues: every bug; the labels say where it is; closed means live.
- GitHub → Pull requests: each robot fix ("Bug #12 (play): ..."), with its **Quick checks** and **AI review** marks.
- GitHub → Actions: every run of the bug robot, the quick checks and the AI review.

## Questions that are not bugs
Answer from the docs and the code. When the answer means changing the game, say which core would do it and offer to
put it on `docs/cores/BOARD.md` for that core. That is the only file you change in the repository; push it to your own branch like
any helper chat, never to `main`.
