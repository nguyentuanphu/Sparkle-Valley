# Brief: every voice line recorded (Voice & Audio core, branch `core/voice-audio`)

Owner, 12 Oct 2026 AEDT: "how do you ensure all the pending voices collected from users and from Studio will be
recorded?" Written by the Release chat (`round-t`). A helper chat: plan first and wait for the owner's "go"; push
`core/voice-audio` when your checks pass and write **"ready for Release"** on the board; the Release chat of the day merges it.
Read `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/voice-audio.md` and the whole board first.

Today: devices report the lines they had to say in the machine voice (the inbox on Studio's Voices page, through
`/api/hello`), and they are recorded only when the owner clicks "Make them with Azure"; lines in new code are recorded only
when a chat with `AZURE_SPEECH_KEY` runs `node tools/make-voice-pack.mjs --engine azure`.

Build: a GitHub workflow that runs once a day (and by hand) with the Azure key as a GitHub secret (the owner adds it; never
in the repo): it reads the inbox from the website, harvests the code's new lines (`tools/voice-harvest.mjs`), records
every missing line with Azure, and pushes them to a branch (`voices/daily`) with a draft pull request that Release merges
in a round. Lines with a child's, friend's or pet's name are never recorded (HANDOFF rule 11). Studio's Voices page shows
"0 waiting" when everything is done, and the date of the last run. Workflows are Analytics & Infra's to look after: put a
note for them on the board. Checks: `voicecover`, `welcomevoice`, `unit`, the workflow run once by hand.
