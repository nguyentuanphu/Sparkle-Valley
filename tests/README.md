# Sparkle Valley checks

1. In the repo folder: `python3 -m http.server 8765`
2. Here: `npm install` (Playwright; in the cloud sandbox Chromium is already in `/opt/pw-browsers`), then `node run.mjs`
   - only some checks: `node run.mjs games features`
   - re-record the UI structure (only when the owner asked for a UI change): `node run.mjs --update-contract`
3. Screenshots go to `out/` (not committed).

**Multiplayer check:** it needs a PeerJS server on this machine (the public one is not reachable from the test machine):
```
mkdir peer && cd peer && npm init -y && npm install peer@1
node -e "const http=require('http'),express=require('express'),{ExpressPeerServer}=require('peer');const a=express(),s=http.createServer(a);a.use('/myapp',ExpressPeerServer(s,{path:'/'}));s.listen(9000,'127.0.0.1')"
```
Without it the check says "skipped".

**Cloud relay check (`cloud`):** needs a local MQTT broker with WebSockets on 127.0.0.1:9001 (it stands in for the public brokers):
```
npm install aedes@0.51 ws@8
node -e "const a=require('aedes')(),h=require('http'),{WebSocketServer,createWebSocketStream}=require('ws');const s=h.createServer(),w=new WebSocketServer({server:s,handleProtocols:p=>p.has('mqtt')?'mqtt':false});w.on('connection',x=>a.handle(createWebSocketStream(x)));s.listen(9001,'127.0.0.1')"
```
