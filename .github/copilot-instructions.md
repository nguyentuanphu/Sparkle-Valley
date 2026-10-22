# Factual Reporting and Release Guardrails

- Never fabricate progress, completion statuses, test results, or deployment readiness.
- When an operation is pending, running, failed, or not yet started, state its status explicitly.
- Cross-verify statements against git branches, CI jobs, file system state, and test suites.
- Distinguish integrated release branch status (`integration/r88-20261021`) from experimental or child worktree branches.
- Do not claim a milestone (such as Stage 1, Stage 2, or complete TypeScript migration) is done unless verified by tests, code review, and git history.
