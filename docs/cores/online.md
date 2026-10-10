# Online core

**You let children play together safely:** friend codes and the friends list, “green dot … is playing” notices, invites,
rooms (start, knock, let in), seeing each other in the valley, talk buttons, the microphone and voice calls, the cloud
relay and the voice relay (TURN), and keeping strangers out.

## You own
- `js/net.js`, `js/netmsg.js`, `js/relay.js`, `js/roomcode.js`
- The online wiring in `js/main.js`: the `Net.on(...)` handlers, friends (`G.autoMeet`, `friendNote`, `G.inviteFriend`, `G.joinFriend`), `G.drawOnlinePanel`, `G.netTick`
- `netlify/functions/turn.mjs` (the voice relay details; the Netlify side is shared with Analytics & Infra)
- `vendor/peerjs.min.js`

## Hard rules (§9.6)
SAFE-001 (newcomers knock; the room's starter lets them in; microphone off until let in), PRIV rules (no names or
photos to strangers: PRIV-004 knocking, PRIV-006 online off until a grown-up turns it on, PRIV-007 door and members'
channel, PRIV-008 friends' status), ARCH rule on checked messages (every network message goes through `js/netmsg.js`,
the friends' channel too).

## Checks you run
`multiplayer meet cloud knock netmsg iphone together netgames coop onlineoff` (and the unit file `tests/unit/netgames.test.mjs`)
They need the local servers: `cd <scratchpad>/srv && node peer.cjs & node mq.cjs` (PeerJS on 9000, MQTT on 9001).

## Talks to
- **Play**: games played together use your messages.
- **Kid UI**: the look of the Friends tab and the notice cards.
- **Analytics & Infra**: the Netlify side of `/api/turn` and its environment variables.

## Owner's decisions to keep
- Friends are told, never moved: a notice with Invite and ▶ Go to their room; leaving a room with friends asks first (round O).
- The microphone comes on with a button, not on every tap; over the cloud relay say plainly that voices can't travel there (round O).
- One TURN key for everyone, kept in Netlify (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN), handed out a few hours at a time (round O).
- Up to 6 players a room.
- **Friends tab guide for grown-ups (owner, 11 Oct AEDT, bug #37: "Go, plus a button"):** the Friends tab (and "Friend
  far away", which opens it) shows a small grown-ups' note naming the real place of the switch, Grown-ups → "Internet and
  playing online" → "Use the internet", in English and Vietnamese with no "Studio"; on when off, off when on. Beside it
  a Grown-ups button that opens with **press and hold only** (never a tap) straight at that section. Checked by `onlineoff`.

## Privacy round (owner, 9 Oct, round R privacy)
- **Online play is off until a grown-up turns it on** (`settings.online`, default `false`, also on devices that played
  before): Grown-ups → Playing online → "Play with friends online" (Grown-ups opens with press and hold). While off:
  `Net.host`, `Net.join`, `listenForFriends` and `friendsStart` do nothing (status `off`), no friends' status is shared
  (the round-28 "sharing on for anyone with friends" now waits for it), and the Friends tab shows only "Playing with
  friends is off. Ask a grown-up to turn it on." The test harness turns it on for every check (`online: true`); check
  `onlineoff` covers a device that never had the setting.
- **Room codes have 6 digits** (`ROOM_LEN` in `js/net.js`, also exported by `js/roomcode.js`), made with
  `crypto.getRandomValues`. One animal per digit as before; the digits and boxes shrink below 480 px so 6 fit a 390 px phone.
- **One key pair per device** (ECDH P-256), kept in `localStorage` `sv2_idkey` (not in backups), so a friend can
  recognise the same device next time.
- **Two cloud channels per room.**
  - *The door* (`kind 'room'`, made from the room code): only the knock (`hello`: name, look, friend code, key; never a
    photo), `chalr`, `bye`; and the starter's answers `door`, `chal`, `admit`, `full`, `nope`, each **locked for the one
    who knocked** (`{pub, iv, ct}`, AES-GCM with the pair key, the words name the kind and the knocker's id).
  - *The members' channel* (`kind 'mem'`, made from a random 32-byte room secret): all room traffic. `admit` carries the
    secret locked for the newcomer. After a `kick` the starter sends a new secret (`rekey`, locked for each player left)
    and moves the channel.
  - A guest believes the starter's words only with the starter's key: the first key that answers the knock is kept
    (the direct link to the room's own PeerJS id outranks the cloud; a saved friend's key from an invitation outranks
    both), and every later `door/admit/chal/full/nope/kick/members/rekey` must be locked with it.
  - A guest meets only players the starter introduces: directly, everything comes through the starter's link; on the
    cloud a hello is accepted only from someone on the starter's `members` list (sent locked to each guest, every 10 s
    and on every change) with the same key. Other game messages are taken only from players already met.
  - Hellos never carry photos. Photos go after being let in, as `photo` messages locked for each player (direct and cloud).
  - A newcomer's `hello` with `w: true` asks the starter for the welcome again (it may have gone out while the newcomer
    was still opening the `admit`).
- **Saved friends must prove it.** The add-friend button in a room saves the friend's key with the friend (`settings.friends[].pub`).
  A knock claiming friend X comes straight in only if its key equals the saved key and it opens a number locked with
  that key (`chal` → `chalr`, 6 s); otherwise it is an ordinary knock the child must accept. Friends added by typing a
  code have no key until they play together once and tap the add-friend button.
- **Friends' status** (presence) carries only "playing now" and a per-session token. Name, place, room code, number of
  players and "I started it" go as a `note` locked for each saved friend with a key (sent when they come online and every
  45 s); invitations are locked the same way (cloud inbox and the PeerJS beacon). No key, no invitation: the child is told
  to say the room number instead.
- **Who's here** (Grown-ups → Playing online): everyone in the room, friend or new (proven when the key matched), direct
  or cloud, since when; the starter can remove someone. Guests show the starter's members' list. (`Net.who()`)
- `js/netgames.js`: a game opens only after this child said yes to the one who asked (or this child started it).
- `js/claims.js`: at most 30 pickups a minute are taken from one player.

### Known limits (to decide)
- On the cloud members' channel, a player who was let in could still send ordinary messages (moves, emotes) under another
  player's id; the starter's own words are locked, so they can't be faked.
- On the cloud only (no direct link), someone who knows the code and answers the knock first is believed (the first key
  that answers is kept); a direct link or a saved friend's invitation outranks it.
- Friends added by typing a code can't be invited or see the room until they have played together once.
