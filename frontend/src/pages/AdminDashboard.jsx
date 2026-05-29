import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Briefcase, LayoutDashboard, Settings, Search, SlidersHorizontal, 
  ChevronDown, ChevronUp, Calendar, MapPin, CheckCircle, Clock, XCircle, 
  ChevronLeft, ChevronRight, AlertCircle, CreditCard, UserCheck, Eye, Sparkles, Star
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalTechnicians: 0, totalBookings: 0 });
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState('bookings');

  // Legal & Compliance states
  const [legalDocs, setLegalDocs] = useState([]);
  const [complianceLogs, setComplianceLogs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);

  const fetchLegalData = async () => {
    setIsLoadingLegal(true);
    try {
      const docsRes = await api.get('/legal/documents');
      setLegalDocs(docsRes.data);
      if (docsRes.data.length > 0 && !selectedDoc) {
        setSelectedDoc(docsRes.data[0]);
        setDocTitle(docsRes.data[0].title);
        setDocContent(docsRes.data[0].content);
      }
      const logsRes = await api.get('/legal/logs');
      setComplianceLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to load legal compliance data", err);
    } finally {
      setIsLoadingLegal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'legal') {
      fetchLegalData();
    }
  }, [activeTab]);

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setIsSavingDoc(true);
    try {
      const res = await api.put(`/legal/document/${selectedDoc.type}`, {
        title: docTitle,
        content: docContent
      });
      alert('Document template updated and version incremented successfully!');
      setLegalDocs(prev => prev.map(doc => doc.type === selectedDoc.type ? res.data.document : doc));
      setSelectedDoc(res.data.document);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update document template');
    } finally {
      setIsSavingDoc(false);
    }
  };

  // Booking Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Withdrawal filters
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');

  // Withdrawal modals states
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payRequest, setPayRequest] = useState(null);
  const [txnId, setTxnId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // UI state for expansions
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [assigningBookingId, setAssigningBookingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, usersRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { totalUsers: 0, totalTechnicians: 0, totalBookings: 0 }})),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/withdrawals').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setUsers(usersRes.data);
      setWithdrawals(withdrawalsRes.data);
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

  const handleApproveWithdrawal = async (id) => {
    if (!window.confirm("Are you sure you want to approve this withdrawal request?")) return;
    try {
      await api.put(`/admin/withdrawals/${id}/status`, { status: 'approved' });
      alert("Withdrawal request approved successfully.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to approve request");
    }
  };

  const handleRejectWithdrawal = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      await api.put(`/admin/withdrawals/${rejectRequest._id}/status`, {
        status: 'rejected',
        adminNotes: rejectReason
      });
      alert("Withdrawal request rejected and refunded.");
      setRejectRequest(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    if (!txnId.trim()) {
      alert("Please enter a Transaction ID / Reference.");
      return;
    }
    try {
      await api.put(`/admin/withdrawals/${payRequest._id}/status`, {
        status: 'paid',
        transactionId: txnId,
        adminNotes: payoutNotes || "Paid successfully"
      });
      alert("Withdrawal marked as paid.");
      setPayRequest(null);
      setTxnId('');
      setPayoutNotes('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark as paid");
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

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Users & Technicians */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20"><Users size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Accounts</p>
              <p className="text-xl font-black text-white">{stats.totalUsers + stats.totalTechnicians || 0}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">U: {stats.totalUsers || 0} | T: {stats.totalTechnicians || 0}</p>
            </div>
          </div>
          
          {/* Card 2: Bookings Volume */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><Calendar size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bookings Count</p>
              <p className="text-xl font-black text-white">{stats.totalBookings || 0}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">D: {stats.dailyBookings || 0} | M: {stats.monthlyBookings || 0}</p>
            </div>
          </div>
          
          {/* Card 3: Cancellations */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20"><XCircle size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cancellations</p>
              <p className="text-xl font-black text-white">{stats.cancellations || 0}</p>
              <p className="text-[9px] text-rose-400 font-bold mt-0.5">{stats.cancellationRate || 0}% Rate</p>
            </div>
          </div>
          
          {/* Card 4: Online Techs */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><CheckCircle size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online Techs</p>
              <p className="text-xl font-black text-white">{stats.onlineTechnicians || 0}</p>
              <p className="text-[9px] text-emerald-400 font-bold mt-0.5">Active & Ready</p>
            </div>
          </div>

          {/* Card 5: Satisfaction Rating */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex items-center gap-3.5 hover:border-white/10 transition-colors">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20"><Star size={20} className="fill-current" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Rating</p>
              <p className="text-xl font-black text-white">{stats.satisfactionRating || 4.8}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Premium Score</p>
            </div>
          </div>

          {/* Card 6: Platform Revenue */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/60 p-5 rounded-2xl border border-indigo-500/30 flex items-center gap-3.5 hover:border-indigo-500/50 transition-colors">
            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/40"><CreditCard size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Rev</p>
              <p className="text-xl font-black text-white">₹{(stats.totalPlatformRevenue || 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Plus: ₹{stats.premiumRevenue || 0}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-4 sm:gap-6 border-b border-white/5 pb-1 scrollbar-none snap-x snap-mandatory shrink-0">
          {[
            { id: 'bookings', label: 'Dispatch Center', icon: LayoutDashboard },
            { id: 'withdrawals', label: 'Withdrawal Requests', icon: CreditCard },
            { id: 'analytics', label: 'Growth & Demands', icon: Sparkles },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'legal', label: 'Compliance & Legal', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
              className={`flex items-center gap-2 pb-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all outline-none cursor-pointer shrink-0 snap-center ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area Based on Active Tab */}
        {activeTab === 'bookings' && (
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
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/5 transition-all outline-none cursor-pointer"
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
                                    <p><span className="text-slate-500">Device/Category Details:</span> {b.deviceType || b.serviceName || 'N/A'}</p>
                                    <p><span className="text-slate-500">Description:</span> {b.problemDescription || 'N/A'}</p>
                                    <p><span className="text-slate-500">Town Area:</span> {b.location || 'N/A'}</p>
                                    <p><span className="text-slate-500">Address:</span> {b.detailedAddress || 'N/A'}</p>
                                    {b.areaSize && <p><span className="text-slate-500">Area Size:</span> {b.areaSize}</p>}
                                    {b.houseType && <p><span className="text-slate-500">House Type:</span> {b.houseType}</p>}
                                    {b.numberOfRooms && <p><span className="text-slate-500">Rooms:</span> {b.numberOfRooms}</p>}
                                    {b.wallArea && <p><span className="text-slate-500">Wall Area:</span> {b.wallArea}</p>}
                                    {b.indoorOutdoor && <p><span className="text-slate-500">Location Type:</span> {b.indoorOutdoor}</p>}
                                    {b.paintPreference && <p><span className="text-slate-500">Paint Preference:</span> {b.paintPreference}</p>}
                                    {b.applianceType && <p><span className="text-slate-500">Appliance:</span> {b.applianceType}</p>}
                                    {b.installationLocation && <p><span className="text-slate-500">Mounting:</span> {b.installationLocation}</p>}
                                    {b.accessoriesNeeded && <p><span className="text-slate-500">Accessories:</span> {b.accessoriesNeeded}</p>}
                                    {b.cancellationReason && (
                                      <p className="text-rose-400"><span className="text-slate-500">Cancelled By:</span> {b.cancelledBy} | Reason: {b.cancellationReason}</p>
                                    )}
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
                                          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md outline-none cursor-pointer"
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
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all uppercase tracking-wider text-[10px] outline-none cursor-pointer"
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
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition-all border border-white/5 uppercase tracking-wider outline-none cursor-pointer"
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
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Technician Wallet Withdrawals</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Review, approve, and process payouts for service technicians.</p>
              </div>

              {/* Sub filters */}
              <div className="flex overflow-x-auto gap-1.5 pb-2">
                {[
                  { id: 'all', label: 'All Requests' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'paid', label: 'Paid' },
                  { id: 'rejected', label: 'Rejected' },
                ].map(subFilter => (
                  <button
                    key={subFilter.id}
                    onClick={() => setWithdrawalFilter(subFilter.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none border cursor-pointer ${withdrawalFilter === subFilter.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10' : 'bg-slate-800/80 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {subFilter.label}
                  </button>
                ))}
              </div>

              {/* Table of withdrawals */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="p-5">Technician Details</th>
                      <th className="p-5">Payout Destination</th>
                      <th className="p-5">Requested Amount</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                          No withdrawal requests found
                        </td>
                      </tr>
                    ) : filteredWithdrawals.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-900/30 transition-all">
                        <td className="p-5">
                          <p className="font-extrabold text-white text-sm">{req.technician?.name || 'Technician'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{req.technician?.email || 'No email'}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Avail Bal: ₹{req.technician?.walletBalance || 0}</p>
                        </td>
                        <td className="p-5 text-xs text-slate-300">
                          {req.bankDetails?.accountNumber ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-200">Bank Transfer</p>
                              <p className="text-[10px] text-slate-400 font-mono">A/C: {req.bankDetails.accountNumber}</p>
                              <p className="text-[10px] text-slate-400 font-mono">IFSC: {req.bankDetails.ifscCode}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Name: {req.bankDetails.accountName}</p>
                            </div>
                          ) : (
                            <p className="text-slate-500">No bank details</p>
                          )}
                          {req.bankDetails?.upiId && (
                            <p className="text-[10px] text-indigo-400 font-mono mt-1">UPI: {req.bankDetails.upiId}</p>
                          )}
                        </td>
                        <td className="p-5 font-black text-white text-sm">
                          ₹{req.amount}
                          <p className="text-[9px] text-slate-500 font-mono font-medium mt-0.5">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            req.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            req.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            req.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {req.status}
                          </span>
                          {req.transactionId && (
                            <p className="text-[9px] text-slate-400 font-mono mt-1">Txn: {req.transactionId}</p>
                          )}
                          {req.processedAt && (
                            <p className="text-[9px] text-slate-400 font-medium mt-1">
                              Processed: {new Date(req.processedAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          {req.adminNotes && (
                            <p className="text-[9px] text-slate-500 mt-1 italic">Note: {req.adminNotes}</p>
                          )}
                        </td>
                        <td className="p-5 text-right space-x-2 whitespace-nowrap">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveWithdrawal(req._id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all outline-none cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectRequest(req)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all outline-none cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <>
                              <button
                                onClick={() => setPayRequest(req)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all outline-none cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                              <button
                                onClick={() => setRejectRequest(req)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all outline-none cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(req.status === 'paid' || req.status === 'rejected') && (
                            <span className="text-xs text-slate-500 italic">No Action Required</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Growth & Demands Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6 sm:p-8 space-y-8 bg-slate-900/40 rounded-[2rem] border border-white/5 shadow-2xl">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Growth & Demand Analytics</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Real-time demand distribution and market trends across areas and categories.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Area Demands */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-400" /> Area-wise Demands
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Booking concentration across different operation towns.</p>
                </div>
                
                <div className="space-y-4">
                  {!stats.areaDemands || stats.areaDemands.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No area demand data available</p>
                  ) : stats.areaDemands.map((area, idx) => {
                    const percentage = stats.totalBookings > 0 
                      ? Math.round((area.count / stats.totalBookings) * 100) 
                      : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">{area.name}</span>
                          <span className="text-indigo-400">{area.count} jobs ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Service Demands */}
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Briefcase size={18} className="text-emerald-400" /> Service Category Demands
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Distribution of requests by service type.</p>
                </div>

                <div className="space-y-4">
                  {!stats.serviceDemands || stats.serviceDemands.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No service demand data available</p>
                  ) : stats.serviceDemands.map((service, idx) => {
                    const percentage = stats.totalBookings > 0 
                      ? Math.round((service.count / stats.totalBookings) * 100) 
                      : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300">{service.name}</span>
                          <span className="text-emerald-400">{service.count} requests ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Top Technicians List */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" /> Top Performing Technicians
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Top 5 technicians based on verification standing and customer reviews.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {!stats.topTechnicians || stats.topTechnicians.length === 0 ? (
                  <p className="text-xs text-slate-500 italic col-span-5 text-center">No technician rating data available</p>
                ) : stats.topTechnicians.map((t, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-white/5 text-center space-y-2">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-base font-black border border-indigo-500/20">
                      {t.name ? t.name.charAt(0) : 'T'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">📍 {t.area || 'Local'}</p>
                    </div>
                    <div className="flex justify-center items-center gap-1.5 text-amber-400 text-xs font-black">
                      <Star size={12} className="fill-current animate-pulse" /> {t.rating || 5.0}
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.jobsCompleted || 0} Jobs Completed</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Directory Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">User & Technician Directory</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Directory of registered customer and technician accounts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                      <th className="p-5">Name / Email</th>
                      <th className="p-5">Phone</th>
                      <th className="p-5">Role</th>
                      <th className="p-5">Premium status</th>
                      <th className="p-5 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                          No registered accounts found
                        </td>
                      </tr>
                    ) : users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-900/30 transition-all">
                        <td className="p-5">
                          <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                            {u.name}
                            {u.isPremium && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5"><Sparkles size={8} /> Plus</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                        </td>
                        <td className="p-5 text-xs font-mono text-slate-300">
                          {u.phone || 'N/A'}
                        </td>
                        <td className="p-5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : u.role === 'technician' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 text-xs font-semibold text-slate-300">
                          {u.isPremium ? (
                            <span className="text-amber-400">Premium Member</span>
                          ) : (
                            <span className="text-slate-500">Standard Tier</span>
                          )}
                        </td>
                        <td className="p-5 text-right text-xs text-slate-400 font-medium">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'legal' && (
          <div className="space-y-6">
            {/* Template Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Templates List */}
              <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Shield className="text-indigo-400" size={18} />
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Document Templates</h3>
                </div>
                {isLoadingLegal && legalDocs.length === 0 ? (
                  <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-indigo-400" /></div>
                ) : (
                  <div className="space-y-2">
                    {legalDocs.map(doc => {
                      const active = selectedDoc?.type === doc.type;
                      return (
                        <button
                          key={doc.type}
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDocTitle(doc.title);
                            setDocContent(doc.content);
                          }}
                          className={`w-full text-left p-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                            active
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                              : 'bg-slate-800/60 border-white/5 text-slate-400 hover:bg-slate-850 hover:text-white'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{doc.title || doc.type}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              active ? 'bg-indigo-700 text-white' : 'bg-slate-950/40 text-slate-500'
                            }`}>
                              V{doc.version}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {legalDocs.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-4">No templates loaded. Run seed script first.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Template Text Editor */}
              <div className="lg:col-span-2 bg-slate-900/40 rounded-[2rem] border border-white/5 p-6 shadow-2xl">
                {selectedDoc ? (
                  <form onSubmit={handleUpdateDocument} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Template Editor</h4>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        Active Version: V{selectedDoc.version}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Document Title</label>
                      <input
                        required
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Template HTML / Markdown Content</label>
                      <textarea
                        required
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:border-indigo-500 transition-all outline-none h-60 resize-y"
                        placeholder="Type policy terms details here..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingDoc}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-extrabold py-3 rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest outline-none active:scale-[0.98] cursor-pointer"
                    >
                      {isSavingDoc ? <Loader2 className="animate-spin inline-block mr-1" size={14} /> : 'Save Template & Increment Version'}
                    </button>
                  </form>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                    <Shield size={36} className="text-slate-600 mb-2 animate-pulse" />
                    <p className="text-xs italic">Select a template from the left to start editing</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Acceptance Logs */}
            <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Compliance Acceptance Logs</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Audit trail of customer & technician agreements</p>
                </div>
                <button
                  type="button"
                  onClick={fetchLegalData}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 outline-none"
                >
                  <RefreshCw size={12} /> Sync Logs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="p-5">User Account</th>
                      <th className="p-5">System Role</th>
                      <th className="p-5">Document Agreed</th>
                      <th className="p-5">Consent Version</th>
                      <th className="p-5 text-right">Agreed Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceLogs.map((log) => {
                      const docTypeMap = {
                        terms_conditions: 'Terms & Conditions',
                        privacy_policy: 'Privacy Policy',
                        technician_terms: 'Technician Agreement'
                      };
                      return (
                        <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-semibold text-xs text-white">
                          <td className="p-5">
                            <div className="font-black text-slate-100">{log.userName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{log.userEmail}</div>
                          </td>
                          <td className="p-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              log.userRole === 'technician' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {log.userRole}
                            </span>
                          </td>
                          <td className="p-5 text-slate-300">
                            {docTypeMap[log.documentType] || log.documentType}
                          </td>
                          <td className="p-5">
                            <span className="font-mono bg-slate-950/60 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                              V{log.version}
                            </span>
                          </td>
                          <td className="p-5 text-right text-slate-400 text-xs">
                            {log.acceptedAt ? new Date(log.acceptedAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                    {complianceLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-xs text-slate-500 italic">
                          No legal consent logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Reject Withdrawal Modal */}
      {rejectRequest && (
        <div className="fixed inset-0 z-50 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Reject Withdrawal Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Reject request for ₹{rejectRequest.amount} from {rejectRequest.technician?.name}. This will refund the amount back to the technician's available wallet balance.
            </p>
            <form onSubmit={handleRejectWithdrawal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rejection Reason</label>
                <textarea
                  required
                  placeholder="Enter rejection reason for the technician..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-rose-500 h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setRejectRequest(null); setRejectReason(''); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg outline-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg outline-none cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {payRequest && (
        <div className="fixed inset-0 z-50 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Disbursal (Mark as Paid)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter transaction details to confirm successful payment of ₹{payRequest.amount} to {payRequest.technician?.name}.
            </p>
            <form onSubmit={handleMarkAsPaid} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Transaction ID / Reference Number</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. TXN987654321, UPI Ref, Bank UTR..."
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Admin Payout Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed via IMPS transfer"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setPayRequest(null); setTxnId(''); setPayoutNotes(''); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg outline-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg outline-none cursor-pointer"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
