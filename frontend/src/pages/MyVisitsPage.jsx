import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingImage from '../components/ListingImage.jsx';
import api from '../lib/api.js';

const STATUS_COLORS = {
  Requested: 'bg-yellow-100 text-yellow-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  Visited: 'bg-purple-100 text-purple-800',
  Interested: 'bg-green-100 text-green-800',
  NotInterested: 'bg-red-100 text-red-800',
  CancelRequested: 'bg-orange-100 text-orange-800',
  Cancelled: 'bg-gray-100 text-gray-800',
};

export default function MyVisitsPage() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetch = () => {
    api.get('/visits/mine').then((r) => { setVisits(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const cancelVisit = async (id) => {
    try {
      await api.patch(`/visits/${id}/cancel`);
      setMsg('Cancel request sent.');
      setError('');
      fetch();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to cancel visit');
    }
  };

  const markVisited = async (id) => {
    try {
      await api.patch(`/visits/${id}/visited`);
      setMsg('Visit marked as visited.');
      setError('');
      fetch();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to mark visit as visited');
    }
  };

  const setInterest = async (id, status) => {
    try {
      await api.patch(`/visits/${id}/interest`, { status });
      setMsg(`Visit updated: ${status}`);
      setError('');
      fetch();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update visit decision');
    }
  };

  const initiateMoveIn = async (visitId) => {
    try {
      const response = await api.post('/move-in', { visitId });
      navigate('/move-ins', { state: { focusMoveInId: response.data?.data?._id } });
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to initiate move-in');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">My Visits</h2>
      {msg && <p className="text-sm mb-3" style={{ color: 'var(--color-success)' }}>{msg}</p>}
      {error && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {visits.length === 0 ? <p className="muted">No visit requests yet.</p> : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v._id} className="listing-inline-card surface-card">
              <div className="listing-inline-media">
                <ListingImage listing={v.listing} variant="panel" fallbackLabel="Listing image pending" />
              </div>
              <div className="listing-inline-copy">
                <p className="font-semibold">{v.listing?.title || 'Listing'}</p>
                <p className="text-sm muted">{v.listing?.locationText}</p>
                <p className="text-xs muted">Requested: {new Date(v.requestedDate).toLocaleDateString()}</p>
                {v.scheduledDate ? <p className="text-xs">Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}</p> : null}
                {v.adminNotes ? <p className="text-xs muted mt-1">Admin note: {v.adminNotes}</p> : null}
              </div>
              <div className="listing-inline-actions">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[v.status] || 'bg-gray-100'}`}>{v.status}</span>
                {['Requested', 'Scheduled'].includes(v.status) && (
                  <button onClick={() => cancelVisit(v._id)} className="btn btn-tertiary">Cancel</button>
                )}
                {v.status === 'Scheduled' && (
                  <button onClick={() => markVisited(v._id)} className="btn btn-primary">Mark visited</button>
                )}
                {v.status === 'Visited' && (
                  <>
                    <button onClick={() => setInterest(v._id, 'Interested')} className="btn btn-primary">Interested</button>
                    <button onClick={() => setInterest(v._id, 'NotInterested')} className="btn btn-secondary">Not interested</button>
                  </>
                )}
                {v.status === 'Interested' && (
                  <button onClick={() => initiateMoveIn(v._id)} className="btn btn-primary">
                    Continue to move-ins
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
