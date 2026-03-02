import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import { useUser } from '../context/UserContext.jsx';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [msg, setMsg] = useState('');

  const fetch = () => {
    api.get(`/support/${id}`).then((r) => setTicket(r.data.data)).catch(console.error);
  };

  useEffect(() => {
    fetch();
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.post(`/support/${id}/message`, { message: reply });
      setReply('');
      fetch();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  if (!ticket) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">{ticket.subject}</h2>
      <p className="text-sm text-gray-500 mb-4">{ticket.category} · {ticket.status}</p>

      <div className="bg-white rounded shadow p-4 space-y-3 mb-4 max-h-96 overflow-y-auto">
        {ticket.messages.map((m, i) => (
          <div key={i} className={`p-3 rounded ${m.senderRole === 'admin' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{m.senderRole === 'admin' ? 'Admin' : 'You'} · {new Date(m.createdAt).toLocaleString()}</p>
            <p className="text-sm">{m.message}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <div className="flex gap-2">
          <input placeholder="Type a reply..." className="border px-3 py-2 rounded flex-1" value={reply} onChange={(e) => setReply(e.target.value)} />
          <button onClick={sendReply} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
        </div>
      )}

      {msg && <p className="text-sm text-red-500 mt-2">{msg}</p>}
    </div>
  );
}
