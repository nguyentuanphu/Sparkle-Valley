STATUS: fixed

What I found
The Simple screen's speaker button was the only button there that spoke without first playing the small tap sound. On an iPhone installed on the home screen, that tap sound is what wakes the audio, so the line stayed silent. The owner confirmed the bottom tab buttons speak, and they do play the tap sound first.

What I changed
- js/simple.js (one line, line 230): the speaker button now plays the tap sound before saying the tab's line, the same way the tab buttons do. This file belongs to Kid UI; it is a shared one-line change, allowed by the owner's note on the issue. No voice files, no new spoken lines, no version bump, no map files.

Checks (run against http://localhost:8765/)
- voicepack: pass
- welcomevoice: pass
- quiet: pass
- songs: pass
- voice: failed the first time (the page reloaded during the check); run again on its own it passed.
- Online checks were not needed. I have no iPhone here, so the fix is not tried on the phone itself.

Left to do
The owner should tap the speaker button on the iPhone once the fix is live to confirm it speaks.
