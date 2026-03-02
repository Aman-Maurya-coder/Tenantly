import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [listing, setListing] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitNote, setVisitNote] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => setListing(r.data.data)).catch(console.error);
  }, [id]);

  const requestVisit = async () => {
    try {
      await api.post('/visits', { listingId: id, requestedDate: visitDate, tenantNotes: visitNote });
      setMsg('Visit requested!');
      setVisitDate('');
      setVisitNote('');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  const addToShortlist = async () => {
    try {
      await api.post('/shortlist', { listingId: id });
      setMsg('Added to shortlist!');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    }
  };

  if (!listing) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">{listing.title}</h2>
      <p className="text-gray-500">{listing.locationText}</p>
      <p className="text-blue-600 font-bold text-xl mt-2">₹{listing.budget}/mo</p>
      <p className="text-gray-600 mt-4">{listing.description}</p>
      <p className="text-sm text-gray-400 mt-2">Move-in date: {new Date(listing.moveInDate).toLocaleDateString()}</p>

      {listing.amenities?.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-1">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((a, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{a}</span>)}
          </div>
        </div>
      )}

      {user?.role === 'tenant' && (
        <div className="mt-6 border-t pt-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Request Visit</h4>
            <div className="flex gap-2 flex-wrap">
              <input type="date" className="border px-3 py-2 rounded" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              <input placeholder="Notes (optional)" className="border px-3 py-2 rounded flex-1" value={visitNote} onChange={(e) => setVisitNote(e.target.value)} />
              <button onClick={requestVisit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Request</button>
            </div>
          </div>

          <button onClick={addToShortlist} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">★ Shortlist</button>
        </div>
      )}

      {msg && <p className="mt-4 text-sm text-green-600">{msg}</p>}
    </div>
  );
}
