import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';

export default function MoveInDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [moveIn, setMoveIn] = useState(null);
  const [msg, setMsg] = useState('');

  const fetch = () => {
    api.get(`/move-in/${id}`).then((r) => setMoveIn(r.data.data)).catch(console.error);
  };

  useEffect(() => {
    fetch();
  }, [id]);

  // Tenant: upload docs
  const [docs, setDocs] = useState([{ name: '', fileUrl: '' }]);
  const uploadDocs = async () => {
    try {
      await api.patch(`/move-in/${id}/documents`, { documents: docs.filter((d) => d.name && d.fileUrl) });
      setMsg('Documents submitted!'); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  // Tenant: confirm agreement
  const confirmAgreement = async () => {
    try {
      await api.patch(`/move-in/${id}/agreement`, { agreed: true });
      setMsg('Agreement confirmed!'); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  // Tenant: confirm inventory
  const [inventoryInput, setInventoryInput] = useState({});
  const confirmInventory = async () => {
    const inventory = Object.entries(inventoryInput).map(([itemId, condition]) => ({ itemId, condition }));
    try {
      await api.patch(`/move-in/${id}/inventory/confirm`, { inventory });
      setMsg('Inventory confirmed!'); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  // Admin: verify docs
  const verifyDocs = async () => {
    const documentIds = moveIn.documents.map((d) => d._id);
    try {
      await api.patch(`/move-in/${id}/documents/verify`, { documentIds });
      setMsg('Documents verified!'); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  // Admin: add inventory
  const [items, setItems] = useState('');
  const addInventory = async () => {
    const itemList = items.split(',').map((i) => ({ item: i.trim() })).filter((i) => i.item);
    try {
      await api.patch(`/move-in/${id}/inventory`, { items: itemList });
      setMsg('Inventory added!'); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  // Admin: mark completed
  const markComplete = async () => {
    try {
      await api.patch(`/move-in/${id}/complete`);
      setMsg('Move-in completed!'); fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  if (!moveIn) return <p>Loading...</p>;

  const STATUS_STEPS = ['initiated', 'documents_submitted', 'agreement_confirmed', 'inventory_completed', 'completed'];
  const currentIdx = STATUS_STEPS.indexOf(moveIn.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Move-In: {moveIn.listing?.title}</h2>

      {/* Progress bar */}
      <div className="flex gap-1">
        {STATUS_STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-2 rounded ${i <= currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-sm text-gray-500">Status: <span className="font-semibold">{moveIn.status}</span></p>

      {/* Documents section */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Documents</h3>
        {moveIn.documents.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {moveIn.documents.map((d) => (
              <li key={d._id} className="flex justify-between">
                <span>{d.name}: <a href={d.fileUrl} className="text-blue-600 underline" target="_blank">View</a></span>
                <span className={d.verified ? 'text-green-600' : 'text-yellow-600'}>{d.verified ? '✓ Verified' : 'Pending'}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-400">No documents uploaded yet.</p>}

        {user?.role === 'tenant' && moveIn.status === 'initiated' && (
          <div className="mt-3 space-y-2">
            {docs.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Doc name" className="border px-2 py-1 rounded flex-1" value={d.name}
                  onChange={(e) => { const n = [...docs]; n[i].name = e.target.value; setDocs(n); }} />
                <input placeholder="File URL" className="border px-2 py-1 rounded flex-1" value={d.fileUrl}
                  onChange={(e) => { const n = [...docs]; n[i].fileUrl = e.target.value; setDocs(n); }} />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setDocs([...docs, { name: '', fileUrl: '' }])} className="text-xs text-blue-600">+ Add doc</button>
              <button onClick={uploadDocs} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Submit Docs</button>
            </div>
          </div>
        )}

        {user?.role === 'admin' && moveIn.status === 'documents_submitted' && (
          <button onClick={verifyDocs} className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm">Verify All Docs</button>
        )}
      </div>

      {/* Agreement section */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Agreement</h3>
        {moveIn.agreementConfirmed ? (
          <p className="text-green-600 text-sm">✓ Confirmed on {new Date(moveIn.agreementConfirmedAt).toLocaleString()}</p>
        ) : (
          user?.role === 'tenant' && moveIn.status === 'documents_submitted' && moveIn.documents.every((d) => d.verified) ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">By clicking below, you agree to the rental terms and conditions.</p>
              <button onClick={confirmAgreement} className="bg-blue-600 text-white px-4 py-2 rounded">I Agree</button>
            </div>
          ) : <p className="text-sm text-gray-400">Pending document verification.</p>
        )}
      </div>

      {/* Inventory section */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Inventory Checklist</h3>
        {moveIn.inventoryChecklist.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {moveIn.inventoryChecklist.map((item) => (
              <li key={item._id} className="flex items-center justify-between">
                <span>{item.item}</span>
                {item.confirmedByTenant ? (
                  <span className="text-green-600">{item.condition}</span>
                ) : user?.role === 'tenant' && moveIn.status === 'agreement_confirmed' ? (
                  <select className="border px-2 py-1 rounded text-xs"
                    value={inventoryInput[item._id] || ''}
                    onChange={(e) => setInventoryInput({ ...inventoryInput, [item._id]: e.target.value })}>
                    <option value="">Select</option>
                    <option value="good">Good</option>
                    <option value="minor_damage">Minor Damage</option>
                    <option value="needs_repair">Needs Repair</option>
                  </select>
                ) : <span className="text-gray-400">Pending</span>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-400">No inventory items yet.</p>}

        {user?.role === 'tenant' && moveIn.status === 'agreement_confirmed' && moveIn.inventoryChecklist.length > 0 && (
          <button onClick={confirmInventory} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm">Confirm Inventory</button>
        )}

        {user?.role === 'admin' && moveIn.status === 'agreement_confirmed' && moveIn.inventoryChecklist.length === 0 && (
          <div className="mt-2">
            <input placeholder="Item1, Item2, Item3" className="border px-3 py-2 rounded w-full mb-2" value={items} onChange={(e) => setItems(e.target.value)} />
            <button onClick={addInventory} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Add Items</button>
          </div>
        )}

        {user?.role === 'admin' && moveIn.status === 'inventory_completed' && (
          <button onClick={markComplete} className="mt-2 bg-green-700 text-white px-4 py-2 rounded">Mark Move-In Completed</button>
        )}
      </div>

      {msg && <p className="text-sm text-green-600 mt-2">{msg}</p>}
    </div>
  );
}
