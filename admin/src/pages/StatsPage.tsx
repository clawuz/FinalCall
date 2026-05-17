import { useEffect, useState } from 'react';
import { getStats } from '../lib/api';

interface StatsData {
  totalDevices: number;
  notifEnabled: number;
  recentLogs: Array<{ id: string; awardId: string; type: string; sentAt: { _seconds: number } }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then((s) => setStats(s as StatsData))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="page"><p style={{ color: '#f87171' }}>{error}</p></div>;
  if (!stats) return <div className="page"><p style={{ color: '#888' }}>Yükleniyor...</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>İstatistik</h1></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#12121f', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#a78bfa' }}>{stats.totalDevices}</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Kayıtlı Cihaz</div>
        </div>
        <div style={{ background: '#12121f', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#4ade80' }}>{stats.notifEnabled}</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Bildirim Açık</div>
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Son Gönderilen Bildirimler</h2>
      <div className="list">
        {stats.recentLogs.length === 0 && <div className="empty">Bildirim yok</div>}
        {stats.recentLogs.map((log) => (
          <div key={log.id} className="list-row">
            <span className="list-row-name">{log.awardId}</span>
            <span style={{ background: '#1a1a2e', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#a78bfa' }}>{log.type}</span>
            <span className="list-row-meta">
              {log.sentAt ? new Date(log.sentAt._seconds * 1000).toLocaleString('tr-TR') : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
