import { useEffect, useState } from 'react';
import api from '../lib/api.js';

export default function MyExtensionsPage() {
  const [extensions, setExtensions] = useState([]);
  const [eligibleMoveIns, setEligibleMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMoveInId, setActiveMoveInId] = useState('');
  const [form, setForm] = useState({ currentEndDate: '', requestedEndDate: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetch = () => {
    Promise.all([
      api.get('/extensions/mine'),
      api.get('/extensions/eligible'),
    ]).then(([ext, mi]) => {
      setExtensions(ext.data.data);
      setEligibleMoveIns(mi.data.data);
      setLoading(false);
    }).catch(console.error);
  };
  useEffect(fetch, []);

  const create = async () => {
    try {
      await api.post('/extensions', { ...form, moveInId: activeMoveInId });
      setMsg('Extension requested!');
      setError('');
      setActiveMoveInId('');
      setForm({ currentEndDate: '', requestedEndDate: '', reason: '' });
      fetch();
    } catch (e) { setError(e.response?.data?.message || 'Error'); }
  };

  const cancel = async (id) => {
    try {
      await api.patch(`/extensions/${id}/cancel`);
      setError('');
      fetch();
    } catch (e) { setError(e.response?.data?.message || 'Error'); }
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
        <h2 className="text-3xl font-bold">Stay Extensions</h2>
      </div>

      <div className="surface-card p-4 mb-6">
        <h3 className="text-xl font-semibold mb-3">Initiate extension from moved-in listings</h3>
        {eligibleMoveIns.length === 0 ? (
          <p className="muted text-sm">No completed move-ins available for extension requests yet.</p>
        ) : (
          <div className="space-y-3">
            {eligibleMoveIns.map((moveIn) => (
              <button
                key={moveIn._id}
                className="w-full text-left p-3 rounded border"
                style={{ borderColor: activeMoveInId === moveIn._id ? 'var(--color-fg)' : 'var(--color-border)' }}
                onClick={() => setActiveMoveInId(moveIn._id)}
              >
                <p className="font-semibold">{moveIn.listing?.title || 'Listing'}</p>
                <p className="text-sm muted">{moveIn.listing?.locationText}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeMoveInId && (
        <div className="surface-card p-4 mb-6 space-y-3">
          <input type="date" placeholder="Current end date" className="input" value={form.currentEndDate}
            onChange={(e) => setForm({ ...form, currentEndDate: e.target.value })} />
          <input type="date" placeholder="Requested end date" className="input" value={form.requestedEndDate}
            onChange={(e) => setForm({ ...form, requestedEndDate: e.target.value })} />
          <textarea placeholder="Reason for extension..." rows="2" className="textarea" value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <button onClick={create} className="btn btn-primary">Submit extension request</button>
        </div>
      )}

      {msg && <p className="text-sm mb-2" style={{ color: 'var(--color-success)' }}>{msg}</p>}
      {error && <p className="text-sm mb-2" style={{ color: 'var(--color-error)' }}>{error}</p>}

      {extensions.length === 0 ? <p className="muted">No extension requests.</p> : (
        <div className="space-y-3">
          {extensions.map((e) => (
            <div key={e._id} className="surface-card p-4 flex justify-between items-center gap-3">
              <div>
                <p className="font-semibold">{e.listing?.title || 'Listing'}</p>
                <p className="text-xs muted">
                  {new Date(e.currentEndDate).toLocaleDateString()} → {new Date(e.requestedEndDate).toLocaleDateString()}
                </p>
                <p className="text-xs muted">{e.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                {e.status === 'pending' && (
                  <button onClick={() => cancel(e._id)} className="btn btn-danger">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
