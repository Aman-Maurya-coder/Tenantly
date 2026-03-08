import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';
import { getMediaUrl } from '../lib/listingMedia.js';

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
  const [approving, setApproving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ documents: {}, inventory: {}, agreement: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const applyMoveInData = (data) => {
    setMoveIn(data);
    const defaults = {};
    (data.listing?.inventoryTemplate || []).forEach((item) => {
      defaults[item._id] = defaults[item._id] || { condition: '', notes: '' };
    });
    setInventoryInput(defaults);
  };

  const refreshMoveIn = async () => {
    const response = await api.get(`/move-in/${id}`);
    applyMoveInData(response.data.data);
  };

  useEffect(() => {
    let cancelled = false;

    api.get(`/move-in/${id}`).then((response) => {
      if (cancelled) {
        return;
      }

      applyMoveInData(response.data.data);
    }).catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [id]);

  const submitMoveIn = async () => {
    const nextErrors = { documents: {}, inventory: {}, agreement: '' };

    DOCUMENT_FIELDS.forEach((field) => {
      if (!docsByLabel[field.key] && !files[field.key]) {
        nextErrors.documents[field.key] = `${field.label} is required.`;
      }
    });

    (moveIn.listing?.inventoryTemplate || []).forEach((item) => {
      if (!inventoryInput[item._id]?.condition) {
        nextErrors.inventory[item._id] = 'Select a condition before submitting.';
      }
    });

    if (!agreementAccepted) {
      nextErrors.agreement = 'You must accept the agreement before submitting the move-in.';
    }

    if (Object.keys(nextErrors.documents).length || Object.keys(nextErrors.inventory).length || nextErrors.agreement) {
      setValidationErrors(nextErrors);
      setError('Fix the highlighted move-in fields before submitting.');
      setMsg('');
      return;
    }

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
      setValidationErrors({ documents: {}, inventory: {}, agreement: '' });
      await refreshMoveIn();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to submit move-in');
    } finally {
      setSubmitting(false);
    }
  };

  const approveMoveIn = async () => {
    try {
      setApproving(true);
      setError('');
      await api.patch(`/move-in/${id}/approve`);
      setMsg('Move-in approved and marked as complete.');
      await refreshMoveIn();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to approve move-in');
    } finally {
      setApproving(false);
    }
  };

  if (!moveIn) return <p>Loading...</p>;
  const isTenant = user?.role === 'tenant';
  const isAdmin = user?.role === 'admin';
  const isInitiated = moveIn.status === 'initiated';
  const isSubmitted = moveIn.status === 'submitted';
  const docsByLabel = Object.fromEntries((moveIn.documents || []).map((doc) => [doc.label, doc]));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Move-In: {moveIn.listing?.title}</h2>
      <p className="muted text-sm">Status: <span className="font-semibold">{moveIn.status}</span></p>
      {msg ? <p className="form-alert form-alert--success">{msg}</p> : null}
      {error ? <p className="form-alert form-alert--error">{error}</p> : null}

      <section className="surface-card p-4">
        <h3 className="text-xl font-semibold mb-3">Required documents</h3>
        <div className="space-y-3">
          {DOCUMENT_FIELDS.map((field) => (
            <div key={field.key} className={`document-preview-card ${validationErrors.documents[field.key] ? 'document-preview-card--error' : ''}`}>
              <p className={`text-sm font-medium ${validationErrors.documents[field.key] ? 'field-label--error' : ''}`}>{field.label}</p>
              {docsByLabel[field.key] ? (
                docsByLabel[field.key].mimeType?.startsWith('image/') ? (
                  <div className="document-preview-media">
                    <img src={getMediaUrl(docsByLabel[field.key].path)} alt={docsByLabel[field.key].originalName} className="document-preview-image" />
                    <a className="text-sm underline" href={getMediaUrl(docsByLabel[field.key].path)} target="_blank" rel="noreferrer">Open full image</a>
                  </div>
                ) : (
                  <a className="text-sm underline" href={getMediaUrl(docsByLabel[field.key].path)} target="_blank" rel="noreferrer">{docsByLabel[field.key].originalName}</a>
                )
              ) : isTenant && isInitiated ? (
                <input
                  className={`input ${validationErrors.documents[field.key] ? 'input-error' : ''}`}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    setFiles({ ...files, [field.key]: e.target.files?.[0] });
                    setValidationErrors((existing) => ({
                      ...existing,
                      documents: { ...existing.documents, [field.key]: '' },
                    }));
                  }}
                />
              ) : (
                <p className="text-sm muted">Not uploaded yet</p>
              )}
              {validationErrors.documents[field.key] ? <p className="field-error">{validationErrors.documents[field.key]}</p> : null}
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
                      className={`select ${validationErrors.inventory[item._id] ? 'input-error' : ''}`}
                      value={inventoryInput[item._id]?.condition || ''}
                      onChange={(e) => {
                        setInventoryInput({
                          ...inventoryInput,
                          [item._id]: { ...inventoryInput[item._id], condition: e.target.value },
                        });
                        setValidationErrors((existing) => ({
                          ...existing,
                          inventory: { ...existing.inventory, [item._id]: '' },
                        }));
                      }}
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
                {validationErrors.inventory[item._id] ? <p className="field-error md:col-start-2">{validationErrors.inventory[item._id]}</p> : null}
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
          <label className={`text-sm flex items-center gap-2 ${validationErrors.agreement ? 'field-label--error' : ''}`}>
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => {
                setAgreementAccepted(e.target.checked);
                setValidationErrors((existing) => ({ ...existing, agreement: '' }));
              }}
            />
            I confirm and accept the move-in agreement terms.
          </label>
        ) : (
          <p className="text-sm muted">Pending tenant confirmation.</p>
        )}
        {validationErrors.agreement ? <p className="field-error mt-2">{validationErrors.agreement}</p> : null}
      </section>

      {isTenant && isInitiated && (
        <button className="btn btn-primary" disabled={submitting} onClick={submitMoveIn}>
          {submitting ? 'Submitting...' : 'Submit move-in'}
        </button>
      )}

      {isTenant && isSubmitted ? <p className="muted text-sm">Your move-in has been submitted and is waiting for admin approval.</p> : null}

      {isAdmin && isSubmitted ? (
        <button className="btn btn-primary" disabled={approving} onClick={approveMoveIn}>
          {approving ? 'Approving...' : 'Approve move-in'}
        </button>
      ) : null}
    </div>
  );
}
