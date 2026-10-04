# Sparkle Valley: rules for the assistant

**HARD RULE: do not `git push`, and do not open or update a pull request, until the owner has checked the work and clearly confirmed.**
- Commit locally as you go.
- When a round is done, show what changed and how it was tested, and give the Netlify zip.
- Then wait for an explicit "yes, push" before pushing. Each confirmation covers that one push only.
- **Standing instruction from the owner (4 Oct, after Round E): "Yes push, all other rounds keep running without asking me."** Until the owner says otherwise: run the planned rounds one after another without waiting, and push each round once its full regression suite is green (a round with a failing check is not pushed until it is fixed). Still report every round (what changed, how tested, Netlify zip and local bundle). The owner can end this at any time by saying so.

Everything else about the project (requirements, how it's built, testing, working style) is in `HANDOFF.md`. Read it first.
