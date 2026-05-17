import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/auth';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(password)) {
      navigate('/awards', { replace: true });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPassword('');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#07070c',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#12121f', border: '1px solid #2a2a4a',
          borderRadius: 12, padding: 40, width: 340,
          animation: shake ? 'shake 0.4s ease' : undefined,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>Final Call Admin</h1>
        </div>
        <div className="field">
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin şifresi"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }}>
          Giriş Yap
        </button>
      </form>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
