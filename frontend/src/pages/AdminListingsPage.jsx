import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    locationText: '',
    budget: '',
    moveInDate: '',
    amenities: '',
    inventoryTemplate: '',
    status: 'Draft',
  });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetch = () => {
    api.get('/listings').then((r) => { setListings(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      locationText: '',
      budget: '',
      moveInDate: '',
      amenities: '',
      inventoryTemplate: '',
      status: 'Draft',
    });
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    const body = {
      ...form,
      budget: Number(form.budget),
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      inventoryTemplate: form.inventoryTemplate.split(',').map((item) => item.trim()).filter(Boolean),
    };
    try {
      if (editId) {
        await api.put(`/listings/${editId}`, body);
        setMsg('Listing updated!');
      } else {
        await api.post('/listings', body);
        setMsg('Listing created!');
      }
      resetForm();
      fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const startEdit = (l) => {
    setForm({
      title: l.title,
      description: l.description,
      locationText: l.locationText,
      budget: l.budget,
      moveInDate: l.moveInDate?.slice(0, 10),
      amenities: l.amenities?.join(', ') || '',
      inventoryTemplate: l.inventoryTemplate?.map((entry) => entry.item).join(', ') || '',
      status: l.status,
    });
    setEditId(l._id);
    setShowForm(true);
  };

  const deleteListing = async (id) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      fetch();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const VALID_TRANSITIONS = {
    Draft: ['Review'],
    Review: ['Published', 'Draft'],
    Published: ['Draft'],
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Manage Listings</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ New Listing'}
        </button>
      </div>

      {showForm && (
        <div className="surface-card p-4 mb-6 space-y-3">
          <input placeholder="Title" className="input" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" rows="3" className="textarea" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Location" className="input" value={form.locationText}
              onChange={(e) => setForm({ ...form, locationText: e.target.value })} />
            <input placeholder="Budget (₹)" type="number" className="input" value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="input" value={form.moveInDate}
              onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />
            <input placeholder="Amenities (comma-separated)" className="input" value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </div>
          <input
            placeholder="Inventory checklist items (comma-separated)"
            className="input"
            value={form.inventoryTemplate}
            onChange={(e) => setForm({ ...form, inventoryTemplate: e.target.value })}
          />
          {editId && (
            <select className="select" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value={form.status}>{form.status} (current)</option>
              {(VALID_TRANSITIONS[form.status] || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={save} className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
        </div>
      )}

      {msg && <p className="text-sm mb-2" style={{ color: 'var(--color-success)' }}>{msg}</p>}

      <div className="space-y-3">
        {listings.map((l) => (
          <div key={l._id} className="surface-card p-4 flex justify-between items-center gap-3">
            <div>
              <p className="font-semibold">{l.title}</p>
              <p className="text-sm muted">{l.locationText} — ₹{l.budget}/month</p>
              <p className="text-xs muted">Status: {l.status} · {new Date(l.moveInDate).toLocaleDateString()}</p>
              <p className="text-xs muted">
                Inventory: {(l.inventoryTemplate || []).map((item) => item.item).join(', ') || 'Not set'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(l)} className="btn btn-secondary">Edit</button>
              <button onClick={() => deleteListing(l._id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
