import { useEffect, useState, useCallback } from 'react';
import { getTips, createTip, updateTip, deleteTip, Tip } from '../lib/api';
import Modal from '../components/Modal';
import TipForm from '../components/TipForm';
import Toast from '../components/Toast';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [modal, setModal] = useState<'add' | Tip | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tip | null>(null);

  const load = useCallback(async () => {
    try { setTips(await getTips()); } catch { setToast({ message: 'Yükleme hatası', type: 'error' }); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data: Partial<Tip>) {
    try {
      if (modal === 'add') { await createTip(data); setToast({ message: 'İpucu eklendi', type: 'success' }); }
      else if (modal && typeof modal === 'object') { await updateTip(modal.id, data); setToast({ message: 'İpucu güncellendi', type: 'success' }); }
      setModal(null); load();
    } catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try { await deleteTip(confirmDelete.id); setToast({ message: 'İpucu silindi', type: 'success' }); setConfirmDelete(null); load(); }
    catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>İpuçları</h1>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Yeni İpucu</button>
      </div>
      <div className="list">
        {tips.length === 0 && <div className="empty">İpucu yok</div>}
        {tips.map((t) => (
          <div key={t.id} className="list-row">
            <span className="list-row-name">{t.title}</span>
            {t.category && <span className="list-row-meta">{t.category}</span>}
            <span className={t.isPublished ? 'badge-pub' : 'badge-draft'}>{t.isPublished ? 'Yayında' : 'Gizli'}</span>
            <div className="list-row-actions">
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(t)}>Düzenle</button>
              <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(t)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Yeni İpucu' : 'İpucu Düzenle'} onClose={() => setModal(null)}>
          <TipForm initial={modal === 'add' ? undefined : modal} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="İpucu Sil" onClose={() => setConfirmDelete(null)}>
          <p style={{ marginBottom: 20 }}><strong>{confirmDelete.title}</strong> silinecek. Emin misin?</p>
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
