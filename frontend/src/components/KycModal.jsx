import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, Landmark, UploadCloud, Eye, AlertCircle } from 'lucide-react';
import api from '../services/api';

const KycModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Bank Info, 2: Verification Documents
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    idProofUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleNextStep = () => {
    setValidationError('');
    
    // Step 1 Validation
    if (!formData.accountName.trim()) {
      setValidationError("Account Holder Name is required.");
      return;
    }
    if (formData.accountNumber.length < 9 || formData.accountNumber.length > 18 || !/^\d+$/.test(formData.accountNumber)) {
      setValidationError("Invalid Account Number: Must be 9-18 digits.");
      return;
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
    if (!ifscRegex.test(formData.ifscCode)) {
      setValidationError("Invalid IFSC format. Must be 11 characters (e.g. HDFC0001234).");
      return;
    }
    
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    try {
      setLoading(true);
      await api.post('/technicians/kyc', formData);
      setLoading(false);
      onSuccess();
    } catch (error) {
      setValidationError(error.response?.data?.message || "Failed to submit KYC. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#111827] w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.1)] text-white">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Landmark size={20} className="text-indigo-400" /> KYC Verification
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Submit bank details securely</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-6 pt-5 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${step >= 1 ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-white/5 text-slate-500'}`}>1</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Bank Info</span>
          </div>
          <div className="w-10 h-0.5 bg-slate-800"></div>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${step >= 2 ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-white/5 text-slate-500'}`}>2</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">ID Verification</span>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-grow flex flex-col justify-between space-y-6 pb-24 sm:pb-6">
          <div className="space-y-4">
            
            {validationError && (
              <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center gap-2 font-bold text-xs animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="space-y-1">
                  <label htmlFor="kyc-account-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Account Holder Name</label>
                  <input 
                    id="kyc-account-name"
                    name="accountName"
                    required 
                    type="text" 
                    value={formData.accountName} 
                    onChange={(e) => setFormData({...formData, accountName: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold transition-all" 
                    placeholder="Enter recipient name exactly" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="kyc-account-number" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Account Number</label>
                  <input 
                    id="kyc-account-number"
                    name="accountNumber"
                    required 
                    type="text" 
                    value={formData.accountNumber} 
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold tracking-wider transition-all" 
                    placeholder="e.g. 5010012345678" 
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="kyc-ifsc" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">IFSC / Routing Code</label>
                  <input 
                    id="kyc-ifsc"
                    name="ifscCode"
                    required 
                    type="text" 
                    value={formData.ifscCode} 
                    onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold tracking-widest transition-all" 
                    placeholder="e.g. HDFC0001234" 
                  />
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-3">
                  <Landmark className="text-slate-500 shrink-0" size={18} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supports direct transfer to HDFC, SBI, ICICI, Axis and others.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-1">
                  <label htmlFor="kyc-id-proof" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ID Proof Image URL (Optional)</label>
                  <input 
                    id="kyc-id-proof"
                    name="idProofUrl"
                    type="url" 
                    value={formData.idProofUrl} 
                    onChange={(e) => setFormData({...formData, idProofUrl: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold transition-all" 
                    placeholder="https://example.com/id-proof.jpg" 
                  />
                </div>

                {formData.idProofUrl && (
                  <div className="space-y-2 animate-in zoom-in duration-300">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Image Preview</label>
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video shadow-lg">
                      <img src={formData.idProofUrl} alt="ID Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-[#0B0F19]/60 px-2 py-0.5 rounded text-[9px] font-black uppercase text-white flex items-center gap-1">
                        <Eye size={10}/> Preview
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <UploadCloud className="text-slate-500" size={32} />
                  <p className="text-xs font-extrabold text-slate-300">Fast Verification</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal font-semibold">Enter a public direct image URL of your driving license, PAN or Aadhaar card.</p>
                </div>
              </div>
            )}

          </div>

          {/* Action Row - Mobile Sticky and Desktop Standard */}
          <div className="flex gap-3 pt-4 border-t border-white/5 bg-slate-900/90 sm:bg-transparent fixed bottom-0 left-0 right-0 p-4 sm:p-0 sm:relative z-20 backdrop-blur-md">
            {step === 2 && (
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-5 py-3.5 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all uppercase tracking-wider outline-none"
              >
                <div className="flex items-center justify-center gap-1"><ArrowLeft size={14}/> Back</div>
              </button>
            )}
            
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-[0.98] outline-none w-full"
            >
              {loading ? (
                <span>Submitting KYC...</span>
              ) : step === 1 ? (
                <>Next Step <ArrowRight size={14} /></>
              ) : (
                <><ShieldCheck size={16} /> Submit KYC</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KycModal;
