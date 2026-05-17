import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminNotifications = onRequest(
  { region: 'europe-west1', cors: true, secrets: ['ADMIN_PASSWORD'] },
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
        res.json({ sent: 0, total: 0 });
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
