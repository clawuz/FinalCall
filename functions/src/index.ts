import * as admin from 'firebase-admin';

admin.initializeApp();

export { checkNotifications } from './checkNotifications';
export { processReceipts } from './processReceipts';
export { adminAwards } from './adminAwards';
export { adminArticles } from './adminArticles';
export { adminTips } from './adminTips';
export { adminNotifications } from './adminNotifications';
export { adminStats } from './adminStats';
