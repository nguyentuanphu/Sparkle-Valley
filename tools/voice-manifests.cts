// One writer shared by the recording tool and Studio. Keep the aggregate for old clients.
const { createHash } = require('node:crypto');
function splitManifest(man) {
  const language = new Map();
  for (const [lang, hashes] of Object.entries(man.other || {})) for (const h of String(hashes).split(' ')) if (h) language.set(h, lang);
  const out = {};
  for (const lang of ['en', 'vi', 'zh', 'hi']) {
    const lines = Object.fromEntries(Object.entries(man.lines || {}).filter(([h]) => (man.langOf?.[h] || language.get(h) || 'en') === lang));
    const shard = { version: man.version, engine: man.engine, model: man.model, made: man.made, language: lang,
      cast: { [lang]: man.cast?.[lang] || [] }, voices: { [lang]: man.voices?.[lang] || {} }, lines,
      tpl: { [lang]: man.tpl?.[lang] || [] }, areas: man.areas };
    // Recording dates and other languages changing must not invalidate this language's saved-pack marker.
    shard.signature = createHash('sha256').update(JSON.stringify({ lines, tpl: shard.tpl, cast: shard.cast, voices: shard.voices })).digest('hex');
    out[lang] = shard;
  }
  return out;
}
module.exports = { splitManifest };
