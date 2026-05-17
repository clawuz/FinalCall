interface Case { title: string; description: string; videoUrl?: string; }
interface PreviousWinners { title: string; description: string; cases: Case[]; }

interface Props {
  value?: PreviousWinners;
  onChange: (v: PreviousWinners | undefined) => void;
}

const emptyCase = (): Case => ({ title: '', description: '', videoUrl: '' });

export default function PreviousWinnersEditor({ value, onChange }: Props) {
  const enabled = !!value;

  function toggle() {
    if (enabled) {
      onChange(undefined);
    } else {
      onChange({ title: '', description: '', cases: [emptyCase()] });
    }
  }

  function updateField(field: 'title' | 'description', v: string) {
    if (!value) return;
    onChange({ ...value, [field]: v });
  }

  function updateCase(i: number, field: keyof Case, v: string) {
    if (!value) return;
    const cases = [...value.cases];
    cases[i] = { ...cases[i], [field]: v };
    onChange({ ...value, cases });
  }

  function addCase() {
    if (!value || value.cases.length >= 10) return;
    onChange({ ...value, cases: [...value.cases, emptyCase()] });
  }

  function removeCase(i: number) {
    if (!value) return;
    onChange({ ...value, cases: value.cases.filter((_, j) => j !== i) });
  }

  return (
    <div style={{ border: '1px solid #2a2a4a', borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: enabled ? 16 : 0 }}>
        <span style={{ fontWeight: 500, color: '#a78bfa', fontSize: 13 }}>🏆 Geçen Yıl Kazananları</span>
        <button type="button" className={enabled ? 'btn-danger' : 'btn-ghost'} onClick={toggle} style={{ padding: '4px 10px', fontSize: 12 }}>
          {enabled ? 'Kaldır' : '+ Ekle'}
        </button>
      </div>

      {enabled && value && (
        <>
          <div className="field">
            <label>Bölüm Başlığı</label>
            <input value={value.title} onChange={(e) => updateField('title', e.target.value)} placeholder="2024 Grand Prix & Gold Winners" />
          </div>
          <div className="field">
            <label>Açıklama</label>
            <textarea value={value.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Kısa tanıtım..." rows={2} />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Case'ler ({value.cases.length}/10)</span>
              {value.cases.length < 10 && (
                <button type="button" className="btn-ghost" onClick={addCase} style={{ padding: '3px 8px', fontSize: 11 }}>+ Case Ekle</button>
              )}
            </div>
            {value.cases.map((c, i) => (
              <div key={i} style={{ background: '#0a0a14', borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#666' }}>Case {i + 1}</span>
                  <button type="button" onClick={() => removeCase(i)} style={{ background: 'transparent', color: '#f87171', fontSize: 11, padding: 0, border: 'none' }}>Sil</button>
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <input value={c.title} onChange={(e) => updateCase(i, 'title', e.target.value)} placeholder="The Last Photo — Dove" />
                </div>
                <div className="field" style={{ marginBottom: 8 }}>
                  <textarea value={c.description} onChange={(e) => updateCase(i, 'description', e.target.value)} placeholder="1-2 cümle açıklama..." rows={2} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input value={c.videoUrl ?? ''} onChange={(e) => updateCase(i, 'videoUrl', e.target.value)} placeholder="YouTube/Vimeo URL (opsiyonel)" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
