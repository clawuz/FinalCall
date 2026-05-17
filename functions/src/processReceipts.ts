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
