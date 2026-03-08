import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [listing, setListing] = useState(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [addingShortlist, setAddingShortlist] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => setListing(r.data.data)).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'tenant') return;
    try {
      api.get('/shortlist').then((response) => {
        const found = response.data.data.some((entry) => entry.listing?._id === id);
        setIsShortlisted(found);
      }).catch(() => {});
    } catch (_error) {
      setIsShortlisted(false);
    }
  }, [id, user?.role]);

  const addToShortlist = async () => {
    try {
      setAddingShortlist(true);
      setError('');
      await api.post('/shortlist', { listingId: id });
      setMsg('Added to shortlist. Request a visit from your shortlist.');
      setIsShortlisted(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to add to shortlist');
    } finally {
      setAddingShortlist(false);
    }
  };

  if (!listing) return <p>Loading...</p>;
  const unavailable = listing?.reservation?.unavailableToCurrentTenant;

  return (
    <div className="surface-card p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-3xl font-bold">{listing.title}</h2>
        {unavailable ? (
          <span className="badge badge-warning">Reserved</span>
        ) : (
          <span className="badge badge-success">Available</span>
        )}
      </div>
      <p className="muted">{listing.locationText}</p>
      <p className="font-bold text-2xl mt-2">₹{listing.budget}/month</p>
      <p className="mt-4">{listing.description}</p>
      <p className="text-sm muted mt-2">Move-in date: {new Date(listing.moveInDate).toLocaleDateString()}</p>

      {listing.amenities?.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((amenity, index) => <span key={index} className="badge badge-info">{amenity}</span>)}
          </div>
        </div>
      )}

      {user?.role === 'tenant' && (
        <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <h4 className="font-semibold mb-2">Shortlist first</h4>
          <p className="text-sm muted mb-3">Visits can only be requested from the shortlist page.</p>
          <button
            onClick={addToShortlist}
            className={isShortlisted ? 'btn btn-secondary' : 'btn btn-primary'}
            disabled={isShortlisted || unavailable || addingShortlist}
          >
            {isShortlisted ? 'Already shortlisted' : addingShortlist ? 'Adding...' : 'Add to shortlist'}
          </button>
        </div>
      )}

      {msg && <p className="mt-4 text-sm" style={{ color: 'var(--color-success)' }}>{msg}</p>}
      {error && <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}
