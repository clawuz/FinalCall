import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminAwards = onRequest(
  { region: 'europe-west1', cors: true, secrets: ['ADMIN_PASSWORD'] },
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
