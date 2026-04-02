import { useState, useEffect } from 'react';
import api from '../services/api';
import { Briefcase, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, User, Wrench, RefreshCw, MessageSquare, Camera, HelpCircle, Hammer, Truck } from 'lucide-react';
import ChatModal from '../components/ChatModal';

const TechnicianDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [chatBookingId, setChatBookingId] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/technicians/profile');
      setProfile(profileRes.data);

      if (profileRes.data.isProfileComplete) {
        const { data } = await api.get('/bookings');
        setJobs(data);
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

  const handleSetupProfile = () => {
    setSetupLoading(true);
    if (!navigator.geolocation) {
       alert("Geolocation is not supported by your browser");
       setSetupLoading(false);
       return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await api.put('/technicians/profile', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: 'Verified Geolocation',
          skills: ['All Devices'], // basic default for demo
          experience: '5 Years'
        });
        fetchJobs();
      } catch (error) {
        alert('Failed to save profile');
      } finally {
        setSetupLoading(false);
      }
    }, () => {
      alert("Unable to retrieve your location for nearby searches.");
      setSetupLoading(false);
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      accepted: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Wrench },
      completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${color}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-200 text-white">
              <Briefcase size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tech Dashboard</h1>
              <p className="text-slate-500 font-medium mt-1">Manage assigned jobs and discover new repairs</p>
            </div>
          </div>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            <RefreshCw size={18} /> Refresh Jobs
          </button>
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

        {/* Stats Section */}
        {!loading && profile?.isProfileComplete && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full"><CheckCircle size={28} /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Jobs Completed</p>
                <p className="text-3xl font-extrabold text-slate-900">
                  {jobs.filter(j => j.status === 'completed').length}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full"><Briefcase size={28} /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Total Earnings</p>
                <p className="text-3xl font-extrabold text-indigo-600">
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
              <div className="space-y-6">
                {jobs.map((job) => (
                  <div key={job._id} className="relative bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-300 border border-slate-100 overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${job.status === 'pending' ? 'bg-amber-400' : job.status === 'accepted' ? 'bg-indigo-500' : job.status === 'completed' ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-5">
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
                          <span className="text-amber-500">$</span>{job.serviceId?.price || 0}
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
                        
                        <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-100 rounded-full px-4 py-2 w-max shadow-sm">
                          <User size={16} />
                          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                            Customer: {job.userEmail ? job.userEmail.split('@')[0] : 'Guest User'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 min-w-[200px] justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                        {job.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateJobStatus(job._id, 'accepted')}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
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
                        {job.status === 'accepted' && (
                          <>
                            <button
                              onClick={() => updateJobStatus(job._id, 'completed')}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl shadow-emerald-200 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={18} /> Mark Completed
                            </button>
                            <button
                              onClick={() => setChatBookingId(job._id)}
                              className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 font-bold py-3 p-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                            >
                              <MessageSquare size={18} /> Chat with Customer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {chatBookingId && (
        <ChatModal 
          bookingId={chatBookingId} 
          currentRole="technician" 
          onClose={() => setChatBookingId(null)} 
        />
      )}
    </div>
  );
};

export default TechnicianDashboard;
