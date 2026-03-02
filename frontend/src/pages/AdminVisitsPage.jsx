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

const ADMIN_TRANSITIONS = {
  Requested: ['Scheduled'],
  Scheduled: ['Visited'],
  Visited: ['Interested', 'NotInterested'],
  CancelRequested: ['Cancelled'],
};

export default function AdminVisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleInputs, setScheduleInputs] = useState({});

  const fetch = () => {
    api.get('/visits').then((r) => { setVisits(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const updateStatus = async (id, status, extra = {}) => {
    try {
      await api.patch(`/visits/${id}/status`, { status, ...extra });
      fetch();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Visits</h2>
      {visits.length === 0 ? <p className="text-gray-500">No visit requests.</p> : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v._id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{v.listing?.title || 'Listing'}</p>
                  <p className="text-sm text-gray-500">Tenant: {v.tenant}</p>
                  <p className="text-xs text-gray-400">Requested: {new Date(v.requestedDate).toLocaleDateString()}</p>
                  {v.scheduledDate && <p className="text-xs text-blue-500">Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}</p>}
                  {v.tenantNotes && <p className="text-xs text-gray-400 mt-1">Tenant note: {v.tenantNotes}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[v.status]}`}>{v.status}</span>
              </div>

              {ADMIN_TRANSITIONS[v.status] && (
                <div className="mt-3 flex gap-2 flex-wrap items-center">
                  {v.status === 'Requested' && (
                    <input type="date" className="border px-2 py-1 rounded text-sm"
                      value={scheduleInputs[v._id] || ''}
                      onChange={(e) => setScheduleInputs({ ...scheduleInputs, [v._id]: e.target.value })} />
                  )}
                  {ADMIN_TRANSITIONS[v.status].map((s) => (
                    <button key={s} onClick={() => {
                      const extra = s === 'Scheduled' ? { scheduledDate: scheduleInputs[v._id] } : {};
                      updateStatus(v._id, s, extra);
                    }} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">{s}</button>
                  ))}
                </div>
              )}

              {v.status === 'Interested' && (
                <p className="mt-2 text-xs text-green-400">
                  Visit accepted. Tenant can now click <strong>Initiate Move-In</strong> on their My Visits page.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
