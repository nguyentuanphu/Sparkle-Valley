# Work order: Backpack item help and compact food confirmation

Status: queued for the current bug/work-order discussion; implementation and release have not started.
Owner request: 14 October 2026 AEDT: "Expand this to all items in bag; when tapping food to eat the dialogue box is too big; make it more discrete and save space but enough for kids to see."

## Required outcome
Every Backpack item explains its name, purpose and available action when tapped, using a small picture-led card with spoken English/Vietnamese. Replace the large food dialogue with a compact confirmation that keeps the Backpack visible.

## Coverage
Audit every item/control currently emitted by drawBag and its feature extensions:
- Coins, Sparkle Orbs and Leafies.
- Cooked dishes and purchased food/snacks.
- Ingredients, including which recipes use them.
- Sellable treasures, showing their sale value.
- Clothes and accessories waiting to be worn, and worn items.
- Legacy/reward hats.
- Whistling kite and whistle.
- Village festival prizes.
- Glider variants and their actual use.
- Pets and any later feature that adds an item to the Backpack.

Do not invent benefits. Decorative items must not claim to improve hearts, stamina or other statistics unless the actual game does so.

## Proposed compact card
- A familiar item picture, item name, then one short purpose/benefit line.
- Food example in Vietnamese: "[food picture] [name] / Them tim va suc / An thoi | De sau" (implementation uses proper Vietnamese accents).
- Position inside the Backpack near the selected item; place above the item or use a compact bottom panel if there is insufficient space below.
- Keep the Backpack and selected item visible. Do not open another large dialogue window or cover most of the screen.
- Replace the existing item card when another item is selected. Never stack cards.
- Use a natural height that fits content; no clipped names or fixed-height text truncation.
- On a phone, aim around 300-340 px wide, bounded by available viewport width. This is a starting layout target, not a hard rule that may cause clipping.
- Text at least 16 px; picture/name visibly larger.
- Action targets at least 64 px for under-5s, 44 px elsewhere. Save space by reducing empty padding and repeated text, not shrinking essential text or buttons.
- Use the existing drawing/icon system, clear contrast and calm animation.

## Food interaction
1. Tap a dish/snack: show its name, picture and actual benefit in the compact card.
2. Speak a short prompt in the selected language.
3. Offer explicit Eat / Not now (An thoi / De sau, with accents in implementation).
4. Consume exactly one item only after Eat. Update quantity, hearts and stamina as the existing food logic specifies.
5. Not now, closing the card, changing tabs or closing the Backpack consumes nothing.
6. Prevent rapid taps from consuming twice or opening competing confirmations.
7. Do not automatically dismiss a pending confirmation while a child is deciding.
8. For food that is already missing or cannot be used, show a short explanation and disable the action appropriately.

## Other item actions
Explain an ingredient without consuming it. Show treasures' sale values, clothes' wear/remove actions, and equipment's real use. Keep the existing item effects; do not accidentally sell, wear, discard or consume an item merely while showing its explanation. The exact action-button flow must be listed in the implementation plan.

## Existing source inspected
- js/chipinfo.js: the three resource chips already show a picture, name and spoken description; close after 6 seconds.
- js/ui.js > openPad > drawBag: askEat currently calls the general dialog() with the item name repeated in a long sentence.
- js/ui.js: ingredient explanations already use toast/say; treasure selling uses a two-tap state; clothes, hats, kite, glider and pets have separate handlers.
- js/hoilang.js: bagHTML and bindBag add festival prizes and carrying behavior.

Do not globally shrink dialog(): NPC conversation and other game prompts share it. Implement a Backpack-specific compact component.

## Ownership and verification
Kid UI leads js/ui.js, the new compact component and CSS; Play supplies correct food/ingredient/equipment effects and festival/pet descriptions; Voice & Audio checks all new spoken lines; Release integrates.
- Verify every listed item class, zero/one/multiple quantities, worn/unworn state, cancellation and repeated taps.
- Check phone, tablet and computer, including long Vietnamese names, landscape and scrolling near the bottom.
- Verify focus, keyboard dismissal, readable contrast, target sizes, language and speech.
- Run bagitems, wearbag, shop, chips, phone, a11y, contract, language/bilingual, relevant festival/pet/equipment checks and suite.mjs --changed.
- Add meaningful compact-food and comprehensive-item-help coverage. Release runs the required combined suite before deployment approval.
- Capture and inspect screenshots before/after the food-card change.
- Show any remaining failure or skipped check; do not weaken checks to pass.

Live r74 is unchanged by this work order.
