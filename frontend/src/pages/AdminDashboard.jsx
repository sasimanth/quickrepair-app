import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Briefcase, LayoutDashboard, Settings } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalTechnicians: 0, totalBookings: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, bookingsRes] = await Promise.all([
          api.get('/admin/stats').catch(() => ({ data: { totalUsers: 0, totalTechnicians: 0, totalBookings: 0 }})),
          api.get('/bookings').catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setBookings(bookingsRes.data);
      } catch (error) {
        console.error('Error fetching admin data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl shadow-lg shadow-slate-300 text-white">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-500 font-medium mt-1">Platform overview and management</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full"><Users size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Users</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.totalUsers || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-full"><Briefcase size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Technicians</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.totalTechnicians || 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full"><LayoutDashboard size={24} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Total Bookings</p>
              <p className="text-2xl font-extrabold text-slate-900">{stats.totalBookings || bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Recent Repair Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider">
                  <th className="p-4">ID / Service</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tech / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-slate-500">No bookings available</td></tr>
                ) : bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{b.serviceId?.name || 'Service'}</p>
                      <p className="text-xs text-slate-500 font-mono">{b._id.slice(-6)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">{b.userEmail || 'Unknown'}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : b.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <p>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-xs text-slate-400">{b.technicianId || b.providerId || 'Unassigned'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
