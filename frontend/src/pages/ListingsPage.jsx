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

  const cardState = (listing) => {
    if (listing?.reservation?.unavailableToCurrentTenant) {
      return { label: 'Reserved', className: 'badge badge-warning', disabled: true };
    }
    return { label: 'Available', className: 'badge badge-success', disabled: false };
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Browse Listings</h2>

      <section className="surface-card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            aria-label="Location filter"
            placeholder="Location"
            className="input md:col-span-2"
            value={filters.locationText}
            onChange={(e) => setFilters({ ...filters, locationText: e.target.value })}
          />
          <input
            aria-label="Minimum budget filter"
            placeholder="Min Budget"
            type="number"
            className="input"
            value={filters.minBudget}
            onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
          />
          <input
            aria-label="Maximum budget filter"
            placeholder="Max Budget"
            type="number"
            className="input"
            value={filters.maxBudget}
            onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
          />
          <input
            aria-label="Move in date filter"
            type="date"
            className="input"
            value={filters.moveInDate}
            onChange={(e) => setFilters({ ...filters, moveInDate: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <button onClick={fetchListings} className="btn btn-primary">Search listings</button>
        </div>
      </section>

      {error && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{error}</p>}

      {loading ? (
        <p className="muted">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="muted">No listings found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const state = cardState(listing);
            const cardContent = (
              <article className={`surface-card p-4 h-full ${state.disabled ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-semibold">{listing.title}</h3>
                  <span className={state.className}>{state.label}</span>
                </div>
                <p className="muted text-sm">{listing.locationText}</p>
                <p className="font-bold mt-2">₹{listing.budget}/month</p>
                <p className="text-sm muted mt-1">Move-in: {new Date(listing.moveInDate).toLocaleDateString()}</p>
                {listing.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {listing.amenities.map((amenity, index) => (
                      <span key={index} className="badge badge-info">{amenity}</span>
                    ))}
                  </div>
                )}
              </article>
            );

            if (state.disabled) {
              return <div key={listing._id}>{cardContent}</div>;
            }

            return (
              <Link to={`/listings/${listing._id}`} key={listing._id} aria-label={`Open ${listing.title}`}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
