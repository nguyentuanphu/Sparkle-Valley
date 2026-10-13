# Work order: family photos and connecting devices

Status: requirements accepted by owner; proposed flow under discussion. No implementation or deployment approved.
Owner request: 14 October 2026 AEDT, "Correct add this in as work order, lets discuss further on other bugs."
Follow-up: how connecting/transferring to another device works and what appears in parents' settings.

## Problem
The current site-wide family code requires other parents to contact the game owner. It unlocks the site's shared family-photo collection, rather than each family's own collection. It does not transfer child profiles or progress.

## Accepted outcome
- Each family has its own private photo collection.
- A parent can connect another family device without contacting the game owner.
- One family's access must never unlock another family's photos.
- Explain plainly what is connected and what is copied.
- Parent controls stay in Grown-ups; everything is English and Vietnamese.

## Proposed parent flow (discussion, not implemented)
1. First device: Grown-ups > Family and devices > Set up our family. Create a family collection without asking the site owner for a code.
2. Existing connected device: Connect another device > show a temporary, one-use pairing code.
3. New device: Join our family > enter that temporary code.
4. Existing device: show the new device's name and ask the parent to approve it.
5. Once approved, the new device receives access to that family's photos and downloads them. The original device keeps its access.
6. Connected devices lists This device and the other approved devices, with a Remove option.
7. Replacing an old device: connect the replacement first, then optionally remove the old device.

No QR code proposed: the project already records the owner's preference for no QR helpers. Code lifetime and exact wording remain to be agreed.

## Proposed Grown-ups settings
Section: Family and devices / Gia dinh va thiet bi (final Vietnamese labels need proper accents in implementation).
- Family status: Not connected / Connected to our family.
- Set up our family, or Join our family, on a new device.
- Family photos: manage the family's pictures.
- Connect another device: generate the temporary code and show pending approval.
- Connected devices: friendly device names, This device, and Remove.
- Clear status text while downloading; connection setup needs the internet.

## Scope boundary
This work order covers family-photo access and device pairing. Do not promise or automatically add child-profile, progress, inventory, achievement, settings or save migration. Discuss these as a separate explicit scope choice. Connecting shares access/copies photos; it does not delete data from the original device.

## Ownership and implementation planning
Studio leads the work order. Analytics & Infra owns the private backend and family/device authorization with Studio. Kid UI owns in-game Grown-ups screens. Release integrates and deploys after the normal review and release approval.

Before implementation, inspect js/family.js (resolve actual client module), js/ui.js, js/state.js, studio/ui/app.js, studio/core.cjs, netlify/lib/family.mjs, netlify/functions/family.mjs and the Studio API. Record precise affected files and interfaces; do not assume the multiplayer Online core owns family-photo access.

## Required behavior and verification
- Pairing requires the parent's approval; the temporary code expires and cannot be reused.
- Verify photo access with two separate families and multiple devices: no cross-family reads, even when a photo identifier is known.
- Device removal revokes further access; specify how locally downloaded/offline copies are cleared when a removed device next connects.
- Preserve the existing owner's collection during migration; never expose it to newly created families.
- A device without a family can still play normally.
- Check phone, tablet and computer screenshots, bilingual text, touch sizes, offline behavior and the existing familyphotos/studio/privacy checks.
- Add meaningful pairing, isolation and removal tests; run changed-file checks and Release's required suite.

## Questions left for discussion
- Whether profiles/progress should later sync too, or stay separate.
- Recovery when every previously connected device is lost: choose a parent-managed recovery method.
- Whether family creation should use an account, a recovery phrase or another method. Do not choose silently.
- Exact labels, pairing-code lifetime and whether photos download automatically or after a parent taps Download.

This is a work order only. The live r74 feature is unchanged.
