interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000, padding: '40px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#12121f', borderRadius: 12, padding: 24,
        width: '100%', maxWidth: wide ? 760 : 540,
        border: '1px solid #2a2a4a',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', color: '#888', fontSize: 18, padding: 0 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
