import { useEffect, useState } from 'react';
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
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetch = () => {
    api.get('/visits/mine').then((r) => { setVisits(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const cancelVisit = async (id) => {
    try {
      await api.patch(`/visits/${id}/cancel`);
      setMsg('Cancel request sent.');
      fetch();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    }
  };

  const initiateMoveIn = async (visitId) => {
    try {
      await api.post('/move-in', { visitId });
      setMsg('Move-in initiated. Continue from Move-Ins page.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Unable to initiate move-in');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Visits</h2>
      {msg && <p className="text-sm text-blue-400 mb-3">{msg}</p>}
      {visits.length === 0 ? <p className="text-gray-500">No visit requests yet.</p> : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v._id} className="bg-white p-4 rounded shadow flex items-center justify-between">
              <div>
                <p className="font-semibold">{v.listing?.title || 'Listing'}</p>
                <p className="text-sm text-gray-500">{v.listing?.locationText}</p>
                <p className="text-xs text-gray-400">Requested: {new Date(v.requestedDate).toLocaleDateString()}</p>
                {v.scheduledDate && <p className="text-xs text-blue-500">Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}</p>}
                {v.adminNotes && <p className="text-xs text-gray-500 mt-1">Admin: {v.adminNotes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[v.status] || 'bg-gray-100'}`}>{v.status}</span>
                {['Requested', 'Scheduled'].includes(v.status) && (
                  <button onClick={() => cancelVisit(v._id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                )}
                {v.status === 'Interested' && (
                  <button onClick={() => initiateMoveIn(v._id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                    Initiate Move-In
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
