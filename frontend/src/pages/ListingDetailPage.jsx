import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ListingImage from '../components/ListingImage.jsx';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';
import { getListingImages } from '../lib/listingMedia.js';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [listing, setListing] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [addingShortlist, setAddingShortlist] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => setListing(r.data.data)).catch(console.error);
  }, [id]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [listing?._id]);

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
  const images = getListingImages(listing);
  const selectedImage = images[selectedImageIndex] || images[0] || null;

  return (
    <div className="detail-shell">
      <section className="surface-card detail-grid">
        <div className="detail-gallery">
          <ListingImage listing={listing} image={selectedImage} variant="hero" fallbackLabel="Gallery not available yet" />

          {images.length > 1 ? (
            <div className="detail-thumbs" aria-label="Listing gallery thumbnails">
              {images.map((image, index) => (
                <button
                  key={image.path}
                  type="button"
                  className={`detail-thumb-button ${selectedImageIndex === index ? 'is-active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <ListingImage listing={listing} image={image} variant="thumb" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-copy">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-eyebrow">Listing overview</p>
              <h2 className="text-4xl font-bold">{listing.title}</h2>
            </div>
            {unavailable ? <span className="badge badge-warning">Reserved</span> : <span className="badge badge-success">Available</span>}
          </div>

          <p className="muted">{listing.locationText}</p>
          <p className="font-bold text-3xl">Rs {listing.budget}/month</p>
          <p>{listing.description}</p>
          <p className="text-sm muted">Move-in date: {new Date(listing.moveInDate).toLocaleDateString()}</p>

          {listing.amenities?.length > 0 ? (
            <div>
              <h4 className="font-semibold text-sm mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity, index) => <span key={index} className="badge badge-info">{amenity}</span>)}
              </div>
            </div>
          ) : null}

          {listing.inventoryTemplate?.length > 0 ? (
            <div>
              <h4 className="font-semibold text-sm mb-2">Move-in checklist</h4>
              <div className="flex flex-wrap gap-2">
                {listing.inventoryTemplate.map((entry) => <span key={entry._id || entry.item} className="badge badge-info">{entry.item}</span>)}
              </div>
            </div>
          ) : null}

          {user?.role === 'tenant' ? (
            <div className="surface-card p-4">
              <h4 className="font-semibold mb-2">Shortlist first</h4>
              <p className="text-sm muted mb-3">Visits can only be requested from the shortlist page after the listing is saved to your shortlist.</p>
              <button
                onClick={addToShortlist}
                className={isShortlisted ? 'btn btn-secondary' : 'btn btn-primary'}
                disabled={isShortlisted || unavailable || addingShortlist}
              >
                {isShortlisted ? 'Already shortlisted' : addingShortlist ? 'Adding...' : 'Add to shortlist'}
              </button>
            </div>
          ) : null}

          {msg ? <p className="text-sm" style={{ color: 'var(--color-success)' }}>{msg}</p> : null}
          {error ? <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
