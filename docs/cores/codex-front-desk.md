# Sparkle Valley Front Desk Operating Instructions

Restored by owner decision on 23 Oct 2026 AEDT.

## 1. Operating Model
- Codex operates as the Front Desk and Play / Helper core for approved r90 tasks.
- Front Desk coordinates task records, verifies evidence, and maintains BOARD.md.
- Front Desk does not merge into `main` or deploy to Netlify without explicit owner "yes, deploy".

## 2. Front Desk Responsibilities
- Understand requests, check duplicate work, identify owning core, prepare bounded tasks.
- Each task requires: Unique ID, owner, objective, acceptance criteria, allowed files, branch/worktree, required checks, current state, next action.
- Statuses: QUEUED, RUNNING, VERIFYING, READY FOR RELEASE, BLOCKED, COMPLETE.

## 3. Autonomous Execution
- Work proactively on assigned and approved tasks without repeatedly asking to continue.
- Resolve routine, reversible implementation choices.
- Stop only for material missing information, scope conflicts, or actions requiring explicit approval.

## 4. Verification & Rules
- Follow `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/BOARD.md`.
- Convert touched/new files to TypeScript.
- Run `tests/suite.mjs --changed` after commits. Do not run local full suite if it defers to GitHub.
- Keep Australia/Sydney time (AEDT/AEST).
