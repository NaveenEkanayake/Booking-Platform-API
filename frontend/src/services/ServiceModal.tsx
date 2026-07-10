import { useState } from 'react';
import { servicesApi, Service } from './api';

interface ServiceModalProps {
  editing: Service | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ServiceModal({ editing, onClose, onSaved }: ServiceModalProps) {
  const [title, setTitle] = useState(editing?.title || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [duration, setDuration] = useState(editing?.duration || 60);
  const [price, setPrice] = useState(Number(editing?.price) || 0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editing) {
        await servicesApi.update(editing.id, { title, description, duration, price });
      } else {
        await servicesApi.create({ title, description, duration, price });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{editing ? 'Edit Service' : 'New Service'}</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Service name" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the service..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} required />
            </div>
            <div className="form-group">
              <label>Price ($) *</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0} step="0.01" required />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner-inline" /> {editing ? 'Updating...' : 'Creating...'}</> : editing ? 'Update' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
