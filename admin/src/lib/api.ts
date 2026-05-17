import type { NotifSchedule } from '../../../types';
export type { NotifSchedule };

const BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL as string;
const password = import.meta.env.VITE_ADMIN_PASSWORD as string;

async function request<T>(
  path: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

// Awards
export const getAwards = () => request<Award[]>('adminAwards');
export const createAward = (data: Partial<Award>) => request<{ id: string }>('adminAwards', 'POST', data);
export const updateAward = (id: string, data: Partial<Award>) => request<{ ok: boolean }>(`adminAwards/${id}`, 'PUT', data);
export const deleteAward = (id: string) => request<{ ok: boolean }>(`adminAwards/${id}`, 'DELETE');

// Articles
export const getArticles = () => request<Article[]>('adminArticles');
export const createArticle = (data: Partial<Article>) => request<{ id: string }>('adminArticles', 'POST', data);
export const updateArticle = (id: string, data: Partial<Article>) => request<{ ok: boolean }>(`adminArticles/${id}`, 'PUT', data);
export const deleteArticle = (id: string) => request<{ ok: boolean }>(`adminArticles/${id}`, 'DELETE');

// Tips
export const getTips = () => request<Tip[]>('adminTips');
export const createTip = (data: Partial<Tip>) => request<{ id: string }>('adminTips', 'POST', data);
export const updateTip = (id: string, data: Partial<Tip>) => request<{ ok: boolean }>(`adminTips/${id}`, 'PUT', data);
export const deleteTip = (id: string) => request<{ ok: boolean }>(`adminTips/${id}`, 'DELETE');

// Notifications
export const sendNotification = (data: {
  title: string;
  body: string;
  target: 'all' | 'award';
  targetAwardId?: string;
}) => request<{ sent: number; total: number }>('adminNotifications', 'POST', data);

// Stats
export interface DeliverySummary {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface StatsData {
  totalDevices: number;
  notifEnabled: number;
  deliverySummary: DeliverySummary;
  byAward: Record<string, { sent: number; delivered: number; failed: number }>;
  recentLog: Array<{ id: string; awardId: string; type: string; sentAt: unknown }>;
  recentReceipts: Array<{
    id: string;
    token: string;
    awardId: string;
    notifType: string;
    sentAt: unknown;
    status: 'pending' | 'delivered' | 'failed';
    errorDetails?: string;
  }>;
}

export const getStats = () => request<StatsData>('adminStats');

// Shared types
export interface Award {
  id: string;
  name: string;
  color: string;
  deadlineDate: string;
  postponedDeadlineDate?: string;
  applicationOpenDate?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  entryFee?: string;
  categories?: string[];
  notifSchedule?: NotifSchedule;
  previousWinners?: {
    title: string;
    description: string;
    cases: { title: string; description: string; videoUrl?: string }[];
  };
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  tags?: string[];
  isPublished: boolean;
}

export interface Tip {
  id: string;
  title: string;
  body: string;
  category?: string;
  isPublished: boolean;
  createdAt: string;
}
