import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearTokens, request, User } from './api';
import Spinner from './Spinner';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    setProfileLoading(true);
    request<User>('GET', '/users/profile')
      .then(setUser)
      .finally(() => setProfileLoading(false));
  }, []);

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>📅 Booking</h1>
          <p>Management Platform</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">📊</span> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">🔧</span> <span>Services</span>
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">📋</span> <span>Bookings</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          {profileLoading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </>
          )}
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
