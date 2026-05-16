import { Timestamp } from 'firebase/firestore';

export type Region = 'TR' | 'Global';

export interface Award {
  id: string;
  name: string;               // Türkçe isim (ör. "Kristal Elma")
  nameEn?: string;
  region: Region;
  country: string;            // "Türkiye", "USA", "UK" vb.
  categories: string[];
  applicationOpenDate: Timestamp;
  deadlineDate: Timestamp;
  earlyBirdDate?: Timestamp;
  applicationUrl: string;
  website: string;
  applicationRequirements?: string;
  fee?: string;
  logoUrl?: string;
  description?: string;
  color?: string;   // AwardColorKey — resolved via resolveAwardColor()
  pastWinners?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Article {
  id: string;
  type: 'news' | 'tip';
  title: string;
  summary: string;
  url?: string;
  relatedAwardId?: string;
  imageUrl?: string;
  publishedAt: Timestamp;
  isActive: boolean;
}

export interface UserPrefs {
  deviceToken: string;
  mutedAwards: string[];
  quietStart: number;   // saat (0-23), varsayılan: 22
  quietEnd: number;     // saat (0-23), varsayılan: 8
  updatedAt: Timestamp;
}

// Urgency hesaplama için yardımcı
export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal';

export function getUrgencyLevel(deadlineDate: Timestamp): UrgencyLevel {
  const now = Date.now();
  const deadline = deadlineDate.toMillis();
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return 'critical';
  if (hoursLeft <= 24) return 'critical';
  if (hoursLeft <= 72) return 'urgent';
  if (hoursLeft <= 168) return 'warning'; // 7 gün
  return 'normal';
}

export function getDaysLeft(deadlineDate: Timestamp): number {
  const now = Date.now();
  const deadline = deadlineDate.toMillis();
  return Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
}

export function getHoursLeft(deadlineDate: Timestamp): number {
  const now = Date.now();
  const deadline = deadlineDate.toMillis();
  return Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60)));
}

export function getCountdownDisplay(deadlineDate: Timestamp): { value: string; unit: string; urgency: UrgencyLevel } {
  const urgency = getUrgencyLevel(deadlineDate);
  const hoursLeft = getHoursLeft(deadlineDate);
  const daysLeft = getDaysLeft(deadlineDate);

  if (hoursLeft <= 24) {
    return { value: String(hoursLeft).padStart(2, '0'), unit: 'saat', urgency };
  }
  return { value: String(daysLeft), unit: 'gün', urgency };
}
