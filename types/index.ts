import { Timestamp } from 'firebase/firestore';

export type Region = 'TR' | 'Global';

export interface NotifMilestone {
  daysBeforeDeadline: number; // 30 | 14 | 7 | 3 | 1
  sendHour: number;           // 0–23, Istanbul time
  enabled: boolean;
}

export interface NotifSchedule {
  milestones: NotifMilestone[];
  lastWeekEnabled: boolean;
  lastWeekIntervalHours: number; // e.g. 12
}

export const DEFAULT_NOTIF_SCHEDULE: NotifSchedule = {
  milestones: [
    { daysBeforeDeadline: 30, sendHour: 10, enabled: false },
    { daysBeforeDeadline: 14, sendHour: 10, enabled: false },
    { daysBeforeDeadline: 7,  sendHour: 9,  enabled: false },
    { daysBeforeDeadline: 3,  sendHour: 9,  enabled: false },
    { daysBeforeDeadline: 1,  sendHour: 9,  enabled: false },
  ],
  lastWeekEnabled: false,
  lastWeekIntervalHours: 12,
};

export interface Award {
  id: string;
  name: string;
  nameEn?: string;
  region: Region;
  country: string;
  categories: string[];
  applicationOpenDate: Timestamp;
  deadlineDate: Timestamp;
  postponedDeadlineDate?: Timestamp;
  earlyBirdDate?: Timestamp;
  applicationUrl: string;
  website: string;
  applicationRequirements?: string;
  fee?: string;
  logoUrl?: string;
  description?: string;
  color?: string;
  pastWinners?: string;
  isActive: boolean;
  notifSchedule?: NotifSchedule; // undefined = no automated notifications
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
  allNotifs: boolean;
  countdownNotif: boolean; // milestone notifications (30d, 14d…)
  lastDayNotif: boolean;   // last-week interval notifications
  quietStart: number;
  quietEnd: number;
  updatedAt: Timestamp;
}

export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal';

export function getUrgencyLevel(deadlineDate: Timestamp): UrgencyLevel {
  const now = Date.now();
  const deadline = deadlineDate.toMillis();
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return 'critical';
  if (hoursLeft <= 24) return 'critical';
  if (hoursLeft <= 72) return 'urgent';
  if (hoursLeft <= 168) return 'warning';
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
