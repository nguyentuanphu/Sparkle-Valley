// The private Studio bot schedule is never part of the game's public /api/live response.
export type BotConfig = { enabled: boolean, schedule: 'day-night' | 'custom', time: string, count: number, profile: 'chaos-toddler' | 'gentle-explorer' | 'max-competence', duration: number };
const PROFILES = ['chaos-toddler', 'gentle-explorer', 'max-competence'];
export function cleanBotConfig(value: unknown): BotConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.enabled !== 'boolean' || !['day-night', 'custom'].includes(String(v.schedule)) ||
    typeof v.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time) ||
    !Number.isInteger(v.count) || (v.count as number) < 1 || (v.count as number) > 10 ||
    !PROFILES.includes(String(v.profile)) || !Number.isInteger(v.duration) ||
    (v.duration as number) < 1 || (v.duration as number) > 30) return null;
  return v as BotConfig;
}
export function dueBotSlot(config: BotConfig | null, now: Date): string | null {
  if (!config?.enabled || Number.isNaN(now.getTime())) return null;
  const minute = now.getUTCHours() * 60 + now.getUTCMinutes();
  const targets = config.schedule === 'day-night' ? [8 * 60, 20 * 60] :
    [Number(config.time.slice(0, 2)) * 60 + Number(config.time.slice(3))];
  const target = targets.find(t => (minute - t + 1440) % 1440 < 5);
  if (target === undefined) return null;
  const day = new Date(now.getTime() - ((minute - target + 1440) % 1440) * 60000).toISOString().slice(0, 10);
  return `${day}T${String(Math.floor(target / 60)).padStart(2, '0')}:${String(target % 60).padStart(2, '0')}Z`;
}
