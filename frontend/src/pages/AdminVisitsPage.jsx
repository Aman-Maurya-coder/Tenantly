import { useEffect, useState } from 'react';
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

const ADMIN_TRANSITIONS = {
  Requested: ['Scheduled'],
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
      <h2 className="text-3xl font-bold mb-4">Manage Visits</h2>
      {visits.length === 0 ? <p className="muted">No visit requests.</p> : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v._id} className="listing-inline-card surface-card">
              <div className="listing-inline-media">
                <ListingImage listing={v.listing} variant="panel" fallbackLabel="Listing image pending" />
              </div>

              <div className="listing-inline-copy">
                <p className="font-semibold">{v.listing?.title || 'Listing'}</p>
                <p className="text-sm muted">Tenant: {v.tenant}</p>
                <p className="text-xs muted">Requested: {new Date(v.requestedDate).toLocaleDateString()}</p>
                {v.scheduledDate ? <p className="text-xs">Scheduled: {new Date(v.scheduledDate).toLocaleDateString()}</p> : null}
                {v.tenantNotes ? <p className="text-xs muted mt-1">Tenant note: {v.tenantNotes}</p> : null}
              </div>

              <div className="listing-inline-actions">
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                {ADMIN_TRANSITIONS[v.status] ? (
                  <div className="flex gap-2 flex-wrap items-center justify-end">
                  {v.status === 'Requested' && (
                    <input type="date" className="input max-w-44"
                      value={scheduleInputs[v._id] || ''}
                      onChange={(e) => setScheduleInputs({ ...scheduleInputs, [v._id]: e.target.value })} />
                  )}
                  {ADMIN_TRANSITIONS[v.status].map((s) => (
                    <button key={s} onClick={() => {
                      const extra = s === 'Scheduled' ? { scheduledDate: scheduleInputs[v._id] } : {};
                      updateStatus(v._id, s, extra);
                    }} className="btn btn-secondary">{s}</button>
                  ))}
                  </div>
                ) : null}

                {['Visited', 'Interested', 'NotInterested'].includes(v.status) ? (
                  <p className="text-xs muted text-right max-w-xs">
                  Tenant now controls visit completion and interest decisions.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
