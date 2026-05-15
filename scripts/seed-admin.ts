/**
 * Firestore seed script (firebase-admin)
 *
 * Kullanım:
 *   1. Firebase Console → Proje Ayarları → Hizmet Hesapları →
 *      "Yeni özel anahtar oluştur" → serviceAccount.json olarak kaydet (proje kökünde)
 *   2. Terminalde: bunx tsx scripts/seed-admin.ts
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

const SA_PATH = join(process.cwd(), 'serviceAccount.json');
let serviceAccount: ServiceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'));
} catch {
  console.error('❌  serviceAccount.json bulunamadı!');
  console.error('   Firebase Console → Proje Ayarları → Hizmet Hesapları');
  console.error('   → "Yeni özel anahtar oluştur" ile indirip proje köküne koy.');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function ts(year: number, month: number, day: number): Timestamp {
  return Timestamp.fromDate(new Date(year, month - 1, day, 20, 59, 0));
}

const now = Timestamp.now();

const AWARDS = [
  // ──────── TÜRKİYE ────────
  {
    id: 'effie-tr-2026',
    name: 'Effie Awards Türkiye',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Marka', 'Dijital', 'Sosyal Medya', 'Entegre Kampanya'],
    applicationOpenDate: ts(2026, 1, 15),
    deadlineDate: ts(2026, 7, 15),
    applicationUrl: 'https://effie.com.tr/basvuru',
    website: 'https://effie.com.tr',
    fee: '₺2.500 - ₺5.000 / kategori',
    description: "Pazarlama etkinliğini ödüllendiren uluslararası Effie'nin Türkiye ayağı.",
    isActive: true,
  },
  {
    id: 'kristal-elma-2026',
    name: 'Kristal Elma',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Reklam', 'Dijital', 'PR', 'Medya', 'Tasarım', 'Açık Hava'],
    applicationOpenDate: ts(2026, 2, 1),
    deadlineDate: ts(2026, 9, 1),
    applicationUrl: 'https://kristalelma.org.tr/basvuru',
    website: 'https://kristalelma.org.tr',
    fee: '₺3.000 - ₺6.000 / kategori',
    description: "Türkiye'nin en prestijli yaratıcı iletişim ödülü.",
    isActive: true,
  },
  {
    id: 'felis-2026',
    name: 'FELIS Awards',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Dijital', 'Sosyal Medya', 'İçerik Pazarlaması', 'E-ticaret'],
    applicationOpenDate: ts(2026, 3, 1),
    deadlineDate: ts(2026, 8, 10),
    applicationUrl: 'https://felisawards.com/basvuru',
    website: 'https://felisawards.com',
    fee: '₺2.000 - ₺4.000 / kategori',
    isActive: true,
  },
  {
    id: 'mma-smarties-tr-2026',
    name: 'MMA Smarties Awards Turkey',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Mobil Pazarlama', 'Sosyal Medya', 'Veri & Teknoloji'],
    applicationOpenDate: ts(2026, 4, 1),
    deadlineDate: ts(2026, 10, 1),
    applicationUrl: 'https://mmaglobal.com/smarties',
    website: 'https://mmaglobal.com',
    isActive: true,
  },
  {
    id: 'brandverse-2026',
    name: 'Brandverse Awards',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Marka İnovasyonu', 'Dijital Dönüşüm', 'Sürdürülebilirlik'],
    applicationOpenDate: ts(2026, 3, 15),
    deadlineDate: ts(2026, 8, 31),
    applicationUrl: 'https://brandverseawards.com',
    website: 'https://brandverseawards.com',
    isActive: true,
  },
  // ──────── GLOBAL ────────
  {
    id: 'cannes-lions-2026',
    name: 'Cannes Lions',
    nameEn: 'Cannes Lions International Festival of Creativity',
    region: 'Global',
    country: 'Fransa',
    categories: ['Film', 'Print', 'Outdoor', 'Digital', 'PR', 'Innovation', 'Design', 'Craft'],
    applicationOpenDate: ts(2026, 1, 20),
    deadlineDate: ts(2026, 6, 10),
    earlyBirdDate: ts(2026, 3, 28),
    applicationUrl: 'https://www.canneslions.com/enter',
    website: 'https://www.canneslions.com',
    fee: '€500 - €2.500 / kategori',
    description: "Dünyanın en prestijli yaratıcı iletişim festivali.",
    isActive: true,
  },
  {
    id: 'dad-awards-2026',
    name: 'D&AD Awards',
    region: 'Global',
    country: 'İngiltere',
    categories: ['Graphic Design', 'Film', 'Digital', 'Writing', 'Photography'],
    applicationOpenDate: ts(2026, 1, 10),
    deadlineDate: ts(2026, 6, 27),
    applicationUrl: 'https://www.dandad.org/awards/professional',
    website: 'https://www.dandad.org',
    fee: '£450 - £1.200 / kategori',
    isActive: true,
  },
  {
    id: 'clio-awards-2026',
    name: 'Clio Awards',
    region: 'Global',
    country: 'ABD',
    categories: ['Film', 'Print', 'Digital/Mobile', 'Social Media', 'Innovation'],
    applicationOpenDate: ts(2026, 2, 1),
    deadlineDate: ts(2026, 7, 20),
    applicationUrl: 'https://clios.com/awards/enter',
    website: 'https://clios.com',
    fee: '$500 - $2.000 / kategori',
    isActive: true,
  },
  {
    id: 'drum-awards-2026',
    name: 'The Drum Awards',
    region: 'Global',
    country: 'İngiltere',
    categories: ['Marketing', 'Digital', 'Social', 'B2B', 'PR'],
    applicationOpenDate: ts(2026, 3, 1),
    deadlineDate: ts(2026, 8, 15),
    applicationUrl: 'https://www.thedrum.com/awards',
    website: 'https://www.thedrum.com',
    isActive: true,
  },
];

async function seed() {
  console.log(`🌱  ${AWARDS.length} ödül Firestore'a yazılıyor...`);

  const batch = db.batch();
  for (const { id, ...data } of AWARDS) {
    const ref = db.collection('awards').doc(id);
    batch.set(ref, { ...data, createdAt: now, updatedAt: now });
  }
  await batch.commit();

  console.log('✅  Seed tamamlandı!');
  console.log('   awards koleksiyonunu Firebase Console\'dan kontrol edebilirsin.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed başarısız:', err.message);
  process.exit(1);
});
