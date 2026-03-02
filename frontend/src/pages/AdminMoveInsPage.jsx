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
      <h2 className="text-2xl font-bold mb-4">Manage Move-Ins</h2>
      {moveIns.length === 0 ? <p className="text-gray-500">No move-ins.</p> : (
        <div className="space-y-3">
          {moveIns.map((m) => (
            <Link to={`/move-in/${m._id}`} key={m._id} className="bg-white p-4 rounded shadow block hover:shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{m.listing?.title || 'Listing'}</p>
                  <p className="text-sm text-gray-500">Tenant: {m.tenant}</p>
                  <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-medium text-blue-600">{m.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
