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
