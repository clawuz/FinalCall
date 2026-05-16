// Bu dosyayı admin olarak çalıştır: bunx ts-node scripts/seed.ts
// NOT: Firebase Admin SDK gerektiriyor, sonraki aşamada çalıştırılacak
// Şimdilik sadece veri yapısını gösterir

import { Timestamp } from 'firebase/firestore';
import { Award } from '../types';

type AwardSeed = Omit<Award, 'id' | 'createdAt' | 'updatedAt'>;

// Tarih yardımcı
function date(year: number, month: number, day: number): Timestamp {
  return Timestamp.fromDate(new Date(year, month - 1, day, 23, 59, 0));
}

export const SEED_AWARDS: AwardSeed[] = [
  // TÜRKIYE
  {
    name: 'Effie Awards Türkiye',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Marka', 'Dijital', 'Sosyal Medya', 'Entegre Kampanya'],
    applicationOpenDate: date(2025, 1, 15),
    deadlineDate: date(2025, 5, 15),
    applicationUrl: 'https://effie.com.tr/basvuru',
    website: 'https://effie.com.tr',
    fee: '₺2.500 - ₺5.000 / kategori',
    description: 'Pazarlama etkinliğini ödüllendiren uluslararası Effie\'nin Türkiye ayağı.',
    color: 'gold',
    isActive: true,
  },
  {
    name: 'Kristal Elma',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Reklam', 'Dijital', 'PR', 'Medya', 'Tasarım', 'Açık Hava'],
    applicationOpenDate: date(2025, 2, 1),
    deadlineDate: date(2025, 7, 1),
    applicationUrl: 'https://kristalelma.org.tr/basvuru',
    website: 'https://kristalelma.org.tr',
    fee: '₺3.000 - ₺6.000 / kategori',
    description: 'Türkiye\'nin en prestijli yaratıcı iletişim ödülü.',
    color: 'teal',
    isActive: true,
  },
  {
    name: 'FELIS Awards',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Dijital', 'Sosyal Medya', 'İçerik Pazarlaması', 'E-ticaret'],
    applicationOpenDate: date(2025, 3, 1),
    deadlineDate: date(2025, 6, 30),
    applicationUrl: 'https://felisawards.com/basvuru',
    website: 'https://felisawards.com',
    fee: '₺2.000 - ₺4.000 / kategori',
    color: 'amber',
    isActive: true,
  },
  {
    name: 'MMA Smarties Awards Turkey',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Mobil Pazarlama', 'Sosyal Medya', 'Veri & Teknoloji'],
    applicationOpenDate: date(2025, 4, 1),
    deadlineDate: date(2025, 8, 15),
    applicationUrl: 'https://mmaglobal.com/smarties',
    website: 'https://mmaglobal.com',
    color: 'amber',
    isActive: true,
  },
  {
    name: 'Brandverse Awards',
    region: 'TR',
    country: 'Türkiye',
    categories: ['Marka İnovasyonu', 'Dijital Dönüşüm', 'Sürdürülebilirlik'],
    applicationOpenDate: date(2025, 3, 15),
    deadlineDate: date(2025, 7, 31),
    applicationUrl: 'https://brandverseawards.com',
    website: 'https://brandverseawards.com',
    color: 'amber',
    isActive: true,
  },
  // GLOBAL
  {
    name: 'Cannes Lions',
    nameEn: 'Cannes Lions International Festival of Creativity',
    region: 'Global',
    country: 'Fransa',
    categories: ['Film', 'Print', 'Outdoor', 'Digital', 'PR', 'Innovation', 'Design', 'Craft'],
    applicationOpenDate: date(2025, 1, 20),
    deadlineDate: date(2025, 5, 29),
    earlyBirdDate: date(2025, 3, 28),
    applicationUrl: 'https://www.canneslions.com/enter',
    website: 'https://www.canneslions.com',
    fee: '€500 - €2.500 / kategori',
    description: 'Dünyanın en prestijli yaratıcı iletişim festivali.',
    color: 'amber',
    isActive: true,
  },
  {
    name: 'D&AD Awards',
    region: 'Global',
    country: 'İngiltere',
    categories: ['Graphic Design', 'Film', 'Digital', 'Writing', 'Photography'],
    applicationOpenDate: date(2025, 1, 10),
    deadlineDate: date(2025, 3, 27),
    applicationUrl: 'https://www.dandad.org/awards/professional',
    website: 'https://www.dandad.org',
    fee: '£450 - £1.200 / kategori',
    color: 'violet',
    isActive: true,
  },
  {
    name: 'Clio Awards',
    region: 'Global',
    country: 'ABD',
    categories: ['Film', 'Print', 'Digital/Mobile', 'Social Media', 'Innovation'],
    applicationOpenDate: date(2025, 2, 1),
    deadlineDate: date(2025, 6, 15),
    applicationUrl: 'https://clios.com/awards/enter',
    website: 'https://clios.com',
    fee: '$500 - $2.000 / kategori',
    color: 'red',
    isActive: true,
  },
  {
    name: 'The Drum Awards',
    region: 'Global',
    country: 'İngiltere',
    categories: ['Marketing', 'Digital', 'Social', 'B2B', 'PR'],
    applicationOpenDate: date(2025, 3, 1),
    deadlineDate: date(2025, 6, 20),
    applicationUrl: 'https://www.thedrum.com/awards',
    website: 'https://www.thedrum.com',
    color: 'amber',
    isActive: true,
  },
];

console.log(`${SEED_AWARDS.length} ödül seed için hazır.`);
console.log('Firebase Admin SDK kurulunca: bunx ts-node scripts/seed-admin.ts');
