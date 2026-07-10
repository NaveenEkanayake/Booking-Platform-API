import { useEffect, useState } from 'react';
import { servicesApi, Service } from '../services/api';
import { bookingsApi, Booking } from '../bookings/api';
import Spinner from '../shared/Spinner';

interface DashboardStats {
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeServices: 0, totalBookings: 0, pendingBookings: 0, confirmedBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentServices, setRecentServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      servicesApi.list({ isActive: true }),
      bookingsApi.list({ limit: 5 }),
      bookingsApi.list({ status: 'PENDING', limit: 100 }),
      bookingsApi.list({ status: 'CONFIRMED', limit: 100 }),
      bookingsApi.list({ limit: 100 }),
    ]).then(([activeSvcs, recentBks, pending, confirmed, all]) => {
      const activeServicesArr = activeSvcs as Service[];
      const recentBookingsArr = (recentBks as any)?.data ?? recentBks;
      const pendingTotal = (pending as any)?.meta?.total ?? (pending as any)?.length ?? 0;
      const confirmedTotal = (confirmed as any)?.meta?.total ?? (confirmed as any)?.length ?? 0;
      const allTotal = (all as any)?.meta?.total ?? (all as any)?.length ?? 0;

      setStats({
        activeServices: activeServicesArr?.length || 0,
        totalBookings: allTotal,
        pendingBookings: pendingTotal,
        confirmedBookings: confirmedTotal,
      });
      setRecentBookings(Array.isArray(recentBookingsArr) ? recentBookingsArr.slice(0, 5) : []);
      setRecentServices(Array.isArray(activeServicesArr) ? activeServicesArr.slice(0, 5) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading dashboard..." fullPage />;

  const statusBadge = (status: string) => {
    const cls = `badge badge-${status.toLowerCase()}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontSize: 22 }}>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-value">{stats.activeServices}</div>
          <div className="stat-label">Active Services</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pendingBookings}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.confirmedBookings}</div>
          <div className="stat-label">Confirmed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><h2>Recent Services</h2></div>
          {recentServices.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No services yet. Create one to get started.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Title</th><th>Price</th><th>Duration</th></tr></thead>
                <tbody>
                  {recentServices.map(s => (
                    <tr key={s.id}><td>{s.title}</td><td>${Number(s.price).toFixed(2)}</td><td>{s.duration} min</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h2>Recent Bookings</h2></div>
          {recentBookings.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No bookings yet.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Customer</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.customerName}</td>
                      <td>{b.bookingDate}</td>
                      <td>{statusBadge(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
