import { useEffect, useState } from 'react';
import ListingImage from '../components/ListingImage.jsx';
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
      <h2 className="text-3xl font-bold mb-4">Manage Extensions</h2>
      {extensions.length === 0 ? <p className="muted">No extension requests.</p> : (
        <div className="space-y-3">
          {extensions.map((e) => (
            <div key={e._id} className="listing-inline-card surface-card">
              <div className="listing-inline-media">
                <ListingImage listing={e.listing} variant="panel" fallbackLabel="Listing image pending" />
              </div>

              <div className="listing-inline-copy">
                <p className="font-semibold">{e.listing?.title || 'Listing'}</p>
                <p className="text-sm muted">Tenant: {e.tenant}</p>
                <p className="text-xs muted">
                    {new Date(e.currentEndDate).toLocaleDateString()} → {new Date(e.requestedEndDate).toLocaleDateString()}
                </p>
                <p className="text-xs muted">{e.reason}</p>
              </div>

              <div className="listing-inline-actions">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                {e.status === 'pending' ? (
                  <div className="flex gap-2">
                  <button onClick={() => decide(e._id, 'approved')} className="btn btn-primary">Approve</button>
                  <button onClick={() => decide(e._id, 'rejected')} className="btn btn-danger">Reject</button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
