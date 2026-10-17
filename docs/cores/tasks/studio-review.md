# Task brief: Studio review and improvements (Studio core)

Written 10 Oct 2026 (AEST). The rules for helper chats are in `CLAUDE.md`; this brief says what to build.

## Goal
Make Sparkle Studio easier for the owner and for parents. The owner has not listed specific problems yet, so this task starts with a review.

## Step 1: review (no changes)
Go through every Studio page (`studio/ui/app.js`, used by both the online Studio and SparkleStudio.exe) as the owner and as a parent would, using the code and the `studio` check's pretend site. List in your plan what is confusing or slow: wording, too many steps, missing feedback after a save or Publish, pages that are hard to find, things that look broken on a phone or tablet. Put your top fixes in order, each with how big it is. **Wait for the owner's "go"**; the owner may add their own complaints.

## Step 2: build what the owner picked

## Keep exactly as they are
The security rules from the privacy round (`docs/ARCHITECTURE.md` PRIV-012 to PRIV-014): two-step or password only chosen by the owner for each account, 12+ character passwords, lockout after 10 wrong tries, the access log, family photos only through the family code, editors cannot merge or restore the live site, the exe's Studio key. The five sections and big cards (`docs/cores/studio.md`, owner's decisions).

## You may change
`studio/ui/`, `studio/*.cjs`, `netlify/functions/studio.mts` and `netlify/lib/` only for Studio pages, `tests/studio-check.mjs`, `docs/cores/studio.md`.

## Checks
Your core's checks (`docs/cores/studio.md`), plus screenshots of each changed page on a phone, a tablet and a computer, then the full suite. Say in the report whether SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).
