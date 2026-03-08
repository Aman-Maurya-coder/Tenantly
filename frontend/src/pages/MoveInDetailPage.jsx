import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'minor_damage', label: 'Minor damage' },
  { value: 'needs_repair', label: 'Needs repair' },
];

const DOCUMENT_FIELDS = [
  { key: 'identityProof', label: 'Identity proof (PDF/Image)' },
  { key: 'addressProof', label: 'Address proof (PDF/Image)' },
  { key: 'incomeProof', label: 'Income proof (PDF/Image)' },
];

export default function MoveInDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [moveIn, setMoveIn] = useState(null);
  const [files, setFiles] = useState({});
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [inventoryInput, setInventoryInput] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchMoveIn = () => {
    api.get(`/move-in/${id}`).then((response) => {
      const data = response.data.data;
      setMoveIn(data);
      const defaults = {};
      (data.listing?.inventoryTemplate || []).forEach((item) => {
        defaults[item._id] = defaults[item._id] || { condition: '', notes: '' };
      });
      setInventoryInput(defaults);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchMoveIn();
  }, [id]);

  const submitMoveIn = async () => {
    const form = new FormData();
    DOCUMENT_FIELDS.forEach((field) => {
      if (files[field.key]) {
        form.append(field.key, files[field.key]);
      }
    });

    const inventory = (moveIn.listing?.inventoryTemplate || []).map((item) => ({
      itemId: item._id,
      condition: inventoryInput[item._id]?.condition || '',
      notes: inventoryInput[item._id]?.notes || '',
    }));

    form.append('agreed', String(agreementAccepted));
    form.append('inventory', JSON.stringify(inventory));

    try {
      setSubmitting(true);
      setError('');
      await api.patch(`/move-in/${id}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('Move-in submitted successfully.');
      fetchMoveIn();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to submit move-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (!moveIn) return <p>Loading...</p>;
  const isTenant = user?.role === 'tenant';
  const isInitiated = moveIn.status === 'initiated';
  const docsByLabel = Object.fromEntries((moveIn.documents || []).map((doc) => [doc.label, doc]));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Move-In: {moveIn.listing?.title}</h2>
      <p className="muted text-sm">Status: <span className="font-semibold">{moveIn.status}</span></p>

      <section className="surface-card p-4">
        <h3 className="text-xl font-semibold mb-3">Required documents</h3>
        <div className="space-y-3">
          {DOCUMENT_FIELDS.map((field) => (
            <div key={field.key}>
              <p className="text-sm font-medium">{field.label}</p>
              {docsByLabel[field.key] ? (
                <a
                  className="text-sm underline"
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`.replace('/api', '') + `/${docsByLabel[field.key].path.replace(/\\/g, '/')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {docsByLabel[field.key].originalName}
                </a>
              ) : isTenant && isInitiated ? (
                <input
                  className="input"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFiles({ ...files, [field.key]: e.target.files?.[0] })}
                />
              ) : (
                <p className="text-sm muted">Not uploaded yet</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-4">
        <h3 className="text-xl font-semibold mb-3">Inventory condition</h3>
        {(moveIn.listing?.inventoryTemplate || []).length === 0 ? (
          <p className="muted text-sm">No inventory checklist configured for this listing.</p>
        ) : (
          <div className="space-y-3">
            {(moveIn.listing?.inventoryTemplate || []).map((item) => (
              <div key={item._id} className="grid md:grid-cols-2 gap-2">
                <p className="font-medium">{item.item}</p>
                {isTenant && isInitiated ? (
                  <div className="grid md:grid-cols-2 gap-2">
                    <select
                      className="select"
                      value={inventoryInput[item._id]?.condition || ''}
                      onChange={(e) => setInventoryInput({
                        ...inventoryInput,
                        [item._id]: { ...inventoryInput[item._id], condition: e.target.value },
                      })}
                    >
                      <option value="">Select condition</option>
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      placeholder="Notes (optional)"
                      value={inventoryInput[item._id]?.notes || ''}
                      onChange={(e) => setInventoryInput({
                        ...inventoryInput,
                        [item._id]: { ...inventoryInput[item._id], notes: e.target.value },
                      })}
                    />
                  </div>
                ) : (
                  <p className="text-sm muted">
                    {(moveIn.inventoryChecklist || []).find((entry) => entry.item === item.item)?.condition || 'Pending'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card p-4">
        <h3 className="text-xl font-semibold mb-2">Agreement confirmation</h3>
        {moveIn.agreementConfirmed ? (
          <p className="text-sm" style={{ color: 'var(--color-success)' }}>
            Confirmed on {new Date(moveIn.agreementConfirmedAt).toLocaleString()}
          </p>
        ) : isTenant && isInitiated ? (
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
            />
            I confirm and accept the move-in agreement terms.
          </label>
        ) : (
          <p className="text-sm muted">Pending tenant confirmation.</p>
        )}
      </section>

      {isTenant && isInitiated && (
        <button className="btn btn-primary" disabled={submitting} onClick={submitMoveIn}>
          {submitting ? 'Submitting...' : 'Submit move-in'}
        </button>
      )}

      {msg && <p className="text-sm" style={{ color: 'var(--color-success)' }}>{msg}</p>}
      {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}
