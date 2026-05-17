import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../lib/auth';

const links = [
  { to: '/awards',        label: '🏆 Ödüller' },
  { to: '/articles',      label: '📰 Haberler' },
  { to: '/tips',          label: '💡 İpuçları' },
  { to: '/notifications', label: '🔔 Bildirim Gönder' },
  { to: '/stats',         label: '📊 İstatistik' },
];

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <nav style={{
      background: '#12121f',
      borderBottom: '1px solid #2a2a4a',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      height: 48,
    }}>
      <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, marginRight: 16 }}>⚡ FINAL CALL</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            color: isActive ? '#fff' : '#888899',
            background: isActive ? '#7c3aed' : 'transparent',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 13,
            textDecoration: 'none',
            fontWeight: isActive ? 600 : 400,
          })}
        >
          {l.label}
        </NavLink>
      ))}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        style={{ marginLeft: 'auto', background: 'transparent', color: '#f87171', border: 'none', fontSize: 13 }}
      >
        Çıkış
      </button>
    </nav>
  );
}
