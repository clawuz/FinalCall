import { useState } from 'react';
import { Award } from '../lib/api';
import PreviousWinnersEditor from './PreviousWinnersEditor';
import NotifScheduleEditor from './NotifScheduleEditor';
import { DEFAULT_NOTIF_SCHEDULE } from '../../../types';
import type { NotifSchedule } from '../../../types';

const COLOR_OPTIONS = [
  { value: 'amber',  hex: '#f59e0b' },
  { value: 'violet', hex: '#8b5cf6' },
  { value: 'teal',   hex: '#14b8a6' },
  { value: 'red',    hex: '#ef4444' },
  { value: 'gold',   hex: '#eab308' },
  { value: 'blue',   hex: '#3b82f6' },
];

function tsToInput(ts: string | undefined): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toISOString().slice(0, 16);
  } catch { return ''; }
}

interface Props {
  initial?: Partial<Award>;
  onSave: (data: Partial<Award>) => Promise<void>;
  onCancel: () => void;
}

export default function AwardForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Award>>({
    name: '',
    color: 'amber',
    deadlineDate: '',
    isActive: true,
    ...initial,
  });
  const [notifSchedule, setNotifSchedule] = useState<NotifSchedule>(
    initial?.notifSchedule ?? DEFAULT_NOTIF_SCHEDULE
  );
  const [saving, setSaving] = useState(false);

  function set(field: keyof Award, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.deadlineDate) return;
    setSaving(true);
    try { await onSave({ ...form, notifSchedule }); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Ödül Adı *</label>
          <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="D&AD Pencil Awards" required />
        </div>

        <div className="field">
          <label>Son Başvuru Tarihi *</label>
          <input type="datetime-local" value={tsToInput(form.deadlineDate)} onChange={(e) => set('deadlineDate', e.target.value)} required />
        </div>

        <div className="field">
          <label>Erteleme Tarihi (opsiyonel)</label>
          <input type="datetime-local" value={tsToInput(form.postponedDeadlineDate)} onChange={(e) => set('postponedDeadlineDate', e.target.value || undefined)} />
        </div>

        <div className="field">
          <label>Başvuru Açılış Tarihi (opsiyonel)</label>
          <input type="datetime-local" value={tsToInput(form.applicationOpenDate)} onChange={(e) => set('applicationOpenDate', e.target.value || undefined)} />
        </div>

        <div className="field">
          <label>Renk</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {COLOR_OPTIONS.map((c) => (
              <div
                key={c.value}
                onClick={() => set('color', c.value)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c.hex,
                  cursor: 'pointer', outline: form.color === c.value ? `3px solid #fff` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Açıklama</label>
          <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
        </div>

        <div className="field">
          <label>Website URL</label>
          <input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label>Başvuru Ücreti</label>
          <input value={form.entryFee ?? ''} onChange={(e) => set('entryFee', e.target.value)} placeholder="€350 / entry" />
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Kategoriler (virgülle ayır)</label>
          <input
            value={(form.categories ?? []).join(', ')}
            onChange={(e) => set('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Film, Print, Digital"
          />
        </div>
      </div>

      <PreviousWinnersEditor value={form.previousWinners} onChange={(v) => set('previousWinners', v)} />

      <NotifScheduleEditor value={notifSchedule} onChange={setNotifSchedule} />

      <div className="field">
        <label>
          <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => set('isActive', e.target.checked)} style={{ width: 'auto', marginRight: 6 }} />
          Aktif
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  );
}
