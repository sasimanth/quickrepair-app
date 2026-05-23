import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Briefcase, LayoutDashboard, Settings, Search, SlidersHorizontal, 
  ChevronDown, ChevronUp, Calendar, MapPin, CheckCircle, Clock, XCircle, 
  ChevronLeft, ChevronRight, AlertCircle, CreditCard, UserCheck, Eye, Sparkles
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalTechnicians: 0, totalBookings: 0 });
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // UI state for expansions
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [assigningBookingId, setAssigningBookingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, usersRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { totalUsers: 0, totalTechnicians: 0, totalBookings: 0 }})),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignTechnician = async (bookingId, techId) => {
    if (!techId) return;
    try {
      const { data } = await api.put(`/bookings/${bookingId}/assign`, { providerId: techId });
      setBookings(prev => prev.map(b => b._id === bookingId ? data : b));
      setAssigningBookingId(null);
      
      // Refresh stats and user list
      const statsRes = await api.get('/admin/stats').catch(() => null);
      if (statsRes) setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign technician");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-slate-400 font-medium animate-pulse">Loading Admin Panel...</p>
      </div>
    );
  }

  // Filter technicians
  const techniciansList = users.filter(u => u.role === 'technician');

  // Compute stats
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const pendingBookings = bookings.filter(b => !['completed', 'rejected', 'cancelled'].includes(b.status));
  
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.finalQuote || b.serviceId?.price || 0), 0);
  const techEarnings = totalRevenue * 0.90; 
  const platformFees = totalRevenue * 0.10; 

  // Filter & Sort Bookings
  const filteredBookings = bookings.filter(b => {
    const query = searchQuery.toLowerCase();
    const customerName = (b.name || '').toLowerCase();
    const customerEmail = (b.userEmail || '').toLowerCase();
    const serviceName = (b.serviceName || b.serviceId?.name || '').toLowerCase();
    const techName = (b.technicianName || '').toLowerCase();
    const bookingId = b._id.toLowerCase();

    const matchesSearch = 
      customerName.includes(query) || 
      customerEmail.includes(query) || 
      serviceName.includes(query) || 
      techName.includes(query) ||
      bookingId.includes(query);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort logic
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    const priceA = a.finalQuote || a.serviceId?.price || 0;
    const priceB = b.finalQuote || b.serviceId?.price || 0;

    if (sortBy === 'date_desc') return dateB - dateA;
    if (sortBy === 'date_asc') return dateA - dateB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'price_asc') return priceA - priceB;
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedBookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = sortedBookings.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'accepted':
      case 'quote_approved':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'quote_pending':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-br from-slate-900 via-[#111827] to-slate-900 p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/10 text-white">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Enterprise Console</h1>
              <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Platform Admin Management</p>
            </div>
          </div>
          <button 
             onClick={() => window.location.href = '/book'}
             className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all text-sm uppercase tracking-wider outline-none z-10 cursor-pointer"
          >
             + Dispatch Booking
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Accounts</p>
              <p className="text-2xl font-black text-white">{stats.totalUsers || 0}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20"><Briefcase size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technicians</p>
              <p className="text-2xl font-black text-white">{stats.totalTechnicians || 0}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-colors">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><LayoutDashboard size={14}/> Dispatch Stats</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-emerald-500/10 rounded-xl p-2.5 text-center border border-emerald-500/10">
                <p className="text-xl font-black text-emerald-400">{completedBookings.length}</p>
                <p className="text-[9px] uppercase font-black text-emerald-500 tracking-wider">Done</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-2.5 text-center border border-amber-500/10">
                <p className="text-xl font-black text-amber-400">{pendingBookings.length}</p>
                <p className="text-[9px] uppercase font-black text-amber-500 tracking-wider">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-900/40 via-indigo-900/20 to-transparent p-6 rounded-3xl border border-indigo-500/30 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Platform Volume</p>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black tracking-widest">10% FEE</span>
            </div>
            <p className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString()}</p>
            <div className="flex justify-between text-[10px] mt-2 text-indigo-400 border-t border-white/5 pt-2 font-bold uppercase tracking-wider">
              <span>Tech: ₹{techEarnings.toLocaleString()}</span>
              <span>Fee: ₹{platformFees.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Global Dispatch Manager Container */}
        <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          
          <div className="p-6 sm:p-8 border-b border-white/5 bg-slate-900/60 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Recent Global Repair Requests</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Review live bookings, approve quotes, and dispatch available local professionals.</p>
            </div>

            {/* Filter Search Sorting Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              {/* Status Tabs */}
              <div className="flex overflow-x-auto gap-1.5 pb-2 lg:pb-0 scrollbar-none snap-x snap-mandatory">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'accepted', label: 'Accepted' },
                  { id: 'quote_pending', label: 'Quote Proposal' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 snap-center outline-none border cursor-pointer ${statusFilter === tab.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10' : 'bg-slate-800/80 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort Panel */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-xs font-semibold text-slate-200 transition-all"
                  />
                </div>
                
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-4 pr-10 py-2.5 bg-slate-900 border border-white/5 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold text-slate-300 appearance-none cursor-pointer"
                  >
                    <option value="date_desc">Latest Bookings</option>
                    <option value="date_asc">Oldest Bookings</option>
                    <option value="price_desc">Highest Price</option>
                    <option value="price_asc">Lowest Price</option>
                  </select>
                  <SlidersHorizontal className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                  <th className="p-5">ID / Service</th>
                  <th className="p-5">Customer Info</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Technician / Date</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                      No matching repair requests found
                    </td>
                  </tr>
                ) : currentBookings.map((b) => {
                  const isExpanded = expandedBookingId === b._id;
                  
                  return (
                    <React.Fragment key={b._id}>
                      <tr className={`hover:bg-slate-900/30 transition-all ${isExpanded ? 'bg-slate-900/20' : ''}`}>
                        <td className="p-5">
                          <p className="font-extrabold text-white text-sm">{b.serviceName || b.serviceId?.name || 'Device Repair'}</p>
                          <p className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5">#{b._id.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-semibold text-slate-200">{b.name || 'Guest User'}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.phone || 'No Phone'}</p>
                        </td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(b.status)}`}>
                            {b.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-5 text-xs text-slate-300">
                          <p className="font-semibold">{b.date ? new Date(b.date).toLocaleDateString() : 'ASAP'}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.technicianName || 'Unassigned'}</p>
                        </td>
                        <td className="p-5 text-right space-x-2">
                          <button
                            onClick={() => setExpandedBookingId(isExpanded ? null : b._id)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/5 transition-all outline-none"
                          >
                            {isExpanded ? 'Hide' : 'Review'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" className="p-6 bg-[#0E1422] border-t border-b border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Booking Specifications</h4>
                                <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                                  <p><span className="text-slate-500">Device Type:</span> {b.deviceType || 'N/A'}</p>
                                  <p><span className="text-slate-500">Description:</span> {b.problemDescription || 'N/A'}</p>
                                  <p><span className="text-slate-500">Town Area:</span> {b.location || 'N/A'}</p>
                                  <p><span className="text-slate-500">Address:</span> {b.detailedAddress || 'N/A'}</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Financial Quote Details</h4>
                                <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                                  <p><span className="text-slate-500">Diagnosed Charge:</span> ₹{b.serviceCharge || 0}</p>
                                  <p><span className="text-slate-500">Spare Parts Cost:</span> ₹{b.sparePartsCost || 0}</p>
                                  <p><span className="text-slate-500">Transport Fee:</span> ₹{b.transportCharge || 0}</p>
                                  <p className="text-indigo-300 font-bold"><span className="text-slate-500 font-medium">Guaranteed Quote:</span> ₹{b.finalQuote || b.serviceId?.price || 0}</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Technician Operations</h4>
                                {b.status === 'pending' || !b.providerId ? (
                                  <div className="space-y-2">
                                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1"><AlertCircle size={12}/> Dispatch Technician</p>
                                    {assigningBookingId === b._id ? (
                                      <div className="space-y-2">
                                        <select
                                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                                          onChange={(e) => handleAssignTechnician(b._id, e.target.value)}
                                          defaultValue=""
                                        >
                                          <option value="" disabled>Select Technician</option>
                                          {techniciansList.map(t => (
                                            <option key={t._id} value={t._id}>{t.name} (📍 {t.location || 'Local'})</option>
                                          ))}
                                        </select>
                                        <button onClick={() => setAssigningBookingId(null)} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-wider">Cancel</button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setAssigningBookingId(b._id)}
                                        className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md outline-none"
                                      >
                                        Assign Technician
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                                    <p><span className="text-slate-500">Assigned Tech:</span> {b.technicianName || 'Verified tech'}</p>
                                    <p><span className="text-slate-500">Contact Email:</span> {b.providerEmail || 'N/A'}</p>
                                    <p><span className="text-slate-500">Phone Dialer:</span> {b.providerPhone || 'N/A'}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid Cards View */}
          <div className="md:hidden p-4 space-y-4">
            {currentBookings.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-xs uppercase tracking-widest font-bold">No requests available</p>
            ) : currentBookings.map((b) => {
              const isExpanded = expandedBookingId === b._id;
              
              return (
                <div key={b._id} className="bg-slate-900/60 rounded-3xl p-5 border border-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(b.status)}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                      <h3 className="font-extrabold text-white text-base mt-2">{b.serviceName || b.serviceId?.name || 'Device Repair'}</h3>
                      <p className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5">#{b._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-mono">{b.date ? new Date(b.date).toLocaleDateString() : 'ASAP'}</p>
                      <p className="text-sm font-black text-white mt-1">₹{b.finalQuote || b.serviceId?.price || 0}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Customer Info</p>
                    <p className="text-xs text-slate-200 font-semibold mt-1">{b.name || 'Guest User'} ({b.phone || 'No Phone'})</p>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t border-white/5 animate-in fade-in duration-300 text-xs">
                      <div>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Device Description</p>
                        <p className="text-slate-300 mt-1 font-semibold leading-relaxed">{b.deviceType || 'N/A'} - {b.problemDescription || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Address details</p>
                        <p className="text-slate-300 mt-1 font-semibold leading-relaxed">{b.location || 'N/A'}, {b.detailedAddress || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl space-y-1.5 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quote Breakdown</p>
                        <p className="flex justify-between text-slate-400"><span>Diagnosis:</span> <span>₹{b.serviceCharge || 0}</span></p>
                        <p className="flex justify-between text-slate-400"><span>Parts:</span> <span>₹{b.sparePartsCost || 0}</span></p>
                        <p className="flex justify-between text-slate-400"><span>Transport:</span> <span>₹{b.transportCharge || 0}</span></p>
                      </div>

                      {/* Tech Operations for mobile */}
                      <div>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1.5">Technician Assignment</p>
                        {b.status === 'pending' || !b.providerId ? (
                          assigningBookingId === b._id ? (
                            <div className="space-y-2">
                              <select
                                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold text-white outline-none"
                                onChange={(e) => handleAssignTechnician(b._id, e.target.value)}
                                defaultValue=""
                              >
                                <option value="" disabled>Select Technician</option>
                                {techniciansList.map(t => (
                                  <option key={t._id} value={t._id}>{t.name} (📍 {t.location || 'Local'})</option>
                                ))}
                              </select>
                              <button onClick={() => setAssigningBookingId(null)} className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigningBookingId(b._id)}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all uppercase tracking-wider text-[10px] outline-none"
                            >
                              Assign Technician
                            </button>
                          )
                        ) : (
                          <div className="space-y-1 text-slate-300 font-semibold">
                            <p><span className="text-slate-500 font-medium">Assigned Tech:</span> {b.technicianName || 'Verified tech'}</p>
                            <p><span className="text-slate-500 font-medium">Phone:</span> {b.providerPhone || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedBookingId(isExpanded ? null : b._id)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition-all border border-white/5 uppercase tracking-wider outline-none"
                  >
                    {isExpanded ? 'Hide Details' : 'Review Request'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-white/5 bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} Requests
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed outline-none cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed outline-none cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
