// @ts-check
// Validate the complete private backup before either client or server writes any photo.
/** @typedef {{ok:true,entries:Array<[string,{image:string}]>}|{ok:false,reason:'invalid'|'limit'}} BackupRead */
/** @param {unknown} value @param {string[]} existingIDs @returns {BackupRead} */
export function readFamilyBackup(value, existingIDs = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {ok:false,reason:'invalid'};
  const backup=/** @type {Record<string,unknown>} */(value);
  if (backup.format!=='sparkle-family-photos-v1' || !backup.photos || typeof backup.photos!=='object' || Array.isArray(backup.photos)) return {ok:false,reason:'invalid'};
  const photos=/** @type {Record<string,unknown>} */(backup.photos), rows=Object.entries(photos);
  if (rows.length>60 || new Set([...existingIDs,...Object.keys(photos)]).size>60) return {ok:false,reason:'limit'};
  /** @type {Array<[string,{image:string}]>} */ const entries=[];
  for (const [id,value] of rows) {
    if (!/^[\p{L}\p{N} _.'-]{1,100}$/u.test(id) || ['__proto__','constructor','prototype'].includes(id) || !value || typeof value!=='object' || Array.isArray(value)) return {ok:false,reason:'invalid'};
    const photo=/** @type {Record<string,unknown>} */(value);
    if (typeof photo.image!=='string' || photo.image.length>450000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo.image)) return {ok:false,reason:'invalid'};
    entries.push([id,{image:photo.image}]);
  }
  return {ok:true,entries};
}
