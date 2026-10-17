// Keep the latest page turn while one friend's tale body is still downloading.
// (Release, 17 Oct AEDT) page turns are listened for before anything waits, also when the tale is already loaded:
// a friend's earlier turns can arrive the moment the theatre is asked to open (ownertogetherstart)
export async function loadTale(tale, sync, startPage = 0) {
  let latest = startPage, listener = null, waiting = null;
  if (sync) {
    const source = sync;
    // (r82) a turn that comes after this returns but before the theatre listens (a friend's earlier turns are replayed
    // the moment a shared tale starts, and a tale already loaded returns at once) is handed over when it listens
    source.listen(page => { if (listener) listener(page); else { latest = page; waiting = page; } });
    sync = { send: page => source.send(page), listen: fn => { listener = fn; if (waiting != null) { const p = waiting; waiting = null; fn(p); } } };
  }
  const loaded = tale.load ? await tale.load() : tale;
  if (!loaded) throw new Error('Missing tale: ' + tale.id);
  waiting = null; // (the turns so far are in startPage; only later ones are handed over)
  return { tale: loaded, sync, startPage: Number.isInteger(latest) && latest >= 0 && latest < loaded.pages.length ? latest : startPage };
}
