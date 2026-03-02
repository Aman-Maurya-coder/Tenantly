import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [msg, setMsg] = useState('');

  const fetch = () => {
    api.get('/support/mine').then((r) => { setTickets(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const create = async () => {
    try {
      await api.post('/support', form);
      setMsg('Ticket created!');
      setShowForm(false);
      setForm({ subject: '', category: 'general', message: '' });
      fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const reopen = async (id) => {
    try {
      await api.patch(`/support/${id}/reopen`);
      fetch();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (loading) return <p>Loading...</p>;

  const STATUS_COLORS = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    reopened: 'bg-orange-100 text-orange-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Support Tickets</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          {showForm ? 'Cancel' : '+ New Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <input placeholder="Subject" className="border px-3 py-2 rounded w-full" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <select className="border px-3 py-2 rounded w-full" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">General</option>
            <option value="visit">Visit</option>
            <option value="listing">Listing</option>
            <option value="move-in">Move-In</option>
          </select>
          <textarea placeholder="Describe your issue..." rows="3" className="border px-3 py-2 rounded w-full" value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
        </div>
      )}

      {msg && <p className="text-sm text-green-600 mb-2">{msg}</p>}

      {tickets.length === 0 ? <p className="text-gray-500">No tickets yet.</p> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link to={`/ticket/${t._id}`} key={t._id} className="bg-white p-4 rounded shadow block hover:shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{t.subject}</p>
                  <p className="text-xs text-gray-400">{t.category} · {new Date(t.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                  {t.status === 'resolved' && (
                    <button onClick={(e) => { e.preventDefault(); reopen(t._id); }} className="text-xs text-orange-600 hover:underline">Reopen</button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
