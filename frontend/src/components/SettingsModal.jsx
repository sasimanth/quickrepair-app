import React, { useState, useEffect } from 'react';
import { X, Save, Camera, MapPin, User, Phone, CheckCircle, Shield, Briefcase, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SearchableServiceSelector from './SearchableServiceSelector';
import SearchableAreaSelector from './SearchableAreaSelector';

const SettingsModal = ({ role, currentProfile, onClose, onSuccess }) => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '👤',
    address: '',
    skills: '', // purely for technicians
    experience: '' // purely for technicians
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (currentProfile && !initialLoaded) {
      setFormData({
        name: currentProfile.name || '',
        phone: currentProfile.phone || '',
        avatar: currentProfile.avatar || '👤',
        address: currentProfile.address || '',
        skills: currentProfile.services || [],
        experience: currentProfile.experience || ''
      });
      setInitialLoaded(true);
    }
  }, [currentProfile, initialLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const endpoint = role === 'technician' ? '/technicians/profile' : '/users/profile';
      const payload = { ...formData };
      if (role === 'technician') {
        payload.skills = Array.isArray(formData.skills) ? formData.skills : [];
      }
      
      const { data: updatedProfile } = await api.put(endpoint, payload);
      
      if (updateUser) {
        updateUser({
          name: formData.name,
          phone: formData.phone,
          avatar: formData.avatar,
          address: formData.address
        });
      }

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onSuccess(updatedProfile); // Close and refresh
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Failed to save profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const avatars = ['👤', '👨‍💻', '👩‍💻', '👩‍🔧', '👨‍🔧', '👱‍♂️', '👩‍🦰', '🕵️'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-300 text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Account & Profile Settings</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Manage personal information and service preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-full transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow p-6 sm:p-8 overflow-y-auto space-y-6 pb-28 sm:pb-8 bg-white">
          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center gap-2 font-bold text-sm animate-in fade-in">
              <CheckCircle size={18} className="shrink-0 text-emerald-600" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl flex items-center gap-2 font-bold text-sm animate-in fade-in">
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black leading-none mr-1">!</span>
              {errorMsg}
            </div>
          )}
          
          <form id="settingsForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
               <div className="w-20 h-20 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-4xl shadow-inner relative group cursor-pointer shrink-0">
                 {formData.avatar}
                 <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-xs">
                    <Camera className="text-white w-5 h-5" />
                 </div>
               </div>
               <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Profile Avatar</label>
                 <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                   {avatars.map(av => (
                     <button
                       key={av}
                       type="button"
                       onClick={() => setFormData({...formData, avatar: av})}
                       className={`w-10 h-10 text-xl flex items-center justify-center rounded-xl transition-all cursor-pointer outline-none ${formData.avatar === av ? 'bg-blue-600 border border-blue-700 text-white scale-105 shadow-md' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
                     >
                       {av}
                     </button>
                   ))}
                 </div>
               </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-900 outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-900 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400"/> Service Area / Address
              </label>
              <SearchableAreaSelector
                value={formData.address}
                onChange={(address) => setFormData({...formData, address})}
                theme="light"
                placeholder="Search and select city..."
              />
            </div>

            {role === 'technician' && (
              <div className="space-y-5 pt-4 border-t border-slate-100">
                 <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full font-bold text-xs border border-blue-200 inline-flex uppercase tracking-wider">
                   <Shield size={12} /> Technical Credentials & Skills
                 </div>
                 
                 <div className="grid grid-cols-1 gap-5">
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                       <Briefcase size={14} className="text-slate-400"/> Experience
                     </label>
                     <input 
                       type="text" 
                       placeholder="e.g. 5 Years"
                       value={formData.experience}
                       onChange={(e) => setFormData({...formData, experience: e.target.value})}
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-900 outline-none text-sm"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                       🛡️ Core Skills
                     </label>
                     <SearchableServiceSelector
                       value={formData.skills}
                       onChange={(skills) => setFormData({...formData, skills})}
                       multiSelect={true}
                       theme="light"
                       placeholder="Select service skills..."
                     />
                   </div>
                 </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 sm:flex-initial px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all uppercase tracking-wider outline-none cursor-pointer border border-slate-200"
          >
            Cancel
          </button>
          <button 
            form="settingsForm"
            type="submit"
            disabled={isSaving}
            className="flex-2 sm:flex-initial px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs outline-none border-none cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
