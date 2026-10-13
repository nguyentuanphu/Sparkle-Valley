// The story films of the tales that are not in js/content/films.js (films batch, owner 13 Oct AEDT: "every story becomes
// a 3D film"): each film is its own small file in js/content/films/, loaded only when its story opens, so the game and
// the other stories stay as quick to start as they were. A page script is the same as in js/content/films.js.
export const TALE_FILMS = {
  rongtien: () => import('./films/rongtien.js'),
  caytre: () => import('./films/caytre.js'),
  tamcam: () => import('./films/tamcam.js'),
  sodua: () => import('./films/sodua.js'),
  thachsanh: () => import('./films/thachsanh.js'),
};
export const taleFilm = async id => TALE_FILMS[id] ? (await TALE_FILMS[id]()).default : null;
