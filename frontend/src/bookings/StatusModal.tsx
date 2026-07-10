import { useState } from 'react';
import { bookingsApi, BookingStatus } from './api';

interface StatusModalProps {
  bookingId: string;
  currentStatus: string;
  onClose: () => void;
  onUpdated: () => void;
}

const allowedTransitions: Record<string, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
};

export default function StatusModal({ bookingId, currentStatus, onClose, onUpdated }: StatusModalProps) {
  const [newStatus, setNewStatus] = useState<BookingStatus>('CONFIRMED');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      await bookingsApi.updateStatus(bookingId, newStatus);
      onUpdated();
    } catch (err: any) { setError(err.message); }
    finally { setUpdating(false); }
  };

  const transitions = allowedTransitions[currentStatus] || [];
  const statusBadge = (status: string) => {
    const cls = `badge badge-${status.toLowerCase()}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
        <h3>Update Status</h3>
        {error && <div className="error-msg">{error}</div>}
        <p style={{ marginBottom: 16, color: '#64748b' }}>
          Current: {statusBadge(currentStatus)}
        </p>
        {transitions.length === 0 ? (
          <p style={{ color: '#ef4444' }}>This booking cannot be updated.</p>
        ) : (
          <div className="form-group">
            <label>New Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as BookingStatus)}>
              {transitions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {transitions.length > 0 && (
            <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
              {updating ? <><span className="spinner-inline" /> Updating...</> : 'Update'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
