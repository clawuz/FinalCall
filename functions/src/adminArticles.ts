import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

function checkAuth(req: any): boolean {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

export const adminArticles = onRequest(
  { region: 'europe-west1', cors: true, secrets: ['ADMIN_PASSWORD'] },
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
