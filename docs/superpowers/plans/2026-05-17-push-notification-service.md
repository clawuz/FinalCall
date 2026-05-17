# Push Notification Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded notification system with a per-award configurable push service, add Expo receipt delivery tracking with invalid token cleanup, and automate deployments via GitHub Actions.

**Architecture:** Each award stores a `notifSchedule` in Firestore; `checkNotifications` (Cloud Function, every 15 min) reads it and dispatches pushes at the configured day+hour per milestone. A new `processReceipts` function (every 30 min) validates Expo delivery receipts and removes dead tokens. Local notification scheduler is removed — server is the single source. GitHub Actions deploys functions on push and triggers EAS builds for app distribution.

**Tech Stack:** Firebase Cloud Functions v2 (Node.js 22, TypeScript), Expo Push API, Firestore, React Native (Expo Router), Vite + React (admin panel), GitHub Actions, EAS Build, Firebase App Distribution.

---

## Files

**Create:**
- `functions/src/processReceipts.ts` — new Cloud Function, validates Expo receipts every 30 min
- `admin/src/components/NotifScheduleEditor.tsx` — milestone toggles + last-week interval UI
- `.github/workflows/deploy-functions.yml` — auto-deploy functions on push to main
- `.github/workflows/eas-build.yml` — EAS build + Firebase App Distribution on push to main

**Modify:**
- `types/index.ts` — add `NotifSchedule` interface, update `Award` and `UserPrefs`
- `services/notifications.ts` — remove local scheduler, add notification tap handler
- `services/userPrefs.ts` — add `countdownNotif` + `lastDayNotif` to `updateUserNotifSettings`
- `store/prefsStore.ts` — make `setCountdownNotif` / `setLastDayNotif` sync to Firestore
- `app/(tabs)/settings.tsx` — remove `cancelAllNotifications` import, update reset button
- `functions/src/checkNotifications.ts` — full rewrite: per-award schedule, new log key format, receipt writing
- `functions/src/processReceipts.ts` — new file (listed above)
- `functions/src/index.ts` — export `processReceipts`
- `functions/src/adminStats.ts` — add delivery metric queries (`push_receipts`)
- `admin/src/lib/api.ts` — add `NotifSchedule` to `Award` interface + `notifSchedule` CRUD
- `admin/src/components/AwardForm.tsx` — embed `NotifScheduleEditor`
- `admin/src/pages/StatsPage.tsx` — add delivery summary cards + recent receipts table

---

## Task 1: TypeScript Types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add `NotifSchedule` interface and update `Award` and `UserPrefs`**

Replace the existing content of `types/index.ts` with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /path/to/project && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to types/index.ts)

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add NotifSchedule type, update Award + UserPrefs types"
```

---

## Task 2: Simplify Client Notification Service

**Files:**
- Modify: `services/notifications.ts`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Rewrite `services/notifications.ts`**

Replace the entire file:

```typescript
import { Platform } from 'react-native';
import { router } from 'expo-router';

const Notifications = Platform.OS !== 'web' ? require('expo-notifications') : null;
const Device = Platform.OS !== 'web' ? require('expo-device') : null;
const Constants = Platform.OS !== 'web' ? require('expo-constants').default : null;

export function configureNotificationHandler() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('awards', {
      name: 'Ödül Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B47AFF',
    });
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Device) return null;
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    console.warn('Could not get push token:', e);
    return null;
  }
}

/**
 * Call once at app startup. When a user taps a push notification,
 * routes to the relevant award detail screen.
 */
export function setupNotificationTapHandler() {
  if (!Notifications) return;
  Notifications.addNotificationResponseReceivedListener(
    (response: { notification: { request: { content: { data: Record<string, string> } } } }) => {
      const awardId = response.notification.request.content.data?.awardId;
      if (awardId) {
        router.push(`/award/${awardId}` as never);
      }
    }
  );
}
```

- [ ] **Step 2: Update `app/(tabs)/settings.tsx`**

Remove the `cancelAllNotifications` import and update the reset button handler:

Find this block near the top of settings.tsx:
```typescript
import { cancelAllNotifications } from '@/services/notifications';
```
Delete that import line.

Find `handleReset` function:
```typescript
function handleReset() {
  Alert.alert(
    'Bildirimleri Sıfırla',
    'Tüm planlanmış bildirimler iptal edilecek. Devam?',
    [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sıfırla', style: 'destructive', onPress: async () => {
          await cancelAllNotifications();
          Alert.alert('Tamam', 'Tüm bildirimler iptal edildi.');
        }
      },
    ]
  );
}
```

Replace with:
```typescript
function handleReset() {
  Alert.alert(
    'Bildirim Ayarları',
    'Bildirimler sunucu tarafından yönetilmektedir. Bildirimleri tamamen kapatmak için yukarıdaki "Tüm Bildirimler" anahtarını kapat.',
    [{ text: 'Tamam' }]
  );
}
```

- [ ] **Step 3: Add `setupNotificationTapHandler` call in `app/_layout.tsx`**

In `app/_layout.tsx`, add the import at the top:
```typescript
import { configureNotificationHandler, setupNotificationTapHandler } from '@/services/notifications';
```

Inside the `RootLayout` component, add a `useEffect` after the existing ones:
```typescript
useEffect(() => {
  if (Platform.OS !== 'web') {
    configureNotificationHandler();
    setupNotificationTapHandler();
  }
}, []);
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add services/notifications.ts app/_layout.tsx app/\(tabs\)/settings.tsx
git commit -m "feat: remove local notification scheduler, add tap-to-award handler"
```

---

## Task 3: Sync Notification Prefs to Firestore

**Files:**
- Modify: `services/userPrefs.ts`
- Modify: `store/prefsStore.ts`

- [ ] **Step 1: Update `services/userPrefs.ts`**

Replace the `updateUserNotifSettings` function signature and body (keep `registerPushToken`, `muteAward`, `unmuteAward` unchanged):

```typescript
export async function updateUserNotifSettings(
  token: string,
  settings: {
    allNotifs?: boolean;
    countdownNotif?: boolean;
    lastDayNotif?: boolean;
    quietStart?: number;
    quietEnd?: number;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'user_prefs', token), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Could not update notification settings in Firestore:', e);
  }
}
```

- [ ] **Step 2: Update `store/prefsStore.ts`**

Change `setCountdownNotif` and `setLastDayNotif` to sync to Firestore (currently local-only). Replace those two setters inside the `create` call:

```typescript
setCountdownNotif: (v) => {
  set({ countdownNotif: v });
  const token = get().pushToken;
  if (token) updateUserNotifSettings(token, { countdownNotif: v });
},
setLastDayNotif: (v) => {
  set({ lastDayNotif: v });
  const token = get().pushToken;
  if (token) updateUserNotifSettings(token, { lastDayNotif: v });
},
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add services/userPrefs.ts store/prefsStore.ts
git commit -m "feat: sync countdownNotif and lastDayNotif prefs to Firestore"
```

---

## Task 4: Rewrite `checkNotifications` Cloud Function

**Files:**
- Modify: `functions/src/checkNotifications.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
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
```

- [ ] **Step 2: Build and verify**

```bash
cd functions && npm run build
```

Expected: exits 0, no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add functions/src/checkNotifications.ts
git commit -m "feat: rewrite checkNotifications with per-award schedule and receipt tracking"
```

---

## Task 5: New `processReceipts` Cloud Function

**Files:**
- Create: `functions/src/processReceipts.ts`

- [ ] **Step 1: Create the file**

```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

type ReceiptStatus = 'ok' | 'error';
interface ExpoReceipt {
  status: ReceiptStatus;
  message?: string;
  details?: { error?: string };
}

export const processReceipts = onSchedule(
  {
    schedule: 'every 30 minutes',
    timeZone: 'Europe/Istanbul',
    region: 'europe-west1',
  },
  async () => {
    // Expo needs ~15 min to process tickets before receipts are available
    const fifteenMinAgo = Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000));

    const snap = await db
      .collection('push_receipts')
      .where('status', '==', 'pending')
      .where('sentAt', '<=', fifteenMinAgo)
      .limit(300)
      .get();

    if (snap.empty) {
      logger.info('No pending receipts to process.');
      return;
    }

    const docs = snap.docs;
    const ticketIds = docs.map((d) => d.data().ticketId as string);
    logger.info(`Checking ${ticketIds.length} receipts from Expo`);

    let receiptData: Record<string, ExpoReceipt>;
    try {
      const response = await fetch(EXPO_RECEIPTS_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ticketIds }),
      });
      const json = await response.json() as { data: Record<string, ExpoReceipt> };
      receiptData = json.data;
    } catch (error) {
      logger.error('Failed to fetch receipts from Expo:', error);
      return;
    }

    const batch = db.batch();
    let delivered = 0, failed = 0, removed = 0;

    for (const doc of docs) {
      const ticketId = doc.data().ticketId as string;
      const token = doc.data().token as string;
      const receipt = receiptData[ticketId];

      if (!receipt) continue; // Expo doesn't have this receipt yet; leave pending

      if (receipt.status === 'ok') {
        batch.update(doc.ref, { status: 'delivered' });
        delivered++;
      } else {
        const errorType = receipt.details?.error ?? receipt.message ?? 'unknown';
        batch.update(doc.ref, { status: 'failed', errorDetails: errorType });
        failed++;

        if (errorType === 'DeviceNotRegistered') {
          // Token is no longer valid — remove from user_prefs
          batch.delete(db.collection('user_prefs').doc(token));
          removed++;
          logger.info(`Removed invalid token: ${token.slice(0, 25)}...`);
        }
      }
    }

    await batch.commit();
    logger.info(
      `Receipts: ${delivered} delivered, ${failed} failed, ${removed} tokens removed`,
    );
  },
);
```

- [ ] **Step 2: Build**

```bash
cd functions && npm run build
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add functions/src/processReceipts.ts
git commit -m "feat: add processReceipts Cloud Function for Expo delivery tracking"
```

---

## Task 6: Wire Up `index.ts` + Update `adminStats`

**Files:**
- Modify: `functions/src/index.ts`
- Modify: `functions/src/adminStats.ts`

- [ ] **Step 1: Export `processReceipts` in `functions/src/index.ts`**

Add one line to `functions/src/index.ts`:

```typescript
import * as admin from 'firebase-admin';
admin.initializeApp();
export { checkNotifications } from './checkNotifications';
export { processReceipts } from './processReceipts';   // ← add this
export { adminAwards } from './adminAwards';
export { adminArticles } from './adminArticles';
export { adminTips } from './adminTips';
export { adminNotifications } from './adminNotifications';
export { adminStats } from './adminStats';
```

- [ ] **Step 2: Replace `functions/src/adminStats.ts`**

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminStats = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    if (!checkAuth(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      );

      const [prefsSnap, logSnap, allReceiptsSnap, recentReceiptsSnap] =
        await Promise.all([
          db.collection('user_prefs').get(),
          db.collection('notification_log').orderBy('sentAt', 'desc').limit(20).get(),
          db.collection('push_receipts').where('sentAt', '>=', thirtyDaysAgo).get(),
          db.collection('push_receipts').orderBy('sentAt', 'desc').limit(50).get(),
        ]);

      const totalDevices = prefsSnap.size;
      const notifEnabled = prefsSnap.docs.filter(
        (d) => d.data().allNotifs !== false,
      ).length;

      const allReceipts = allReceiptsSnap.docs.map((d) => d.data());
      const deliverySummary = {
        total: allReceipts.length,
        delivered: allReceipts.filter((r) => r.status === 'delivered').length,
        failed: allReceipts.filter((r) => r.status === 'failed').length,
        pending: allReceipts.filter((r) => r.status === 'pending').length,
      };

      // Per-award delivery breakdown (last 30d)
      const byAward: Record<string, { sent: number; delivered: number; failed: number }> = {};
      for (const r of allReceipts) {
        const id = r.awardId as string;
        if (!byAward[id]) byAward[id] = { sent: 0, delivered: 0, failed: 0 };
        byAward[id].sent++;
        if (r.status === 'delivered') byAward[id].delivered++;
        if (r.status === 'failed') byAward[id].failed++;
      }

      res.json({
        totalDevices,
        notifEnabled,
        deliverySummary,
        byAward,
        recentLog: logSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        recentReceipts: recentReceiptsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          // Mask token for privacy
          token: ((d.data().token as string) ?? '').slice(0, 25) + '…',
        })),
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);
```

- [ ] **Step 3: Build**

```bash
cd functions && npm run build
```

Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add functions/src/index.ts functions/src/adminStats.ts
git commit -m "feat: export processReceipts, add delivery metrics to adminStats"
```

---

## Task 7: Admin — `NotifScheduleEditor` Component

**Files:**
- Create: `admin/src/components/NotifScheduleEditor.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { NotifSchedule, NotifMilestone } from '../../../types';

interface Props {
  value: NotifSchedule;
  onChange: (s: NotifSchedule) => void;
}

const MILESTONE_DAYS = [30, 14, 7, 3, 1];

export default function NotifScheduleEditor({ value, onChange }: Props) {
  function updateMilestone(days: number, patch: Partial<NotifMilestone>) {
    onChange({
      ...value,
      milestones: value.milestones.map((m) =>
        m.daysBeforeDeadline === days ? { ...m, ...patch } : m,
      ),
    });
  }

  function ensureAllDays(schedule: NotifSchedule): NotifSchedule {
    const existing = new Map(schedule.milestones.map((m) => [m.daysBeforeDeadline, m]));
    return {
      ...schedule,
      milestones: MILESTONE_DAYS.map(
        (d) => existing.get(d) ?? { daysBeforeDeadline: d, sendHour: 10, enabled: false },
      ),
    };
  }

  const safe = ensureAllDays(value);

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Bildirim Takvimi
      </p>

      {/* Milestone rows */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {safe.milestones.map((m, i) => (
          <div
            key={m.daysBeforeDeadline}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={m.enabled}
              onChange={(e) => updateMilestone(m.daysBeforeDeadline, { enabled: e.target.checked })}
              style={{ accentColor: 'var(--violet)', width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text)', fontSize: 14, minWidth: 90 }}>
              {m.daysBeforeDeadline} gün önce
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Saat</span>
            <input
              type="number"
              min={0}
              max={23}
              value={m.sendHour}
              disabled={!m.enabled}
              onChange={(e) =>
                updateMilestone(m.daysBeforeDeadline, {
                  sendHour: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)),
                })
              }
              style={{
                width: 56, padding: '4px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: m.enabled ? 'var(--text)' : 'var(--muted)',
                fontSize: 14, textAlign: 'center',
                opacity: m.enabled ? 1 : 0.4,
              }}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>:00</span>
          </div>
        ))}
      </div>

      {/* Last-week interval */}
      <div
        style={{
          marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="checkbox"
            checked={safe.lastWeekEnabled}
            onChange={(e) => onChange({ ...safe, lastWeekEnabled: e.target.checked })}
            style={{ accentColor: 'var(--violet)', width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--text)', fontSize: 14 }}>Son hafta aralıklı bildirim</span>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Her</span>
          <input
            type="number"
            min={4}
            max={48}
            step={4}
            value={safe.lastWeekIntervalHours}
            disabled={!safe.lastWeekEnabled}
            onChange={(e) =>
              onChange({
                ...safe,
                lastWeekIntervalHours: Math.min(48, Math.max(4, parseInt(e.target.value) || 12)),
              })
            }
            style={{
              width: 56, padding: '4px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: safe.lastWeekEnabled ? 'var(--text)' : 'var(--muted)',
              fontSize: 14, textAlign: 'center',
              opacity: safe.lastWeekEnabled ? 1 : 0.4,
            }}
          />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>saatte bir</span>
        </div>
        <p style={{ marginTop: 6, marginLeft: 28, fontSize: 11, color: 'var(--muted)' }}>
          Son 7 günde bu sıklıkta hatırlatma gönderilir.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify admin TypeScript**

```bash
cd admin && npx tsc --noEmit
```

Expected: exits 0 (the import path `../../../types` resolves to `types/index.ts` at the project root — if it doesn't, adjust the relative path or add a path alias)

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/NotifScheduleEditor.tsx
git commit -m "feat: add NotifScheduleEditor component for per-award notification schedule"
```

---

## Task 8: Admin — Wire `NotifScheduleEditor` into `AwardForm` + `api.ts`

**Files:**
- Modify: `admin/src/lib/api.ts`
- Modify: `admin/src/components/AwardForm.tsx`

- [ ] **Step 1: Add `NotifSchedule` to `Award` interface in `admin/src/lib/api.ts`**

Find the `Award` interface and add `notifSchedule?`:

```typescript
// At the top of api.ts, add the import:
import type { NotifSchedule } from '../../../types';

// Inside the Award interface, add:
export interface Award {
  id: string;
  name: string;
  nameEn?: string;
  region: string;
  country: string;
  categories: string[];
  applicationOpenDate: string;
  deadlineDate: string;
  postponedDeadlineDate?: string;
  earlyBirdDate?: string;
  applicationUrl: string;
  website: string;
  fee?: string;
  description?: string;
  color?: string;
  isActive: boolean;
  notifSchedule?: NotifSchedule;  // ← add this
}
```

- [ ] **Step 2: Update `AwardForm.tsx` to include `NotifScheduleEditor`**

At the top of `admin/src/components/AwardForm.tsx`, add:

```typescript
import NotifScheduleEditor from './NotifScheduleEditor';
import { DEFAULT_NOTIF_SCHEDULE } from '../../../types';
import type { NotifSchedule } from '../../../types';
```

Inside the form state (where `name`, `deadlineDate`, etc. are tracked), add:

```typescript
const [notifSchedule, setNotifSchedule] = useState<NotifSchedule>(
  initial?.notifSchedule ?? DEFAULT_NOTIF_SCHEDULE
);
```

Where `initial` is the award being edited (passed as a prop), defaulting to `DEFAULT_NOTIF_SCHEDULE` for new awards.

In the form submit handler, include `notifSchedule` in the payload:

```typescript
const payload = {
  name,
  nameEn,
  region,
  country,
  categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
  applicationOpenDate,
  deadlineDate,
  postponedDeadlineDate: postponedDeadlineDate || undefined,
  earlyBirdDate: earlyBirdDate || undefined,
  applicationUrl,
  website,
  fee,
  description,
  color,
  isActive,
  notifSchedule,           // ← add
  previousWinners,
};
```

At the bottom of the form JSX, before the submit button, add:

```tsx
<NotifScheduleEditor value={notifSchedule} onChange={setNotifSchedule} />
```

- [ ] **Step 3: Build admin**

```bash
cd admin && npm run build
```

Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add admin/src/lib/api.ts admin/src/components/AwardForm.tsx
git commit -m "feat: add notifSchedule to AwardForm with NotifScheduleEditor"
```

---

## Task 9: Admin — Delivery Metrics in `StatsPage`

**Files:**
- Modify: `admin/src/pages/StatsPage.tsx`
- Modify: `admin/src/lib/api.ts`

- [ ] **Step 1: Update `getStats` return type in `admin/src/lib/api.ts`**

Find the `getStats` function and update its return type:

```typescript
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
  recentLog: Array<{ id: string; awardId: string; type: string; sentAt: any }>;
  recentReceipts: Array<{
    id: string;
    token: string;
    awardId: string;
    notifType: string;
    sentAt: any;
    status: 'pending' | 'delivered' | 'failed';
    errorDetails?: string;
  }>;
}

export async function getStats(): Promise<StatsData> {
  return request<StatsData>('adminStats', { method: 'GET' });
}
```

- [ ] **Step 2: Replace `admin/src/pages/StatsPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { getStats, StatsData } from '../lib/api';

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p style={{ color: 'var(--muted)' }}>Yükleniyor…</p></div>;
  if (error) return <div className="page"><p style={{ color: 'var(--red)' }}>{error}</p></div>;
  if (!data) return null;

  const { deliverySummary: ds } = data;
  const deliveryRate = ds.total > 0
    ? Math.round((ds.delivered / ds.total) * 100)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>İstatistikler</h1>
      </div>

      {/* Device stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Toplam Cihaz" value={data.totalDevices} />
        <StatCard label="Bildirim Açık" value={data.notifEnabled} />
        <StatCard label="Gönderilen (30g)" value={ds.total} />
        <StatCard label="Ulaşan" value={ds.delivered} sub={`${deliveryRate}%`} color="var(--violet)" />
        <StatCard label="Başarısız" value={ds.failed} color={ds.failed > 0 ? 'var(--red)' : undefined} />
        <StatCard label="Bekliyor" value={ds.pending} />
      </div>

      {/* Per-award breakdown */}
      {Object.keys(data.byAward).length > 0 && (
        <>
          <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Ödül Bazlı Teslimat
          </h2>
          <div className="list" style={{ marginBottom: 24 }}>
            {Object.entries(data.byAward).map(([awardId, stats]) => {
              const rate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0;
              return (
                <div key={awardId} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}>{awardId}</span>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Gönderildi: {stats.sent}</span>
                    <span style={{ color: 'var(--violet)' }}>Ulaştı: {stats.delivered}</span>
                    {stats.failed > 0 && <span style={{ color: 'var(--red)' }}>Hata: {stats.failed}</span>}
                    <span style={{ color: 'var(--muted)' }}>{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent receipts */}
      {data.recentReceipts.length > 0 && (
        <>
          <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Son Teslimatlar
          </h2>
          <div className="list" style={{ marginBottom: 24 }}>
            {data.recentReceipts.map((r) => (
              <div key={r.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{r.awardId} · {r.notifType}</span>
                  <br />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{r.token}</span>
                </div>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: r.status === 'delivered' ? 'rgba(77,205,190,0.15)' : r.status === 'failed' ? 'rgba(255,90,90,0.15)' : 'rgba(255,255,255,0.08)',
                  color: r.status === 'delivered' ? '#4dcdbe' : r.status === 'failed' ? '#ff5a5a' : 'var(--muted)',
                }}>
                  {r.status === 'delivered' ? 'Ulaştı' : r.status === 'failed' ? (r.errorDetails ?? 'Hata') : 'Bekliyor'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent notification log */}
      <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Bildirim Günlüğü
      </h2>
      <div className="list">
        {data.recentLog.map((entry) => (
          <div key={entry.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{entry.awardId} — {entry.type}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {entry.sentAt?.seconds ? new Date(entry.sentAt.seconds * 1000).toLocaleString('tr-TR') : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '16px 18px',
    }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--text)', lineHeight: 1 }}>
        {value.toLocaleString()}
        {sub && <span style={{ fontSize: 14, marginLeft: 6, color: 'var(--muted)' }}>{sub}</span>}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Build admin**

```bash
cd admin && npm run build
```

Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add admin/src/lib/api.ts admin/src/pages/StatsPage.tsx
git commit -m "feat: add delivery metrics and receipt table to StatsPage"
```

---

## Task 10: GitHub Actions Workflows

**Files:**
- Create: `.github/workflows/deploy-functions.yml`
- Create: `.github/workflows/eas-build.yml`

- [ ] **Step 1: Create `.github/workflows/` directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `deploy-functions.yml`**

```yaml
name: Deploy Cloud Functions

on:
  push:
    branches: [main]
    paths:
      - 'functions/**'
      - 'firestore.rules'
      - 'firestore.indexes.json'
      - 'firebase.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: functions/package-lock.json

      - name: Install function dependencies
        run: npm ci
        working-directory: functions

      - name: Build TypeScript
        run: npm run build
        working-directory: functions

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions --project notifawards-app
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

- [ ] **Step 3: Create `eas-build.yml`**

```yaml
name: EAS Build & Distribute

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'components/**'
      - 'services/**'
      - 'store/**'
      - 'assets/all/**'
      - 'constants/**'
      - 'types/**'
      - 'app.json'
      - 'package.json'
      - 'eas.json'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build iOS + Android (preview)
        run: eas build --platform all --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Distribute iOS to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID_IOS }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          groups: testers
          releaseNotes: "Auto build from commit ${{ github.sha }}"
          file: ${{ steps.build.outputs.ios-artifact-path }}

      - name: Distribute Android to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID_ANDROID }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          groups: testers
          releaseNotes: "Auto build from commit ${{ github.sha }}"
          file: ${{ steps.build.outputs.android-artifact-path }}
```

- [ ] **Step 4: Add required GitHub Secrets**

Go to GitHub → repository → Settings → Secrets and variables → Actions → New repository secret. Add:

| Secret name | How to get it |
|---|---|
| `FIREBASE_TOKEN` | Run `firebase login:ci` locally, copy the token printed |
| `EXPO_TOKEN` | expo.dev → Account → Access Tokens → Create |
| `FIREBASE_APP_ID_IOS` | Firebase Console → Project Settings → Your Apps → iOS app ID (format: `1:123:ios:abc`) |
| `FIREBASE_APP_ID_ANDROID` | Firebase Console → Project Settings → Your Apps → Android app ID |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project Settings → Service Accounts → Generate new private key → paste full JSON content |

- [ ] **Step 5: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions for auto function deploy and EAS build distribution"
```

---

## Task 11: Deploy & Smoke Test

**Files:** none (deployment only)

- [ ] **Step 1: Deploy updated Cloud Functions**

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

Expected output:
```
✔  functions[checkNotifications(europe-west1)] Successful update operation.
✔  functions[processReceipts(europe-west1)] Successful create operation.
✔  functions[adminStats(europe-west1)] Successful update operation.
```

- [ ] **Step 2: Deploy updated admin panel**

```bash
cd admin && npm run build && cd .. && firebase deploy --only hosting:admin
```

Expected: `✔  Deploy complete!`

- [ ] **Step 3: Set a test `notifSchedule` on one award via admin panel**

1. Open `https://notifawards-app.web.app`, log in with `Last123*`
2. Go to Awards → edit any award
3. Enable "1 gün önce" milestone at hour 10, enable "Son hafta" every 12 hours
4. Save — verify no error toast

- [ ] **Step 4: Verify Firestore has `notifSchedule` on the award**

Open Firebase Console → Firestore → awards → the award you edited → confirm `notifSchedule` field is present and has the correct structure.

- [ ] **Step 5: Verify `processReceipts` deployed**

Firebase Console → Functions → processReceipts should appear. Check logs after 30 minutes for "No pending receipts to process." (expected when no push has been sent yet).

- [ ] **Step 6: Verify GitHub Actions**

Push a trivial change to `functions/` and confirm the `Deploy Cloud Functions` workflow runs green in the GitHub Actions tab.

- [ ] **Step 7: Final commit + push**

```bash
git push origin main
```

Expected: GitHub Actions → Deploy Cloud Functions workflow triggers automatically.
