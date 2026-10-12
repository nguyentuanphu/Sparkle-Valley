# Round V: the owner's iPhone notes of 13 Oct (Release chat)

Owner, 13 Oct, 6:30 to 6:42 am AEDT, iPhone screenshots on live r69. Decisions (pop-up questions, 13 Oct AEDT):
this Release chat builds all of it; the Shop becomes a tab in the Pad right after Backpack (the dock button goes);
after this round the same chat does the batch rollout brief (`docs/cores/tasks/rollout.md`, branch `core/rollout`).
Plan first; nothing is built before the owner's "go". Rules first where a hard rule changes. One "yes, deploy" per release.

## Release 1 (r70): what is live and broken, plus the Shop and the Backpack
| # | What | How | Files | Check |
|---|---|---|---|---|
| 1 | Quest bar | a tap folds it to a small chip (tap again to open) and hides its yellow direction arrow; remembered per child | `js/hud.js`, `js/main.js`, `css/style.css` | `questbar` (new) |
| 2 | iPhone edges | no blur band at the top and no black strip at the bottom: the page fills the whole screen (viewport-fit, safe-area padding for the buttons only, body background) | `index.html`, `css/style.css` | `phone` (iPhone 15 size with safe areas) |
| 3 | Picture over the child's head | Round U's job picture (the sweeper's broom) is shown over its villager only, hidden with them (far, still copy, indoors) | `js/dayplan.js` | `dayplan` (no job picture without its person) |
| 4 | Villager sitting in the air | sitting people sit on the ground or a seat (check every sitting pose) | `js/town.js` / the people builders | `dayplan` or `talk` (no person floating) |
| 5 | "Chào hỏi" button | cause found: Round U's "every villager talks" gives a "Say hello" tap and a job picture to every person in the valley, and it takes the child's own character for a villager when the character is rebuilt (new clothes), so a "Say hello" tap follows the child and sits nearest, blocking villagers, animals and quests, and the broom (#3) floats over the child's head. Fix: never the children, their pets or friends; a person, animal or quest tap comes first; every villager still tells a random fact or saying | `js/villagertalk.js` | `talk` (the child never gets a tap or a job picture; tap order) |
| 6 | iPhone microphone | always off when a room is made or joined; one tap asks iPhone and switches on; works on Safari and the Home Screen app | `js/net.js`, `js/listen.js`, call code | `iphone` (+ owner's real iPhone) |
| 7 | Camera button and slow camera | the camera button centred in its circle; beside a building the camera swings round in about half a second (calm camera rule kept) | `css/style.css`, `js/player.js`, `js/seethrough.js` | `camcalm`, `camera` |
| 8 | "Where is...?" | after picking a place: Fly (straight there) or Walk (the sparkle trail) | `js/wayfind.js` | `wayfind` |
| 9 | Friends tab | closes by itself when a friend accepts or a game invite is accepted; "Retry game" works; "Bạn bè của con" folds | `js/main.js` (drawOnlinePanel), `js/netgames.js` | `netgames`, `meet` |
| 10 | Shop | a Shop tab right after Backpack in the Pad; no Shop button in the dock | `js/ui.js`, `js/hud.js` | `shop`, `contract` (re-recorded: owner asked) |
| 11 | Backpack | every item says what it is and what it is for (hover and tap); food asks "Eat it?"; coins, Sparkle Orbs and Leafies in one tidy row of cards; the section-button row back (built) | `js/ui.js`, `css/style.css` | `chips`, `hscroll`, `bagitems` (new) |

## Release 2 (r71): the Simple screen, clothes, games with friends
| # | What | How | Files | Check |
|---|---|---|---|---|
| 12 | Simple screen like Khám phá (owner's correction, 13 Oct) | one screen that scrolls down: each section has its title, then its games on a road under it, then the next section, as in the Khám phá tab | `js/simple.js`, `css/style.css` | `simple`, `adventure`, `phone` |
| 13 | Clothes for girls and boys (owner's correction, 13 Oct) | "Girl or boy?" when the character is made (changeable in the child's card); the shop sells only that set; clothes of the other set can be given as a gift to a friend of that set, and any clothes traded with a friend of the same set; nothing owned is taken away | `js/ui.js` (character maker), `js/shop.js`, `js/content/shop.js` | `shop`, `wearbag`, `firstplayer` |
| 14 | Play together | a "Play together" button in Friends lists every game for two or more; more games for friends; Tiến Lên miền Bắc as a choice next to miền Nam | `js/netgames.js`, `js/games/tienlen.js` | `netgames`, `tienlen` |

## Release 3 (r72): riding
| 15 | Ride anywhere (owner, 13 Oct: every vehicle too) | every animal and vehicle a child can ride goes anywhere and goes back to its place when the child gets off; buses, trams and ferries: at each stop pick where to go; first-person camera while riding | `js/traffic.js`, `js/vehicles.js`, `js/animals.js`, `js/player.js` | `ride`, `vehicles` |

## Later releases: story films
| 16 | Every story as a 3D film | like Thánh Gióng and Cây khế: about 6 to 8 films a release, Vietnamese stories first, then Australian, Chinese and Indian; voices recorded with Azure | `js/content/films.js` (new scripts), `js/tales.js` | `films`, `tales` |

## Then: the batch rollout (`docs/cores/tasks/rollout.md`, branch `core/rollout`)

## Not possible here
- A real iPhone: the microphone fix is checked in a test browser that behaves like Safari; the owner tries it on the iPhone after the deploy.
