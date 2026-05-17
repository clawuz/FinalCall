import { useState } from 'react';
import { Article } from '../lib/api';

const TAG_OPTIONS = ['global', 'local', 'cannes', 'effie', 'd&ad', 'felis', 'digital', 'pr'];

interface Props {
  initial?: Partial<Article>;
  onSave: (data: Partial<Article>) => Promise<void>;
  onCancel: () => void;
}

function tsToInput(ts: string | undefined): string {
  if (!ts) return '';
  try { return new Date(ts).toISOString().slice(0, 16); } catch { return ''; }
}

export default function ArticleForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Article>>({
    title: '', summary: '', source: '', url: '', imageUrl: '',
    publishedAt: new Date().toISOString(), tags: [], isPublished: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  function set(field: keyof Article, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(tag: string) {
    const tags = form.tags ?? [];
    set('tags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.summary || !form.source || !form.url) return;
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
        <label>Özet *</label>
        <textarea value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} rows={3} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label>Kaynak *</label>
          <input value={form.source ?? ''} onChange={(e) => set('source', e.target.value)} placeholder="Campaign, Adweek..." required />
        </div>
        <div className="field">
          <label>URL *</label>
          <input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://..." required />
        </div>
        <div className="field">
          <label>Görsel URL (opsiyonel)</label>
          <input value={form.imageUrl ?? ''} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Yayın Tarihi</label>
          <input type="datetime-local" value={tsToInput(form.publishedAt)} onChange={(e) => set('publishedAt', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Etiketler</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag} type="button"
              onClick={() => toggleTag(tag)}
              style={{
                padding: '3px 10px', fontSize: 11, borderRadius: 4,
                background: (form.tags ?? []).includes(tag) ? '#7c3aed' : 'transparent',
                border: '1px solid #2a2a4a',
                color: (form.tags ?? []).includes(tag) ? '#fff' : '#888',
              }}
            >{tag}</button>
          ))}
        </div>
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
