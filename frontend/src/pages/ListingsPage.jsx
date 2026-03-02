import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ locationText: '', minBudget: '', maxBudget: '', moveInDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.locationText) params.locationText = filters.locationText;
      if (filters.minBudget) params.minBudget = filters.minBudget;
      if (filters.maxBudget) params.maxBudget = filters.maxBudget;
      if (filters.moveInDate) params.moveInDate = filters.moveInDate;
      const res = await api.get('/listings', { params });
      setListings(res.data.data);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Unable to load listings. Make sure backend is running on port 5000.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Browse Listings</h2>

      <div className="flex flex-wrap gap-3 mb-6 bg-zinc-900 p-4 rounded shadow border border-zinc-800">
        <input placeholder="Location" className="border px-3 py-2 rounded flex-1 min-w-36"
          value={filters.locationText} onChange={(e) => setFilters({ ...filters, locationText: e.target.value })} />
        <input placeholder="Min Budget" type="number" className="border px-3 py-2 rounded w-32"
          value={filters.minBudget} onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })} />
        <input placeholder="Max Budget" type="number" className="border px-3 py-2 rounded w-32"
          value={filters.maxBudget} onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })} />
        <input type="date" className="border px-3 py-2 rounded"
          value={filters.moveInDate} onChange={(e) => setFilters({ ...filters, moveInDate: e.target.value })} />
        <button onClick={fetchListings} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {loading ? <p>Loading...</p> : listings.length === 0 ? <p className="text-gray-500">No listings found. Only Published listings are shown on this page.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link to={`/listings/${l._id}`} key={l._id} className="bg-zinc-900 border border-zinc-800 p-4 rounded shadow hover:shadow-md transition">
              <h3 className="text-lg font-semibold">{l.title}</h3>
              <p className="text-gray-500 text-sm">{l.locationText}</p>
              <p className="text-blue-600 font-bold mt-2">₹{l.budget}/mo</p>
              <p className="text-xs text-gray-400 mt-1">Move-in: {new Date(l.moveInDate).toLocaleDateString()}</p>
              {l.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {l.amenities.map((a, i) => <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{a}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
