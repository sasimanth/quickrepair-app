import React, { useState, useEffect } from 'react';
import { X, Save, Camera, MapPin, User, Phone, CheckCircle, Shield, Briefcase, Loader2 } from 'lucide-react';
import api from '../services/api';
import SearchableServiceSelector from './SearchableServiceSelector';
import SearchableAreaSelector from './SearchableAreaSelector';

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
      
      await api.put(endpoint, payload);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onSuccess(); // Close and refresh
      }, 1200);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Failed to save profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const avatars = ['👤', '👨‍💻', '👩‍💻', '👩‍🔧', '👨‍🔧', '👱‍♂️', '👩‍🦰', '🕵️'];

  return (
    <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#111827] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col transform transition-all animate-in slide-in-from-bottom-6 duration-300 text-white">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">Profile Settings</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customize your personal profile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow p-6 sm:p-8 overflow-y-auto space-y-6 pb-28 sm:pb-8">
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={18} className="shrink-0" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-top-2">
              <span className="w-4 h-4 rounded-full bg-rose-500 text-slate-950 flex items-center justify-center text-[10px] font-black leading-none mr-1">!</span>
              {errorMsg}
            </div>
          )}
          
          <form id="settingsForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
               <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-4xl shadow-inner relative group cursor-pointer shrink-0">
                 {formData.avatar}
                 <div className="absolute inset-0 bg-[#0B0F19]/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                    <Camera className="text-white w-5 h-5" />
                 </div>
               </div>
               <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Choose Premium Avatar</label>
                 <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                   {avatars.map(av => (
                     <button
                       key={av}
                       type="button"
                       onClick={() => setFormData({...formData, avatar: av})}
                       className={`w-10 h-10 text-xl flex items-center justify-center rounded-xl transition-all outline-none ${formData.avatar === av ? 'bg-indigo-600 border border-indigo-400 scale-105 shadow-lg shadow-indigo-600/20' : 'bg-slate-800 border border-white/5 hover:bg-slate-700'}`}
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
                <label htmlFor="settings-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <input 
                    id="settings-name"
                    name="name"
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-slate-100 outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <input 
                    id="settings-phone"
                    name="phone"
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-white/5 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-slate-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-500"/> Service Area / Address
              </label>
              <SearchableAreaSelector
                value={formData.address}
                onChange={(address) => setFormData({...formData, address})}
                theme="dark"
                placeholder="Search and select city..."
              />
            </div>

            {role === 'technician' && (
              <div className="space-y-5 pt-4 border-t border-white/5">
                 <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3.5 py-1.5 rounded-full font-bold text-xs border border-indigo-500/20 inline-flex uppercase tracking-widest">
                   <Shield size={12} /> Technical Professional Credentials
                 </div>
                 
                 <div className="grid grid-cols-1 gap-5">
                   <div className="space-y-1.5">
                     <label htmlFor="settings-experience" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                       <Briefcase size={14} className="text-slate-500"/> Experience
                     </label>
                     <input 
                       id="settings-experience"
                       name="experience"
                       type="text" 
                       placeholder="e.g. 5 Years"
                       value={formData.experience}
                       onChange={(e) => setFormData({...formData, experience: e.target.value})}
                       className="w-full px-4 py-3 bg-slate-900 border border-white/5 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold text-slate-100 outline-none text-sm"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                       🛡️ Core Skills
                     </label>
                     <SearchableServiceSelector
                       value={formData.skills}
                       onChange={(skills) => setFormData({...formData, skills})}
                       multiSelect={true}
                       theme="dark"
                       placeholder="Select service skills..."
                     />
                   </div>
                 </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Mobile Sticky and Desktop Standard */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-slate-900/90 flex justify-end gap-3 rounded-b-3xl fixed bottom-0 left-0 right-0 sm:relative z-20 backdrop-blur-md">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 sm:flex-initial px-5 py-3 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all uppercase tracking-wider outline-none"
          >
            Cancel
          </button>
          <button 
            form="settingsForm"
            type="submit"
            disabled={isSaving}
            className="flex-2 sm:flex-initial px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs outline-none"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
