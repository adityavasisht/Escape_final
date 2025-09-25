import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

const AdminTripBookings = () => {
  const { tripId } = useParams();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/admin/bookings-by-trip/${user.id}/${tripId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
        setBookings(data.bookings || []);
      } catch (e) {
        setError(e.message || 'Failed to load trip bookings');
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id && tripId) fetchData();
  }, [user?.id, tripId, API_BASE_URL, getToken]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bookings…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow max-w-lg w-full text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-500 text-white rounded">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Bookings for Trip</h1>
          {bookings.length > 0 && (
            <button
              onClick={() => {
                const header = [
                  'Customer Name','Customer Email','Customer Phone','Booking Date','Amount','Status','Total Passengers','Passenger Details','Trip OTP'
                ];
                const rows = bookings.map(b => {
                  const details = (b.passengers || []).map((p, idx) => `${idx+1}. ${(p.gender||'Other')}${typeof p.age==='number' ? `(${p.age})` : ''}`).join(' | ');
                  return [
                    b.customerName || '',
                    b.customerEmail || '',
                    b.customerPhone || '',
                    new Date(b.bookingDate).toLocaleDateString(),
                    b.totalAmount || 0,
                    b.bookingStatus || '',
                    b.totalPassengers || (b.passengers?.length || 1),
                    details,
                    b.tripOTP || ''
                  ];
                });
                const csv = [header, ...rows]
                  .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trip_${tripId}_bookings_${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            >
              Export CSV
            </button>
          )}
        </div>
        {bookings.length === 0 ? (
          <p className="text-gray-600">No bookings yet for this trip.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Passengers</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Details</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map(b => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-800">{b.customerName}<div className="text-xs text-gray-500">{b.customerEmail}</div></td>
                    <td className="px-4 py-2 text-sm text-gray-800">{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">₹{b.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{b.totalPassengers || (b.passengers?.length || 1)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
                      {b.passengers && b.passengers.length > 0 ? b.passengers.map((p, i) => `${i?'; ':''}${p.gender||'Other'}${typeof p.age==='number'?`(${p.age})`:''}`) : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        b.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' : b.bookingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>{b.bookingStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTripBookings;


