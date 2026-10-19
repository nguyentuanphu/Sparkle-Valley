// Shared additions are registered by lazy game menus; default instructions load with the film/chat.
export interface HowToCard { pic: string; en: string; vi: string; title?: boolean; end?: boolean; demo?: unknown }
export interface HowToGuide { origin?: HowToCard; steps: HowToCard[]; real?: HowToCard }
export interface HowToOptions { onPlay?: () => void; onClose?: () => void }
export const HOWTO: Record<string, HowToGuide> = {};
