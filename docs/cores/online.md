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
photos to strangers), ARCH rule on checked messages (every network message goes through `js/netmsg.js`).

## Checks you run
`multiplayer meet cloud knock netmsg iphone together netgames coop`
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
