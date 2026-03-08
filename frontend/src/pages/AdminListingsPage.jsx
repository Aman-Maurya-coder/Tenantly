import { useEffect, useState } from 'react';
import ListingImage from '../components/ListingImage.jsx';
import api from '../lib/api.js';
import { getMediaUrl } from '../lib/listingMedia.js';

const EMPTY_FORM = {
  title: '',
  description: '',
  locationText: '',
  budget: '',
  moveInDate: '',
  amenities: '',
  inventoryTemplate: '',
  status: 'Draft',
};

const VALID_TRANSITIONS = {
  Draft: ['Review'],
  Review: ['Published', 'Draft'],
  Published: ['Draft'],
};

const MAX_IMAGES = 8;

const createPreviewId = () => `preview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [coverImageRef, setCoverImageRef] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => {
    newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [newImagePreviews]);

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings');
      setListings(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const clearNewPreviews = () => {
    newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setNewImagePreviews([]);
  };

  const resetForm = () => {
    clearNewPreviews();
    setForm(EMPTY_FORM);
    setExistingImages([]);
    setEditId(null);
    setCoverImageRef('');
    setValidationErrors({});
    setShowForm(false);
    setError('');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.locationText.trim()) nextErrors.locationText = 'Location is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!form.budget || Number(form.budget) <= 0) nextErrors.budget = 'Enter a valid monthly budget.';
    if (!form.moveInDate) nextErrors.moveInDate = 'Move-in date is required.';

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const remainingSlots = MAX_IMAGES - existingImages.length - newImagePreviews.length;
    const allowedFiles = selectedFiles.slice(0, Math.max(remainingSlots, 0));

    if (selectedFiles.length > allowedFiles.length) {
      setError(`Only ${MAX_IMAGES} images can be attached to a listing.`);
    } else {
      setError('');
    }

    const nextPreviews = allowedFiles.map((file) => ({
      id: createPreviewId(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setNewImagePreviews((current) => [...current, ...nextPreviews]);
    if (!coverImageRef && existingImages.length === 0 && nextPreviews[0]) {
      setCoverImageRef(`new:${nextPreviews[0].id}`);
    }
    event.target.value = '';
  };

  const removeExistingImage = (pathToRemove) => {
    const nextExistingImages = existingImages.filter((image) => image.path !== pathToRemove);
    setExistingImages(nextExistingImages);

    if (coverImageRef === `existing:${pathToRemove}`) {
      if (nextExistingImages[0]) {
        setCoverImageRef(`existing:${nextExistingImages[0].path}`);
      } else if (newImagePreviews[0]) {
        setCoverImageRef(`new:${newImagePreviews[0].id}`);
      } else {
        setCoverImageRef('');
      }
    }
  };

  const removeNewImage = (indexToRemove) => {
    setNewImagePreviews((current) => current.filter((preview, index) => {
      if (index === indexToRemove) {
        if (coverImageRef === `new:${preview.id}`) {
          const fallbackPreview = current.find((candidate, candidateIndex) => candidateIndex !== indexToRemove);
          if (existingImages[0]) {
            setCoverImageRef(`existing:${existingImages[0].path}`);
          } else if (fallbackPreview) {
            setCoverImageRef(`new:${fallbackPreview.id}`);
          } else {
            setCoverImageRef('');
          }
        }
        URL.revokeObjectURL(preview.url);
        return false;
      }
      return true;
    }));
  };

  const save = async () => {
    if (!validateForm()) {
      setError('Fix the highlighted fields before saving this listing.');
      setMsg('');
      return;
    }

    setSaving(true);
    setMsg('');
    setError('');

    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('description', form.description);
    payload.append('locationText', form.locationText);
    payload.append('budget', String(Number(form.budget)));
    payload.append('moveInDate', form.moveInDate);
    payload.append(
      'amenities',
      JSON.stringify(form.amenities.split(',').map((item) => item.trim()).filter(Boolean))
    );
    payload.append(
      'inventoryTemplate',
      JSON.stringify(form.inventoryTemplate.split(',').map((item) => item.trim()).filter(Boolean))
    );
    payload.append('retainedImages', JSON.stringify(existingImages));
    payload.append('coverImageRef', coverImageRef);
    payload.append('newImageKeys', JSON.stringify(newImagePreviews.map((preview) => preview.id)));

    if (editId) {
      payload.append('status', form.status);
    }

    newImagePreviews.forEach((preview) => {
      payload.append('images', preview.file);
    });

    try {
      if (editId) {
        await api.put(`/listings/${editId}`, payload);
        setMsg('Listing updated successfully.');
      } else {
        await api.post('/listings', payload);
        setMsg('Listing created successfully.');
      }

      resetForm();
      setLoading(true);
      await fetchListings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save listing');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (listing) => {
    clearNewPreviews();
    setForm({
      title: listing.title,
      description: listing.description,
      locationText: listing.locationText,
      budget: String(listing.budget),
      moveInDate: listing.moveInDate?.slice(0, 10),
      amenities: listing.amenities?.join(', ') || '',
      inventoryTemplate: listing.inventoryTemplate?.map((entry) => entry.item).join(', ') || '',
      status: listing.status,
    });
    setExistingImages(listing.images || []);
    setEditId(listing._id);
    setShowForm(true);
    setCoverImageRef(listing.images?.[0] ? `existing:${listing.images[0].path}` : '');
    setValidationErrors({});
    setError('');
    setMsg('');
  };

  const deleteListing = async (id) => {
    if (!confirm('Delete this listing?')) {
      return;
    }

    try {
      await api.delete(`/listings/${id}`);
      setLoading(true);
      await fetchListings();
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Unable to delete listing');
    }
  };

  if (loading) {
    return <p className="muted">Loading listings...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="section-eyebrow">Admin inventory</p>
          <h2 className="text-3xl font-bold">Manage Listings</h2>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
              return;
            }
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          {showForm ? 'Close form' : 'New listing'}
        </button>
      </div>

      {showForm ? (
        <section className="surface-card p-5 mb-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold">{editId ? 'Edit listing' : 'Create listing'}</h3>
            <p className="form-hint">Upload up to eight images. The first image is used as the cover everywhere else in the product.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <label>
              <span className={`text-sm font-medium ${validationErrors.title ? 'field-label--error' : ''}`}>Title</span>
              <input className={`input mt-1 ${validationErrors.title ? 'input-error' : ''}`} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              {validationErrors.title ? <p className="field-error">{validationErrors.title}</p> : null}
            </label>
            <label>
              <span className={`text-sm font-medium ${validationErrors.locationText ? 'field-label--error' : ''}`}>Location</span>
              <input className={`input mt-1 ${validationErrors.locationText ? 'input-error' : ''}`} value={form.locationText} onChange={(event) => setForm({ ...form, locationText: event.target.value })} />
              {validationErrors.locationText ? <p className="field-error">{validationErrors.locationText}</p> : null}
            </label>
            <label className="lg:col-span-2">
              <span className={`text-sm font-medium ${validationErrors.description ? 'field-label--error' : ''}`}>Description</span>
              <textarea className={`textarea mt-1 ${validationErrors.description ? 'input-error' : ''}`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              {validationErrors.description ? <p className="field-error">{validationErrors.description}</p> : null}
            </label>
            <label>
              <span className={`text-sm font-medium ${validationErrors.budget ? 'field-label--error' : ''}`}>Budget</span>
              <input type="number" className={`input mt-1 ${validationErrors.budget ? 'input-error' : ''}`} value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} />
              {validationErrors.budget ? <p className="field-error">{validationErrors.budget}</p> : null}
            </label>
            <label>
              <span className={`text-sm font-medium ${validationErrors.moveInDate ? 'field-label--error' : ''}`}>Move-in date</span>
              <input type="date" className={`input mt-1 ${validationErrors.moveInDate ? 'input-error' : ''}`} value={form.moveInDate} onChange={(event) => setForm({ ...form, moveInDate: event.target.value })} />
              {validationErrors.moveInDate ? <p className="field-error">{validationErrors.moveInDate}</p> : null}
            </label>
            <label>
              <span className="text-sm font-medium">Amenities</span>
              <input className="input mt-1" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
            </label>
            <label>
              <span className="text-sm font-medium">Inventory checklist</span>
              <input className="input mt-1" value={form.inventoryTemplate} onChange={(event) => setForm({ ...form, inventoryTemplate: event.target.value })} />
            </label>
          </div>

          {editId ? (
            <label>
              <span className="text-sm font-medium">Workflow status</span>
              <select className="select mt-1" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value={form.status}>{form.status} (current)</option>
                {(VALID_TRANSITIONS[form.status] || []).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          ) : null}

          <div>
            <label className="text-sm font-medium block mb-2" htmlFor="listing-images">Listing images</label>
            <input id="listing-images" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageSelection} />
          </div>

          {existingImages.length > 0 || newImagePreviews.length > 0 ? (
            <div className="image-preview-strip">
              {existingImages.map((image) => (
                <div key={image.path} className="image-preview-card">
                  <img src={getMediaUrl(image.path)} alt={image.altText || `${form.title || 'Listing'} image`} className="image-preview-image" />
                  <div className="image-preview-meta">
                    <p>{image.originalName}</p>
                    {coverImageRef === `existing:${image.path}` ? <span className="image-preview-badge">Cover</span> : null}
                  </div>
                  <div className="button-row">
                    <button onClick={() => setCoverImageRef(`existing:${image.path}`)} className="btn btn-secondary" type="button">Set as cover image</button>
                    <button onClick={() => removeExistingImage(image.path)} className="btn btn-tertiary" type="button">Remove</button>
                  </div>
                </div>
              ))}

              {newImagePreviews.map((preview, index) => (
                <div key={preview.id} className="image-preview-card">
                  <img src={preview.url} alt={preview.name} className="image-preview-image" />
                  <div className="image-preview-meta">
                    <p>{preview.name}</p>
                    {coverImageRef === `new:${preview.id}` ? <span className="image-preview-badge">Cover</span> : null}
                  </div>
                  <div className="button-row">
                    <button onClick={() => setCoverImageRef(`new:${preview.id}`)} className="btn btn-secondary" type="button">Set as cover image</button>
                    <button onClick={() => removeNewImage(index)} className="btn btn-tertiary" type="button">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button onClick={save} disabled={saving} className="btn btn-primary" type="button">
              {saving ? 'Saving...' : editId ? 'Update listing' : 'Create listing'}
            </button>
            <button onClick={resetForm} className="btn btn-secondary" type="button">Cancel</button>
          </div>
        </section>
      ) : null}

      {msg ? <p className="form-alert form-alert--success mb-3">{msg}</p> : null}
      {error ? <p className="form-alert form-alert--error mb-3">{error}</p> : null}

      <div className="space-y-4">
        {listings.map((listing) => (
          <article key={listing._id} className="listing-inline-card surface-card">
            <div className="listing-inline-media">
              <ListingImage listing={listing} variant="panel" fallbackLabel="No cover yet" />
            </div>

            <div className="listing-inline-copy">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold">{listing.title}</h3>
                <span className="badge badge-info">{listing.status}</span>
              </div>
              <p className="muted">{listing.locationText} · Rs {listing.budget}/month</p>
              <p className="text-sm muted">Move-in: {new Date(listing.moveInDate).toLocaleDateString()}</p>
              <p className="text-sm muted">Images: {listing.images?.length || 0}</p>
              <p className="text-sm muted">
                Inventory: {(listing.inventoryTemplate || []).map((item) => item.item).join(', ') || 'Not set'}
              </p>
            </div>

            <div className="listing-inline-actions">
              <button onClick={() => startEdit(listing)} className="btn btn-secondary" type="button">Edit</button>
              <button onClick={() => deleteListing(listing._id)} className="btn btn-danger" type="button">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
