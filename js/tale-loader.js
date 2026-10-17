// Keep the latest page turn while one friend's tale body is still downloading.
export async function loadTale(tale, sync, startPage = 0) {
  if (!tale.load) return { tale, sync, startPage };
  let latest = startPage, listener = null;
  if (sync) {
    const source = sync;
    source.listen(page => { if (listener) listener(page); else latest = page; });
    sync = { send: page => source.send(page), listen: fn => { listener = fn; } };
  }
  const loaded = await tale.load();
  if (!loaded) throw new Error('Missing tale: ' + tale.id);
  return { tale: loaded, sync, startPage: Number.isInteger(latest) && latest >= 0 && latest < loaded.pages.length ? latest : startPage };
}
