import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function MyExtensionsPage() {
  const [extensions, setExtensions] = useState([]);
  const [moveIns, setMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ moveInId: '', currentEndDate: '', requestedEndDate: '', reason: '' });
  const [msg, setMsg] = useState('');

  const fetch = () => {
    Promise.all([
      api.get('/extensions/mine'),
      api.get('/move-in/mine'),
    ]).then(([ext, mi]) => {
      setExtensions(ext.data.data);
      setMoveIns(mi.data.data.filter((m) => m.status === 'completed'));
      setLoading(false);
    }).catch(console.error);
  };
  useEffect(fetch, []);

  const create = async () => {
    try {
      await api.post('/extensions', form);
      setMsg('Extension requested!');
      setShowForm(false);
      setForm({ moveInId: '', currentEndDate: '', requestedEndDate: '', reason: '' });
      fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const cancel = async (id) => {
    try {
      await api.patch(`/extensions/${id}/cancel`);
      fetch();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (loading) return <p>Loading...</p>;

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Stay Extensions</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          {showForm ? 'Cancel' : '+ Request Extension'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <select className="border px-3 py-2 rounded w-full" value={form.moveInId}
            onChange={(e) => setForm({ ...form, moveInId: e.target.value })}>
            <option value="">Select completed move-in</option>
            {moveIns.map((m) => <option key={m._id} value={m._id}>{m.listing?.title || m._id}</option>)}
          </select>
          <input type="date" placeholder="Current end date" className="border px-3 py-2 rounded w-full" value={form.currentEndDate}
            onChange={(e) => setForm({ ...form, currentEndDate: e.target.value })} />
          <input type="date" placeholder="Requested end date" className="border px-3 py-2 rounded w-full" value={form.requestedEndDate}
            onChange={(e) => setForm({ ...form, requestedEndDate: e.target.value })} />
          <textarea placeholder="Reason for extension..." rows="2" className="border px-3 py-2 rounded w-full" value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
        </div>
      )}

      {msg && <p className="text-sm text-green-600 mb-2">{msg}</p>}

      {extensions.length === 0 ? <p className="text-gray-500">No extension requests.</p> : (
        <div className="space-y-3">
          {extensions.map((e) => (
            <div key={e._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-semibold">{e.listing?.title || 'Listing'}</p>
                <p className="text-xs text-gray-500">
                  {new Date(e.currentEndDate).toLocaleDateString()} → {new Date(e.requestedEndDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400">{e.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                {e.status === 'pending' && (
                  <button onClick={() => cancel(e._id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
