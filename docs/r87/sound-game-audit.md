# Sound-game audit — 19 October 2026 AEDT

Owner report: “Animals sounds like pig noise or audio games.” Release is checking both source assets and real playback paths. This workspace cannot hear audio input; decoding, signal measurements and automated playback checks are **not** a listening-quality pass.

## Animal recordings and playback

- All ten files decode: cow, sheep, pig, dog, cat, duck, hen, horse, frog and owl. Each has a distinct hash, mono 22,050 Hz audio, and a duration between 0.78 and 2.66 s. File measurements: [animal-audio-analysis.json](evidence/animal-audio-analysis.json).
- The SoundBible pig original was checked directly. It has about 0.50 s of signal and 1.50 s of silence; the existing first-0.70-s crop retains the signal. The crop has not been replaced with extra silence or artificial repeated oinks. Its recognisability remains a listening question.
- Found: after a four-second load wait the quiz could use the old synthetic animal tone. Other first-time animal calls also substituted a synthetic effect before the recording arrived. Fixed in source: known real animals wait for their recording; the quiz holds with a 64 px retry if a file cannot be obtained.
- Found: normalised recordings went through the synth bus's default -24 dB compressor and the quiz's 1.6x boost. Fixed in source: a separate recording bus with a high-threshold overlap limiter preserves a single call's dynamics. New playback check traces the actual source-to-output path and gain.
- Found: repeated replay taps started overlapping calls, and narration could still be speaking when the animal played. Fixed in source: stop the previous call on replay, await narration, and cancel game-owned calls on close (including Story Helpers).
- Asset levels vary: measured integrated loudness ranges roughly -15.8 to -23.6 LUFS, with hen/frog quieter. Short-clip loudness measurements and source identity alone cannot establish recognisability. No blind filtering, pitch shifting or replacement has been applied.

## Games covered

| Game/group | Audio basis | Audit/check scope |
|---|---|---|
| Who Says That? (`animalsounds`) | All ten real animal recordings | Delayed/missing pig, correct source buffer, no synthetic substitution, narration ordering, repeat/close cleanup, retry recovery |
| Story Helpers | Spoken story/words plus animal reward calls | Real-call path shared; game cleanup stops its animal calls; storyhelp check required |
| Music Corner | Modelled đàn bầu, didgeridoo, guzheng and tabla | Inspect note/frequency/envelope routing and user controls; timbres are synthesis, not authentic instrument recordings; no listening-quality claim |
| First Sounds / First Sound Hunt | Spoken words and letter prompts | Word/letter mappings and recorded speech coverage; perceptual pronunciation remains distinct from file coverage |
| Reading sound, word-building, rhyme, tones/vowels, syllables, listen/touch, sentences/read-along | Recorded names, words, phonemes and narration | EN/VI reading completion; phoneme mapping/recording coverage; no animal-tone substitution used here |
| Pass the Parcel and Vietnamese chant games | Synthesised tunes and recorded chant | Distinguish intentional music/effects from recognition clues; retain stop/close and voice coverage checks |

Focused `soundgames` passed, including delayed/missing pig recovery, all ten actual buffers, cancellation, replay serialisation and Story Helpers praise waiting for the animal call. Existing `animalvoices` (10 real clips), `voicecover` (9,527 lines), and the full six-story `storyhelp` check passed. Reading passed all 90 EN/VI age/level cases on the earlier r87 checkpoint. The latest lazy recording-bus and camera-frame refinements are receiving a final focused run; final results belong in the release report.

A labelled source-clip page is available at [audio-review.html](audio-review.html). It plays the individual existing files without game mixing; file-by-file source credits remain in sounds/animals/SOURCES.md. Owner/device listening is still necessary for claims about whether a pig or instrument sounds convincing.

## Cross-feature interruption found by the full suite

The road-safety voice failure reproduced locally. Instrumented logs show the recorded road instruction was requested correctly, then an automatic Daily Adventure step (“Find 3 shuttlecocks”) cancelled it before a source started and used the device voice for the unrelated clue. The asset is present. Adventure step/remembrance announcements now wait behind conversations, games and other busy windows; queued steps are discarded if the day/adventure/step has changed. The original no-native-voice and actual-recorded-playback assertions remain. The road-voice check passed EN/VI locally (95 s), and the full Daily Adventure check passed (225 s). Final GitHub verification still required.

## Music Corner replay

Source review found concurrent tune playback on repeated Play taps. The game now keeps one replay at a time, preserves that guard across instrument-tab redraws, cancels future scheduled notes on close/new recording, and waits for the final note’s decay before enabling replay. Its existing four synthesised timbres and note mappings are unchanged. A focused check exercises all 32 pads, recorded-note replay, repeated taps, tab changes and closing; passed in 67 s. The test preserves recorded first-note delay and turns off the separately tested tap-feedback switch so button sounds cannot masquerade as instrument notes.
