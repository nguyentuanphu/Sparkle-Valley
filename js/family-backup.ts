// Validate the complete private backup before either client or server writes any photo.
export type BackupRead = { ok: true, entries: Array<[string, { image: string }]> } | { ok: false, reason: 'invalid' | 'limit' };
export function readFamilyBackup(value: unknown, existingIDs: string[] = []): BackupRead {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {ok:false,reason:'invalid'};
  const backup=value as Record<string,unknown>;
  if (backup.format!=='sparkle-family-photos-v1' || !backup.photos || typeof backup.photos!=='object' || Array.isArray(backup.photos)) return {ok:false,reason:'invalid'};
  const photos=backup.photos as Record<string,unknown>, rows=Object.entries(photos);
  if (rows.length>60 || new Set([...existingIDs,...Object.keys(photos)]).size>60) return {ok:false,reason:'limit'};
  const entries: Array<[string,{image:string}]> = [];
  for (const [id,value] of rows) {
    if (!/^[\p{L}\p{N} _.'-]{1,100}$/u.test(id) || ['__proto__','constructor','prototype'].includes(id) || !value || typeof value!=='object' || Array.isArray(value)) return {ok:false,reason:'invalid'};
    const photo=value as Record<string,unknown>;
    if (typeof photo.image!=='string' || photo.image.length>450000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo.image)) return {ok:false,reason:'invalid'};
    entries.push([id,{image:photo.image}]);
  }
  return {ok:true,entries};
}
