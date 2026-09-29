import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { healthAPI } from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();
  const [securityMode, setSecurityMode] = useState('');

  useEffect(() => {
    healthAPI.check()
      .then(({ data }) => setSecurityMode(data.mode))
      .catch(() => {});
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

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
