import { useEffect, useState } from 'react';
import { getAwards, sendNotification, Award } from '../lib/api';
import Toast from '../components/Toast';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function NotificationsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'award'>('all');
  const [targetAwardId, setTargetAwardId] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    getAwards().then((a) => setAwards(a.filter((x) => x.isActive)));
  }, []);

  async function handleSend() {
    setSending(true);
    setConfirm(false);
    try {
      const result = await sendNotification({
        title, body, target,
        targetAwardId: target === 'award' ? targetAwardId : undefined,
      });
      setToast({ message: `${result.sent} / ${result.total} cihaza gönderildi`, type: 'success' });
      setTitle(''); setBody('');
    } catch (e) {
      setToast({ message: String(e), type: 'error' });
    } finally {
      setSending(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (target === 'all' || targetAwardId);

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="page-header"><h1>Bildirim Gönder</h1></div>

      <div style={{ background: '#12121f', border: '1px solid #2a2a4a', borderRadius: 12, padding: 24 }}>
        <div className="field">
          <label>Başlık ({title.length}/60)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} placeholder="Final Call hatırlatması" />
        </div>
        <div className="field">
          <label>Mesaj ({body.length}/200)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 200))} rows={4} placeholder="Bildirim içeriği..." />
        </div>

        <div className="field">
          <label>Hedef</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {(['all', 'award'] as const).map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e2f0', cursor: 'pointer' }}>
                <input type="radio" name="target" value={t} checked={target === t} onChange={() => setTarget(t)} style={{ width: 'auto' }} />
                {t === 'all' ? 'Herkese' : 'Belirli ödülü takip edenlere'}
              </label>
            ))}
          </div>
        </div>

        {target === 'award' && (
          <div className="field">
            <label>Ödül</label>
            <select value={targetAwardId} onChange={(e) => setTargetAwardId(e.target.value)}>
              <option value="">— Ödül seç —</option>
              {awards.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {title && body && (
          <div style={{ background: '#0a0a14', border: '1px solid #2a2a4a', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Önizleme</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
            <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>{body}</div>
          </div>
        )}

        {!confirm ? (
          <button className="btn-primary" disabled={!canSend || sending} onClick={() => setConfirm(true)} style={{ width: '100%', padding: 10 }}>
            Gönder
          </button>
        ) : (
          <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              {target === 'all' ? 'Tüm kullanıcılara' : `"${awards.find((a) => a.id === targetAwardId)?.name ?? ''}" takipçilerine`} bildirim gönderilecek. Onaylıyor musun?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setConfirm(false)}>İptal</button>
              <button className="btn-primary" onClick={handleSend} disabled={sending}>{sending ? 'Gönderiliyor...' : 'Onayla ve Gönder'}</button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
