import { useEffect, useState, useCallback } from 'react';
import { getAwards, createAward, updateAward, deleteAward, Award } from '../lib/api';
import Modal from '../components/Modal';
import AwardForm from '../components/AwardForm';
import Toast from '../components/Toast';

const COLOR_HEX: Record<string, string> = {
  amber: '#f59e0b', violet: '#8b5cf6', teal: '#14b8a6',
  red: '#ef4444', gold: '#eab308', blue: '#3b82f6',
};

type Filter = 'all' | 'active' | 'passive';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [modal, setModal] = useState<'add' | Award | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Award | null>(null);

  const load = useCallback(async () => {
    try { setAwards(await getAwards()); } catch { setToast({ message: 'Yükleme hatası', type: 'error' }); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = awards.filter((a) =>
    filter === 'all' ? true : filter === 'active' ? a.isActive : !a.isActive
  );

  async function handleSave(data: Partial<Award>) {
    try {
      if (modal === 'add') {
        await createAward(data);
        setToast({ message: 'Ödül eklendi', type: 'success' });
      } else if (modal && typeof modal === 'object') {
        await updateAward(modal.id, data);
        setToast({ message: 'Ödül güncellendi', type: 'success' });
      }
      setModal(null);
      load();
    } catch (e) {
      setToast({ message: String(e), type: 'error' });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteAward(confirmDelete.id);
      setToast({ message: 'Ödül silindi', type: 'success' });
      setConfirmDelete(null);
      load();
    } catch (e) {
      setToast({ message: String(e), type: 'error' });
    }
  }

  function formatDate(ts: string | undefined) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return ts; }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Ödüller</h1>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Yeni Ödül</button>
      </div>

      <div className="filter-bar">
        {(['all', 'active', 'passive'] as Filter[]).map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}
          </button>
        ))}
      </div>

      <div className="list">
        {visible.length === 0 && <div className="empty">Ödül yok</div>}
        {visible.map((a) => (
          <div key={a.id} className="list-row">
            <div className="color-dot" style={{ background: COLOR_HEX[a.color] ?? '#888' }} />
            <span className="list-row-name">{a.name}</span>
            {a.postponedDeadlineDate && (
              <span style={{ color: '#fbbf24', fontSize: 11 }}>⚠ Ertelendi: {formatDate(a.postponedDeadlineDate)}</span>
            )}
            <span className="list-row-meta">{formatDate(a.deadlineDate)}</span>
            <span className={a.isActive ? 'badge-active' : 'badge-passive'}>{a.isActive ? 'Aktif' : 'Pasif'}</span>
            <div className="list-row-actions">
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(a)}>Düzenle</button>
              <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(a)}>Sil</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Yeni Ödül' : 'Ödülü Düzenle'} onClose={() => setModal(null)} wide>
          <AwardForm
            initial={modal === 'add' ? undefined : modal}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Ödülü Sil" onClose={() => setConfirmDelete(null)}>
          <p style={{ marginBottom: 20, color: '#e2e2f0' }}>
            <strong>{confirmDelete.name}</strong> silinecek. Emin misin?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            <button className="btn-danger" onClick={handleDelete}>Sil</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
