# Final Call Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based admin panel (Vite + React) on Firebase Hosting for managing awards, articles, tips, and manual push notifications.

**Architecture:** React SPA inside `admin/` folder in the existing repo, served from Firebase Hosting. All writes go through new Cloud Function HTTP endpoints (password-protected) using the Admin SDK — Firestore write rules stay `false` for clients. The existing `checkNotifications` scheduled function is untouched.

**Tech Stack:** Vite 5, React 18, React Router v6, TypeScript, Firebase Functions v2 (onRequest), Firebase Hosting, Expo Push API (for manual notifications).

---

## File Map

**New files — Cloud Functions:**
- `functions/src/adminAwards.ts` — CRUD HTTP endpoints for awards
- `functions/src/adminArticles.ts` — CRUD HTTP endpoints for articles
- `functions/src/adminTips.ts` — CRUD HTTP endpoints for tips
- `functions/src/adminNotifications.ts` — manual push sender endpoint
- `functions/src/adminStats.ts` — read-only stats endpoint

**Modified — Cloud Functions:**
- `functions/src/index.ts` — export new endpoints

**Modified — Firebase config:**
- `firebase.json` — add hosting targets for admin

**New files — Admin SPA:**
- `admin/package.json`
- `admin/tsconfig.json`
- `admin/vite.config.ts`
- `admin/index.html`
- `admin/src/main.tsx`
- `admin/src/App.tsx`
- `admin/src/admin.css`
- `admin/src/lib/auth.ts`
- `admin/src/lib/api.ts`
- `admin/src/components/TopNav.tsx`
- `admin/src/components/Modal.tsx`
- `admin/src/components/Toast.tsx`
- `admin/src/pages/LoginPage.tsx`
- `admin/src/pages/AwardsPage.tsx`
- `admin/src/components/AwardForm.tsx`
- `admin/src/components/PreviousWinnersEditor.tsx`
- `admin/src/pages/ArticlesPage.tsx`
- `admin/src/components/ArticleForm.tsx`
- `admin/src/pages/TipsPage.tsx`
- `admin/src/components/TipForm.tsx`
- `admin/src/pages/NotificationsPage.tsx`
- `admin/src/pages/StatsPage.tsx`
- `admin/.env.example`

---

## Task 1: Update Firebase Config & Functions Index

**Files:**
- Modify: `firebase.json`
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Update firebase.json with hosting targets**

Replace the contents of `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ]
    }
  ],
  "hosting": [
    {
      "target": "admin",
      "public": "admin/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

- [ ] **Step 2: Update functions/src/index.ts to export new endpoints**

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

export { checkNotifications } from './checkNotifications';
export { adminAwards } from './adminAwards';
export { adminArticles } from './adminArticles';
export { adminTips } from './adminTips';
export { adminNotifications } from './adminNotifications';
export { adminStats } from './adminStats';
```

- [ ] **Step 3: Commit**

```bash
git add firebase.json functions/src/index.ts
git commit -m "chore: add hosting target and function exports for admin panel"
```

---

## Task 2: Cloud Function — adminAwards

**Files:**
- Create: `functions/src/adminAwards.ts`

- [ ] **Step 1: Create functions/src/adminAwards.ts**

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminAwards = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    if (!checkAuth(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.path.replace(/^\//, '');

    try {
      if (req.method === 'GET') {
        const snap = await db.collection('awards').orderBy('deadlineDate', 'asc').get();
        const awards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json(awards);
        return;
      }

      if (req.method === 'POST') {
        const data = req.body as Record<string, unknown>;
        if (!data.name || !data.deadlineDate) {
          res.status(400).json({ error: 'name and deadlineDate are required' });
          return;
        }
        const ref = await db.collection('awards').add({
          ...data,
          deadlineDate: admin.firestore.Timestamp.fromDate(new Date(data.deadlineDate as string)),
          postponedDeadlineDate: data.postponedDeadlineDate
            ? admin.firestore.Timestamp.fromDate(new Date(data.postponedDeadlineDate as string))
            : null,
          applicationOpenDate: data.applicationOpenDate
            ? admin.firestore.Timestamp.fromDate(new Date(data.applicationOpenDate as string))
            : null,
        });
        res.json({ id: ref.id });
        return;
      }

      if (req.method === 'PUT') {
        if (!id) { res.status(400).json({ error: 'id required' }); return; }
        const data = req.body as Record<string, unknown>;
        const update: Record<string, unknown> = { ...data };
        if (data.deadlineDate) {
          update.deadlineDate = admin.firestore.Timestamp.fromDate(new Date(data.deadlineDate as string));
        }
        if (data.postponedDeadlineDate) {
          update.postponedDeadlineDate = admin.firestore.Timestamp.fromDate(new Date(data.postponedDeadlineDate as string));
        } else {
          update.postponedDeadlineDate = null;
        }
        if (data.applicationOpenDate) {
          update.applicationOpenDate = admin.firestore.Timestamp.fromDate(new Date(data.applicationOpenDate as string));
        } else {
          update.applicationOpenDate = null;
        }
        await db.collection('awards').doc(id).set(update, { merge: true });
        res.json({ ok: true });
        return;
      }

      if (req.method === 'DELETE') {
        if (!id) { res.status(400).json({ error: 'id required' }); return; }
        await db.collection('awards').doc(id).delete();
        res.json({ ok: true });
        return;
      }

      res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);
```

- [ ] **Step 2: Build functions to verify no TypeScript errors**

```bash
cd functions && npm run build 2>&1
```

Expected: no errors, `lib/` files created.

- [ ] **Step 3: Commit**

```bash
git add functions/src/adminAwards.ts
git commit -m "feat: add adminAwards Cloud Function endpoint"
```

---

## Task 3: Cloud Function — adminArticles

**Files:**
- Create: `functions/src/adminArticles.ts`

- [ ] **Step 1: Create functions/src/adminArticles.ts**

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminArticles = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    if (!checkAuth(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.path.replace(/^\//, '');

    try {
      if (req.method === 'GET') {
        const snap = await db.collection('articles').orderBy('publishedAt', 'desc').get();
        res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        return;
      }

      if (req.method === 'POST') {
        const data = req.body as Record<string, unknown>;
        if (!data.title || !data.summary || !data.source || !data.url) {
          res.status(400).json({ error: 'title, summary, source and url are required' });
          return;
        }
        const ref = await db.collection('articles').add({
          ...data,
          publishedAt: data.publishedAt
            ? admin.firestore.Timestamp.fromDate(new Date(data.publishedAt as string))
            : admin.firestore.Timestamp.now(),
          isPublished: data.isPublished ?? false,
        });
        res.json({ id: ref.id });
        return;
      }

      if (req.method === 'PUT') {
        if (!id) { res.status(400).json({ error: 'id required' }); return; }
        const data = req.body as Record<string, unknown>;
        const update = { ...data } as Record<string, unknown>;
        if (data.publishedAt) {
          update.publishedAt = admin.firestore.Timestamp.fromDate(new Date(data.publishedAt as string));
        }
        await db.collection('articles').doc(id).set(update, { merge: true });
        res.json({ ok: true });
        return;
      }

      if (req.method === 'DELETE') {
        if (!id) { res.status(400).json({ error: 'id required' }); return; }
        await db.collection('articles').doc(id).delete();
        res.json({ ok: true });
        return;
      }

      res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);
```

- [ ] **Step 2: Create functions/src/adminTips.ts**

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminTips = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    if (!checkAuth(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = req.path.replace(/^\//, '');

    try {
      if (req.method === 'GET') {
        const snap = await db.collection('tips').orderBy('createdAt', 'desc').get();
        res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        return;
      }

      if (req.method === 'POST') {
        const data = req.body as Record<string, unknown>;
        if (!data.title || !data.body) {
          res.status(400).json({ error: 'title and body are required' });
          return;
        }
        const ref = await db.collection('tips').add({
          ...data,
          isPublished: data.isPublished ?? false,
          createdAt: admin.firestore.Timestamp.now(),
        });
        res.json({ id: ref.id });
        return;
      }

      if (req.method === 'PUT') {
        if (!id) { res.status(400).json({ error: 'id required' }); return; }
        await db.collection('tips').doc(id).set(req.body, { merge: true });
        res.json({ ok: true });
        return;
      }

      if (req.method === 'DELETE') {
        if (!id) { res.status(400).json({ error: 'id required' }); return; }
        await db.collection('tips').doc(id).delete();
        res.json({ ok: true });
        return;
      }

      res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);
```

- [ ] **Step 3: Create functions/src/adminNotifications.ts**

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminNotifications = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    if (!checkAuth(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { title, body, target, targetAwardId } = req.body as {
      title: string;
      body: string;
      target: 'all' | 'award';
      targetAwardId?: string;
    };

    if (!title || !body || !target) {
      res.status(400).json({ error: 'title, body and target are required' });
      return;
    }
    if (target === 'award' && !targetAwardId) {
      res.status(400).json({ error: 'targetAwardId required when target is award' });
      return;
    }

    try {
      const prefsSnap = await db.collection('user_prefs').get();
      const tokens = prefsSnap.docs
        .map((d) => ({
          token: d.id,
          mutedAwards: (d.data().mutedAwards as string[]) ?? [],
          allNotifs: (d.data().allNotifs as boolean) ?? true,
        }))
        .filter((t) => {
          if (!t.allNotifs) return false;
          if (!t.token.startsWith('ExponentPushToken[')) return false;
          if (target === 'award' && targetAwardId) {
            return !t.mutedAwards.includes(targetAwardId);
          }
          return true;
        })
        .map((t) => t.token);

      if (tokens.length === 0) {
        res.json({ sent: 0 });
        return;
      }

      const messages = tokens.map((to) => ({ to, title, body, sound: 'default' as const }));

      let sent = 0;
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100);
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
        const result = (await response.json()) as { data: Array<{ status: string }> };
        sent += result.data.filter((r) => r.status === 'ok').length;
      }

      res.json({ sent, total: tokens.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);
```

- [ ] **Step 4: Create functions/src/adminStats.ts**

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
      const [prefsSnap, logSnap] = await Promise.all([
        db.collection('user_prefs').get(),
        db.collection('notification_log').orderBy('sentAt', 'desc').limit(20).get(),
      ]);

      const prefs = prefsSnap.docs.map((d) => d.data());
      const totalDevices = prefs.length;
      const notifEnabled = prefs.filter((p) => p.allNotifs !== false).length;

      const recentLogs = logSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      res.json({ totalDevices, notifEnabled, recentLogs });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);
```

- [ ] **Step 5: Build functions to verify**

```bash
cd functions && npm run build 2>&1
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add functions/src/adminArticles.ts functions/src/adminTips.ts functions/src/adminNotifications.ts functions/src/adminStats.ts
git commit -m "feat: add admin Cloud Function endpoints (articles, tips, notifications, stats)"
```

---

## Task 4: Admin Vite Project Scaffold

**Files:**
- Create: `admin/package.json`
- Create: `admin/tsconfig.json`
- Create: `admin/vite.config.ts`
- Create: `admin/index.html`
- Create: `admin/.env.example`

- [ ] **Step 1: Create admin/package.json**

```json
{
  "name": "final-call-admin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create admin/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
});
```

- [ ] **Step 4: Create admin/index.html**

```html
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Final Call Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create admin/.env.example**

```
VITE_ADMIN_PASSWORD=your-admin-password-here
VITE_FUNCTIONS_BASE_URL=https://europe-west1-notifawards-app.cloudfunctions.net
```

- [ ] **Step 6: Install dependencies**

```bash
cd admin && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit**

```bash
git add admin/package.json admin/tsconfig.json admin/vite.config.ts admin/index.html admin/.env.example
git commit -m "feat: scaffold admin Vite project"
```

---

## Task 5: Auth, API Client, and Global CSS

**Files:**
- Create: `admin/src/lib/auth.ts`
- Create: `admin/src/lib/api.ts`
- Create: `admin/src/admin.css`

- [ ] **Step 1: Create admin/src/lib/auth.ts**

```typescript
const SESSION_KEY = 'fc_admin_auth';

export function login(password: string): boolean {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD as string;
  if (password !== expected) return false;
  sessionStorage.setItem(SESSION_KEY, '1');
  return true;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
```

- [ ] **Step 2: Create admin/src/lib/api.ts**

```typescript
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
export const getStats = () =>
  request<{ totalDevices: number; notifEnabled: number; recentLogs: unknown[] }>('adminStats');

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
```

- [ ] **Step 3: Create admin/src/admin.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #07070c;
  --surface: #12121f;
  --surface2: #1a1a2e;
  --border: #2a2a4a;
  --violet: #7c3aed;
  --violet-light: #a78bfa;
  --text: #e2e2f0;
  --text-muted: #888899;
  --green: #4ade80;
  --red: #f87171;
  --amber: #fbbf24;
  --radius: 8px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  transition: opacity 0.15s;
}
button:hover { opacity: 0.85; }
button:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: var(--violet); color: #fff; }
.btn-danger  { background: transparent; color: var(--red); border: 1px solid var(--red); }
.btn-ghost   { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }

input, textarea, select {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 13px;
  padding: 8px 10px;
  width: 100%;
  outline: none;
}
input:focus, textarea:focus, select:focus { border-color: var(--violet); }
textarea { resize: vertical; min-height: 80px; }

label { color: var(--text-muted); font-size: 12px; margin-bottom: 4px; display: block; }

.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }

.badge-active  { background: #1a2e1a; color: var(--green); border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.badge-passive { background: #2e1a1a; color: var(--red);   border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.badge-pub     { background: #1a2e1a; color: var(--green); border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.badge-draft   { background: #2e2a1a; color: var(--amber); border-radius: 4px; padding: 2px 8px; font-size: 11px; }

.page { padding: 24px; max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h1 { font-size: 20px; font-weight: 600; }

.list { display: flex; flex-direction: column; gap: 8px; }
.list-row {
  background: var(--surface2);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.list-row-name { flex: 1; font-weight: 500; }
.list-row-meta { color: var(--text-muted); font-size: 12px; }
.list-row-actions { display: flex; gap: 8px; }

.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.filter-btn { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 5px 12px; }
.filter-btn.active { border-color: var(--violet); color: var(--violet-light); }

.empty { color: var(--text-muted); text-align: center; padding: 48px; }

.color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/lib/auth.ts admin/src/lib/api.ts admin/src/admin.css
git commit -m "feat: add auth, api client, and global CSS for admin"
```

---

## Task 6: App Shell — main.tsx, App.tsx, TopNav, Modal, Toast

**Files:**
- Create: `admin/src/main.tsx`
- Create: `admin/src/App.tsx`
- Create: `admin/src/components/TopNav.tsx`
- Create: `admin/src/components/Modal.tsx`
- Create: `admin/src/components/Toast.tsx`

- [ ] **Step 1: Create admin/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './admin.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 2: Create admin/src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './lib/auth';
import LoginPage from './pages/LoginPage';
import AwardsPage from './pages/AwardsPage';
import ArticlesPage from './pages/ArticlesPage';
import TipsPage from './pages/TipsPage';
import NotificationsPage from './pages/NotificationsPage';
import StatsPage from './pages/StatsPage';
import TopNav from './components/TopNav';

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <>
              <TopNav />
              <Routes>
                <Route path="/" element={<Navigate to="/awards" replace />} />
                <Route path="/awards" element={<AwardsPage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/tips" element={<TipsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/stats" element={<StatsPage />} />
              </Routes>
            </>
          </AuthGuard>
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 3: Create admin/src/components/TopNav.tsx**

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../lib/auth';

const links = [
  { to: '/awards',        label: '🏆 Ödüller' },
  { to: '/articles',      label: '📰 Haberler' },
  { to: '/tips',          label: '💡 İpuçları' },
  { to: '/notifications', label: '🔔 Bildirim Gönder' },
  { to: '/stats',         label: '📊 İstatistik' },
];

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <nav style={{
      background: '#12121f',
      borderBottom: '1px solid #2a2a4a',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      height: 48,
    }}>
      <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, marginRight: 16 }}>⚡ FINAL CALL</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            color: isActive ? '#fff' : '#888899',
            background: isActive ? '#7c3aed' : 'transparent',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 13,
            textDecoration: 'none',
            fontWeight: isActive ? 600 : 400,
          })}
        >
          {l.label}
        </NavLink>
      ))}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        style={{ marginLeft: 'auto', background: 'transparent', color: '#f87171', border: 'none', fontSize: 13 }}
      >
        Çıkış
      </button>
    </nav>
  );
}
```

- [ ] **Step 4: Create admin/src/components/Modal.tsx**

```tsx
interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000, padding: '40px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#12121f', borderRadius: 12, padding: 24,
        width: '100%', maxWidth: wide ? 760 : 540,
        border: '1px solid #2a2a4a',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', color: '#888', fontSize: 18, padding: 0 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create admin/src/components/Toast.tsx**

```tsx
import { useEffect } from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
  onDone: () => void;
}

export default function Toast({ message, type, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: type === 'success' ? '#1a2e1a' : '#2e1a1a',
      border: `1px solid ${type === 'success' ? '#4ade80' : '#f87171'}`,
      color: type === 'success' ? '#4ade80' : '#f87171',
      borderRadius: 8, padding: '10px 18px', fontWeight: 500, fontSize: 13,
    }}>
      {message}
    </div>
  );
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd admin && npm run dev 2>&1 &
sleep 3 && curl -s http://localhost:5173 | head -5
```

Expected: HTML with `<div id="root">`.

- [ ] **Step 7: Commit**

```bash
git add admin/src/main.tsx admin/src/App.tsx admin/src/components/TopNav.tsx admin/src/components/Modal.tsx admin/src/components/Toast.tsx
git commit -m "feat: add admin app shell, routing, TopNav, Modal, Toast"
```

---

## Task 7: Login Page

**Files:**
- Create: `admin/src/pages/LoginPage.tsx`

- [ ] **Step 1: Create admin/src/pages/LoginPage.tsx**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/auth';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(password)) {
      navigate('/awards', { replace: true });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPassword('');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#07070c',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#12121f', border: '1px solid #2a2a4a',
          borderRadius: 12, padding: 40, width: 340,
          animation: shake ? 'shake 0.4s ease' : undefined,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>Final Call Admin</h1>
        </div>
        <div className="field">
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin şifresi"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }}>
          Giriş Yap
        </button>
      </form>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173/login`. You should see a centered dark login form with ⚡ icon. Enter a wrong password — form should shake. Enter the correct password (from `.env`) — should redirect to `/awards`.

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/LoginPage.tsx
git commit -m "feat: add admin login page with shake animation"
```

---

## Task 8: Awards Page

**Files:**
- Create: `admin/src/pages/AwardsPage.tsx`
- Create: `admin/src/components/AwardForm.tsx`
- Create: `admin/src/components/PreviousWinnersEditor.tsx`

- [ ] **Step 1: Create admin/src/components/PreviousWinnersEditor.tsx**

```tsx
interface Case { title: string; description: string; videoUrl?: string; }
interface PreviousWinners { title: string; description: string; cases: Case[]; }

interface Props {
  value?: PreviousWinners;
  onChange: (v: PreviousWinners | undefined) => void;
}

const emptyCase = (): Case => ({ title: '', description: '', videoUrl: '' });

export default function PreviousWinnersEditor({ value, onChange }: Props) {
  const enabled = !!value;

  function toggle() {
    if (enabled) {
      onChange(undefined);
    } else {
      onChange({ title: '', description: '', cases: [emptyCase()] });
    }
  }

  function updateField(field: 'title' | 'description', v: string) {
    if (!value) return;
    onChange({ ...value, [field]: v });
  }

  function updateCase(i: number, field: keyof Case, v: string) {
    if (!value) return;
    const cases = [...value.cases];
    cases[i] = { ...cases[i], [field]: v };
    onChange({ ...value, cases });
  }

  function addCase() {
    if (!value || value.cases.length >= 10) return;
    onChange({ ...value, cases: [...value.cases, emptyCase()] });
  }

  function removeCase(i: number) {
    if (!value) return;
    onChange({ ...value, cases: value.cases.filter((_, j) => j !== i) });
  }

  return (
    <div style={{ border: '1px solid #2a2a4a', borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: enabled ? 16 : 0 }}>
        <span style={{ fontWeight: 500, color: '#a78bfa', fontSize: 13 }}>🏆 Geçen Yıl Kazananları</span>
        <button type="button" className={enabled ? 'btn-danger' : 'btn-ghost'} onClick={toggle} style={{ padding: '4px 10px', fontSize: 12 }}>
          {enabled ? 'Kaldır' : '+ Ekle'}
        </button>
      </div>

      {enabled && value && (
        <>
          <div className="field">
            <label>Bölüm Başlığı</label>
            <input value={value.title} onChange={(e) => updateField('title', e.target.value)} placeholder="2024 Grand Prix & Gold Winners" />
          </div>
          <div className="field">
            <label>Açıklama</label>
            <textarea value={value.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Kısa tanıtım..." rows={2} />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Case'ler ({value.cases.length}/10)</span>
              {value.cases.length < 10 && (
                <button type="button" className="btn-ghost" onClick={addCase} style={{ padding: '3px 8px', fontSize: 11 }}>+ Case Ekle</button>
              )}
            </div>
            {value.cases.map((c, i) => (
              <div key={i} style={{ background: '#0a0a14', borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#666' }}>Case {i + 1}</span>
                  <button type="button" onClick={() => removeCase(i)} style={{ background: 'transparent', color: '#f87171', fontSize: 11, padding: 0 }}>Sil</button>
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <input value={c.title} onChange={(e) => updateCase(i, 'title', e.target.value)} placeholder="The Last Photo — Dove" />
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <textarea value={c.description} onChange={(e) => updateCase(i, 'description', e.target.value)} placeholder="1-2 cümle açıklama..." rows={2} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input value={c.videoUrl ?? ''} onChange={(e) => updateCase(i, 'videoUrl', e.target.value)} placeholder="YouTube/Vimeo URL (opsiyonel)" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create admin/src/components/AwardForm.tsx**

```tsx
import { useState } from 'react';
import { Award } from '../lib/api';
import PreviousWinnersEditor from './PreviousWinnersEditor';

const COLOR_OPTIONS = [
  { value: 'amber',  hex: '#f59e0b' },
  { value: 'violet', hex: '#8b5cf6' },
  { value: 'teal',   hex: '#14b8a6' },
  { value: 'red',    hex: '#ef4444' },
  { value: 'gold',   hex: '#eab308' },
  { value: 'blue',   hex: '#3b82f6' },
];

function tsToInput(ts: string | undefined): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toISOString().slice(0, 16);
  } catch { return ''; }
}

interface Props {
  initial?: Partial<Award>;
  onSave: (data: Partial<Award>) => Promise<void>;
  onCancel: () => void;
}

export default function AwardForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Award>>({
    name: '',
    color: 'amber',
    deadlineDate: '',
    isActive: true,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  function set(field: keyof Award, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.deadlineDate) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Ödül Adı *</label>
          <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="D&AD Pencil Awards" required />
        </div>

        <div className="field">
          <label>Son Başvuru Tarihi *</label>
          <input type="datetime-local" value={tsToInput(form.deadlineDate)} onChange={(e) => set('deadlineDate', e.target.value)} required />
        </div>

        <div className="field">
          <label>Erteleme Tarihi (opsiyonel)</label>
          <input type="datetime-local" value={tsToInput(form.postponedDeadlineDate)} onChange={(e) => set('postponedDeadlineDate', e.target.value || undefined)} />
        </div>

        <div className="field">
          <label>Başvuru Açılış Tarihi (opsiyonel)</label>
          <input type="datetime-local" value={tsToInput(form.applicationOpenDate)} onChange={(e) => set('applicationOpenDate', e.target.value || undefined)} />
        </div>

        <div className="field">
          <label>Renk</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {COLOR_OPTIONS.map((c) => (
              <div
                key={c.value}
                onClick={() => set('color', c.value)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c.hex,
                  cursor: 'pointer', outline: form.color === c.value ? `3px solid #fff` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Açıklama</label>
          <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
        </div>

        <div className="field">
          <label>Website URL</label>
          <input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label>Başvuru Ücreti</label>
          <input value={form.entryFee ?? ''} onChange={(e) => set('entryFee', e.target.value)} placeholder="€350 / entry" />
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Kategoriler (virgülle ayır)</label>
          <input
            value={(form.categories ?? []).join(', ')}
            onChange={(e) => set('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Film, Print, Digital"
          />
        </div>
      </div>

      <PreviousWinnersEditor value={form.previousWinners} onChange={(v) => set('previousWinners', v)} />

      <div className="field">
        <label>
          <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => set('isActive', e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
          Aktif
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create admin/src/pages/AwardsPage.tsx**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { getAwards, createAward, updateAward, deleteAward, Award } from '../lib/api';
import Modal from '../components/Modal';
import AwardForm from '../components/AwardForm';
import Toast from '../components/Toast';

const COLOR_HEX: Record<string, string> = {
  amber: '#f59e0b', violet: '#8b5cf6', teal: '#14b8a6',
  red: '#ef4444', gold: '#eab308', blue: '#3b82f6',
};

type Filter = 'all' | 'active' | 'passive';
type Toast = { message: string; type: 'success' | 'error' } | null;

export default function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [modal, setModal] = useState<'add' | Award | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmDelete, setConfirmDelete] = useState<Award | null>(null);

  const load = useCallback(async () => {
    try { setAwards(await getAwards()); } catch { setToast({ message: 'Yükleme hatası', type: 'error' }); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = awards.filter((a) =>
    filter === 'all' ? true : filter === 'active' ? a.isActive : !a.isActive
  );

  async function handleSave(data: Partial<Award>) {
    try {
      if (modal === 'add') {
        await createAward(data);
        setToast({ message: 'Ödül eklendi', type: 'success' });
      } else if (modal && typeof modal === 'object') {
        await updateAward(modal.id, data);
        setToast({ message: 'Ödül güncellendi', type: 'success' });
      }
      setModal(null);
      load();
    } catch (e) {
      setToast({ message: String(e), type: 'error' });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteAward(confirmDelete.id);
      setToast({ message: 'Ödül silindi', type: 'success' });
      setConfirmDelete(null);
      load();
    } catch (e) {
      setToast({ message: String(e), type: 'error' });
    }
  }

  function formatDate(ts: string | undefined) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return ts; }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Ödüller</h1>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Yeni Ödül</button>
      </div>

      <div className="filter-bar">
        {(['all', 'active', 'passive'] as Filter[]).map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}
          </button>
        ))}
      </div>

      <div className="list">
        {visible.length === 0 && <div className="empty">Ödül yok</div>}
        {visible.map((a) => (
          <div key={a.id} className="list-row">
            <div className="color-dot" style={{ background: COLOR_HEX[a.color] ?? '#888' }} />
            <span className="list-row-name">{a.name}</span>
            {a.postponedDeadlineDate && (
              <span style={{ color: '#fbbf24', fontSize: 11 }}>⚠ Ertelendi: {formatDate(a.postponedDeadlineDate)}</span>
            )}
            <span className="list-row-meta">{formatDate(a.deadlineDate)}</span>
            <span className={a.isActive ? 'badge-active' : 'badge-passive'}>{a.isActive ? 'Aktif' : 'Pasif'}</span>
            <div className="list-row-actions">
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(a)}>Düzenle</button>
              <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(a)}>Sil</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Yeni Ödül' : 'Ödülü Düzenle'} onClose={() => setModal(null)} wide>
          <AwardForm
            initial={modal === 'add' ? undefined : modal}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Ödülü Sil" onClose={() => setConfirmDelete(null)}>
          <p style={{ marginBottom: 20, color: '#e2e2f0' }}>
            <strong>{confirmDelete.name}</strong> silinecek. Emin misin?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            <button className="btn-danger" onClick={handleDelete}>Sil</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/pages/AwardsPage.tsx admin/src/components/AwardForm.tsx admin/src/components/PreviousWinnersEditor.tsx
git commit -m "feat: add awards page with full CRUD and previous winners editor"
```

---

## Task 9: Articles & Tips Pages

**Files:**
- Create: `admin/src/pages/ArticlesPage.tsx`
- Create: `admin/src/components/ArticleForm.tsx`
- Create: `admin/src/pages/TipsPage.tsx`
- Create: `admin/src/components/TipForm.tsx`

- [ ] **Step 1: Create admin/src/components/ArticleForm.tsx**

```tsx
import { useState } from 'react';
import { Article } from '../lib/api';

const TAG_OPTIONS = ['global', 'local', 'cannes', 'effie', 'd&ad', 'felis', 'digital', 'pr'];

interface Props {
  initial?: Partial<Article>;
  onSave: (data: Partial<Article>) => Promise<void>;
  onCancel: () => void;
}

function tsToInput(ts: string | undefined): string {
  if (!ts) return '';
  try { return new Date(ts).toISOString().slice(0, 16); } catch { return ''; }
}

export default function ArticleForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Article>>({
    title: '', summary: '', source: '', url: '', imageUrl: '',
    publishedAt: new Date().toISOString(), tags: [], isPublished: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  function set(field: keyof Article, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(tag: string) {
    const tags = form.tags ?? [];
    set('tags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.summary || !form.source || !form.url) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Başlık *</label>
        <input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} required />
      </div>
      <div className="field">
        <label>Özet *</label>
        <textarea value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} rows={3} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Kaynak *</label>
          <input value={form.source ?? ''} onChange={(e) => set('source', e.target.value)} placeholder="Campaign, Adweek..." required />
        </div>
        <div className="field">
          <label>URL *</label>
          <input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://..." required />
        </div>
        <div className="field">
          <label>Görsel URL (opsiyonel)</label>
          <input value={form.imageUrl ?? ''} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Yayın Tarihi</label>
          <input type="datetime-local" value={tsToInput(form.publishedAt)} onChange={(e) => set('publishedAt', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Etiketler</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag} type="button"
              onClick={() => toggleTag(tag)}
              style={{
                padding: '3px 10px', fontSize: 11, borderRadius: 4,
                background: (form.tags ?? []).includes(tag) ? '#7c3aed' : 'transparent',
                border: '1px solid #2a2a4a',
                color: (form.tags ?? []).includes(tag) ? '#fff' : '#888',
              }}
            >{tag}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.isPublished ?? false} onChange={(e) => set('isPublished', e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
          Yayınla
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create admin/src/pages/ArticlesPage.tsx**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { getArticles, createArticle, updateArticle, deleteArticle, Article } from '../lib/api';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import Toast from '../components/Toast';

type Filter = 'all' | 'published' | 'draft';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [modal, setModal] = useState<'add' | Article | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  const load = useCallback(async () => {
    try { setArticles(await getArticles()); } catch { setToast({ message: 'Yükleme hatası', type: 'error' }); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = articles.filter((a) =>
    filter === 'all' ? true : filter === 'published' ? a.isPublished : !a.isPublished
  );

  async function handleSave(data: Partial<Article>) {
    try {
      if (modal === 'add') { await createArticle(data); setToast({ message: 'Haber eklendi', type: 'success' }); }
      else if (modal && typeof modal === 'object') { await updateArticle(modal.id, data); setToast({ message: 'Haber güncellendi', type: 'success' }); }
      setModal(null); load();
    } catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try { await deleteArticle(confirmDelete.id); setToast({ message: 'Haber silindi', type: 'success' }); setConfirmDelete(null); load(); }
    catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Haberler</h1>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Yeni Haber</button>
      </div>
      <div className="filter-bar">
        {(['all', 'published', 'draft'] as Filter[]).map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tümü' : f === 'published' ? 'Yayında' : 'Taslak'}
          </button>
        ))}
      </div>
      <div className="list">
        {visible.length === 0 && <div className="empty">Haber yok</div>}
        {visible.map((a) => (
          <div key={a.id} className="list-row">
            <span className="list-row-name">{a.title}</span>
            <span className="list-row-meta">{a.source}</span>
            <span className={a.isPublished ? 'badge-pub' : 'badge-draft'}>{a.isPublished ? 'Yayında' : 'Taslak'}</span>
            <div className="list-row-actions">
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(a)}>Düzenle</button>
              <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(a)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Yeni Haber' : 'Haberi Düzenle'} onClose={() => setModal(null)} wide>
          <ArticleForm initial={modal === 'add' ? undefined : modal} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Haberi Sil" onClose={() => setConfirmDelete(null)}>
          <p style={{ marginBottom: 20 }}><strong>{confirmDelete.title}</strong> silinecek. Emin misin?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            <button className="btn-danger" onClick={handleDelete}>Sil</button>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 3: Create admin/src/components/TipForm.tsx**

```tsx
import { useState } from 'react';
import { Tip } from '../lib/api';

const CATEGORIES = ['başvuru', 'strateji', 'sunum', 'yaratıcılık', 'bütçe'];

interface Props {
  initial?: Partial<Tip>;
  onSave: (data: Partial<Tip>) => Promise<void>;
  onCancel: () => void;
}

export default function TipForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Tip>>({ title: '', body: '', category: '', isPublished: false, ...initial });
  const [saving, setSaving] = useState(false);

  function set(field: keyof Tip, value: unknown) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Başlık *</label>
        <input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} required />
      </div>
      <div className="field">
        <label>İçerik *</label>
        <textarea value={form.body ?? ''} onChange={(e) => set('body', e.target.value)} rows={4} required />
      </div>
      <div className="field">
        <label>Kategori</label>
        <select value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}>
          <option value="">— Seç —</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.isPublished ?? false} onChange={(e) => set('isPublished', e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
          Yayınla
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create admin/src/pages/TipsPage.tsx**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { getTips, createTip, updateTip, deleteTip, Tip } from '../lib/api';
import Modal from '../components/Modal';
import TipForm from '../components/TipForm';
import Toast from '../components/Toast';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [modal, setModal] = useState<'add' | Tip | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tip | null>(null);

  const load = useCallback(async () => {
    try { setTips(await getTips()); } catch { setToast({ message: 'Yükleme hatası', type: 'error' }); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data: Partial<Tip>) {
    try {
      if (modal === 'add') { await createTip(data); setToast({ message: 'İpucu eklendi', type: 'success' }); }
      else if (modal && typeof modal === 'object') { await updateTip(modal.id, data); setToast({ message: 'İpucu güncellendi', type: 'success' }); }
      setModal(null); load();
    } catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try { await deleteTip(confirmDelete.id); setToast({ message: 'İpucu silindi', type: 'success' }); setConfirmDelete(null); load(); }
    catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>İpuçları</h1>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Yeni İpucu</button>
      </div>
      <div className="list">
        {tips.length === 0 && <div className="empty">İpucu yok</div>}
        {tips.map((t) => (
          <div key={t.id} className="list-row">
            <span className="list-row-name">{t.title}</span>
            {t.category && <span className="list-row-meta">{t.category}</span>}
            <span className={t.isPublished ? 'badge-pub' : 'badge-draft'}>{t.isPublished ? 'Yayında' : 'Gizli'}</span>
            <div className="list-row-actions">
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(t)}>Düzenle</button>
              <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(t)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Yeni İpucu' : 'İpucu Düzenle'} onClose={() => setModal(null)}>
          <TipForm initial={modal === 'add' ? undefined : modal} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="İpucu Sil" onClose={() => setConfirmDelete(null)}>
          <p style={{ marginBottom: 20 }}><strong>{confirmDelete.title}</strong> silinecek. Emin misin?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            <button className="btn-danger" onClick={handleDelete}>Sil</button>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add admin/src/pages/ArticlesPage.tsx admin/src/components/ArticleForm.tsx admin/src/pages/TipsPage.tsx admin/src/components/TipForm.tsx
git commit -m "feat: add articles and tips pages with full CRUD"
```

---

## Task 10: Notifications & Stats Pages

**Files:**
- Create: `admin/src/pages/NotificationsPage.tsx`
- Create: `admin/src/pages/StatsPage.tsx`

- [ ] **Step 1: Create admin/src/pages/NotificationsPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { getAwards, sendNotification, Award } from '../lib/api';
import Toast from '../components/Toast';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function NotificationsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'award'>('all');
  const [targetAwardId, setTargetAwardId] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    getAwards().then((a) => setAwards(a.filter((x) => x.isActive)));
  }, []);

  async function handleSend() {
    setSending(true);
    setConfirm(false);
    try {
      const result = await sendNotification({
        title, body, target,
        targetAwardId: target === 'award' ? targetAwardId : undefined,
      });
      setToast({ message: `${result.sent} / ${result.total} cihaza gönderildi`, type: 'success' });
      setTitle(''); setBody('');
    } catch (e) {
      setToast({ message: String(e), type: 'error' });
    } finally {
      setSending(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (target === 'all' || targetAwardId);

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="page-header"><h1>Bildirim Gönder</h1></div>

      <div style={{ background: '#12121f', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24 }}>
        <div className="field">
          <label>Başlık ({title.length}/60)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} placeholder="Final Call hatırlatması" />
        </div>
        <div className="field">
          <label>Mesaj ({body.length}/200)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 200))} rows={4} placeholder="Bildirim içeriği..." />
        </div>

        <div className="field">
          <label>Hedef</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {(['all', 'award'] as const).map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e2f0', cursor: 'pointer' }}>
                <input type="radio" name="target" value={t} checked={target === t} onChange={() => setTarget(t)} style={{ width: 'auto' }} />
                {t === 'all' ? 'Herkese' : 'Belirli ödülü takip edenlere'}
              </label>
            ))}
          </div>
        </div>

        {target === 'award' && (
          <div className="field">
            <label>Ödül</label>
            <select value={targetAwardId} onChange={(e) => setTargetAwardId(e.target.value)}>
              <option value="">— Ödül seç —</option>
              {awards.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {title && body && (
          <div style={{ background: '#0a0a14', border: '1px solid #2a2a4a', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Önizleme</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>{body}</div>
          </div>
        )}

        {!confirm ? (
          <button className="btn-primary" disabled={!canSend || sending} onClick={() => setConfirm(true)} style={{ width: '100%', padding: 10 }}>
            Gönder
          </button>
        ) : (
          <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              {target === 'all' ? 'Tüm kullanıcılara' : `"${awards.find((a) => a.id === targetAwardId)?.name ?? ''}" takipçilerine`} bildirim gönderilecek. Onaylıyor musun?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setConfirm(false)}>İptal</button>
              <button className="btn-primary" onClick={handleSend} disabled={sending}>{sending ? 'Gönderiliyor...' : 'Onayla ve Gönder'}</button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Create admin/src/pages/StatsPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { getStats } from '../lib/api';

interface StatsData {
  totalDevices: number;
  notifEnabled: number;
  recentLogs: Array<{ id: string; awardId: string; type: string; sentAt: { _seconds: number } }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then((s) => setStats(s as StatsData))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="page"><p style={{ color: '#f87171' }}>{error}</p></div>;
  if (!stats) return <div className="page"><p style={{ color: '#888' }}>Yükleniyor...</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>İstatistik</h1></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#12121f', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#a78bfa' }}>{stats.totalDevices}</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Kayıtlı Cihaz</div>
        </div>
        <div style={{ background: '#12121f', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#4ade80' }}>{stats.notifEnabled}</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Bildirim Açık</div>
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Son Gönderilen Bildirimler</h2>
      <div className="list">
        {stats.recentLogs.length === 0 && <div className="empty">Bildirim yok</div>}
        {stats.recentLogs.map((log) => (
          <div key={log.id} className="list-row">
            <span className="list-row-name">{log.awardId}</span>
            <span style={{ background: '#1a1a2e', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#a78bfa' }}>{log.type}</span>
            <span className="list-row-meta">
              {log.sentAt ? new Date(log.sentAt._seconds * 1000).toLocaleString('tr-TR') : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/NotificationsPage.tsx admin/src/pages/StatsPage.tsx
git commit -m "feat: add notifications and stats pages"
```

---

## Task 11: Build Verification & Deploy

- [ ] **Step 1: Create admin/.env from example**

```bash
cp admin/.env.example admin/.env
# Edit admin/.env — fill in VITE_ADMIN_PASSWORD and VITE_FUNCTIONS_BASE_URL
```

`VITE_FUNCTIONS_BASE_URL` format: `https://europe-west1-notifawards-app.cloudfunctions.net`

- [ ] **Step 2: Set ADMIN_PASSWORD env for Cloud Functions**

```bash
firebase functions:secrets:set ADMIN_PASSWORD
# When prompted, enter the same password as VITE_ADMIN_PASSWORD
```

Update each Cloud Function to use the secret (add `secrets: ['ADMIN_PASSWORD']` to the `onRequest` options):

In `functions/src/adminAwards.ts` (and all other admin function files), update:
```typescript
export const adminAwards = onRequest(
  { region: 'europe-west1', cors: true, secrets: ['ADMIN_PASSWORD'] },
  async (req, res) => { ... }
);
```

- [ ] **Step 3: Build admin and verify no TypeScript errors**

```bash
cd admin && npm run build 2>&1
```

Expected: `dist/` created, no TypeScript errors, no Vite build errors.

- [ ] **Step 4: Add Firebase Hosting target in .firebaserc**

```bash
firebase target:apply hosting admin notifawards-app
```

Expected: `.firebaserc` updated with hosting targets.

- [ ] **Step 5: Build and deploy Cloud Functions**

```bash
cd functions && npm run build
firebase deploy --only functions 2>&1
```

Expected: all 6 functions deployed (`checkNotifications`, `adminAwards`, `adminArticles`, `adminTips`, `adminNotifications`, `adminStats`).

- [ ] **Step 6: Deploy admin hosting**

```bash
firebase deploy --only hosting:admin 2>&1
```

Expected: Admin panel live at `https://notifawards-app.web.app` (or custom hosting URL shown in output).

- [ ] **Step 7: Smoke test deployed admin panel**

1. Open the URL from Step 6 in a browser
2. Login with the admin password — should redirect to /awards
3. Verify awards list loads from Firestore
4. Add a test award — verify it appears in the list and in Firebase Console
5. Delete the test award
6. Navigate to each page — Haberler, İpuçları, Bildirim Gönder, İstatistik

- [ ] **Step 8: Commit**

```bash
git add admin/.env.example functions/src/ .firebaserc
git commit -m "feat: complete admin panel — all pages, cloud functions, deploy config"
git push origin main
```

---

## Environment Variables Summary

| Variable | Where | Value |
|----------|-------|-------|
| `VITE_ADMIN_PASSWORD` | `admin/.env` | Shared admin password |
| `VITE_FUNCTIONS_BASE_URL` | `admin/.env` | `https://europe-west1-notifawards-app.cloudfunctions.net` |
| `ADMIN_PASSWORD` | Firebase Secret | Same as `VITE_ADMIN_PASSWORD` |
