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

// Firestore Timestamp or ISO string → { date: "YYYY-MM-DD", time: "HH:MM" }
function tsToDatetime(ts: unknown): { date: string; time: string } {
  if (!ts) return { date: '', time: '' };
  try {
    let ms: number | undefined;
    if (typeof ts === 'object' && ts !== null) {
      const obj = ts as Record<string, number>;
      const secs = obj.seconds ?? obj._seconds;
      if (secs !== undefined) ms = secs * 1000;
    }
    if (ms === undefined && typeof ts === 'string') {
      ms = new Date(ts).getTime();
    }
    if (!ms || isNaN(ms)) return { date: '', time: '' };
    const d = new Date(ms);
    const date = d.toISOString().slice(0, 10);
    const time = d.toISOString().slice(11, 16);
    return { date, time };
  } catch { return { date: '', time: '' }; }
}

// "YYYY-MM-DD" + "HH:MM" → ISO string
function datetimeToISO(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}:00.000Z`;
}

interface DateTimeFieldProps {
  label: string;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  required?: boolean;
}

function DateTimeField({ label, date, time, onDateChange, onTimeChange, required }: DateTimeFieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required={required}
          style={{ flex: 2 }}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
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
    isActive: true,
    ...initial,
  });
  const [notifSchedule, setNotifSchedule] = useState<NotifSchedule>(
    initial?.notifSchedule ?? DEFAULT_NOTIF_SCHEDULE
  );
  const [saving, setSaving] = useState(false);

  // Date/time split state
  const initDeadline = tsToDatetime(initial?.deadlineDate);
  const initPostponed = tsToDatetime(initial?.postponedDeadlineDate);
  const initOpenDate = tsToDatetime(initial?.applicationOpenDate);

  const [deadlineDate, setDeadlineDate] = useState(initDeadline.date);
  const [deadlineTime, setDeadlineTime] = useState(initDeadline.time || '23:59');
  const [postponedDate, setPostponedDate] = useState(initPostponed.date);
  const [postponedTime, setPostponedTime] = useState(initPostponed.time || '23:59');
  const [openDate, setOpenDate] = useState(initOpenDate.date);
  const [openTime, setOpenTime] = useState(initOpenDate.time || '09:00');

  function setField(field: keyof Award, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !deadlineDate) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        deadlineDate: datetimeToISO(deadlineDate, deadlineTime),
        postponedDeadlineDate: postponedDate ? datetimeToISO(postponedDate, postponedTime) : undefined,
        applicationOpenDate: openDate ? datetimeToISO(openDate, openTime) : undefined,
        notifSchedule,
      });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Ödül Adı *</label>
          <input
            value={form.name ?? ''}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="D&AD Pencil Awards"
            required
          />
        </div>

        <DateTimeField
          label="Son Başvuru Tarihi *"
          date={deadlineDate}
          time={deadlineTime}
          onDateChange={setDeadlineDate}
          onTimeChange={setDeadlineTime}
          required
        />

        <DateTimeField
          label="Erteleme Tarihi (opsiyonel)"
          date={postponedDate}
          time={postponedTime}
          onDateChange={setPostponedDate}
          onTimeChange={setPostponedTime}
        />

        <DateTimeField
          label="Başvuru Açılış Tarihi (opsiyonel)"
          date={openDate}
          time={openTime}
          onDateChange={setOpenDate}
          onTimeChange={setOpenTime}
        />

        <div className="field">
          <label>Renk</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {COLOR_OPTIONS.map((c) => (
              <div
                key={c.value}
                onClick={() => setField('color', c.value)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c.hex,
                  cursor: 'pointer',
                  outline: form.color === c.value ? '3px solid #fff' : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Açıklama</label>
          <textarea value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={2} />
        </div>

        <div className="field">
          <label>Website URL</label>
          <input value={form.website ?? ''} onChange={(e) => setField('website', e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label>Başvuru Ücreti</label>
          <input value={form.entryFee ?? ''} onChange={(e) => setField('entryFee', e.target.value)} placeholder="€350 / entry" />
        </div>

        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Kategoriler (virgülle ayır)</label>
          <input
            value={(form.categories ?? []).join(', ')}
            onChange={(e) => setField('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="Film, Print, Digital"
          />
        </div>
      </div>

      <PreviousWinnersEditor value={form.previousWinners} onChange={(v) => setField('previousWinners', v)} />

      <NotifScheduleEditor value={notifSchedule} onChange={setNotifSchedule} />

      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => setField('isActive', e.target.checked)}
            style={{ width: 'auto', marginRight: 6 }}
          />
          Aktif
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn-ghost" onClick={onCancel}>İptal</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
