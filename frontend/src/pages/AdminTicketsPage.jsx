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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-3xl font-bold">Manage Tickets</h2>
        <Link to="/admin/dashboard" className="btn btn-secondary">Back to dashboard</Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ['open', stats.open],
            ['in progress', stats.inProgress],
            ['resolved', stats.resolved],
            ['closed', stats.closed],
            ['reopened', stats.reopened],
          ].map(([key, value]) => (
            <div key={key} className="surface-card p-3 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs muted capitalize">{key}</p>
            </div>
          ))}
          <div className="surface-card p-3 text-center">
            <p className="text-2xl font-bold">{stats.unresolved}</p>
            <p className="text-xs muted">Unresolved</p>
          </div>
          {stats.avgFirstResponseMinutes !== null && (
            <div className="surface-card p-3 text-center">
              <p className="text-2xl font-bold">{Math.round(stats.avgFirstResponseMinutes)}</p>
              <p className="text-xs muted">Avg Response (min)</p>
            </div>
          )}
        </div>
      )}

      {tickets.length === 0 ? <p className="muted">No tickets.</p> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t._id} className="surface-card p-4">
              <div className="flex justify-between items-start">
                <Link to={`/ticket/${t._id}`}>
                  <p className="font-semibold hover:underline">{t.subject}</p>
                  <p className="text-xs muted">Tenant: {t.tenant} · {t.category}</p>
                  <p className="text-xs muted">{new Date(t.updatedAt).toLocaleDateString()}</p>
                </Link>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[t.status]}`}>{t.status}</span>
              </div>

              {ADMIN_TRANSITIONS[t.status] && (
                <div className="mt-2 flex gap-2">
                  {ADMIN_TRANSITIONS[t.status].map((s) => (
                    <button key={s} onClick={() => updateStatus(t._id, s)}
                      className="btn btn-secondary capitalize">{s.replace('_', ' ')}</button>
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
