# Brief: tester reports (owner, 12 Oct 2026 AEDT)

A device the owner makes a **tester** finds and reports problems by itself, the tester can add their own with one tap,
fixed problems are checked again by themselves, and testers are rewarded for helping. Everything the owner picked in the
pop-up questions of 12 Oct AEDT is in; nothing is built until the owner's "go" on a plan.

**Owner's rule for what a tester sees:** the tester's screens talk only about what the game collects and what the tester
agrees to. They never name the tools behind it (no Studio, GitHub or Netlify on any tester screen, in any language).

## 1. Becoming a tester: the agreement screen

- A device becomes a tester when the owner assigns it. The next time the game opens, it shows the agreement once, in
  English and Vietnamese, with **I accept** and **Not now**. Nothing below starts until the tester accepts.
- Text (both languages, the same meaning):
  > **Become a Sparkle Valley tester**
  > Thank you for helping make the game better! While this device is a tester:
  > - When something goes wrong, the game sends a report by itself: a picture of the screen, what was happening in the
  >   last 30 seconds, and details of this device and game version.
  > - Reports include the players' names, ages and progress on this device.
  > - When you tap the ladybird, your typed or spoken note is sent too.
  > - Reports are used only to find and fix problems in the game.
  > - You can stop being a tester at any time in Settings, and reports stop straight away.
- Settings shows "Stop being a tester" while it is on. The acceptance (date, version) is kept with the device's reports.
- **Privacy exception (owner, 12 Oct AEDT):** on a tester device that has accepted, reports keep children's names, ages
  and progress, and need no grown-up gate. This is an exception to the PRIV rules (`docs/ARCHITECTURE.md` §9) and to
  HANDOFF rule 11 for tester reports only; children's devices that are not testers stay exactly as they are. The round
  adds the exception to the rules in the document and in `js/content/rules.js`, with a check.

## 2. Reporting

### 2a. Automatic reports
On a tester device the game files a report by itself, with no tap, when:
- an error happens in the game's own code;
- a game or story has not opened after 3 seconds, or does not close;
- the screen freezes (no frame for 2 seconds);
- play is slow (under 20 frames a second for 10 seconds);
- a button is off the screen or under another one;
- a spoken line has no recording;
- the child is stuck (no movement for 5 seconds while the stick is pushed).

Each report carries: a screenshot; the last 30 seconds as a replay (taps, positions, screens opened); the last 20 errors
(message and file:line); the game version, device, screen size, language, age group, players' names; the place, the
position, and the game, story or window open; how smoothly it ran. The same problem in the same spot is sent once, then
counted.

### 2b. The ladybird bug icon
- A small drawn ladybird (a drawing in `js/art.js`, not a phone emoji), 44 px or more, in a corner of the screen, only on
  tester devices.
- **Tap:** the screen is captured at that moment, before anything opens; then a small panel: pick a kind (**Broken**,
  **Looks wrong**, **Words or voice**, **Sound**, **Idea**), press the microphone and say what is wrong (turned into
  text) or type it, **Send**. Everything in 2a is attached by itself.
- **Long press:** a quick report at once, no panel ("something was wrong just now").
- **A number on the ladybird:** reports waiting to send while offline; they send by themselves when back online.
- **A tick on the ladybird:** a problem this tester reported is fixed in the new version. Tapping it shows "Fixed in
  rNN: please check" with **Yes, fixed** and **Still wrong**.
- **Already reported:** tapping the ladybird where a known problem is open says so ("Already reported, seen 5 times"),
  and one tap adds to it instead of making a new one.

### 2c. Nightly auto play
When a tester device first opens a new version, the auto play check (`js/autoplay.js`) runs a fast pass by itself, at
night or while the device is charging, and sends what it finds as reports. It puts the device's progress back afterwards,
as it does today.

### 2d. Automatic retest
When a fix for a reported problem comes out, tester devices replay that problem's 30 seconds on the new version and mark
it fixed if it no longer happens, or report it again if it does.

### 2e. Always on screen
A small "Tester" mark with the game version, so every screenshot shows which version it came from.

## 3. The daily summary
Once a day: new problems, fixed, still open, and the ones the most testers hit, for the owner and the chats.

## 4. Rewards for testers
1. **Bug Hunter badges:** Bronze, Silver, Gold and Rainbow ladybird at 1, 10, 25 and 50 reports that helped. Shown on
   the tester's profile and in the Passport, and **worn on the explorer's shirt (chest)**, seen in the valley and in
   online play; it changes as the tester levels up.
2. **Fixed! thank-you:** when a problem a tester reported is fixed, the next time they open the game Ông Cú thanks them
   by name ("Bé Na found this, and now it's fixed!") with confetti and a few coins.
3. **Tester gear:** clothes only testers can earn: a magnifying-glass hat, a ladybird backpack, a detective cape.
4. **Coins for reports:** a few coins for each report that helps fix something; a little more when it has a spoken note.
5. **Tester's Corner:** a small hut in the valley with a ladybird sign that only testers can enter, with a board of the
   problems fixed thanks to them.
6. **Weekly star:** the tester whose reports helped most that week gets a gold star on their name chip for a week.
7. **Sneak peeks:** testers see new places and games a few days before everyone else, with a "Tester preview" ribbon.
8. **Sticker album:** a sticker for each kind of problem found (Broken, Looks wrong, Words or voice, Sound, Idea), and a
   prize for a full page.

New spoken lines (the thank-yous, the panel, the agreement) in both languages, recorded; lines with a child's name are
built from recorded parts with the name shown, as today.

## 5. Behind the scenes (for the chats; never shown to testers)
- Assigning testers and their level (auto reports only, or auto reports and the ladybird): the owner's tools, next to
  the auto play switch.
- Reports go to the website's inbox, limited per device like the missing-lines inbox; a job groups them hourly by
  error, place and game into one tracked problem each, with a core label and a count ("seen 7 times, 3 devices, r66"),
  which the bug robot and the cores pick up; a fix's round is written on it, which starts the retest in 2d.
- Which core does what: Kid UI (agreement screen, ladybird, panel, tester mark, rewards screens), Analytics & Infra
  (capture, replay, inbox, hourly grouping, daily summary), Play (rewards in the game: coins, gear, Tester's Corner,
  sticker album, sneak peeks), Studio (assigning testers), Voice & Audio (new lines), World (the Tester's Corner hut,
  with its place by id), Release (the privacy rule exception and the round).

## 6. Checks to add
- the agreement screen shows once, nothing is sent before **I accept**, "Stop being a tester" stops everything;
- a forced error, a game that does not open and a frozen screen each make one report with a screenshot and a replay;
- the ladybird: tap captures before the panel opens, long press sends at once, offline reports wait and then send;
- a non-tester device has no ladybird, no tester mark and sends nothing (the privacy rules unchanged for it);
- the badge on the shirt at each level, on phone, tablet and computer.
