import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function MyMoveInsPage() {
  const [moveIns, setMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/move-in/mine').then((r) => { setMoveIns(r.data.data); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Move-Ins</h2>
      {moveIns.length === 0 ? <p className="text-gray-500">No move-ins yet. Get a visit accepted first!</p> : (
        <div className="space-y-3">
          {moveIns.map((m) => (
            <Link to={`/move-in/${m._id}`} key={m._id} className="bg-white p-4 rounded shadow block hover:shadow-md">
              <p className="font-semibold">{m.listing?.title || 'Listing'}</p>
              <p className="text-sm text-gray-500">Status: <span className="font-medium">{m.status}</span></p>
              <p className="text-xs text-gray-400">Created: {new Date(m.createdAt).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
