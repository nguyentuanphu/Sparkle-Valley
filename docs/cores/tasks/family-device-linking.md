# Work order: family photos and connecting devices

Status: implemented on `work/owner-round-20261014` for the approved combined round; verification in progress, not deployed. The original proposal below is retained as design history. Current implementation and acceptance evidence follow at the end.
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

Before implementation, inspect js/family.js (resolve actual client module), js/ui.js, js/state.js, studio/ui/app.js, studio/core.cts, netlify/lib/family.mts, netlify/functions/family.mts and the Studio API. Record precise affected files and interfaces; do not assume the multiplayer Online core owns family-photo access.

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


## Round integration · 14 Oct 2026 AEDT
Included in this same round, not a later release. Bind photos to stable NPC IDs so renaming does not break them; a deleted/recreated NPC requires explicit rebinding. Private photo data does not belong in the public GitHub code repository. Include backup/export and host-migration handling; moving away from Netlify does not automatically transfer private Blobs to GitHub. Resolve all-old-devices-lost recovery before implementing that flow. Profile/progress sync is not implied by photo pairing.


## Implemented flow and recovery — 14 Oct 2026 AEDT
- Parent-owned private collections use a temporary, one-use pairing code valid for ten minutes. The already connected device approves the new device before it can read photos.
- Setup saves a private recovery file. It reconnects the family if every device is lost. Photo backups work offline for cached photos and can be restored on a new host; nothing automatically copies private images to GitHub. Keep recovery files private. This implementation choice was disclosed in the combined batch; it adds no parent account or child-progress sync.
- Photo bindings use registered avatar IDs; display-name changes keep the ID. Deleted/recreated characters require explicit reassignment to an empty slot. The picker excludes objects that cannot display a photo.
- Browser photo bytes live in Cache API, with small timestamps in localStorage. Offline copies remain viewable. Revocation clears cached copies on the device's next successful online authorization check; an offline device cannot learn it has been revoked.
- Earlier shared-photo access is preserved under the folded Earlier photo code option. New families use the prominent Family photos and devices section without contacting the game owner.
- Passed: isolated-family/approval/expiry/recovery/migration/concurrent-upload unit checks; two isolated browser devices for approval, transfer/postcards, metadata-only localStorage, offline cache/backup and revoked-device clearing. The real deployed Netlify function, full suite and hardware review remain release gates.
