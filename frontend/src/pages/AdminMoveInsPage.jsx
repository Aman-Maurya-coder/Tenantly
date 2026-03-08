import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingImage from '../components/ListingImage.jsx';
import api from '../lib/api.js';

const MOVE_IN_STATUS_BADGES = {
  initiated: 'badge badge-warning',
  submitted: 'badge badge-info',
  completed: 'badge badge-success',
};

export default function AdminMoveInsPage() {
  const [moveIns, setMoveIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMoveIns = () => {
    api.get('/move-in').then((r) => {
      setMoveIns(r.data.data);
      setLoading(false);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message || 'Unable to load move-ins');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMoveIns();
  }, []);

  const approveMoveIn = async (moveInId) => {
    try {
      await api.patch(`/move-in/${moveInId}/approve`);
      setError('');
      fetchMoveIns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to approve move-in');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Manage Move-Ins</h2>
      {error ? <p className="form-alert form-alert--error mb-3">{error}</p> : null}
      {moveIns.length === 0 ? <p className="muted">No move-ins.</p> : (
        <div className="space-y-3">
          {moveIns.map((m) => (
            <article key={m._id} className="listing-inline-card surface-card">
              <div className="listing-inline-media">
                <ListingImage listing={m.listing} variant="panel" fallbackLabel="Listing image pending" />
              </div>
              <div className="listing-inline-copy">
                <p className="font-semibold">{m.listing?.title || 'Listing'}</p>
                <p className="text-sm muted">Tenant: {m.tenant}</p>
                <p className="text-sm muted">Move-in workflow status is visible here without opening the record.</p>
                <p className="text-xs muted">{new Date(m.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="listing-inline-actions">
                <span className={MOVE_IN_STATUS_BADGES[m.status] || 'badge badge-info'}>{m.status}</span>
                <Link to={`/move-in/${m._id}`} className="btn btn-secondary">Review</Link>
                {m.status === 'submitted' ? <button onClick={() => approveMoveIn(m._id)} className="btn btn-primary" type="button">Approve</button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
