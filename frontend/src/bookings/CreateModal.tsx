import { useState, useEffect, FormEvent } from 'react';
import { servicesApi, Service } from '../services/api';
import { bookingsApi } from './api';

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [svcs, setSvcs] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { servicesApi.list({ isActive: true }).then(setSvcs); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await bookingsApi.create({
        customerName: name, customerEmail: email, customerPhone: phone,
        serviceId, bookingDate: date, bookingTime: time,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New Booking</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Customer Name *</label><input value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Phone *</label><input value={phone} onChange={e => setPhone(e.target.value)} required /></div>
          </div>
          <div className="form-group">
            <label>Service *</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)} required>
              <option value="">Select a service...</option>
              {svcs.map(s => <option key={s.id} value={s.id}>{s.title} - ${Number(s.price).toFixed(2)}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
            <div className="form-group"><label>Time *</label><input type="time" value={time} onChange={e => setTime(e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <><span className="spinner-inline" /> Creating...</> : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
