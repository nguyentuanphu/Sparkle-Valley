// Independent language requests: a slow or refreshed index must not replace another language.
export const voiceLanguages = settings => settings.bilingual ? [settings.lang === 'vi' ? 'vi' : 'en', settings.lang === 'vi' ? 'en' : 'vi'] : [settings.lang === 'vi' ? 'vi' : 'en'];
export function createVoiceIndex(fetcher, changed, cachedLegacy = async () => null) {
  const loaded = new Map(), pending = new Map(), revisions = new Map();
  const valid = (lang, j) => j && j.lines && j.language === lang && !Array.isArray(j.lines);
  const publish = () => {
    const pack = { version: 2, lines: {}, other: {}, tpl: {}, cast: {}, voices: {}, signatures: {}, areas: 0 };
    for (const [lang, j] of loaded) {
      Object.assign(pack.lines, j.lines); Object.assign(pack.tpl, j.tpl); Object.assign(pack.cast, j.cast); Object.assign(pack.voices, j.voices);
      if (lang !== 'en') pack.other[lang] = Object.keys(j.lines).join(' ');
      pack.signatures[lang] = j.signature || `${j.version}:${j.made}:${Object.keys(j.lines).length}`;
      if (j.areas) pack.areas = j.areas;
    }
    changed(pack);
  };
  const accept = (lang, j) => {
    if (!valid(lang, j)) return false;
    revisions.set(lang, (revisions.get(lang) || 0) + 1); loaded.set(lang, j); publish(); return true;
  };
  const load = lang => {
    if (!['en', 'vi', 'zh', 'hi'].includes(lang) || loaded.has(lang)) return Promise.resolve();
    if (pending.has(lang)) return pending.get(lang);
    const revision = revisions.get(lang) || 0;
    const p = fetcher(`voices/manifest-${lang}.json`).then(r => r.ok ? r.json() : null).catch(() => null).then(async j => {
      if (!valid(lang, j)) j = legacyLanguage(await cachedLegacy(), lang);
      return j;
    }).then(j => {
      if ((revisions.get(lang) || 0) !== revision) return;
      if (!valid(lang, j)) throw new Error(`Missing ${lang} voice index`);
      accept(lang, j);
    }).finally(() => pending.delete(lang));
    pending.set(lang, p); return p;
  };
  // Refresh only languages already requested by this page; other tabs may use another language.
  return { load, has: lang => loaded.has(lang), refresh: j => (loaded.has(j?.language) || pending.has(j?.language)) && accept(j.language, j) };
}

// Migration is cache-only: an older offline install may have the aggregate but no language indexes yet.
export function legacyLanguage(man, lang) {
  if (!man?.lines) return null;
  const other = new Map();
  for (const [L, hashes] of Object.entries(man.other || {})) for (const h of String(hashes).split(' ')) if (h) other.set(h, L);
  const lines = Object.fromEntries(Object.entries(man.lines).filter(([h]) => (man.langOf?.[h] || other.get(h) || 'en') === lang));
  return { ...man, language: lang, lines, other: lang === 'en' ? {} : { [lang]: Object.keys(lines).join(' ') }, tpl: { [lang]: man.tpl?.[lang] || [] } };
}
