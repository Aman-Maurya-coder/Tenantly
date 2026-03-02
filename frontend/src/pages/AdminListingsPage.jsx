import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', locationText: '', budget: '', moveInDate: '', amenities: '', status: 'Draft' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetch = () => {
    api.get('/listings').then((r) => { setListings(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const resetForm = () => {
    setForm({ title: '', description: '', locationText: '', budget: '', moveInDate: '', amenities: '', status: 'Draft' });
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    const body = {
      ...form,
      budget: Number(form.budget),
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
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
        <h2 className="text-2xl font-bold">Manage Listings</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          {showForm ? 'Cancel' : '+ New Listing'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <input placeholder="Title" className="border px-3 py-2 rounded w-full" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" rows="3" className="border px-3 py-2 rounded w-full" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Location" className="border px-3 py-2 rounded" value={form.locationText}
              onChange={(e) => setForm({ ...form, locationText: e.target.value })} />
            <input placeholder="Budget (₹)" type="number" className="border px-3 py-2 rounded" value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="border px-3 py-2 rounded" value={form.moveInDate}
              onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />
            <input placeholder="Amenities (comma-separated)" className="border px-3 py-2 rounded" value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </div>
          {editId && (
            <select className="border px-3 py-2 rounded w-full" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value={form.status}>{form.status} (current)</option>
              {(VALID_TRANSITIONS[form.status] || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">{editId ? 'Update' : 'Create'}</button>
        </div>
      )}

      {msg && <p className="text-sm text-green-600 mb-2">{msg}</p>}

      <div className="space-y-3">
        {listings.map((l) => (
          <div key={l._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <p className="font-semibold">{l.title}</p>
              <p className="text-sm text-gray-500">{l.locationText} — ₹{l.budget}/mo</p>
              <p className="text-xs text-gray-400">Status: {l.status} · {new Date(l.moveInDate).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(l)} className="text-xs text-blue-600 hover:underline">Edit</button>
              <button onClick={() => deleteListing(l._id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
