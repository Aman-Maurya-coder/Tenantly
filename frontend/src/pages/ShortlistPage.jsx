import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingImage from '../components/ListingImage.jsx';
import api from '../lib/api.js';

export default function ShortlistPage() {
  const [items, setItems] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [visitForms, setVisitForms] = useState({});

  const fetch = () => {
    api.get('/shortlist').then((r) => { setItems(r.data.data); setLoading(false); }).catch(console.error);
  };
  useEffect(fetch, []);

  const remove = async (listingId) => {
    await api.delete(`/shortlist/${listingId}`);
    setCompareIds((prev) => prev.filter((id) => id !== listingId));
    fetch();
  };

  const toggleCompare = (listingId) => {
    setCompareIds((prev) => {
      if (prev.includes(listingId)) return prev.filter((id) => id !== listingId);
      if (prev.length >= 3) { setError('Max 3 listings to compare'); return prev; }
      return [...prev, listingId];
    });
    setCompareData(null);
    setMsg('');
    setError('');
  };

  const compare = async () => {
    if (compareIds.length < 2) { setError('Select at least 2 listings'); return; }
    try {
      const res = await api.get(`/shortlist/compare?ids=${compareIds.join(',')}`);
      setCompareData(res.data.data);
      setMsg('');
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Error');
    }
  };

  const requestVisit = async (listingId) => {
    const current = visitForms[listingId] || {};
    if (!current.requestedDate) {
      setError('Select a requested date before requesting a visit.');
      return;
    }
    try {
      await api.post('/visits', {
        listingId,
        requestedDate: current.requestedDate,
        tenantNotes: current.tenantNotes || '',
      });
      setMsg('Visit request created from shortlist.');
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to request visit');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">My Shortlist</h2>

      {items.length === 0 ? <p className="muted">No shortlisted listings.</p> : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((s) => (
              <div key={s._id} className="listing-inline-card surface-card">
                <div className="listing-inline-media">
                  <ListingImage listing={s.listing} variant="panel" fallbackLabel="Listing image pending" />
                </div>

                <div className="listing-inline-copy">
                  <Link to={`/listings/${s.listing._id}`} className="flex-1">
                    <p className="font-semibold">{s.listing.title}</p>
                    <p className="text-sm muted">{s.listing.locationText} — Rs {s.listing.budget}/month</p>
                  </Link>
                </div>

                <div className="listing-inline-actions">
                  {s.listing?.listingState?.isExpired ? <span className="badge badge-error">Expired</span> : null}
                  {s.listing?.listingState?.unavailableToCurrentTenant ? <span className="badge badge-warning">Reserved</span> : null}
                  <label className="text-xs flex items-center gap-1 muted">
                    <input type="checkbox" checked={compareIds.includes(s.listing._id)} onChange={() => toggleCompare(s.listing._id)} />
                    Compare
                  </label>
                  <input
                    type="date"
                    className="input max-w-44"
                    value={visitForms[s.listing._id]?.requestedDate || ''}
                    onChange={(e) => setVisitForms({
                      ...visitForms,
                      [s.listing._id]: { ...visitForms[s.listing._id], requestedDate: e.target.value },
                    })}
                  />
                  <input
                    placeholder="Notes (optional)"
                    className="input max-w-sm"
                    value={visitForms[s.listing._id]?.tenantNotes || ''}
                    onChange={(e) => setVisitForms({
                      ...visitForms,
                      [s.listing._id]: { ...visitForms[s.listing._id], tenantNotes: e.target.value },
                    })}
                  />
                  <button
                    onClick={() => requestVisit(s.listing._id)}
                    className="btn btn-primary"
                    disabled={!s.listing?.listingState?.canRequestVisit}
                  >
                    Request visit
                  </button>
                  <button onClick={() => remove(s.listing._id)} className="btn btn-danger">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={compare} className="btn btn-secondary mb-4">
            Compare Selected ({compareIds.length})
          </button>
        </>
      )}

      {msg && <p className="text-sm mt-2" style={{ color: 'var(--color-success)' }}>{msg}</p>}
      {error && <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>{error}</p>}

      {compareData && (
        <div className="overflow-x-auto mt-6">
          <table className="w-full surface-card text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left">Field</th>
                {compareData.map((l) => <th key={l._id} className="p-3 text-left">{l.title}</th>)}
              </tr>
            </thead>
            <tbody>
              {['locationText', 'budget', 'moveInDate', 'amenities', 'description', 'listingState'].map((field) => (
                <tr key={field} className="border-t">
                  <td className="p-3 font-medium capitalize">{field}</td>
                  {compareData.map((l) => (
                    <td key={l._id} className="p-3">
                      {field === 'budget' ? `₹${l[field]}` :
                       field === 'moveInDate' ? new Date(l[field]).toLocaleDateString() :
                       field === 'amenities' ? (l[field]?.join(', ') || '—') :
                       field === 'listingState' ? (l.listingState?.canRequestVisit ? 'Visit can be requested' : 'Unavailable now') :
                        l[field]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-2">
            {compareData.map((listing) => (
              <button
                key={listing._id}
                className="btn btn-primary"
                disabled={!listing.listingState?.canRequestVisit}
                onClick={() => requestVisit(listing._id)}
              >
                Request visit: {listing.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
