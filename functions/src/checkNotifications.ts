import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

type NotifType =
  | 'open'
  | '30d'
  | '14d'
  | '7d'
  | '3d'
  | '1d'
  | 'last_16h'
  | 'last_12h'
  | 'last_8h'
  | 'last_4h';

interface Milestone {
  type: NotifType;
  msBeforeDeadline: number;
}

const MILESTONES: Milestone[] = [
  { type: '30d', msBeforeDeadline: 30 * 24 * 60 * 60 * 1000 },
  { type: '14d', msBeforeDeadline: 14 * 24 * 60 * 60 * 1000 },
  { type: '7d', msBeforeDeadline: 7 * 24 * 60 * 60 * 1000 },
  { type: '3d', msBeforeDeadline: 3 * 24 * 60 * 60 * 1000 },
  { type: '1d', msBeforeDeadline: 1 * 24 * 60 * 60 * 1000 },
  { type: 'last_16h', msBeforeDeadline: 16 * 60 * 60 * 1000 },
  { type: 'last_12h', msBeforeDeadline: 12 * 60 * 60 * 1000 },
  { type: 'last_8h', msBeforeDeadline: 8 * 60 * 60 * 1000 },
  { type: 'last_4h', msBeforeDeadline: 4 * 60 * 60 * 1000 },
];

function getNotifContent(type: NotifType, awardName: string): { title: string; body: string } {
  switch (type) {
    case 'open':
      return { title: `${awardName} başvuruları açıldı! 🎯`, body: 'Başvuru süreci başladı. Hazırlanmak için zamanın var.' };
    case '30d':
      return { title: `${awardName} — 30 gün kaldı`, body: 'Başvuru için 30 günün var. Planlamaya başla.' };
    case '14d':
      return { title: `${awardName} — 14 gün kaldı`, body: 'Son 2 hafta! Çalışmalarını hazırla.' };
    case '7d':
      return { title: `${awardName} — Son 1 hafta!`, body: 'Başvuru için 7 günün kaldı. Geç kalma.' };
    case '3d':
      return { title: `${awardName} — 3 gün kaldı`, body: 'Son 3 gün! Başvurunu tamamla.' };
    case '1d':
      return { title: `${awardName} — Yarın son gün!`, body: 'Yarın başvuru kapanıyor. Son kontrolleri yap.' };
    case 'last_16h':
      return { title: `${awardName} — Bugün son gün`, body: '16 saat kaldı! Hemen başvur.' };
    case 'last_12h':
      return { title: `${awardName} — 12 saat kaldı`, body: 'Son 12 saat! Başvurunu tamamla.' };
    case 'last_8h':
      return { title: `${awardName} — 8 saat kaldı`, body: 'Yalnızca 8 saat kaldı. Acele et!' };
    case 'last_4h':
      return { title: `${awardName} — Son 4 saat!`, body: 'Başvuru kapanıyor. Son fırsat!' };
  }
}

// Expo Push Notification Service endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  badge?: number;
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  // Expo accepts batches of up to 100
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      const result = (await response.json()) as { data: Array<{ status: string; message?: string }> };
      const failures = result.data.filter((r) => r.status === 'error');
      if (failures.length > 0) {
        logger.warn(`Expo push: ${failures.length} failed out of ${batch.length}`);
      } else {
        logger.info(`Expo push: ${batch.length} messages sent successfully`);
      }
    } catch (error) {
      logger.error('Failed to send Expo push batch:', error);
    }
  }
}

export const checkNotifications = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Europe/Istanbul',
    region: 'europe-west1',
  },
  async () => {
    const now = Date.now();
    // 2-hour catch-up window: handles brief function downtime
    const catchUpWindowMs = 2 * 60 * 60 * 1000;

    // Load active awards
    const awardsSnap = await db.collection('awards').where('isActive', '==', true).get();
    if (awardsSnap.empty) {
      logger.info('No active awards, skipping.');
      return;
    }

    // Load already-sent notification log (keyed by `{awardId}_{type}`)
    const logSnap = await db.collection('notification_log').get();
    const sentKeys = new Set(logSnap.docs.map((d) => d.id));

    // Load registered device tokens
    const prefsSnap = await db.collection('user_prefs').get();
    if (prefsSnap.empty) {
      logger.info('No registered tokens, skipping.');
      return;
    }

    // Current hour in Istanbul (UTC+3)
    const nowDate = new Date(now);
    const istanbulHour = (nowDate.getUTCHours() + 3) % 24;

    const allTokenDocs = prefsSnap.docs.map((d) => ({
      token: d.id,
      mutedAwards: (d.data().mutedAwards as string[]) ?? [],
      allNotifs: (d.data().allNotifs as boolean) ?? true,
      quietStart: (d.data().quietStart as number) ?? 22,
      quietEnd: (d.data().quietEnd as number) ?? 8,
    }));

    function isInQuietHours(quietStart: number, quietEnd: number, hour: number): boolean {
      if (quietStart > quietEnd) {
        // Wraps midnight: e.g. 22 → 8
        return hour >= quietStart || hour < quietEnd;
      }
      return hour >= quietStart && hour < quietEnd;
    }

    // Only keep active tokens (Expo format) that are not in quiet hours
    const activeTokenDocs = allTokenDocs.filter(
      (t) =>
        t.allNotifs &&
        t.token.startsWith('ExponentPushToken[') &&
        !isInQuietHours(t.quietStart, t.quietEnd, istanbulHour)
    );

    if (activeTokenDocs.length === 0) {
      logger.info('No active tokens with notifications enabled.');
      return;
    }

    const batch = db.batch();
    let logCount = 0;
    const pushMessages: ExpoPushMessage[] = [];

    for (const awardDoc of awardsSnap.docs) {
      const data = awardDoc.data();
      const awardId = awardDoc.id;
      const awardName = data.name as string;
      const deadlineMs = (data.deadlineDate as Timestamp).toMillis();

      // Skip awards whose deadline has passed
      if (deadlineMs <= now) continue;

      // Check applicationOpen notification
      if (data.applicationOpenDate) {
        const openMs = (data.applicationOpenDate as Timestamp).toMillis();
        const logKey = `${awardId}_open`;
        if (
          openMs <= now &&
          openMs >= now - catchUpWindowMs &&
          !sentKeys.has(logKey)
        ) {
          const { title, body } = getNotifContent('open', awardName);
          for (const t of activeTokenDocs) {
            if (!t.mutedAwards.includes(awardId)) {
              pushMessages.push({ to: t.token, title, body, data: { awardId, type: 'open' }, sound: 'default', badge: 1 });
            }
          }
          batch.set(db.collection('notification_log').doc(logKey), {
            awardId, type: 'open', sentAt: Timestamp.now(),
          });
          logCount++;
        }
      }

      // Check milestone notifications
      for (const milestone of MILESTONES) {
        const milestoneMs = deadlineMs - milestone.msBeforeDeadline;
        const logKey = `${awardId}_${milestone.type}`;

        if (
          milestoneMs <= now &&
          milestoneMs >= now - catchUpWindowMs &&
          !sentKeys.has(logKey)
        ) {
          const { title, body } = getNotifContent(milestone.type, awardName);
          for (const t of activeTokenDocs) {
            if (!t.mutedAwards.includes(awardId)) {
              pushMessages.push({
                to: t.token,
                title,
                body,
                data: { awardId, type: milestone.type },
                sound: 'default',
                badge: 1,
              });
            }
          }
          batch.set(db.collection('notification_log').doc(logKey), {
            awardId, type: milestone.type, sentAt: Timestamp.now(),
          });
          logCount++;
        }
      }
    }

    if (pushMessages.length > 0) {
      logger.info(`Sending ${pushMessages.length} push messages for ${logCount} milestone(s)`);
      await sendExpoPush(pushMessages);
    }

    if (logCount > 0) {
      await batch.commit();
      logger.info(`Logged ${logCount} notification(s) to notification_log`);
    } else {
      logger.info('No notifications due in this run.');
    }
  }
);
