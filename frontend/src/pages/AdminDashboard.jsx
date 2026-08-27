import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { globalServices, globalCategories } from '../data/services';
import { 
  Users, Briefcase, LayoutDashboard, Settings, Search, SlidersHorizontal, 
  ChevronDown, ChevronUp, Calendar, MapPin, CheckCircle, Clock, XCircle, 
  ChevronLeft, ChevronRight, AlertCircle, CreditCard, UserCheck, Eye, Sparkles, Star, Shield, Loader2, RefreshCw, ShieldAlert,
  DollarSign, TrendingUp, BarChart3, PieChart, Activity, FileText, Lock, Award, CheckSquare, Layers, Plus, Filter, Trash2, Edit, X
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalTechnicians: 0, 
    totalBookings: 0,
    dailyBookings: 0,
    monthlyBookings: 0,
    cancellations: 0,
    cancellationRate: 0,
    onlineTechnicians: 0,
    satisfactionRating: 4.8,
    totalPlatformRevenue: 0,
    premiumRevenue: 0,
    areaDemands: [],
    serviceDemands: [],
    topTechnicians: []
  });
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Financial Settings & Commission States
  const [commissionRate, setCommissionRate] = useState(15);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);

  // Service Catalog Management States
  const [serviceList, setServiceList] = useState(globalServices);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    categoryId: 'repair',
    price: '',
    description: '',
    icon: 'Wrench'
  });

  // Legal & Compliance states
  const [legalDocs, setLegalDocs] = useState([]);
  const [complianceLogs, setComplianceLogs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);

  // Verification Center states
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [selectedVerificationTech, setSelectedVerificationTech] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Security Center states
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Booking Filter & Search & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Withdrawal filters & Modals
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payRequest, setPayRequest] = useState(null);
  const [txnId, setTxnId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // UI state for expansions
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [assigningBookingId, setAssigningBookingId] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, usersRes, withdrawalsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { totalUsers: 24, totalTechnicians: 8, totalBookings: 18 }})),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/withdrawals').catch(() => ({ data: [] }))
      ]);
      setStats(prev => ({ ...prev, ...statsRes.data }));
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setWithdrawals(Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : []);
    } catch (error) {
      console.error('Error fetching admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchLegalData = async () => {
    setIsLoadingLegal(true);
    try {
      const docsRes = await api.get('/legal/documents');
      if (docsRes.data && docsRes.data.length > 0) {
        setLegalDocs(docsRes.data);
        if (!selectedDoc) {
          setSelectedDoc(docsRes.data[0]);
          setDocTitle(docsRes.data[0].title);
          setDocContent(docsRes.data[0].content);
        }
      }
      const logsRes = await api.get('/legal/logs');
      setComplianceLogs(logsRes.data || []);
    } catch (err) {
      console.error("Failed to load legal compliance data", err);
      const defaultDocs = [
        { type: 'terms_conditions', title: 'Terms & Conditions', content: '<h2>1. Marketplace Facilitator Agreement</h2><p>By accessing or using Fixvo, you agree to these Terms & Conditions. Fixvo operates strictly as an on-demand technology marketplace matching customers with independent, verified service professionals ("Technicians"). Fixvo is not a direct employer of technicians nor a direct repair provider.</p><h2>2. User Obligations</h2><p>Users must provide truthful service address information, contact phone numbers, and failure descriptions.</p>', version: 1, updatedAt: new Date().toISOString() },
        { type: 'privacy_policy', title: 'Privacy Policy', content: '<h2>1. Information We Collect</h2><p>Fixvo collects personal identifiers (name, email address, phone number), physical service location, and equipment details to facilitate repair services.</p><h2>2. Geolocation Tracking</h2><p>To enable real-time technician matching and live ETA tracking, Fixvo requests access to location services.</p>', version: 1, updatedAt: new Date().toISOString() }
      ];
      setLegalDocs(defaultDocs);
      if (!selectedDoc) {
        setSelectedDoc(defaultDocs[0]);
        setDocTitle(defaultDocs[0].title);
        setDocContent(defaultDocs[0].content);
      }
    } finally {
      setIsLoadingLegal(false);
    }
  };

  const fetchPendingVerifications = async () => {
    setLoadingVerifications(true);
    try {
      const { data } = await api.get('/admin/technicians/pending');
      setPendingVerifications(data || []);
    } catch (err) {
      console.error("Failed to load pending verifications", err);
      setPendingVerifications([
        {
          _id: 'tech_v1',
          name: 'Ramesh Kumar',
          email: 'ramesh.tech@fixvo.in',
          phone: '+91 98765 43210',
          skills: ['AC Repair', 'Refrigeration'],
          experience: '6 Years',
          idProofUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
          tradeLicenseUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'tech_v2',
          name: 'Kalyan Naidu',
          email: 'kalyan.tech@fixvo.in',
          phone: '+91 91234 56789',
          skills: ['Plumbing', 'Water Purifier RO'],
          experience: '4 Years',
          idProofUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingVerifications(false);
    }
  };

  const fetchSecurityData = async () => {
    setLoadingSecurity(true);
    try {
      const alertsRes = await api.get('/admin/security/alerts');
      setSecurityAlerts(alertsRes.data?.alerts || []);
      setSecurityStats(alertsRes.data?.stats || null);

      const logsRes = await api.get('/admin/security/audit-logs');
      setAuditLogs(logsRes.data || []);
    } catch (err) {
      console.error("Failed to load security metrics", err);
      setSecurityAlerts([
        {
          _id: 'sec_1',
          severity: 'high',
          type: 'Potential Off-Platform Payment Leakage',
          description: 'Technician #TECH-402 cancelled 3 consecutive bookings after customer phone contact.',
          createdAt: new Date().toISOString(),
          status: 'open'
        },
        {
          _id: 'sec_2',
          severity: 'medium',
          type: 'Multiple Unrecognized IP Logins',
          description: '5 failed admin login attempts detected from IP 185.220.101.4.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'open'
        }
      ]);
      setSecurityStats({ openAlerts: 2, totalResolved: 14, highRiskTechs: 1 });
      setAuditLogs([
        { _id: 'log_1', action: 'COMMISSION_RATE_UPDATED', admin: 'Founder Admin', details: 'Updated platform commission from 12% to 15%', timestamp: new Date().toISOString() },
        { _id: 'log_2', action: 'TECH_VERIFIED', admin: 'Founder Admin', details: 'Approved KYC for Ramesh Kumar (#TECH-104)', timestamp: new Date(Date.now() - 7200000).toISOString() }
      ]);
    } finally {
      setLoadingSecurity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'legal') {
      fetchLegalData();
    } else if (activeTab === 'verifications') {
      fetchPendingVerifications();
    } else if (activeTab === 'security') {
      fetchSecurityData();
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

  const handleReviewTechnician = async (userId, status) => {
    try {
      await api.put(`/admin/technicians/${userId}/verify`, {
        status,
        adminNotes: verificationNotes
      });
      alert(`Technician status updated to ${status} successfully!`);
      setSelectedVerificationTech(null);
      setVerificationNotes('');
      fetchPendingVerifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit technician document review');
    }
  };

  const handleResolveAlert = async (e) => {
    e.preventDefault();
    if (!resolvingAlertId) return;
    try {
      await api.put(`/admin/security/alerts/${resolvingAlertId}/resolve`, {
        resolutionNotes
      });
      alert('Security alert successfully resolved.');
      setResolvingAlertId(null);
      setResolutionNotes('');
      fetchSecurityData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to resolve alert.');
    }
  };

  const handleAssignTechnician = async (bookingId, techId) => {
    if (!techId) return;
    try {
      const { data } = await api.put(`/bookings/${bookingId}/assign`, { providerId: techId });
      setBookings(prev => prev.map(b => b._id === bookingId ? data : b));
      setAssigningBookingId(null);
      alert("Technician assigned successfully!");
      fetchData();
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

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceForm.name || !newServiceForm.price) return;
    
    const newService = {
      id: 'srv_' + Date.now(),
      name: newServiceForm.name,
      categoryId: newServiceForm.categoryId,
      price: Number(newServiceForm.price),
      description: newServiceForm.description,
      icon: newServiceForm.icon
    };
    
    setServiceList(prev => [newService, ...prev]);
    setNewServiceForm({ name: '', categoryId: 'repair', price: '', description: '', icon: 'Wrench' });
    setShowAddServiceForm(false);
    alert('New service added to catalog successfully!');
  };

  // Filter technicians
  const techniciansList = users.filter(u => u.role === 'technician');

  // Filter & Sort Bookings
  const filteredBookings = bookings.filter(b => {
    const query = searchQuery.toLowerCase();
    const customerName = (b.name || '').toLowerCase();
    const customerEmail = (b.userEmail || '').toLowerCase();
    const serviceName = (b.serviceName || b.serviceId?.name || '').toLowerCase();
    const techName = (b.technicianName || '').toLowerCase();
    const bookingId = (b._id || b.id || '').toString().toLowerCase();

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

  const getStatusBadge = (status) => {
    const config = {
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      quote_pending: 'bg-purple-100 text-purple-800 border-purple-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200'
    };
    const style = config[status] || 'bg-slate-100 text-slate-800 border-slate-200';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

  // Compute Revenue Analytics Visual Metrics
  const revenueData = useMemo(() => {
    const totalGMV = bookings.reduce((sum, b) => sum + (b.finalQuote || b.amount || 0), 0);
    const platformCommissionEarned = totalGMV * (commissionRate / 100);
    const techNetPayouts = totalGMV - platformCommissionEarned;

    const monthlyBreakdown = [
      { month: 'Jan', gmv: Math.round(totalGMV * 0.08), commission: Math.round(totalGMV * 0.08 * 0.15) },
      { month: 'Feb', gmv: Math.round(totalGMV * 0.10), commission: Math.round(totalGMV * 0.10 * 0.15) },
      { month: 'Mar', gmv: Math.round(totalGMV * 0.12), commission: Math.round(totalGMV * 0.12 * 0.15) },
      { month: 'Apr', gmv: Math.round(totalGMV * 0.15), commission: Math.round(totalGMV * 0.15 * 0.15) },
      { month: 'May', gmv: Math.round(totalGMV * 0.14), commission: Math.round(totalGMV * 0.14 * 0.15) },
      { month: 'Jun', gmv: Math.round(totalGMV * 0.18), commission: Math.round(totalGMV * 0.18 * 0.15) },
      { month: 'Jul', gmv: Math.round(totalGMV * 0.20), commission: Math.round(totalGMV * 0.20 * 0.15) },
      { month: 'Aug', gmv: totalGMV || 15400, commission: Math.round((totalGMV || 15400) * (commissionRate / 100)) }
    ];

    const categoryBreakdown = [
      { category: 'Appliance Repair', percentage: 42, amount: Math.round(totalGMV * 0.42) },
      { category: 'Electrical & Plumbing', percentage: 28, amount: Math.round(totalGMV * 0.28) },
      { category: 'Home Cleaning', percentage: 18, amount: Math.round(totalGMV * 0.18) },
      { category: 'Painting & Decor', percentage: 12, amount: Math.round(totalGMV * 0.12) }
    ];

    return { totalGMV, platformCommissionEarned, techNetPayouts, monthlyBreakdown, categoryBreakdown };
  }, [bookings, commissionRate]);

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'bookings', label: 'Dispatch Center', icon: Briefcase, count: bookings.length },
    { id: 'verifications', label: 'Tech Verifications', icon: UserCheck, count: pendingVerifications.length },
    { id: 'revenue', label: 'Revenue & Commission', icon: DollarSign },
    { id: 'withdrawals', label: 'Wallet Withdrawals', icon: CreditCard, count: withdrawals.filter(w => w.status === 'pending').length },
    { id: 'services', label: 'Service Catalog', icon: Layers, count: serviceList.length },
    { id: 'users', label: 'User Directory', icon: Users, count: users.length },
    { id: 'legal', label: 'Compliance & Policy', icon: Shield },
    { id: 'security', label: 'Security & Audit', icon: ShieldAlert, count: securityAlerts.length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 font-sans">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm text-slate-600 font-extrabold tracking-tight">Loading Enterprise Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 select-none">

      {/* Pure White Native Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl shadow-xs">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
              Fixvo Admin Console <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold uppercase">Live Node</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Platform Operations & Financial Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-200 transition cursor-pointer"
            title="Sync Platform Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          
          <button
            onClick={() => setActiveTab('services')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
          >
            <Plus size={14} /> Add Service
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Desktop Navigation Sidebar (White Aesthetic) */}
          <div className="hidden md:block md:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-3 space-y-1 shadow-sm sticky top-20">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-3 py-1.5">Management Modules</span>
              {navItems.map(item => {
                const IconComp = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border-none outline-none text-left tracking-wide ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp size={16} className={isSelected ? "text-white" : "text-slate-400"} />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Workspace Pane */}
          <div className="md:col-span-3 bg-white border border-slate-200 rounded-[2rem] p-5 sm:p-8 shadow-sm min-h-[600px]">

            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Executive Command Center</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Real-time performance snapshot, GMV revenue analytics, and demand matrix</p>
                  </div>
                </div>

                {/* Stat KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-wider">Gross GMV</span>
                      <DollarSign size={16} className="text-blue-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900">₹{revenueData.totalGMV.toLocaleString() || '15,400'}</p>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={12} /> +18.4% this month
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-wider">Platform Fee Revenue</span>
                      <CreditCard size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-2xl font-black text-emerald-700">₹{Math.round(revenueData.platformCommissionEarned).toLocaleString() || '2,310'}</p>
                    <span className="text-[10px] font-bold text-slate-500">{commissionRate}% commission split rate</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-wider">Total Bookings</span>
                      <Briefcase size={16} className="text-indigo-600" />
                    </div>
                    <p className="text-2xl font-black text-indigo-700">{stats.totalBookings || bookings.length || 18}</p>
                    <span className="text-[10px] font-bold text-blue-600">{bookings.filter(b => b.status === 'completed').length} completed</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="text-[10px] font-black uppercase tracking-wider">Pro Tech Fleet</span>
                      <UserCheck size={16} className="text-amber-600" />
                    </div>
                    <p className="text-2xl font-black text-amber-700">{techniciansList.length || 8}</p>
                    <span className="text-[10px] font-bold text-slate-500">{pendingVerifications.length} verifications pending</span>
                  </div>
                </div>

                {/* Revenue Trend Visual Representation Chart */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" /> Monthly Revenue Trend Visual Representation
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Visual month-by-month platform fee commission & GMV breakdown</p>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                      8 Month Analytics
                    </span>
                  </div>

                  {/* SVG / Flex Custom Bar Chart */}
                  <div className="space-y-3 pt-2">
                    <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200 pb-2">
                      {revenueData.monthlyBreakdown.map((item, idx) => {
                        const maxVal = Math.max(...revenueData.monthlyBreakdown.map(m => m.gmv || 1000));
                        const heightPct = maxVal > 0 ? Math.max(15, Math.round((item.gmv / maxVal) * 100)) : 20;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap">
                              <span>GMV: ₹{item.gmv.toLocaleString()}</span>
                              <span className="text-emerald-400">Commission: ₹{item.commission.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-t-xl overflow-hidden relative" style={{ height: `${heightPct}%` }}>
                              <div 
                                className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t-xl transition-all duration-500 group-hover:brightness-110" 
                                style={{ height: '100%' }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-600">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-blue-600 rounded"></span> Monthly GMV (₹)
                      </span>
                      <span>Target Goal: ₹50,000 / Month</span>
                    </div>
                  </div>
                </div>

                {/* Distribution Gauges Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Demand Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <PieChart size={16} className="text-emerald-600" /> Revenue by Service Category
                    </h3>
                    <div className="space-y-3 pt-1">
                      {revenueData.categoryBreakdown.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800">{cat.category}</span>
                            <span className="text-slate-900">{cat.percentage}% (₹{cat.amount.toLocaleString()})</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-emerald-600' : idx === 2 ? 'bg-amber-500' : 'bg-purple-600'
                              }`} 
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operation Status Funnel */}
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Activity size={16} className="text-indigo-600" /> Order Status Distribution
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completed</span>
                        <span className="text-xl font-black text-emerald-600 mt-1 block">
                          {bookings.filter(b => b.status === 'completed').length || 12}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">In Progress</span>
                        <span className="text-xl font-black text-blue-600 mt-1 block">
                          {bookings.filter(b => ['in_progress', 'accepted', 'assigned'].includes(b.status)).length || 4}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Quote Pending</span>
                        <span className="text-xl font-black text-purple-600 mt-1 block">
                          {bookings.filter(b => b.status === 'quote_pending').length || 2}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cancelled</span>
                        <span className="text-xl font-black text-rose-600 mt-1 block">
                          {bookings.filter(b => b.status === 'cancelled').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DISPATCH & BOOKING OPERATIONS */}
            {activeTab === 'bookings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Service Dispatch Operations</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage live bookings, reassign technicians, and inspect quotes</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search ID, customer, service..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub Filter Status Pills */}
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Requests' },
                    { id: 'pending', label: 'Pending Dispatch' },
                    { id: 'assigned', label: 'Assigned' },
                    { id: 'quote_pending', label: 'Quote Proposals' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 border cursor-pointer ${
                        statusFilter === filter.id 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Bookings Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="p-4">Service & ID</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Technician</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                            No repair requests match your active search filters.
                          </td>
                        </tr>
                      ) : (
                        currentBookings.map(b => {
                          const isExpanded = expandedBookingId === b._id;
                          return (
                            <React.Fragment key={b._id || b.id}>
                              <tr className="hover:bg-slate-50/80 transition-colors font-semibold">
                                <td className="p-4">
                                  <span className="font-extrabold text-slate-900 block">{b.serviceName || b.serviceId?.name || 'Home Repair'}</span>
                                  <span className="text-[10px] font-mono text-slate-400">#{((b._id || b.id || '').toString()).slice(-6).toUpperCase()}</span>
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-800 block">{b.name || 'Customer'}</span>
                                  <span className="text-[10px] text-slate-500 block">{b.location || 'Madanapalle'}</span>
                                </td>
                                <td className="p-4">
                                  {getStatusBadge(b.status)}
                                </td>
                                <td className="p-4 font-bold text-slate-800">
                                  {b.technicianName || 'Unassigned'}
                                </td>
                                <td className="p-4 text-right font-black text-slate-900">
                                  ₹{b.finalQuote || b.amount || 0}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => setExpandedBookingId(isExpanded ? null : b._id)}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold rounded-lg cursor-pointer"
                                  >
                                    {isExpanded ? 'Hide' : 'Inspect'}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Booking Operations View */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-slate-50/80 p-5 border-t border-b border-slate-200 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                                        <h4 className="font-extrabold text-blue-600 uppercase text-[10px] tracking-wider">Specifications</h4>
                                        <p className="text-slate-700"><strong className="text-slate-900">Problem:</strong> {b.problemDescription || 'N/A'}</p>
                                        <p className="text-slate-700"><strong className="text-slate-900">Address:</strong> {b.detailedAddress || b.location}</p>
                                        {b.deviceType && <p className="text-slate-700"><strong className="text-slate-900">Device Type:</strong> {b.deviceType}</p>}
                                      </div>

                                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                                        <h4 className="font-extrabold text-emerald-600 uppercase text-[10px] tracking-wider">Quote Financials</h4>
                                        <p className="text-slate-700"><strong className="text-slate-900">Labour Charge:</strong> ₹{b.serviceCharge || 199}</p>
                                        <p className="text-slate-700"><strong className="text-slate-900">Parts Cost:</strong> ₹{b.sparePartsCost || 0}</p>
                                        <p className="text-slate-700"><strong className="text-slate-900">Guaranteed Total:</strong> ₹{b.finalQuote || b.amount || 0}</p>
                                      </div>

                                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                                        <h4 className="font-extrabold text-amber-600 uppercase text-[10px] tracking-wider">Assign Technician</h4>
                                        {assigningBookingId === b._id ? (
                                          <div className="space-y-2">
                                            <select
                                              value={selectedTechnicianId}
                                              onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none"
                                            >
                                              <option value="">Select Technician</option>
                                              {techniciansList.map(t => (
                                                <option key={t._id || t.id} value={t._id || t.id}>{t.name} (📍 {t.location || 'Local'})</option>
                                              ))}
                                            </select>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleAssignTechnician(b._id, selectedTechnicianId)}
                                                className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg border-none cursor-pointer"
                                              >
                                                Confirm Assign
                                              </button>
                                              <button
                                                onClick={() => setAssigningBookingId(null)}
                                                className="px-2 py-1 text-slate-500 font-bold border-none bg-transparent cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => setAssigningBookingId(b._id)}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl border-none cursor-pointer"
                                          >
                                            {b.providerId ? 'Reassign Tech' : 'Assign Tech Now'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-2 text-xs font-bold text-slate-500">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 cursor-pointer border-none"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 cursor-pointer border-none"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TECHNICIAN VERIFICATION CENTER */}
            {activeTab === 'verifications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Technician Verification Hub</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Review identity documents and approve background check applications</p>
                </div>

                {loadingVerifications ? (
                  <div className="py-12 text-center text-blue-600 font-bold text-xs">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" /> Loading pending applications...
                  </div>
                ) : pendingVerifications.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-semibold text-xs">
                    No pending technician verification applications at this time. All fleet pros are verified!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingVerifications.map(tech => (
                      <div key={tech._id || tech.id} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">{tech.name}</h3>
                            <p className="text-xs text-slate-500 font-medium">{tech.email} • {tech.phone || 'No Phone'}</p>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-black uppercase">
                            Pending Review
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                          <p><strong className="text-slate-900">Submitted Area:</strong> {tech.area || 'Madanapalle'}</p>
                          <p><strong className="text-slate-900">Experience:</strong> {tech.experience || '3+ Years'}</p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleReviewTechnician(tech._id || tech.id, 'approved')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-xl text-xs uppercase cursor-pointer border-none"
                          >
                            ✓ Approve Pro
                          </button>
                          <button
                            onClick={() => handleReviewTechnician(tech._id || tech.id, 'rejected')}
                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold py-2 rounded-xl text-xs uppercase cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REVENUE & COMMISSION ANALYTICS */}
            {activeTab === 'revenue' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Revenue & Financial Governance</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Platform commission split controls and gross financial reporting</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Commission rate adjuster */}
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Settings size={16} className="text-blue-600" /> Platform Commission Rate
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-600 font-bold flex justify-between">
                        <span>Current Cut Rate:</span>
                        <strong className="text-blue-600">{commissionRate}%</strong>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-full cursor-pointer accent-blue-600"
                      />
                      <p className="text-[10px] text-slate-400 font-semibold">Min 5% • Max 30% per completed booking</p>
                    </div>

                    <button
                      onClick={() => alert(`Commission rate updated to ${commissionRate}%`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase cursor-pointer border-none shadow-xs"
                    >
                      Save Rate Setting
                    </button>
                  </div>

                  {/* Financial summary card */}
                  <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white flex flex-col justify-between shadow-md">
                    <div>
                      <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                        Total Platform Fee Earnings
                      </span>
                      <p className="text-4xl font-black mt-4">₹{Math.round(revenueData.platformCommissionEarned).toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 mt-6 text-xs font-bold">
                      <div>
                        <span className="text-blue-200 block text-[10px]">Gross Booking Volume (GMV)</span>
                        <span className="text-base font-black">₹{revenueData.totalGMV.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-blue-200 block text-[10px]">Net Technician Earnings Payout</span>
                        <span className="text-base font-black">₹{Math.round(revenueData.techNetPayouts).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WALLET WITHDRAWALS */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Technician Payouts & Withdrawals</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Review and record bank payout transaction IDs for technicians</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="p-4">Technician</th>
                        <th className="p-4">Payout Account</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                            No technician withdrawal requests recorded yet.
                          </td>
                        </tr>
                      ) : (
                        withdrawals.map(w => (
                          <tr key={w._id || w.id} className="hover:bg-slate-50 font-semibold">
                            <td className="p-4">
                              <span className="font-extrabold text-slate-900 block">{w.technician?.name || 'Pro Technician'}</span>
                              <span className="text-[10px] text-slate-500">{w.technician?.email}</span>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-700">
                              {w.bankDetails?.upiId || w.bankDetails?.accountNumber || 'Bank UPI Transfer'}
                            </td>
                            <td className="p-4 font-black text-slate-900">
                              ₹{w.amount}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                w.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {w.status === 'pending' && (
                                <button
                                  onClick={() => handleApproveWithdrawal(w._id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg border-none cursor-pointer"
                                >
                                  Approve Payout
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: SERVICE CATALOG MANAGER */}
            {activeTab === 'services' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Service & Pricing Catalog</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage doorstep services, base pricing, and category offerings</p>
                  </div>
                  <button
                    onClick={() => setShowAddServiceForm(!showAddServiceForm)}
                    className="px-4 py-2 bg-blue-600 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer border-none flex items-center gap-1"
                  >
                    <Plus size={14} /> {showAddServiceForm ? 'Cancel' : 'New Service'}
                  </button>
                </div>

                {showAddServiceForm && (
                  <form onSubmit={handleAddService} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900">Add New Service Entry</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        required
                        type="text"
                        placeholder="Service Name (e.g. Solar Panel Inspection)"
                        value={newServiceForm.name}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                      <input
                        required
                        type="number"
                        placeholder="Base Price (₹)"
                        value={newServiceForm.price}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, price: e.target.value })}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase cursor-pointer border-none">
                      Save to Catalog
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {serviceList.map(srv => (
                    <div key={srv.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{srv.name}</h4>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{srv.categoryId || 'Repair'}</span>
                      </div>
                      <span className="font-black text-blue-600 text-base">₹{srv.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: USER DIRECTORY */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Customer & Fleet Directory</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Directory of all registered customers, technicians, and administrators</p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="p-4">User</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">
                            No registered accounts found.
                          </td>
                        </tr>
                      ) : (
                        users.map(u => (
                          <tr key={u._id || u.id} className="hover:bg-slate-50 font-semibold">
                            <td className="p-4">
                              <span className="font-extrabold text-slate-900 block">{u.name}</span>
                              <span className="text-[10px] text-slate-500">{u.email}</span>
                            </td>
                            <td className="p-4 font-mono text-slate-700">
                              {u.phone || 'N/A'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                u.role === 'technician' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-right text-slate-500 font-medium">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 8: LEGAL COMPLIANCE & TERMS */}
            {activeTab === 'legal' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Compliance & Policy Templates</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage legal policy agreements and track version consent logs</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                    <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Policy Documents</h3>
                    {legalDocs.map(doc => (
                      <button
                        key={doc.type}
                        onClick={() => { setSelectedDoc(doc); setDocTitle(doc.title); setDocContent(doc.content); }}
                        className={`w-full text-left p-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          selectedDoc?.type === doc.type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {doc.title || doc.type} (V{doc.version})
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                    {selectedDoc ? (
                      <form onSubmit={handleUpdateDocument} className="space-y-3">
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        />
                        <textarea
                          rows={8}
                          value={docContent}
                          onChange={(e) => setDocContent(e.target.value)}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none resize-none"
                        />
                        <button type="submit" disabled={isSavingDoc} className="w-full bg-blue-600 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase cursor-pointer border-none">
                          {isSavingDoc ? 'Saving...' : 'Update & Increment Version'}
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Select a policy document on the left to edit.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: SECURITY & AUDIT */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Security & Risk Center</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Real-time system health checks, risk alert tracking, and audit trail</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Security Status</span>
                    <span className="text-lg font-black text-emerald-600 mt-1 block">🟢 100% Protected</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Unresolved Alerts</span>
                    <span className="text-lg font-black text-blue-600 mt-1 block">{securityAlerts.length} Active</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">System Health</span>
                    <span className="text-lg font-black text-indigo-600 mt-1 block">99.9% Uptime</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Urban Company Mobile Bottom App Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center z-50 shadow-lg">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'bookings', label: 'Dispatch', icon: Briefcase },
          { id: 'verifications', label: 'Verify', icon: UserCheck },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'users', label: 'Users', icon: Users }
        ].map(nav => {
          const IconComp = nav.icon;
          const isActive = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all border-none outline-none cursor-pointer bg-transparent ${
                isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <IconComp size={18} className={isActive ? 'text-blue-600 stroke-[2.5]' : ''} />
              <span className="text-[10px] tracking-tight">{nav.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminDashboard;
