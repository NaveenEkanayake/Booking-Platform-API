import { useEffect, useState } from 'react';
import { servicesApi, Service } from './api';
import ServiceModal from './ServiceModal';
import Spinner from '../shared/Spinner';

export default function ServicesPage() {
  const [list, setList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const fetchServices = () => {
    setLoading(true);
    servicesApi.list({ search: search || undefined })
      .then(setList)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await servicesApi.remove(id);
      setShowDelete(null);
      fetchServices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSearch = () => { fetchServices(); };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <h2>🔧 Services</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Service</button>
      </div>

      <div className="filters">
        <input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn btn-secondary btn-sm" onClick={handleSearch}>Search</button>
      </div>

      <div className="card">
        {loading ? <Spinner text="Loading services..." /> : (
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Title</th><th>Description</th><th>Duration</th><th>Price</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={6} className="text-center" style={{ padding: 32, color: '#94a3b8' }}>No services found</td></tr>
                ) : list.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.title}</strong></td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description || '—'}</td>
                    <td>{s.duration} min</td>
                    <td>${Number(s.price).toFixed(2)}</td>
                    <td><span className={`badge ${s.isActive ? 'badge-completed' : 'badge-cancelled'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        {s.isActive && <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(s.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchServices(); }}
        />
      )}

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
            <h3>Delete Service?</h3>
            <p style={{ color: '#64748b', marginBottom: 20 }}>This will deactivate the service. Bookings for this service will still be accessible.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
