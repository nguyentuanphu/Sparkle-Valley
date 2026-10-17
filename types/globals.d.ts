// What the game uses from the browser that TypeScript's own lists do not have (owner, 16 Oct AEDT: TypeScript, batch 3):
// the PeerJS library (vendor/peerjs.min.js, loaded by a script tag), the switches the checks set before the game starts,
// and the older names some phones still use. Type notes only.
export {};
declare global {
  interface Window {
    /** PeerJS, for playing with friends (vendor/peerjs.min.js); its own types are not shipped */
    Peer?: new (...args: any[]) => any;
    /** the checks: a pretend voice relay (TURN) and a pretend PeerJS server */
    SV_TURN_TEST?: any;
    SV_PEER?: { host: string, port: number, path: string, secure: boolean };
    /** older Safari */
    webkitAudioContext?: typeof AudioContext;
  }
  interface Navigator {
    /** how the device is connected (Wi-Fi or mobile data), where the browser says */
    connection?: { type?: string, effectiveType?: string, saveData?: boolean, downlink?: number, rtt?: number };
    mozConnection?: Navigator['connection'];
    webkitConnection?: Navigator['connection'];
  }
}
