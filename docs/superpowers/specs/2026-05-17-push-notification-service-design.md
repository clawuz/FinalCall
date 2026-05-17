# Push Notification Service Design

## Goal

Replace the hardcoded, polling-based push notification system with a fully configurable, per-award scheduled push service. Each award gets its own notification schedule defined in the admin panel. Add delivery receipt tracking, invalid token cleanup, and a GitHub Actions CI/CD pipeline for automated deployments.

## Architecture

```
GitHub (main branch)
│
├── deploy-functions.yml   → firebase deploy --only functions  (auto on push)
└── eas-build.yml          → eas build --platform all + Firebase App Distribution

Cloud Functions (europe-west1)
├── checkNotifications     scheduled every 15 min — reads per-award notifSchedule
├── processReceipts        scheduled every 30 min — validates Expo delivery receipts
├── adminAwards            CRUD (updated: handles notifSchedule field)
├── adminArticles          CRUD (unchanged)
├── adminTips              CRUD (unchanged)
├── adminNotifications     manual push (unchanged)
└── adminStats             stats (updated: includes delivery metrics)

Firestore
├── awards/{id}            + notifSchedule field
├── user_prefs/{token}     + openNotif, countdownNotif, lastDayNotif fields
├── notification_log/{key} existing — milestone sent log
└── push_receipts/{id}     new — Expo ticket → receipt tracking

React Native Client
├── services/notifications.ts   simplified — local scheduler REMOVED
├── services/userPrefs.ts       updated — sync all pref toggles to Firestore
└── store/prefsStore.ts         updated — pref setters call Firestore

Admin Panel
├── AwardsPage / AwardForm      + Bildirim Takvimi section
└── StatsPage                   + delivery metrics breakdown
```

---

## Firestore Schema

### `awards/{id}` — new `notifSchedule` field

```typescript
interface NotifSchedule {
  milestones: Array<{
    daysBeforeDeadline: number;  // 30, 14, 7, 3, 1
    sendHour: number;            // 0–23 (Istanbul time)
    enabled: boolean;
  }>;
  lastWeekEnabled: boolean;
  lastWeekIntervalHours: number; // e.g. 12
}
```

Awards without `notifSchedule` receive no automated notifications. Admin must explicitly configure a schedule per award.

### `user_prefs/{token}` — new fields

```typescript
{
  // existing
  mutedAwards: string[];
  allNotifs: boolean;
  quietStart: number;
  quietEnd: number;
  // new
  countdownNotif: boolean;   // milestone notifications (30d, 14d…)
  lastDayNotif: boolean;     // last-week interval notifications
  updatedAt: Timestamp;
}
```

### `notification_log/{key}` — key format

- Milestone: `{awardId}_{N}d_{deadlineDateStr}` e.g. `cannes-lions-2026_7d_20261010`
  — includes the deadline date so postponed deadlines generate new keys automatically
- Last-week bucket: `{awardId}_lastWeek_{bucketIndex}` where `bucketIndex = Math.floor(msUntilDeadline / intervalMs)`

### `push_receipts/{id}` — new collection

```typescript
{
  ticketId: string;       // Expo ticket ID returned after send
  awardId: string;
  notifType: string;      // '7d' | 'lastWeek_3' | 'manual' etc.
  token: string;
  sentAt: Timestamp;
  status: 'pending' | 'delivered' | 'failed';
  errorDetails?: string;  // populated on failure
}
```

---

## Cloud Functions

### `checkNotifications` (updated)

Runs every 15 minutes. Acts as a dispatcher, not a poller.

```
For each active award:
  1. Skip if notifSchedule is missing
  2. Use postponedDeadlineDate if present, else deadlineDate
  3. Skip if deadline has passed

  Milestone check (per milestone in notifSchedule.milestones):
    - milestoneTime = deadline - daysBeforeDeadline * 24h
    - logKey = `{awardId}_{N}d_{deadlineDateStr}` (YYYY-MM-DD of the effective deadline)
    - Fire if: enabled=true AND milestoneTime is within ±30 min of now AND logKey not in notification_log

  Last-week check (if lastWeekEnabled=true AND deadline < 7 days away):
    - bucketIndex = Math.floor(msUntilDeadline / (lastWeekIntervalHours * 3600000))
    - logKey = `{awardId}_lastWeek_{bucketIndex}`
    - Fire if: logKey not in notification_log

  Per user filter:
    - allNotifs must be true
    - token must start with 'ExponentPushToken['
    - award must not be in mutedAwards
    - For milestone: countdownNotif must be true
    - For last-week: lastDayNotif must be true
    - Not in quiet hours

  After sending:
    - Write logKey to notification_log
    - Write one push_receipts doc per Expo ticket ID returned
```

### `processReceipts` (new)

Runs every 30 minutes.

```
1. Query push_receipts where status = 'pending', sentAt > 15 min ago
2. Batch ticket IDs (max 300 per Expo receipt API call)
3. POST to https://exp.host/--/api/v2/push/getReceipts
4. For each receipt:
   - 'ok'  → update push_receipts status = 'delivered'
   - 'error' + details.error = 'DeviceNotRegistered'
             → delete doc at user_prefs/{token}
             → update push_receipts doc: status = 'failed', errorDetails = 'DeviceNotRegistered'
   - 'error' other → update push_receipts doc: status = 'failed', errorDetails = details.error
```

---

## Admin Panel Changes

### AwardForm — "Bildirim Takvimi" section

Added below the existing form fields, above the Save button.

**Milestone rows** (one per standard milestone: 30d, 14d, 7d, 3d, 1d):
- Toggle (enabled/disabled)
- Number input: "Gün" (read-only label, value fixed per row)
- Number input: "Saat" (0–23, only active when enabled)

**Last-week block:**
- Toggle: "Son Hafta Aralıklı Bildirim"
- Number input: "Her ___ saatte bir" (default 12, range 4–48)

Default for new awards: all milestones disabled, lastWeekEnabled false. Admin must opt-in per award.

### StatsPage — delivery metrics (updated)

Adds below existing stat cards:

- **Delivery summary cards:** Total sent (last 30d) / Delivered / Failed / Pending
- **Per-award breakdown table:** award name | sent | delivered | failed | last sent
- **Recent receipts list:** last 50 push_receipts docs (token masked, status badge, sentAt)

`adminStats` Cloud Function updated to query `push_receipts` for these aggregates.

---

## React Native Client Changes

### `services/notifications.ts` (simplified)

**Removed:**
- `scheduleAwardNotifications()`
- `cancelAwardNotifications()`
- `cancelAllNotifications()`
- `SCHEDULE_POINTS`, `LAST_DAY_HOURS`, `shiftOutOfQuiet()`, `isInQuietHours()`

**Kept:**
- `configureNotificationHandler()`
- `registerForPushNotificationsAsync()`

**Added:**
- `setupNotificationTapHandler()` — listens for notification response, extracts `awardId` from `data`, calls `router.push('/award/' + awardId)`

### `services/userPrefs.ts` (updated)

`updateUserNotifSettings()` now accepts and syncs `countdownNotif` and `lastDayNotif`:

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
): Promise<void>
```

### `store/prefsStore.ts` (updated)

`setCountdownNotif` and `setLastDayNotif` now call `updateUserNotifSettings()` (previously local-only).

---

## GitHub Actions

### `.github/workflows/deploy-functions.yml`

```yaml
name: Deploy Cloud Functions
on:
  push:
    branches: [main]
    paths:
      - 'functions/**'
      - 'firestore.rules'
      - 'firestore.indexes.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
        working-directory: functions
      - run: npm run build
        working-directory: functions
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_ID: notifawards-app
```

### `.github/workflows/eas-build.yml`

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
      - 'assets/**'
      - 'app.json'
      - 'package.json'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      - name: Distribute to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID_IOS }}
          token: ${{ secrets.FIREBASE_TOKEN }}
          groups: testers
          file: # path to .ipa from EAS artifact
```

**Required GitHub Secrets:**
- `FIREBASE_TOKEN` — `firebase login:ci` ile üretilir
- `EXPO_TOKEN` — expo.dev → Access Tokens
- `FIREBASE_APP_ID_IOS` — Firebase Console → App settings
- `FIREBASE_APP_ID_ANDROID` — Firebase Console → App settings

---

## Error Handling

| Scenario | Handling |
|---|---|
| Award has no `notifSchedule` | Skip silently in checkNotifications |
| Expo push batch fails | Log error, continue with next batch, do not write to notification_log |
| Receipt API unavailable | Leave push_receipts as 'pending', retry next 30-min run |
| Token not found in user_prefs on delete | Ignore (already cleaned) |
| postponedDeadlineDate set after some milestones already sent | Old log keys include the old date string; new deadline date = new keys, so all milestones re-fire for the postponed deadline |

---

## What Is Not In Scope

- FCM migration (Expo Push API is sufficient)
- Local notification fallback (removed entirely — server is single source)
- Per-user custom schedule (admin sets per-award, users control mute + quiet hours)
- Analytics beyond delivery tracking (open rate requires deep link tracking, Phase 2)
