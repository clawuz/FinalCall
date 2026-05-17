# Final Call Admin Panel — Design Spec

## Overview

A web-based admin panel for managing the Final Call app's content and notifications. Built as a React SPA (Vite) hosted on Firebase Hosting, connected to Firestore via Cloud Function HTTP endpoints.

---

## Users & Auth

- **Users:** Developer + editorial team (non-technical)
- **Auth:** Single shared password stored in `VITE_ADMIN_PASSWORD` env variable
- **Session:** Password hash stored in `sessionStorage`; cleared on tab close
- **Login page:** Minimal — logo, password field, submit. Wrong password → shake + error message.
- **Future:** Upgrade to Firebase Auth (email/password per editor) without changing the architecture

---

## Architecture

### Directory structure

```
NotifAwards/
├── admin/                        ← new Vite + React project
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── AwardsPage.tsx
│   │   │   ├── ArticlesPage.tsx
│   │   │   ├── TipsPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   └── StatsPage.tsx
│   │   ├── components/
│   │   │   ├── TopNav.tsx
│   │   │   ├── AwardForm.tsx
│   │   │   ├── ArticleForm.tsx
│   │   │   ├── TipForm.tsx
│   │   │   └── PreviousWinnersEditor.tsx
│   │   ├── lib/
│   │   │   ├── firebase.ts       ← Firebase app init
│   │   │   ├── auth.ts           ← password check, session
│   │   │   └── api.ts            ← Cloud Function calls
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── functions/src/
│   ├── index.ts                  ← exports updated
│   ├── checkNotifications.ts     ← existing
│   ├── adminAwards.ts            ← new HTTP endpoints
│   ├── adminArticles.ts          ← new HTTP endpoints
│   ├── adminTips.ts              ← new HTTP endpoints
│   └── adminNotifications.ts    ← new: manual push sender
├── firebase.json                 ← hosting targets updated
└── firestore.rules               ← no changes needed
```

### Deploy

```bash
cd admin && npm run build
firebase deploy --only hosting:admin
```

`firebase.json` hosting targets:
```json
"hosting": [
  { "target": "app",   "public": "dist" },
  { "target": "admin", "public": "admin/dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] }
]
```

### Data flow

```
Admin Panel (browser)
  → HTTPS request with admin password header
  → Cloud Function HTTP endpoint (verifies password server-side)
  → Firestore Admin SDK (write)
```

Firestore client-side write rules remain `allow write: if false` — all writes go through Cloud Functions, keeping security intact.

---

## Data Model

### `awards` collection

```ts
{
  name: string
  color: 'amber' | 'violet' | 'teal' | 'red' | 'gold' | 'blue'
  deadlineDate: Timestamp              // full datetime (date + time)
  postponedDeadlineDate?: Timestamp    // shown as warning in app if present
  applicationOpenDate?: Timestamp
  description?: string
  website?: string
  isActive: boolean
  entryFee?: string
  categories?: string[]
  previousWinners?: {
    title: string                      // "2024 Grand Prix & Gold Winners"
    description: string                // short intro paragraph
    cases: Array<{
      title: string                    // "The Last Photo — Dove"
      description: string             // 1-2 sentences
      videoUrl?: string               // YouTube/Vimeo, optional
    }>                                 // max 10 items
  }
}
```

### `articles` collection

```ts
{
  title: string
  summary: string          // 1-3 sentence editorial summary
  source: string           // "Campaign", "Adweek", etc.
  url: string
  imageUrl?: string
  publishedAt: Timestamp
  tags?: string[]          // ['global', 'cannes', 'effie']
  isPublished: boolean
}
```

### `tips` collection (new)

```ts
{
  title: string
  body: string
  category?: string        // 'başvuru' | 'strateji' | 'sunum'
  isPublished: boolean
  createdAt: Timestamp
}
```

---

## Pages

### Layout
Top navigation bar (always visible):
`⚡ FINAL CALL | Ödüller | Haberler | İpuçları | Bildirim Gönder | İstatistik | [Çıkış]`

Active section highlighted in violet. Logout clears session and redirects to login.

---

### 1. Ödüller (`/awards`)

- **List view:** Table rows — color dot, name, deadline (with time), postponed warning if set, active/passive badge, Edit + Delete buttons
- **Filter:** Aktif / Pasif / Tümü toggle
- **Add / Edit form** (modal or slide-over panel):
  - Name, color picker (6 swatches)
  - Deadline: date picker + time picker (HH:MM)
  - Postponed deadline: optional date + time
  - Application open date: optional
  - Description, website URL, entry fee, categories (comma-separated)
  - **Previous Winners accordion** — "Geçen Yıl Kazananları Ekle" toggle:
    - Section title field
    - Section description textarea
    - Case list (+ Add Case button, max 10):
      - Case title, description, video URL (optional)
      - Drag to reorder, delete button per case
  - Active toggle
  - Save / Cancel buttons
- **Delete:** Confirmation dialog before deletion

---

### 2. Haberler (`/articles`)

- **List view:** Title, source, published date, Published/Draft badge, Edit + Delete
- **Filter:** Yayında / Taslak / Tümü
- **Add / Edit form:**
  - Title, summary (textarea), source, URL
  - Image URL (optional, with preview)
  - Published date (datetime picker)
  - Tags (multi-select: global, local, cannes, effie, d&ad, etc.)
  - Published toggle
- **Delete:** Confirmation dialog

---

### 3. İpuçları (`/tips`)

- **List view:** Title, category, Published/Hidden badge, Edit + Delete
- **Add / Edit form:**
  - Title, body (textarea)
  - Category (dropdown or free text)
  - Published toggle
- **Delete:** Confirmation dialog

---

### 4. Bildirim Gönder (`/notifications`)

- **Form:**
  - Title field (max 60 chars, character counter)
  - Message field (max 200 chars, character counter)
  - Target: radio buttons → "Herkese" or "Belirli ödülü takip edenlere"
  - If "Belirli ödül" selected: award dropdown (active awards only)
  - Preview card showing how notification will appear on phone
  - Send button → confirmation dialog → Cloud Function call
- **Result:** Success/error toast after send

---

### 5. İstatistik (`/stats`)

- Toplam kayıtlı cihaz sayısı (`user_prefs` collection count)
- Bildirim açık cihaz sayısı (`allNotifs === true`)
- Son 20 gönderilen bildirim (`notification_log`, descending by sentAt)

---

## Cloud Function Endpoints (new)

All endpoints require `x-admin-password` header matching `ADMIN_PASSWORD` env variable.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/adminAwards` | List all awards |
| POST | `/adminAwards` | Create award |
| PUT | `/adminAwards/:id` | Update award |
| DELETE | `/adminAwards/:id` | Delete award |
| GET | `/adminArticles` | List all articles |
| POST | `/adminArticles` | Create article |
| PUT | `/adminArticles/:id` | Update article |
| DELETE | `/adminArticles/:id` | Delete article |
| GET | `/adminTips` | List all tips |
| POST | `/adminTips` | Create tip |
| PUT | `/adminTips/:id` | Update tip |
| DELETE | `/adminTips/:id` | Delete tip |
| POST | `/adminSendNotification` | Send manual push to all or award followers |

**`/adminSendNotification` logic:** "Award followers" = all `user_prefs` tokens where `allNotifs === true` AND the `targetAwardId` is NOT in their `mutedAwards` array. Mirrors the existing `checkNotifications` filtering logic.

---

## Error Handling

- **Network errors:** Toast notification — "Bağlantı hatası, tekrar dene"
- **Auth failure (401):** Redirect to login, clear session
- **Validation:** Client-side required field checks before form submit
- **Delete:** Always confirm with dialog before calling delete endpoint
- **Push send failure:** Show partial failure count from Expo API response

---

## Firestore Rules

No changes to existing rules. All writes go through Cloud Functions with Admin SDK, bypassing client-side rules. `allow write: if false` on `awards`, `articles`, `tips` remains.
