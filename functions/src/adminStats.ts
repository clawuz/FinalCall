import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminStats = onRequest(
  { region: 'europe-west1', cors: true, secrets: ['ADMIN_PASSWORD'] },
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
