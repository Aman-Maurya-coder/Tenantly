import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function AdminMoveInsPage() {
  const [moveIns, setMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/move-in').then((r) => { setMoveIns(r.data.data); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Manage Move-Ins</h2>
      {moveIns.length === 0 ? <p className="muted">No move-ins.</p> : (
        <div className="space-y-3">
          {moveIns.map((m) => (
            <Link to={`/move-in/${m._id}`} key={m._id} className="surface-card p-4 block">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{m.listing?.title || 'Listing'}</p>
                  <p className="text-sm muted">Tenant: {m.tenant}</p>
                  <p className="text-xs muted">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="badge badge-info">{m.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
