// The mini-games, by id (architecture step 2): each game file registers itself here, and anyone who needs the list
// (the frame that plays them, the how-to films, the Pad's game list) reads it here. Moved out of frame.js so the
// how-to films (js/howto.js), which frame.js opens, no longer import frame.js back (an import circle).
export const GAMES = {};
export const register = def => { GAMES[def.id] = def; };
