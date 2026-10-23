# Next round after r89.1: Save a copy, and the family code (Release, 23 Oct 2026 AEDT)

Owner, 23 Oct 2026 AEDT (pop-up, "Save copy + family code"): "Is there a way we can capture these devices as unique so
regardless of opening a new game we can still track? Also can we save progress right to iCloud or anywhere accessible to
the user?"

## Why not fingerprinting

A wiped browser keeps nothing the game wrote. Guessing a device from its screen, system and browser ("fingerprinting")
cannot tell identical iPhones apart and is tracking without consent, which children's privacy rules and the game's own
privacy rules (PRIV-*) do not allow. The family code below is the consented way to get the same result.

## Part 1: Save a copy / Load a copy (Grown-ups)

- Grown-ups (behind the grown-up gate) gets "Save a copy · Lưu một bản" and "Load a copy · Mở bản đã lưu".
- Save a copy makes one small file (`sparkle-valley-<date>.svsave`, JSON: the same snapshot as js/state.ts, profiles,
  farm, settings, the device number) and hands it to the share sheet (js/printpage.ts sharePDF's way): Save to Files
  (iCloud Drive), Google Drive, Mail. A browser that cannot share files downloads it.
- Load a copy picks the file, checks it (format, size, every field as normalizeProfile expects), shows the children's
  names and the date, and asks before replacing what is on the device (never silently overwrites a child's save:
  CLAUDE.md, never assumed).
- Works offline; nothing is sent to the website.
- Checks: a unit test of the file format and the checker (bad, old, too large files refused); a browser check that saves,
  wipes the device, loads the file and finds the same progress; phone, tablet and computer screenshots.

## Part 2: The family code (Studio counts by family and child)

- Studio shows a family code (short, plus a QR). A grown-up enters or scans it once on each device (Grown-ups).
- The device keeps the link with its saves (and in the copy above). Its hello to the website carries the family's link,
  not anything about the child beyond what Analytics already sends.
- Studio groups devices by family: a wiped device, or a second app on the same iPhone (Safari tab, Safari Home Screen
  app, Chrome Home Screen app keep separate storage), counts as part of the family again once the code is entered.
- Studio also gets "same device as…" to join two device entries by hand.
- Builds on the Family devices trial (js/familydevices.ts, netlify/lib/family-devices.mts); privacy notice wording in
  English and Vietnamese for the owner to approve first.

## Order

Part 1 first (small, no server change), then Part 2. Each with its plan shown to the owner before building.
