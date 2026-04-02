import { useState, useEffect } from 'react';
import api from '../services/api'; 
import { Calendar, MapPin, Smartphone, AlertCircle, Clock, CheckCircle, PackageSearch, XCircle, Plus, LayoutDashboard, Wrench, Settings, Star, User, ChevronRight, MessageSquare, Camera, UploadCloud, Loader2, Shield, HelpCircle, Truck, Home } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';

const MOCK_TECHNICIANS = [
  { id: 'tech-1', name: 'Alex Fixes', rating: 4.9, experience: '5 years', distance: '1.2 miles', jobsCompleted: 342, avatar: '👤' },
  { id: 'tech-2', name: 'Sarah Tech Pro', rating: 4.8, experience: '8 years', distance: '2.1 miles', jobsCompleted: 890, avatar: '👩‍🔧' },
  { id: 'tech-3', name: 'Mike Electronics', rating: 4.6, experience: '3 years', distance: '3.5 miles', jobsCompleted: 156, avatar: '👨‍🔧' },
  { id: 'tech-4', name: 'James QuickRepair', rating: 4.9, experience: '12 years', distance: '0.8 miles', jobsCompleted: 1102, avatar: '👨‍🚀' },
  { id: 'tech-5', name: 'Emma Displays', rating: 4.7, experience: '4 years', distance: '2.8 miles', jobsCompleted: 430, avatar: '👩‍🎤' }
];

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Step 1: Form, Step 2: Technician Selection
  const [step, setStep] = useState(1);
  const [fetchingTechs, setFetchingTechs] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const [chatBookingId, setChatBookingId] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    serviceId: '', date: '', deviceType: '', problemDescription: '', location: '', imageUrl: '',
    serviceOption: 'direct',
    unknownProblem: false,
    hasSpace: true,
    serviceLocation: 'on-site',
    isRestrictedArea: false,
    isUnderWarranty: false
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bookingsRes = await api.get('/bookings');
      setBookings(bookingsRes.data);
      const servicesRes = await api.get('/services');
      setServices(servicesRes.data);
      if (servicesRes.data.length > 0) {
        setFormData(prev => ({ ...prev, serviceId: servicesRes.data[0]._id }));
      }
    } catch (error) { console.error('Error fetching dashboard data:', error); } 
    finally { setLoading(false); }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setStep(2);
    setFetchingTechs(true);
    
    const fetchTechnicians = async (lat, lng) => {
      try {
        const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
        const res = await api.get(`/technicians/nearby${query}`);
        // Render real techs from DB (if any active) plus the mock list for demo saturation
        const realTechs = res.data || [];
        // Filter out any mock ones if they exist purely to avoid duplicate ID issues during UI demo
        setTechnicians([...realTechs, ...MOCK_TECHNICIANS.filter(m => !realTechs.find(rt => rt.id === m.id))]);
      } catch (err) {
        console.error('Failed to grab technicians', err);
        setTechnicians(MOCK_TECHNICIANS);
      } finally {
        setFetchingTechs(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchTechnicians(pos.coords.latitude, pos.coords.longitude),
        () => fetchTechnicians() // fallback
      );
    } else {
      fetchTechnicians();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please select an image under 5MB.");
      return;
    }
    
    setUploadingImage(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to process image. Please try again.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async () => {
    if (!selectedTech) {
      alert("Please select a technician first.");
      return;
    }
    
    try {
      const payload = {
        ...formData,
        providerId: selectedTech.id // explicit specific assignment
      };
      
      await api.post('/bookings', payload);
      
      // Reset state
      setShowForm(false);
      setStep(1);
      setSelectedTech(null);
      setFormData({ 
        serviceId: services.length > 0 ? services[0]._id : '', date: '', deviceType: '', problemDescription: '', location: '', imageUrl: '',
        serviceOption: 'direct', unknownProblem: false, hasSpace: true, serviceLocation: 'on-site', isRestrictedArea: false, isUnderWarranty: false
      });
      fetchData(); 
    } catch (error) {
      alert('Failed to submit booking request. Check the console.');
      console.error(error);
    }
  };

  const cancelRequest = () => {
    setShowForm(!showForm);
    setStep(1);
    setSelectedTech(null);
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
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
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 text-white">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
              <p className="text-slate-500 font-medium mt-1">Manage your direct repair requests</p>
            </div>
          </div>
          <button
            onClick={cancelRequest}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-md ${showForm ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-indigo-200'}`}
          >
            {showForm ? <XCircle size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel Request' : 'Book a New Service'}
          </button>
        </div>

        {/* Workflow container */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showForm ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-700 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Wrench className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-800">
                  {step === 1 ? 'Schedule a Repair' : 'Select a Technician'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>1. Details</span>
                <ChevronRight size={16} className="text-slate-300"/>
                <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>2. Select Tech</span>
              </div>
            </div>
            
            {/* --- STEP 1: FORM --- */}
            {step === 1 && (
              services.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  <AlertCircle />
                  <p className="font-medium">No services are currently available. Please contact support.</p>
                </div>
              ) : (
                <form onSubmit={handleInitialSubmit} className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Settings size={16} className="text-slate-400"/> Select Service</label>
                      <select
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                        required
                      >
                        {services.map(service => (
                          <option key={service._id} value={service._id}>{service.name} - ${service.price}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Calendar size={16} className="text-slate-400"/> Preferred Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Smartphone size={16} className="text-slate-400"/> Device Type</label>
                      <input type="text" placeholder="e.g. iPhone 13, HP Pavilion" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" value={formData.deviceType} onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Location</label>
                      <input type="text" placeholder="Your address or area" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Camera size={16} className="text-slate-400"/> Device Photo (Optional)</label>
                    <div className="relative group border-2 border-dashed border-slate-300 rounded-xl p-4 transition-all hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center min-h-[100px] bg-slate-50 cursor-pointer overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center text-blue-500">
                          <Loader2 className="animate-spin mb-2" size={24} />
                          <span className="text-sm font-bold">Uploading...</span>
                        </div>
                      ) : formData.imageUrl ? (
                        <div className="flex flex-col items-center text-emerald-600">
                          <CheckCircle className="mb-2" size={28} />
                          <span className="text-sm font-bold">Photo Uploaded Successfully!</span>
                          <img src={formData.imageUrl} alt="Preview" className="mt-3 w-16 h-16 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-600 transition-colors">
                          <UploadCloud className="mb-2" size={28} />
                          <span className="text-sm font-bold">Click or drag a photo here</span>
                          <span className="text-xs mt-1 text-slate-400">JPG, PNG under 5MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Shield size={16} className="text-slate-400"/> Is your product under warranty?</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="warranty" checked={formData.isUnderWarranty} onChange={() => setFormData({...formData, isUnderWarranty: true})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-medium">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="warranty" checked={!formData.isUnderWarranty} onChange={() => setFormData({...formData, isUnderWarranty: false})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-medium">No</span>
                        </label>
                      </div>
                    </div>
                    {formData.isUnderWarranty && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-amber-800 font-medium">We recommend using the official brand service center to avoid voiding your warranty. You can still continue to book with us if you prefer.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><HelpCircle size={16} className="text-slate-400"/> Describe the problem</label>
                      <div className="flex items-start gap-2 mb-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <input type="checkbox" id="unknownProblem" checked={formData.unknownProblem} onChange={(e) => setFormData({...formData, unknownProblem: e.target.checked})} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label htmlFor="unknownProblem" className="text-sm text-slate-700 font-medium cursor-pointer">I don't know the exact issue (Technician will diagnose)</label>
                      </div>
                      <textarea rows="3" placeholder={formData.unknownProblem ? "Tell us what happened (e.g., screen went black, strange noise)..." : "Describe the issue you're facing in detail..."} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium resize-none" value={formData.problemDescription} onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}></textarea>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Wrench size={16} className="text-slate-400"/> Service Visit Type</label>
                      <div className="space-y-3">
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.serviceOption === 'inspection' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                           <div className="flex items-center gap-3">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'inspection'} onChange={() => setFormData({...formData, serviceOption: 'inspection'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                             <div>
                               <span className="block font-bold text-slate-800">Inspection Visit ($15)</span>
                               <span className="block text-xs text-slate-500 mt-1">Tech diagnoses problem & gives final cost. Fee adjusted in final bill.</span>
                             </div>
                           </div>
                        </label>
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.serviceOption === 'direct' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                           <div className="flex items-center gap-3">
                             <input type="radio" name="serviceOption" checked={formData.serviceOption === 'direct'} onChange={() => setFormData({...formData, serviceOption: 'direct'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                             <div>
                               <span className="block font-bold text-slate-800">Direct Repair Visit</span>
                               <span className="block text-xs text-slate-500 mt-1">Tech comes fully prepared to fix standard issues immediately.</span>
                             </div>
                           </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Home size={16} className="text-slate-400"/> Do you have space for repair work?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="hasSpace" checked={formData.hasSpace} onChange={() => setFormData({...formData, hasSpace: true, serviceLocation: 'on-site'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="hasSpace" checked={!formData.hasSpace} onChange={() => setFormData({...formData, hasSpace: false, serviceLocation: 'off-site'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium">No</span>
                          </label>
                        </div>
                      </div>
                      
                      {!formData.hasSpace && (
                         <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                           <p className="text-sm text-blue-800 font-medium flex items-center gap-2"><Truck size={16}/> Off-site pickup & return suggested.</p>
                         </div>
                      )}

                      <div className="space-y-2 mt-4">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Preferred Service Location</label>
                        <select
                          value={formData.serviceLocation}
                          onChange={(e) => setFormData({ ...formData, serviceLocation: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                        >
                          <option value="on-site">On-site Repair (At your location)</option>
                          <option value="off-site">Off-site Repair (Pickup & Return)</option>
                          {formData.isRestrictedArea && <option value="gate">Meet at Gate</option>}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Shield size={16} className="text-slate-400"/> Is your location restricted (Hostel/Campus)?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="restricted" checked={formData.isRestrictedArea} onChange={() => setFormData({...formData, isRestrictedArea: true, serviceLocation: 'gate'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="restricted" checked={!formData.isRestrictedArea} onChange={() => setFormData({...formData, isRestrictedArea: false, serviceLocation: formData.hasSpace ? 'on-site' : 'off-site'})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium">No</span>
                          </label>
                        </div>
                      </div>
                      
                      {formData.isRestrictedArea && (
                         <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                           <p className="text-sm text-indigo-800 font-medium">For restricted areas, please select "Meet at Gate" or "Off-site Repair". The tech will contact you via app chat to coordinate.</p>
                         </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Find Nearby Technicians 🔍
                  </button>
                </form>
              )
            )}

            {/* --- STEP 2: TECHNICIAN SELECTION --- */}
            {step === 2 && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-500">
                {fetchingTechs ? (
                  <div className="flex flex-col items-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="font-semibold text-slate-600 animate-pulse">Scanning your area for top-rated technicians...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-slate-600 font-medium pb-2 border-b border-slate-100">We found several qualified technicians nearby. Please select one for direct assignment.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {technicians.map((tech) => (
                         <div 
                           key={tech.id}
                           onClick={() => setSelectedTech(tech)}
                           className={`cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 ${selectedTech?.id === tech.id ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100 transform scale-[1.02]' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm bg-white'}`}
                         >
                           <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl shadow-inner">
                               {tech.avatar}
                             </div>
                             <div>
                               <h3 className="font-bold text-slate-800">{tech.name}</h3>
                               <div className="flex items-center text-amber-500 text-sm font-bold">
                                 <Star size={14} className="fill-current mr-1"/>
                                 {tech.rating} <span className="text-slate-400 font-normal ml-1 border-l border-slate-300 pl-1">{tech.jobsCompleted} jobs</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="space-y-2 text-sm text-slate-600 pt-2 border-t border-slate-100/50">
                             <div className="flex justify-between">
                               <span className="font-medium text-slate-400">Experience</span>
                               <span className="font-bold text-slate-700">{tech.experience}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="font-medium text-slate-400">Distance</span>
                               <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{tech.distance}</span>
                             </div>
                           </div>
                         </div>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-6 mt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setStep(1)} 
                        className="py-3 px-6 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleFinalSubmit}
                        disabled={!selectedTech}
                        className={`flex-1 py-3 px-6 font-bold rounded-xl shadow-lg transition-all transform ${selectedTech ? 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                      >
                        Send Request to {selectedTech ? selectedTech.name.split(' ')[0] : 'Technician'} 🚀
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 font-medium animate-pulse">Fetching your history...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <PackageSearch className="text-blue-500" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Bookings Yet</h3>
            <p className="text-slate-500 max-w-sm text-center">You haven't requested any device repairs yet. Click the button above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                        {booking.serviceId?.name || 'Device Repair'}
                      </span>
                      <h3 className="text-2xl font-extrabold text-slate-900">
                        ${booking.serviceId?.price || 0}
                        {booking.serviceOption === 'inspection' && <span className="text-sm text-slate-500 font-medium ml-2 block sm:inline">+ ${booking.inspectionFee || 15} Inspection</span>}
                      </h3>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  {booking.deviceType && (
                    <div className="space-y-3 bg-slate-50 rounded-xl p-5 border border-slate-100/60">
                      <div className="flex items-start gap-3 text-slate-700">
                        <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-slate-900">Device</p>
                          <p className="text-slate-600">{booking.deviceType}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-slate-700">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-slate-900">Issue</p>
                          <p className="text-slate-600 line-clamp-2">{booking.problemDescription}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-slate-700">
                        <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-slate-900 flex items-center gap-2">Location 
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wide border border-emerald-100">{booking.serviceLocation === 'gate' ? 'Gate Meetup' : booking.serviceLocation || 'On-site'}</span>
                          </p>
                          <p className="text-slate-600">{booking.location}</p>
                        </div>
                      </div>
                      {booking.imageUrl && (
                        <div className="flex items-start gap-3 text-slate-700 pt-2 border-t border-slate-100/80">
                          <Camera className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                            <img src={booking.imageUrl} alt="Device Damage" className="w-full h-auto max-h-32 object-cover hover:scale-105 transition-transform" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={18} />
                    <span className="font-medium text-sm">
                      {booking.date ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending Date'}
                    </span>
                  </div>
                  {booking.providerId ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl text-indigo-700 text-sm font-bold shadow-sm border border-indigo-100">
                        <User size={16} className="text-indigo-500"/>
                        Technician Assigned
                      </div>
                      <button 
                         onClick={() => setChatBookingId(booking._id)}
                         className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-indigo-100 transform hover:-translate-y-0.5"
                      >
                         <MessageSquare size={16} /> Open Chat
                      </button>

                      {booking.status === 'completed' && !booking.isReviewed && (
                        <button 
                           onClick={() => setReviewBooking(booking)}
                           className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all shadow-amber-200 transform hover:-translate-y-0.5"
                        >
                           <Star size={16} className="fill-current text-amber-100" /> Leave Review
                        </button>
                      )}
                      
                      {booking.isReviewed && (
                         <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-emerald-700 text-sm font-bold shadow-sm">
                           <Star size={16} className="text-emerald-500 fill-emerald-500"/>
                           Reviewed
                         </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm font-medium italic">Unassigned...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {chatBookingId && (
        <ChatModal 
          bookingId={chatBookingId} 
          currentRole="user" 
          onClose={() => setChatBookingId(null)} 
        />
      )}

      {reviewBooking && (
        <ReviewModal 
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
