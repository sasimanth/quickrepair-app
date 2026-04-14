import { useState, useEffect } from 'react';
import api from '../services/api';
import { Briefcase, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, User, Wrench, RefreshCw, MessageSquare, Camera, HelpCircle, Hammer, Truck, Settings } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import SettingsModal from '../components/SettingsModal';
import VerificationModal from '../components/VerificationModal';
import { Star, ShieldAlert, ShieldCheck } from 'lucide-react';
import { socket } from '../services/socket';

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [quoteModalJob, setQuoteModalJob] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ finalQuote: '', quoteReason: '', quotePhoto: '' });

  useEffect(() => { fetchJobs(); }, []);

  // Live Location Broadcasting via WebSockets
  useEffect(() => {
    let watchId;
    if (profile?.isOnline && profile?.userId && navigator.geolocation) {
       socket.emit('register_tech', profile.userId);
       
       watchId = navigator.geolocation.watchPosition((position) => {
         socket.emit('update_location', {
           techId: profile.userId,
           lat: position.coords.latitude,
           lng: position.coords.longitude
         });
       }, (err) => console.log('Location watch err:', err),
       { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [profile?.isOnline, profile?.userId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/technicians/profile');
      setProfile(profileRes.data);

      if (profileRes.data.isProfileComplete) {
        const { data } = await api.get('/bookings');
        setJobs(data);
        const reviewsRes = await api.get(`/reviews/technician/${profileRes.data.userId}`);
        setReviews(reviewsRes.data);
      }
    } catch (error) { console.error('Error fetching dashboard data', error); }
    finally { setLoading(false); }
  };

  const updateJobStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      fetchJobs(); 
    } catch (error) { alert(`Failed to update status to ${status}`); }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/bookings/${quoteModalJob._id}/quote`, quoteForm);
      setQuoteModalJob(null);
      setQuoteForm({ finalQuote: '', quoteReason: '', quotePhoto: '' });
      fetchJobs();
    } catch (error) {
      alert("Failed to submit quote");
    }
  };

  const handleSetupProfile = async () => {
    setSetupLoading(true);

    const completeProfileWithLocation = async (lat, lng, addressString) => {
      try {
        await api.put('/technicians/profile', {
          lat,
          lng,
          address: addressString,
          skills: ['All Devices'], // basic default for demo
          experience: '5 Years'
        });
        fetchJobs();
      } catch (error) {
        alert('Failed to save profile');
      } finally {
        setSetupLoading(false);
      }
    };

    if (!navigator.geolocation) {
       console.log("Geolocation is not supported by your browser. Falling back to default.");
       return completeProfileWithLocation(30.2672, -97.7431, "Default Testing Location");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        completeProfileWithLocation(position.coords.latitude, position.coords.longitude, 'Verified Geolocation');
      }, 
      () => {
      console.log("Unable to retrieve your location. Falling back to default.");
      completeProfileWithLocation(30.2672, -97.7431, 'Default Testing Location');
    });
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !profile.isOnline;
      const res = await api.put('/technicians/profile', { isOnline: newStatus });
      setProfile(res.data);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Unassigned' },
      assigned: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Assigned To You' },
      queued: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Queued' },
      accepted: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Wrench, label: 'In Progress' },
      quote_pending: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock, label: 'Quote Sent' },
      completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}>
        <Icon size={14} />
        {label || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100/80">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 rounded-[1.25rem] shadow-xl shadow-slate-900/20 text-white">
              <Briefcase size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tech Dashboard</h1>
                 {profile?.isVerified && (
                   <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold uppercase tooltip" title="Identity Verified">
                     <ShieldCheck size={14} /> Verified
                   </div>
                 )}
              </div>
              <p className="text-slate-500 font-medium mt-1">Manage assigned jobs and discover new repairs</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profile?.isProfileComplete && (
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border-2 ${profile?.isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
              >
                <div className={`w-3 h-3 rounded-full ${profile?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {profile?.isOnline ? 'Online (Accepting Jobs)' : 'Offline (Hidden)'}
              </button>
            )}
            <button
               onClick={() => setShowSettings(true)}
               className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm"
            >
              <Settings size={20} /> Settings
            </button>
            <button
              onClick={fetchJobs}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-sm"
            >
              <RefreshCw size={18} /> Refresh Jobs
            </button>
          </div>
        </div>

        {/* Onboarding Section */}
        {!loading && profile && !profile.isProfileComplete && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-50">
               <MapPin className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Activate Your Profile</h2>
            <p className="text-slate-600 max-w-md mx-auto">To start receiving repair requests from local customers, we need to verify your local service area using your device's location.</p>
            <button 
              onClick={handleSetupProfile}
              disabled={setupLoading}
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
            >
              {setupLoading ? <RefreshCw className="animate-spin" size={20}/> : <MapPin size={20}/>}
              {setupLoading ? 'Locating...' : 'Share Location & Go Active'}
            </button>
          </div>
        )}

        {/* Verification Banner */}
        {!loading && profile?.isProfileComplete && !profile?.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
               <ShieldAlert className="text-amber-500" size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-slate-800">Identity Not Verified</h2>
              <p className="text-slate-600 mt-1 max-w-2xl text-sm md:text-base">Verified technicians receive 300% more direct repair requests. Complete your background check securely to earn your verified badge and unlock premier jobs.</p>
            </div>
            <button 
              onClick={() => setShowVerification(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 w-full md:w-auto whitespace-nowrap"
            >
              Get Verified Now
            </button>
          </div>
        )}

        {/* Stats Section */}
        {!loading && profile?.isProfileComplete && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex items-center gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1">
              <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.25rem] group-hover:scale-110 transition-transform"><CheckCircle size={32} /></div>
              <div>
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Jobs Completed</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight mt-1">
                  {jobs.filter(j => j.status === 'completed').length}
                </p>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 flex items-center gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1">
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[1.25rem] group-hover:scale-110 transition-transform"><Briefcase size={32} /></div>
              <div>
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Total Earnings</p>
                <p className="text-4xl font-black text-indigo-600 tracking-tight mt-1">
                  ${jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.serviceId?.price || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!loading && profile?.isProfileComplete && (
          <>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <PackageSearch className="text-amber-500" size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Jobs Available</h3>
                <p className="text-slate-500 max-w-sm text-center">There are no pending repair requests assigned to you currently. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {jobs.map((job) => (
                  <div key={job._id} className="relative bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 border border-slate-100/80 overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-2 h-full ${['pending','assigned','queued'].includes(job.status) ? 'bg-amber-400' : job.status === 'accepted' ? 'bg-indigo-500' : job.status === 'completed' ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    
                    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 pl-10 md:pl-12">
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                            {job.serviceId?.name || 'Device Repair'}
                          </span>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border ${job.serviceOption === 'inspection' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {job.serviceOption === 'inspection' ? 'Inspection Visit' : 'Direct Repair'}
                          </span>
                          {getStatusBadge(job.status)}
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium ml-auto md:ml-0">
                            <Clock size={16} />
                            {job.date ? new Date(job.date).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                        
                        <h3 className="text-3xl font-extrabold text-slate-800 inline-flex items-center gap-2">
                          <span className="text-amber-500">₹</span>{job.serviceId?.price || 0} <span className="text-sm text-slate-400 font-bold ml-2">(+₹{job.transportCharge || 0} Transp.)</span>
                        </h3>

                        {job.deviceType && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-5">
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <Smartphone className="text-blue-500 mt-1 shrink-0" size={20} />
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Device</p>
                                  <p className="font-medium text-slate-800">{job.deviceType}</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <MapPin className="text-emerald-500 mt-1 shrink-0" size={20} />
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</p>
                                  <p className="font-medium text-slate-800">{job.location}</p>
                                  {(job.serviceLocation && job.serviceLocation !== 'on-site') && (
                                     <span className="inline-block mt-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                       {job.serviceLocation === 'gate' ? 'Gate Meetup' : 'Off-site Pickup Required'}
                                     </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <AlertCircle className="text-rose-500 mt-1 shrink-0" size={20} />
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Description</p>
                                <p className="text-slate-700 italic">"{job.problemDescription}"</p>
                                {job.unknownProblem && (
                                   <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                                     <HelpCircle size={12}/> Unknown Issue - Requires Diagnosis
                                   </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {job.suggestedTools && job.suggestedTools.length > 0 && (
                          <div className="flex items-start gap-4 p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                            <Hammer className="text-indigo-500 mt-1 shrink-0" size={24} />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Suggested Tools for Visit</p>
                              <div className="flex flex-wrap gap-2">
                                {job.suggestedTools.map((tool, i) => (
                                  <span key={i} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {job.imageUrl && (
                          <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group/image">
                            <Camera className="text-indigo-500 mt-1 shrink-0 absolute top-5 left-5 opacity-40 group-hover/image:opacity-100 transition-opacity" size={24} />
                            <div className="w-full">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pl-8">Customer Device Photo</p>
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-sm ml-8">
                                <img src={job.imageUrl} alt="Damage evidence" className="w-full h-auto object-cover hover:scale-[1.03] transition-transform duration-500" />
                              </div>
                            </div>
                          </div>
                        )}

                        {job.status === 'accepted' && (
                           <div className="pt-2 border-t border-slate-100/50 mt-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                             <p className="font-bold text-sm text-indigo-900 flex items-center justify-between">
                               <span className="flex items-center gap-2"><Truck size={18} className="text-indigo-500"/> Action Required</span>
                               <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-indigo-100">Route to customer</span>
                             </p>
                           </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-100 rounded-full px-4 py-2 w-max shadow-sm mt-4">
                          <User size={16} />
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                            Customer: {job.userEmail ? job.userEmail.split('@')[0] : 'Guest User'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 min-w-[200px] justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-8">
                        {['pending', 'assigned'].includes(job.status) && (
                          <>
                            <button
                              onClick={() => updateJobStatus(job._id, 'accepted')}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                              <Wrench size={18} /> Accept Job
                            </button>
                            <button
                              onClick={() => updateJobStatus(job._id, 'rejected')}
                              className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 p-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle size={18} /> Decline
                            </button>
                          </>
                        )}
                        {job.status === 'queued' && (
                           <div className="flex flex-col text-center items-center justify-center gap-2 p-4 rounded-xl font-bold border bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm">
                             <Clock size={18} /> 
                             <span>In Your Queue</span>
                             <span className="text-xs font-normal">Finish current job first</span>
                           </div>
                        )}
                        {job.status === 'accepted' && (
                          <>
                            <button
                              onClick={() => setQuoteModalJob(job)}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                              <Wrench size={18} /> Send Quote
                            </button>
                            <button
                              onClick={() => updateJobStatus(job._id, 'completed')}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={18} /> Mark Completed
                            </button>
                            <button
                              onClick={() => setChatBookingId(job._id)}
                              className="w-full bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 text-indigo-600 font-bold py-3 p-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                            >
                              <MessageSquare size={18} /> Chat Customer
                            </button>
                          </>
                        )}
                        {job.status === 'quote_pending' && (
                           <div className="flex items-center justify-center gap-2 p-4 rounded-xl font-bold border bg-blue-50 text-blue-600 border-blue-200 shadow-sm">
                             <Clock size={18} /> Awaiting Approval
                           </div>
                        )}
                        {job.status === 'completed' && (
                          <div className={`flex items-center justify-center gap-2 p-4 rounded-xl font-bold border ${job.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'}`}>
                            {job.paymentStatus === 'completed' ? <><CheckCircle size={18} /> Paid In Full</> : <><Clock size={18} /> Awaiting Payment</>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reviews Section */}
        {!loading && profile?.isProfileComplete && reviews.length > 0 && (
          <div className="pt-8 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" /> Recent Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(review => (
                <div key={review._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                       <Star 
                         key={star} 
                         size={16} 
                         className={star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 fill-slate-200'} 
                       />
                    ))}
                  </div>
                  <p className="text-slate-700 italic font-medium">"{review.comment || 'No comment provided.'}"</p>
                  <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {chatBookingId && (
        <ChatModal 
          bookingId={chatBookingId} 
          currentRole="technician" 
          onClose={() => setChatBookingId(null)} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          role="technician"
          currentProfile={profile}
          onClose={() => setShowSettings(false)}
          onSuccess={() => {
            setShowSettings(false);
            fetchJobs();
          }}
        />
      )}

      {showVerification && (
        <VerificationModal 
          currentStatus={profile?.backgroundCheckStatus}
          onClose={() => setShowVerification(false)}
          onSuccess={() => {
            setShowVerification(false);
            fetchJobs();
          }}
        />
      )}

      {quoteModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Submit Final Quote</h3>
              <button onClick={() => setQuoteModalJob(null)} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Final Price ($)</label>
                <input required type="number" value={quoteForm.finalQuote} onChange={(e) => setQuoteForm({...quoteForm, finalQuote: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 150" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Diagnosis / Reason</label>
                <textarea required value={quoteForm.quoteReason} onChange={(e) => setQuoteForm({...quoteForm, quoteReason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="3" placeholder="Explain the required work..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Proof Image URL (Optional)</label>
                <input type="url" value={quoteForm.quotePhoto} onChange={(e) => setQuoteForm({...quoteForm, quotePhoto: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4">Send Quote for Approval</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
