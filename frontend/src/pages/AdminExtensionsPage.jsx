import { useEffect, useState } from 'react';
import api from '../lib/api.js';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function AdminExtensionsPage() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/extensions').then((r) => { setExtensions(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const decide = async (id, status) => {
    try {
      await api.patch(`/extensions/${id}/decide`, { status });
      fetch();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Extensions</h2>
      {extensions.length === 0 ? <p className="text-gray-500">No extension requests.</p> : (
        <div className="space-y-3">
          {extensions.map((e) => (
            <div key={e._id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{e.listing?.title || 'Listing'}</p>
                  <p className="text-sm text-gray-500">Tenant: {e.tenant}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.currentEndDate).toLocaleDateString()} → {new Date(e.requestedEndDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">{e.reason}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[e.status]}`}>{e.status}</span>
              </div>

              {e.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => decide(e._id, 'approved')} className="text-xs bg-green-100 hover:bg-green-200 px-3 py-1 rounded">Approve</button>
                  <button onClick={() => decide(e._id, 'rejected')} className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
