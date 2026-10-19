// @ts-check
// Persisted reports are untrusted JSON. Never erase older reports to claim a new one was queued.
export type ReportEntry = { id: string; b: string; kind: string; at: number; clientId?: string; shot?: string; [key: string]: unknown };
export type QueueRead = { ok: true; rows: ReportEntry[] } | { ok: false; reason: 'invalid'; rows: [] };
/** @param {string|null} raw @returns {QueueRead} */
export function readReportQueue(raw: string | null): QueueRead {
  let value: unknown; try { value = raw === null ? [] : JSON.parse(raw); } catch { return {ok:false,reason:'invalid',rows:[]}; }
  if (!Array.isArray(value) || !value.every(isReportEntry)) return {ok:false,reason:'invalid',rows:[]};
  return {ok:true,rows:value};
}
/** @param {unknown} value @returns {value is ReportEntry} */
function isReportEntry(value: unknown): value is ReportEntry {
  if(!value || typeof value !== 'object')return false;
  // Narrow object access after the runtime guard; fields retain unknown until checked.
  if (!('id' in value) || !('b' in value) || !('kind' in value) || !('at' in value)) return false;
  const row = value;
  return typeof row.id==='string' && typeof row.b==='string' && typeof row.kind==='string' && typeof row.at==='number' && Number.isFinite(row.at) && (!('clientId' in row) || row.clientId===undefined || typeof row.clientId==='string') && (!('shot' in row) || row.shot===undefined || typeof row.shot==='string');
}
/**
 * Keep text/identity of every report if pictures exceed the storage quota.
 * @param {Pick<Storage,'setItem'>} storage @param {string} key @param {ReportEntry[]} rows
 * @returns {{ok:true,withoutPictures:boolean}|{ok:false,reason:'storage'}}
 */
export function persistReportQueue(storage: Pick<Storage, 'setItem'>, key: string, rows: ReportEntry[]): { ok: true; withoutPictures: boolean } | { ok: false; reason: 'storage' } {
  try {storage.setItem(key,JSON.stringify(rows));return {ok:true,withoutPictures:false};} catch {}
  try {storage.setItem(key,JSON.stringify(rows.map(row=>({...row,shot:''}))));return {ok:true,withoutPictures:true};} catch {return {ok:false,reason:'storage'};}
}
