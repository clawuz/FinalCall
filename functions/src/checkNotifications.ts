import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface NotifMilestone {
  daysBeforeDeadline: number;
  sendHour: number;
  enabled: boolean;
}

interface NotifSchedule {
  milestones: NotifMilestone[];
  lastWeekEnabled: boolean;
  lastWeekIntervalHours: number;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  badge?: number;
}

interface PushMeta {
  awardId: string;
  notifType: string;
  token: string;
}

/** Returns YYYY-MM-DD string for a unix timestamp */
function toDateStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function isInQuietHours(hour: number, quietStart: number, quietEnd: number): boolean {
  if (quietStart > quietEnd) return hour >= quietStart || hour < quietEnd;
  return hour >= quietStart && hour < quietEnd;
}

/** Send messages in batches of 100. Returns ticket IDs (null on failure). */
async function sendExpoPush(
  messages: ExpoPushMessage[],
): Promise<Array<string | null>> {
  const results: Array<string | null> = [];
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
      const result = (await response.json()) as {
        data: Array<{ status: string; id?: string; message?: string }>;
      };
      for (let j = 0; j < batch.length; j++) {
        const ticket = result.data[j];
        results.push(ticket?.status === 'ok' && ticket.id ? ticket.id : null);
        if (ticket?.status !== 'ok') {
          logger.warn('Push ticket error:', ticket?.message);
        }
      }
    } catch (error) {
      logger.error('Failed to send Expo push batch:', error);
      batch.forEach(() => results.push(null));
    }
  }
  return results;
}

export const checkNotifications = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Europe/Istanbul',
    region: 'europe-west1',
  },
  async () => {
    const now = Date.now();
    const WINDOW_MS = 30 * 60 * 1000; // 30-min catch window (2 runs worth of slack)
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const [awardsSnap, logSnap, prefsSnap] = await Promise.all([
      db.collection('awards').where('isActive', '==', true).get(),
      db.collection('notification_log').get(),
      db.collection('user_prefs').get(),
    ]);

    if (awardsSnap.empty || prefsSnap.empty) {
      logger.info('No active awards or tokens, skipping.');
      return;
    }

    const sentKeys = new Set(logSnap.docs.map((d) => d.id));

    // Current hour in Istanbul (UTC+3)
    const istanbulHour = (new Date(now).getUTCHours() + 3) % 24;

    const users = prefsSnap.docs
      .map((d) => ({
        token: d.id,
        mutedAwards: (d.data().mutedAwards as string[]) ?? [],
        allNotifs: (d.data().allNotifs as boolean) ?? true,
        countdownNotif: (d.data().countdownNotif as boolean) ?? true,
        lastDayNotif: (d.data().lastDayNotif as boolean) ?? true,
        quietStart: (d.data().quietStart as number) ?? 22,
        quietEnd: (d.data().quietEnd as number) ?? 8,
      }))
      .filter(
        (u) =>
          u.allNotifs &&
          u.token.startsWith('ExponentPushToken[') &&
          !isInQuietHours(istanbulHour, u.quietStart, u.quietEnd),
      );

    if (users.length === 0) {
      logger.info('No active users in this window.');
      return;
    }

    const logBatch = db.batch();
    const messages: ExpoPushMessage[] = [];
    const metas: PushMeta[] = [];
    let logCount = 0;

    for (const awardDoc of awardsSnap.docs) {
      const data = awardDoc.data();
      const awardId = awardDoc.id;
      const awardName = data.name as string;
      const schedule = data.notifSchedule as NotifSchedule | undefined;

      // Skip awards with no configured schedule
      if (!schedule) continue;

      // Use postponed deadline when available
      const effectiveDeadline = data.postponedDeadlineDate
        ? (data.postponedDeadlineDate as Timestamp).toMillis()
        : (data.deadlineDate as Timestamp).toMillis();

      if (effectiveDeadline <= now) continue;

      const deadlineDateStr = toDateStr(effectiveDeadline);
      const msUntilDeadline = effectiveDeadline - now;

      // ── Milestone notifications ──────────────────────────────────
      for (const ms of schedule.milestones) {
        if (!ms.enabled) continue;

        const logKey = `${awardId}_${ms.daysBeforeDeadline}d_${deadlineDateStr}`;
        if (sentKeys.has(logKey)) continue;

        // Compute the target fire time: N days before deadline, at sendHour Istanbul
        const targetDay = new Date(effectiveDeadline);
        targetDay.setDate(targetDay.getDate() - ms.daysBeforeDeadline);
        // Convert Istanbul hour to UTC (Istanbul = UTC+3)
        targetDay.setUTCHours((ms.sendHour - 3 + 24) % 24, 0, 0, 0);
        const sendTargetMs = targetDay.getTime();

        if (now < sendTargetMs || now >= sendTargetMs + WINDOW_MS) continue;

        const daysLabel = ms.daysBeforeDeadline;
        const title = daysLabel === 1
          ? `${awardName} — Yarın son gün!`
          : `${awardName} — ${daysLabel} gün kaldı`;
        const body = daysLabel === 1
          ? 'Yarın başvuru kapanıyor. Son kontrolleri yap.'
          : `Başvuru için ${daysLabel} günün var. Geç kalma.`;

        for (const u of users) {
          if (!u.countdownNotif || u.mutedAwards.includes(awardId)) continue;
          messages.push({ to: u.token, title, body, data: { awardId, type: `${daysLabel}d` }, sound: 'default', badge: 1 });
          metas.push({ awardId, notifType: `${daysLabel}d_${deadlineDateStr}`, token: u.token });
        }

        logBatch.set(db.collection('notification_log').doc(logKey), {
          awardId, type: `${ms.daysBeforeDeadline}d`, deadlineDateStr, sentAt: Timestamp.now(),
        });
        sentKeys.add(logKey);
        logCount++;
      }

      // ── Last-week interval notifications ─────────────────────────
      if (schedule.lastWeekEnabled && msUntilDeadline <= ONE_WEEK_MS) {
        const intervalMs = schedule.lastWeekIntervalHours * 60 * 60 * 1000;
        const bucketIndex = Math.floor(msUntilDeadline / intervalMs);
        const logKey = `${awardId}_lastWeek_${bucketIndex}`;

        if (!sentKeys.has(logKey)) {
          const hoursLeft = Math.round(msUntilDeadline / (60 * 60 * 1000));
          const daysLeft = Math.ceil(msUntilDeadline / (24 * 60 * 60 * 1000));
          const title = hoursLeft <= 24
            ? `🚨 ${awardName} — Bugün son gün!`
            : `⏰ ${awardName} — Son ${daysLeft} gün`;
          const body = `${hoursLeft} saat kaldı. Başvurmayı unutma!`;

          for (const u of users) {
            if (!u.lastDayNotif || u.mutedAwards.includes(awardId)) continue;
            messages.push({ to: u.token, title, body, data: { awardId, type: 'lastWeek' }, sound: 'default', badge: 1 });
            metas.push({ awardId, notifType: `lastWeek_${bucketIndex}`, token: u.token });
          }

          logBatch.set(db.collection('notification_log').doc(logKey), {
            awardId, type: 'lastWeek', bucketIndex, sentAt: Timestamp.now(),
          });
          sentKeys.add(logKey);
          logCount++;
        }
      }
    }

    if (messages.length === 0) {
      logger.info('No notifications due in this run.');
      return;
    }

    logger.info(`Sending ${messages.length} push messages for ${logCount} milestone(s)`);
    const ticketIds = await sendExpoPush(messages);

    // Write push_receipts for delivery tracking
    const receiptBatch = db.batch();
    for (let i = 0; i < ticketIds.length; i++) {
      const ticketId = ticketIds[i];
      if (!ticketId) continue;
      const ref = db.collection('push_receipts').doc();
      receiptBatch.set(ref, {
        ticketId,
        token: metas[i].token,
        awardId: metas[i].awardId,
        notifType: metas[i].notifType,
        sentAt: Timestamp.now(),
        status: 'pending',
      });
    }

    await Promise.all([logBatch.commit(), receiptBatch.commit()]);
    logger.info(`Logged ${logCount} notification(s), ${ticketIds.filter(Boolean).length} receipts written`);
  },
);
