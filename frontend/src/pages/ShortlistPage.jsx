import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function ShortlistPage() {
  const [items, setItems] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

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
      if (prev.length >= 3) { setMsg('Max 3 listings to compare'); return prev; }
      return [...prev, listingId];
    });
    setCompareData(null);
    setMsg('');
  };

  const compare = async () => {
    if (compareIds.length < 2) { setMsg('Select at least 2 listings'); return; }
    try {
      const res = await api.get(`/shortlist/compare?ids=${compareIds.join(',')}`);
      setCompareData(res.data.data);
      setMsg('');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Shortlist</h2>

      {items.length === 0 ? <p className="text-gray-500">No shortlisted listings.</p> : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((s) => (
              <div key={s._id} className="bg-white p-4 rounded shadow flex items-center justify-between">
                <Link to={`/listings/${s.listing._id}`} className="flex-1">
                  <p className="font-semibold">{s.listing.title}</p>
                  <p className="text-sm text-gray-500">{s.listing.locationText} — ₹{s.listing.budget}/mo</p>
                </Link>
                <div className="flex items-center gap-2">
                  <label className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={compareIds.includes(s.listing._id)} onChange={() => toggleCompare(s.listing._id)} />
                    Compare
                  </label>
                  <button onClick={() => remove(s.listing._id)} className="text-xs text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={compare} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4">
            Compare Selected ({compareIds.length})
          </button>
        </>
      )}

      {msg && <p className="text-sm text-red-500 mt-2">{msg}</p>}

      {compareData && (
        <div className="overflow-x-auto mt-6">
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Field</th>
                {compareData.map((l) => <th key={l._id} className="p-3 text-left">{l.title}</th>)}
              </tr>
            </thead>
            <tbody>
              {['locationText', 'budget', 'moveInDate', 'amenities', 'description'].map((field) => (
                <tr key={field} className="border-t">
                  <td className="p-3 font-medium capitalize">{field}</td>
                  {compareData.map((l) => (
                    <td key={l._id} className="p-3">
                      {field === 'budget' ? `₹${l[field]}` :
                       field === 'moveInDate' ? new Date(l[field]).toLocaleDateString() :
                       field === 'amenities' ? (l[field]?.join(', ') || '—') :
                       l[field]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
