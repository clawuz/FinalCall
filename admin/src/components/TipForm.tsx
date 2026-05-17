import { useState } from 'react';
import { Tip } from '../lib/api';

const CATEGORIES = ['başvuru', 'strateji', 'sunum', 'yaratıcılık', 'bütçe'];

interface Props {
  initial?: Partial<Tip>;
  onSave: (data: Partial<Tip>) => Promise<void>;
  onCancel: () => void;
}

export default function TipForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Tip>>({ title: '', body: '', category: '', isPublished: false, ...initial });
  const [saving, setSaving] = useState(false);

  function set(field: keyof Tip, value: unknown) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Başlık *</label>
        <input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} required />
      </div>
      <div className="field">
        <label>İçerik *</label>
        <textarea value={form.body ?? ''} onChange={(e) => set('body', e.target.value)} rows={4} required />
      </div>
      <div className="field">
        <label>Kategori</label>
        <select value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}>
          <option value="">— Seç —</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.isPublished ?? false} onChange={(e) => set('isPublished', e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
          Yayınla
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
