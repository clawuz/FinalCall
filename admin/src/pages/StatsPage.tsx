import { useEffect, useState } from 'react';
import { getStats, StatsData } from '../lib/api';

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p style={{ color: 'var(--muted)' }}>Yükleniyor…</p></div>;
  if (error) return <div className="page"><p style={{ color: 'var(--red)' }}>{error}</p></div>;
  if (!data) return null;

  const { deliverySummary: ds } = data;
  const deliveryRate = ds.total > 0
    ? Math.round((ds.delivered / ds.total) * 100)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>İstatistikler</h1>
      </div>

      {/* Device stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Toplam Cihaz" value={data.totalDevices} />
        <StatCard label="Bildirim Açık" value={data.notifEnabled} />
        <StatCard label="Gönderilen (30g)" value={ds.total} />
        <StatCard label="Ulaşan" value={ds.delivered} sub={`${deliveryRate}%`} color="var(--violet)" />
        <StatCard label="Başarısız" value={ds.failed} color={ds.failed > 0 ? 'var(--red)' : undefined} />
        <StatCard label="Bekliyor" value={ds.pending} />
      </div>

      {/* Per-award breakdown */}
      {Object.keys(data.byAward).length > 0 && (
        <>
          <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Ödül Bazlı Teslimat
          </h2>
          <div className="list" style={{ marginBottom: 24 }}>
            {Object.entries(data.byAward).map(([awardId, stats]) => {
              const rate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0;
              return (
                <div key={awardId} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'monospace' }}>{awardId}</span>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Gönderildi: {stats.sent}</span>
                    <span style={{ color: 'var(--violet)' }}>Ulaştı: {stats.delivered}</span>
                    {stats.failed > 0 && <span style={{ color: 'var(--red)' }}>Hata: {stats.failed}</span>}
                    <span style={{ color: 'var(--muted)' }}>{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent receipts */}
      {data.recentReceipts.length > 0 && (
        <>
          <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Son Teslimatlar
          </h2>
          <div className="list" style={{ marginBottom: 24 }}>
            {data.recentReceipts.map((r) => (
              <div key={r.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{r.awardId} · {r.notifType}</span>
                  <br />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{r.token}</span>
                </div>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: r.status === 'delivered' ? 'rgba(77,205,190,0.15)' : r.status === 'failed' ? 'rgba(255,90,90,0.15)' : 'rgba(255,255,255,0.08)',
                  color: r.status === 'delivered' ? '#4dcdbe' : r.status === 'failed' ? '#ff5a5a' : 'var(--muted)',
                }}>
                  {r.status === 'delivered' ? 'Ulaştı' : r.status === 'failed' ? (r.errorDetails ?? 'Hata') : 'Bekliyor'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent notification log */}
      <h2 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Bildirim Günlüğü
      </h2>
      <div className="list">
        {data.recentLog.length === 0 && <div className="empty">Bildirim yok</div>}
        {data.recentLog.map((entry) => (
          <div key={entry.id} className="list-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{entry.awardId} — {entry.type}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {(entry.sentAt as { _seconds?: number })?._seconds
                ? new Date((entry.sentAt as { _seconds: number })._seconds * 1000).toLocaleString('tr-TR')
                : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '16px 18px',
    }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--text)', lineHeight: 1 }}>
        {value.toLocaleString()}
        {sub && <span style={{ fontSize: 14, marginLeft: 6, color: 'var(--muted)' }}>{sub}</span>}
      </p>
    </div>
  );
}
