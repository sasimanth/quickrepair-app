import { useState, useEffect } from 'react';
import { X, Save, Camera, UploadCloud, MapPin, User, Phone, CheckCircle, Shield } from 'lucide-react';
import api from '../services/api';

const SettingsModal = ({ role, currentProfile, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '👤',
    address: '',
    skills: '', // purely for technicians
    experience: '' // purely for technicians
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        phone: currentProfile.phone || '',
        avatar: currentProfile.avatar || '👤',
        address: currentProfile.address || '',
        skills: currentProfile.skills ? currentProfile.skills.join(', ') : '',
        experience: currentProfile.experience || ''
      });
    }
  }, [currentProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const endpoint = role === 'technician' ? '/technicians/profile' : '/users/profile';
      
      const payload = { ...formData };
      if (role === 'technician') {
        payload.skills = formData.skills.split(',').map(s => s.trim());
      }
      
      await api.put(endpoint, payload);
      onSuccess(); // Close and refresh!
    } catch (error) {
      console.error(error);
      alert('Failed to save profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const avatars = ['👤', '👩‍🔧', '👨‍🔧', '👱‍♂️', '👨‍🚀', '👩‍🎤', '🕵️', '🧙‍♂️'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
              <p className="text-sm text-slate-500 font-medium">Update your professional details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto">
          <form id="settingsForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center gap-6">
               <div className="w-24 h-24 bg-indigo-50 border-2 border-indigo-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner relative group cursor-pointer">
                 {formData.avatar}
                 <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] flex items-center justify-center backdrop-blur-[1px]">
                    <Camera className="text-white" />
                 </div>
               </div>
               <div className="flex-1 space-y-2">
                 <label className="text-sm font-bold text-slate-700">Choose Avatar</label>
                 <div className="flex flex-wrap gap-2">
                   {avatars.map(av => (
                     <button
                       key={av}
                       type="button"
                       onClick={() => setFormData({...formData, avatar: av})}
                       className={`w-10 h-10 text-xl flex items-center justify-center rounded-xl transition-all ${formData.avatar === av ? 'bg-indigo-100 border-2 border-indigo-400 scale-110' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}
                     >
                       {av}
                     </button>
                   ))}
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> Primary Location/Address</label>
              <input 
                type="text" 
                placeholder="123 Silicon Valley, CA"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
              />
            </div>

            {role === 'technician' && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                 <div className="flex items-center gap-2 mb-4 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm inline-flex">
                   <Shield size={16} /> Technician Details
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Years of Experience</label>
                     <input 
                       type="text" 
                       placeholder="e.g. 5 Years"
                       value={formData.experience}
                       onChange={(e) => setFormData({...formData, experience: e.target.value})}
                       className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Core Skills (Comma separated)</label>
                     <input 
                       type="text" 
                       placeholder="iPhones, Laptops, MacBooks"
                       value={formData.skills}
                       onChange={(e) => setFormData({...formData, skills: e.target.value})}
                       className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-700"
                     />
                   </div>
                 </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-4 rounded-b-[2rem]">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            form="settingsForm"
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save size={18} />}
            {isSaving ? 'Saving Profile...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
