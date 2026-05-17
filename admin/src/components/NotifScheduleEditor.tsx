import { NotifSchedule, NotifMilestone } from '../../../types';

interface Props {
  value: NotifSchedule;
  onChange: (s: NotifSchedule) => void;
}

const MILESTONE_DAYS = [30, 14, 7, 3, 1];

export default function NotifScheduleEditor({ value, onChange }: Props) {
  function updateMilestone(days: number, patch: Partial<NotifMilestone>) {
    onChange({
      ...value,
      milestones: value.milestones.map((m) =>
        m.daysBeforeDeadline === days ? { ...m, ...patch } : m,
      ),
    });
  }

  function ensureAllDays(schedule: NotifSchedule): NotifSchedule {
    const existing = new Map(schedule.milestones.map((m) => [m.daysBeforeDeadline, m]));
    return {
      ...schedule,
      milestones: MILESTONE_DAYS.map(
        (d) => existing.get(d) ?? { daysBeforeDeadline: d, sendHour: 10, enabled: false },
      ),
    };
  }

  const safe = ensureAllDays(value);

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Bildirim Takvimi
      </p>

      {/* Milestone rows */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {safe.milestones.map((m, i) => (
          <div
            key={m.daysBeforeDeadline}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={m.enabled}
              onChange={(e) => updateMilestone(m.daysBeforeDeadline, { enabled: e.target.checked })}
              style={{ accentColor: 'var(--violet)', width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text)', fontSize: 14, minWidth: 90 }}>
              {m.daysBeforeDeadline} gün önce
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Saat</span>
            <input
              type="number"
              min={0}
              max={23}
              value={m.sendHour}
              disabled={!m.enabled}
              onChange={(e) =>
                updateMilestone(m.daysBeforeDeadline, {
                  sendHour: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)),
                })
              }
              style={{
                width: 56, padding: '4px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: m.enabled ? 'var(--text)' : 'var(--muted)',
                fontSize: 14, textAlign: 'center',
                opacity: m.enabled ? 1 : 0.4,
              }}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>:00</span>
          </div>
        ))}
      </div>

      {/* Last-week interval */}
      <div
        style={{
          marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="checkbox"
            checked={safe.lastWeekEnabled}
            onChange={(e) => onChange({ ...safe, lastWeekEnabled: e.target.checked })}
            style={{ accentColor: 'var(--violet)', width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ color: 'var(--text)', fontSize: 14 }}>Son hafta aralıklı bildirim</span>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Her</span>
          <input
            type="number"
            min={4}
            max={48}
            step={4}
            value={safe.lastWeekIntervalHours}
            disabled={!safe.lastWeekEnabled}
            onChange={(e) =>
              onChange({
                ...safe,
                lastWeekIntervalHours: Math.min(48, Math.max(4, parseInt(e.target.value) || 12)),
              })
            }
            style={{
              width: 56, padding: '4px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: safe.lastWeekEnabled ? 'var(--text)' : 'var(--muted)',
              fontSize: 14, textAlign: 'center',
              opacity: safe.lastWeekEnabled ? 1 : 0.4,
            }}
          />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>saatte bir</span>
        </div>
        <p style={{ marginTop: 6, marginLeft: 28, fontSize: 11, color: 'var(--muted)' }}>
          Son 7 günde bu sıklıkta hatırlatma gönderilir.
        </p>
      </div>
    </div>
  );
}
