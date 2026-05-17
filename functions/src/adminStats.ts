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
