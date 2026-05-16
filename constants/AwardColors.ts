// constants/AwardColors.ts
export type AwardColorKey = 'amber' | 'violet' | 'teal' | 'red' | 'gold' | 'blue';

export interface AwardColorDef {
  hex: string;
  rgb: string;       // "r,g,b" for rgba() usage
  light: string;     // lighter variant for gradients
}

export const AWARD_COLORS: Record<AwardColorKey, AwardColorDef> = {
  amber:  { hex: '#FFB347', rgb: '255,179,71',  light: '#FFD080' },
  violet: { hex: '#B47AFF', rgb: '180,122,255', light: '#D4AAFF' },
  teal:   { hex: '#4DCDBE', rgb: '77,205,190',  light: '#90EDE6' },
  red:    { hex: '#FF5A5A', rgb: '255,90,90',   light: '#FF9090' },
  gold:   { hex: '#FFC832', rgb: '255,200,50',  light: '#FFE080' },
  blue:   { hex: '#64B4FF', rgb: '100,180,255', light: '#A0D0FF' },
};

export const DEFAULT_AWARD_COLOR: AwardColorKey = 'amber';

export function resolveAwardColor(key?: string | null): AwardColorDef {
  if (key && key in AWARD_COLORS) return AWARD_COLORS[key as AwardColorKey];
  return AWARD_COLORS[DEFAULT_AWARD_COLOR];
}
