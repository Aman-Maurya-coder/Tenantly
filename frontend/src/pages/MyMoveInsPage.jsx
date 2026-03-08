import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ListingImage from '../components/ListingImage.jsx';
import api from '../lib/api.js';

const MOVE_IN_STATUS_BADGES = {
  initiated: 'badge badge-warning',
  submitted: 'badge badge-info',
  completed: 'badge badge-success',
};

export default function MyMoveInsPage() {
  const location = useLocation();
  const [moveIns, setMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/move-in/mine').then((r) => { setMoveIns(r.data.data); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">My Move-Ins</h2>
      {location.state?.focusMoveInId && <p className="text-sm mb-3" style={{ color: 'var(--color-success)' }}>Move-in initiated. Complete your submission below.</p>}
      {moveIns.length === 0 ? <p className="muted">No move-ins yet. Get a visit accepted first.</p> : (
        <div className="space-y-3">
          {moveIns.map((m) => (
            <article key={m._id} className="listing-inline-card surface-card">
              <div className="listing-inline-media">
                <ListingImage listing={m.listing} variant="panel" fallbackLabel="Listing image pending" />
              </div>
              <div className="listing-inline-copy">
                <p className="font-semibold">{m.listing?.title || 'Listing'}</p>
                <p className="text-sm muted">Move-in workflow status is shown directly on this card.</p>
                <p className="text-xs muted">Created: {new Date(m.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="listing-inline-actions">
                <span className={MOVE_IN_STATUS_BADGES[m.status] || 'badge badge-info'}>{m.status}</span>
                <Link to={`/move-in/${m._id}`} className="btn btn-secondary">Open move-in</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
