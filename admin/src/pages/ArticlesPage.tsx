import { useEffect, useState, useCallback } from 'react';
import { getArticles, createArticle, updateArticle, deleteArticle, Article } from '../lib/api';
import Modal from '../components/Modal';
import ArticleForm from '../components/ArticleForm';
import Toast from '../components/Toast';

type Filter = 'all' | 'published' | 'draft';
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [modal, setModal] = useState<'add' | Article | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  const load = useCallback(async () => {
    try { setArticles(await getArticles()); } catch { setToast({ message: 'Yükleme hatası', type: 'error' }); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = articles.filter((a) =>
    filter === 'all' ? true : filter === 'published' ? a.isPublished : !a.isPublished
  );

  async function handleSave(data: Partial<Article>) {
    try {
      if (modal === 'add') { await createArticle(data); setToast({ message: 'Haber eklendi', type: 'success' }); }
      else if (modal && typeof modal === 'object') { await updateArticle(modal.id, data); setToast({ message: 'Haber güncellendi', type: 'success' }); }
      setModal(null); load();
    } catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try { await deleteArticle(confirmDelete.id); setToast({ message: 'Haber silindi', type: 'success' }); setConfirmDelete(null); load(); }
    catch (e) { setToast({ message: String(e), type: 'error' }); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Haberler</h1>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Yeni Haber</button>
      </div>
      <div className="filter-bar">
        {(['all', 'published', 'draft'] as Filter[]).map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tümü' : f === 'published' ? 'Yayında' : 'Taslak'}
          </button>
        ))}
      </div>
      <div className="list">
        {visible.length === 0 && <div className="empty">Haber yok</div>}
        {visible.map((a) => (
          <div key={a.id} className="list-row">
            <span className="list-row-name">{a.title}</span>
            <span className="list-row-meta">{a.source}</span>
            <span className={a.isPublished ? 'badge-pub' : 'badge-draft'}>{a.isPublished ? 'Yayında' : 'Taslak'}</span>
            <div className="list-row-actions">
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal(a)}>Düzenle</button>
              <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(a)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Yeni Haber' : 'Haberi Düzenle'} onClose={() => setModal(null)} wide>
          <ArticleForm initial={modal === 'add' ? undefined : modal} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Haberi Sil" onClose={() => setConfirmDelete(null)}>
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
