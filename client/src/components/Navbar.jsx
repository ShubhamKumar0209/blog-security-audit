import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { healthAPI } from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const [securityMode, setSecurityMode] = useState('');
  const [showPayloads, setShowPayloads] = useState(false);

  useEffect(() => {
    healthAPI.check()
      .then(({ data }) => setSecurityMode(data.mode))
      .catch(() => {});
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const copyPayload = (payload) => {
    navigator.clipboard.writeText(payload);
    alert('Payload copied to clipboard!');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="logo-icon">🛡️</span>
          SecureBlog
          {securityMode && (
            <span className={`security-badge ${securityMode === 'baseline' ? 'badge-baseline' : 'badge-hardened'}`}>
              {securityMode}
            </span>
          )}
        </Link>

        <div className="navbar-links">
          <div className="payloads-dropdown-container">
            <button 
              className="nav-btn-primary" 
              style={{ background: 'transparent', border: '1px solid var(--accent-primary)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
              onClick={() => setShowPayloads(!showPayloads)}
            >
              Test Payloads 🧪
            </button>
            {showPayloads && (
              <div className="payloads-dropdown">
                <div className="payload-item">
                  <strong>Image XSS (React-compatible)</strong>
                  <code onClick={() => copyPayload('<img src="x" onerror="alert(\'XSS Triggered!\')" />')} title="Click to copy">
                    &lt;img src="x" onerror="alert('XSS Triggered!')" /&gt;
                  </code>
                </div>
                <div className="payload-item">
                  <strong>Cookie Stealer XSS</strong>
                  <code onClick={() => copyPayload('<img src="x" onerror="alert(document.cookie)" />')} title="Click to copy">
                    &lt;img src="x" onerror="alert(document.cookie)" /&gt;
                  </code>
                </div>
                <div className="payload-item">
                  <strong>Iframe Injection</strong>
                  <code onClick={() => copyPayload('<iframe src="javascript:alert(\'Iframe XSS!\')"></iframe>')} title="Click to copy">
                    &lt;iframe src="javascript:alert('Iframe XSS!')"&gt;&lt;/iframe&gt;
                  </code>
                </div>
              </div>
            )}
          </div>

          <Link to="/" className={isActive('/')}>Home</Link>

          {isAuthenticated && (
            <Link to="/create" className={isActive('/create')}>Write</Link>
          )}

          {isAdmin && (
            <Link to="/admin" className={isActive('/admin')}>Admin</Link>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/profile" className={isActive('/profile')}>
                {user.name?.split(' ')[0]}
              </Link>
              <button onClick={logout} className="nav-btn-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login')}>Login</Link>
              <Link to="/register" className="nav-btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
