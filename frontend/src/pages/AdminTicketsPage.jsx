import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

const STATUS_COLORS = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  reopened: 'bg-orange-100 text-orange-800',
};

const ADMIN_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed', 'in_progress'],
  reopened: ['in_progress'],
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    Promise.all([
      api.get('/support'),
      api.get('/support/stats'),
    ]).then(([t, s]) => {
      setTickets(t.data.data);
      setStats(s.data.data);
      setLoading(false);
    }).catch(console.error);
  };
  useEffect(fetch, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/support/${id}/status`, { status });
      fetch();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Tickets</h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Object.entries(stats.statusCounts || {}).map(([k, v]) => (
            <div key={k} className="bg-white p-3 rounded shadow text-center">
              <p className="text-2xl font-bold">{v}</p>
              <p className="text-xs text-gray-500 capitalize">{k}</p>
            </div>
          ))}
          <div className="bg-white p-3 rounded shadow text-center">
            <p className="text-2xl font-bold">{stats.unresolved}</p>
            <p className="text-xs text-gray-500">Unresolved</p>
          </div>
          {stats.avgFirstResponseMinutes !== null && (
            <div className="bg-white p-3 rounded shadow text-center">
              <p className="text-2xl font-bold">{Math.round(stats.avgFirstResponseMinutes)}</p>
              <p className="text-xs text-gray-500">Avg Response (min)</p>
            </div>
          )}
        </div>
      )}

      {tickets.length === 0 ? <p className="text-gray-500">No tickets.</p> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t._id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <Link to={`/ticket/${t._id}`}>
                  <p className="font-semibold hover:underline">{t.subject}</p>
                  <p className="text-xs text-gray-500">Tenant: {t.tenant} · {t.category}</p>
                  <p className="text-xs text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</p>
                </Link>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>{t.status}</span>
              </div>

              {ADMIN_TRANSITIONS[t.status] && (
                <div className="mt-2 flex gap-2">
                  {ADMIN_TRANSITIONS[t.status].map((s) => (
                    <button key={s} onClick={() => updateStatus(t._id, s)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded capitalize">{s.replace('_', ' ')}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
