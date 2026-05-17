import { useEffect } from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
  onDone: () => void;
}

export default function Toast({ message, type, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      background: type === 'success' ? '#1a2e1a' : '#2e1a1a',
      border: `1px solid ${type === 'success' ? '#4ade80' : '#f87171'}`,
      color: type === 'success' ? '#4ade80' : '#f87171',
      borderRadius: 8, padding: '10px 18px', fontWeight: 500, fontSize: 13,
    }}>
      {message}
    </div>
  );
}
