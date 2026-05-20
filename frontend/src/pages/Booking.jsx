import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { globalCategories, globalServices } from '../data/services';
import { Calendar, MapPin, Smartphone, HelpCircle, Wrench, Camera, UploadCloud, CheckCircle, Loader2, Settings, ArrowRight } from 'lucide-react';
import api from '../services/api';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(useLocation().search);
  const initialService = queryParams.get('service') || '';
  
  const [formData, setFormData] = useState({
    serviceId: initialService,
    date: new Date().toISOString().split('T')[0],
    deviceType: '',
    problemDescription: '',
    location: '',
    unknownProblem: false,
    serviceOption: 'direct'
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is already logged in, just go to dashboard with action=book
    if (user) {
       navigate(`/dashboard?action=book&service=${initialService}`, { replace: true });
    }
  }, [user, navigate, initialService]);

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
      setFormData(prev => ({ ...prev, mediaUrl: reader.result, mediaType: file.type }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to process image.');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!formData.serviceId) {
       alert('Please select a service');
       return;
    }
    
    // Save to local storage so after login we can auto-fill or proceed
    localStorage.setItem('pendingBooking', JSON.stringify(formData));
    
    // Force login now
    navigate('/login?redirect=/dashboard?action=book');
  };

  if (user) return null; // handled by useEffect

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-3xl mx-auto">
        
        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <Wrench className="text-blue-600" size={28} />
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Book a Service</h2>
              <p className="text-slate-500 font-medium mt-1">Tell us what you need help with</p>
            </div>
          </div>
          
          <form onSubmit={handleContinue} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Settings size={16} className="text-slate-400"/> Select Service</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                  required
                >
                  <option value="">-- Choose a Service --</option>
                  {globalCategories.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {globalServices.filter(s => s.categoryId === cat.id).map(service => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </optgroup>
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
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Smartphone size={16} className="text-slate-400"/> Brand / Model / Details</label>
                <input type="text" placeholder="e.g. iPhone 13, AC 1.5 Ton" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium" value={formData.deviceType} onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Town / Area</label>
                <select 
                  required 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="">Select your area</option>
                  <option value="Tirupati">Tirupati</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Camera size={16} className="text-slate-400"/> Device Photo (Optional)</label>
              <div className="relative group border-2 border-dashed border-slate-300 rounded-xl p-4 transition-all hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center min-h-[100px] bg-slate-50 cursor-pointer overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/quicktime" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImage}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                {uploadingImage ? (
                  <div className="flex flex-col items-center text-blue-500">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="text-sm font-bold">Uploading...</span>
                  </div>
                ) : formData.mediaUrl ? (
                  <div className="flex flex-col items-center text-emerald-600">
                    <CheckCircle className="mb-2" size={28} />
                    <span className="text-sm font-bold">Media Attached!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-600 transition-colors">
                    <UploadCloud className="mb-2" size={28} />
                    <span className="text-sm font-bold">Click or drag a photo here</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><HelpCircle size={16} className="text-slate-400"/> Describe the problem</label>
              <textarea rows="3" placeholder="Describe the issue you're facing in detail..." required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium resize-none" value={formData.problemDescription} onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}></textarea>
            </div>

            <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2">
              Continue to Assign Technician <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Booking;
