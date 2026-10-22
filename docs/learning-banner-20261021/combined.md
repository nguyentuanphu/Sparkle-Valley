# Combined banner: learning and Vietnamese heritage

Owner direction, 22 October 2026 AEDT: combine themes 2 and 3, use the game references, and add more information about Vietnamese folk games and stories.

[Download the combined PNG](sparkle-valley-combined-heritage.png) · [All designs](README.md)

## Design

The adventure-map journey from Paper Trail Adventure supplies the layout and connected route. In the Game supplies the actual pink/purple title, blue/lilac palette, rounded white panels, outlined icons, original flat owl and low-poly scenery. The two main showcases explain Vietnamese folk games and stories, with four smaller stops showing the broader learning range and a parent-guidance footer.

Reference images inspected and supplied for this composition:

- [Paper Trail Adventure](theme-2-paper-trail.png)
- [In the Game](theme-3-game-ui.png)
- [Actual title UI](../../marketing/source/stills10/title-en.jpg)
- [Actual Ô Ăn Quan UI](../../marketing/source/stills10/game-oanquan-en.jpg)
- [Actual story UI and art](../../marketing/source/stills10/tale-en.jpg)

The banner is a generated promotional composition using these references. It does not introduce a new game interface.

### Vietnam on the left, Australia on the right

The owner approved the other elements and requested clearer Vietnamese landmarks in the left background on 22 October 2026 AEDT. The scenic revision uses Cầu Rồng, Hồ Gươm with Tháp Rùa, and Chùa Một Cột; Sydney Opera House and Sydney Harbour Bridge identify Australia on the right. The text, activity panels, story/game illustrations and parent guidance keep their approved design.

Landmark references:

- [Actual game Dragon Bridge](../../marketing/source/stills/city-dragon.jpg)
- [Actual game Hanoi/Turtle Tower](../../marketing/source/stills10/cine-hanoi-en.jpg)
- [Hanoi landmark models](../../js/regions.js): Turtle Tower on its lake islet and One Pillar Pagoda on a single pillar above a pond.
- [Landmark metadata](../../js/cities.js) and [world placement](../../js/content/map.js): Đà Nẵng's Dragon Bridge, Hồ Gươm and the Hanoi landmarks.

The previous combined design is preserved in Git history at commit `c7977ada`.

The revised PNG was visually inspected on 22 October 2026 AEDT: all three Vietnamese landmarks are visible on the left, Sydney's landmarks remain on the right, and the game/story names, explanations, parent footer, logo and website copy remain present and legible. File validation confirms 1672 × 941 pixels. This image-only revision was checked visually and for file/document-link integrity; the prior 9/9 game checks below refer to the preceding banner batch, with no game-code change in this revision.

## Vietnamese folk games

| Existing game | How the game plays | Practice and family connection |
| --- | --- | --- |
| Ô Ăn Quan / Mandarin Squares | Choose a pit, distribute stones and plan captures on the traditional board | Counting, predicting the next move and taking turns; parents can explain how the game was played in their own childhood |
| Kéo Co / Tug of War | Tap the Pull button repeatedly to move the rope toward the team's side; two children can play opposing sides | Attention, responsive finger control and shared play; introduces the familiar traditional team-game idea |
| Thả Diều / Kite Flying | Hold and steer the kite through the air to collect stars | Attention and hand-eye coordination; introduces a traditional outdoor pastime through a screen activity |

Other Vietnamese play already in the catalogue includes Rồng Rắn Lên Mây, Đánh Chuyền, Chi Chi Chành Chành and Đá Cầu. The banner features three examples so their actions and practice lines stay readable.

Source: [game catalogue](../../js/games/catalog.js), [Ô Ăn Quan and Kéo Co](../../js/games/vietnam.js), [kite game](../../js/games/folk2.js), [other folk games](../../js/games/folk.js).

## Vietnamese stories

| Existing story | Story content | Topics for parent-child discussion |
| --- | --- | --- |
| Thánh Gióng / Saint Gióng, the Boy Who Grew Giant | A village helps a boy grow into a hero who protects the land | Courage, community and helping others |
| Cây khế / The Starfruit Tree | Two brothers make different choices when a bird offers treasure | Kindness, greed, fairness and knowing when there is enough |
| Sự tích dưa hấu / The First Watermelon | Mai An Tiêm's family plants seeds and works to build a life on an island | Effort, patience, resourcefulness and perseverance |

Children can listen in English or Vietnamese, become familiar with new words and follow a sequence of events. Parents can invite them to retell a scene, name a character's feelings or discuss a choice. These are opportunities for guided practice and conversation, rather than guaranteed learning outcomes.

Other existing Vietnamese stories include Tấm Cám, Sọ Dừa, Sự tích Hồ Gươm and Cây tre trăm đốt.

Source: [story names, scenes and bilingual narration](../../js/tales-content.js), [story menu metadata](../../js/talesdata.js).

## Editable banner copy

Brand: Sparkle Valley

> Play, learn & explore Vietnamese culture
>
> Ages 2–8 · English + Tiếng Việt

### Vietnamese folk games

Trò chơi dân gian

- Ô Ăn Quan — count stones & plan moves
- Kéo Co — timing & teamwork
- Thả Diều — steer, focus & coordinate

Practise counting, planning & taking turns

### Vietnamese stories

Truyện cổ tích Việt Nam

- Thánh Gióng — courage & community
- Cây khế — kindness & fair choices
- Sự tích dưa hấu — effort & perseverance

Listening, vocabulary & story sequencing

### Broader learning stops

| Group | Examples | Practice line |
| --- | --- | --- |
| Words & numbers | Word Builder • Count With Me | Letters, words & early maths |
| Sounds & colour | Who Says That? • Rainbow Paints | Listening & colour recognition |
| Music & thinking | Music Corner • Memory Match | Rhythm, memory & problem-solving |
| Family & money | Family missions • Piggy Bank | Helping, turn-taking & saving |

### Parent footer

> Parents guide the journey
>
> Age & difficulty choices • Family tasks • Rest & bedtime settings
>
> sparklevalley.au

## Review and validation

22 October 2026 AEDT: the final combined PNG was visually inspected. The review covered the pink/purple title, game-style owl, outlined story figures, folk-game board, kite, route layout, Vietnamese spellings, named examples, practice/theme lines and parent footer. The artwork is 1672 × 941 pixels.

The selected repository suite (`node suite.mjs --changed --jobs 1`) passed **9/9, with no retries** on this follow-up: emoji, preload, noemoji, arch, unit (175 tests), names, bilingual, rules and types. Its first invocation stopped at preflight because the preview server was not running; after starting the server, every selected check passed on its first run. The final combined artwork and documentation were then checked visually and for valid links/whitespace; the game code is unchanged.
