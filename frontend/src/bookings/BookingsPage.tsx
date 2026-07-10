import { useEffect, useState } from 'react';
import { bookingsApi, Booking } from './api';
import CreateModal from './CreateModal';
import StatusModal from './StatusModal';
import Spinner from '../shared/Spinner';

export default function BookingsPage() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ id: string; current: string } | null>(null);

  const limit = 10;

  const fetchBookings = () => {
    setLoading(true);
    bookingsApi.list({ page, limit, search: searchQuery || undefined, status: statusFilter || undefined })
      .then(res => {
        setAllBookings(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotal(res.meta?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [page, statusFilter, searchQuery]);

  const handleSearch = () => { setSearchQuery(search); setPage(1); };

  const statusBadge = (status: string) => {
    const cls = `badge badge-${status.toLowerCase()}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2>📋 Bookings</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Booking</button>
      </div>

      <div className="filters">
        <input placeholder="Search by customer name..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={handleSearch}>Search</button>
      </div>

      <div className="card">
        {loading ? <Spinner text="Loading bookings..." /> : (
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Customer</th><th>Email</th><th>Phone</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {allBookings.length === 0 ? (
                  <tr><td colSpan={8} className="text-center" style={{ padding: 32, color: '#94a3b8' }}>No bookings found</td></tr>
                ) : allBookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.customerName}</strong></td>
                    <td>{b.customerEmail}</td>
                    <td>{b.customerPhone}</td>
                    <td>{b.service?.title || '—'}</td>
                    <td>{b.bookingDate}</td>
                    <td>{b.bookingTime}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setStatusTarget({ id: b.id, current: b.status })}>
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            <span>{total} total</span>
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchBookings(); }} />}
      {statusTarget && (
        <StatusModal
          bookingId={statusTarget.id}
          currentStatus={statusTarget.current}
          onClose={() => setStatusTarget(null)}
          onUpdated={() => { setStatusTarget(null); fetchBookings(); }}
        />
      )}
    </div>
  );
}
