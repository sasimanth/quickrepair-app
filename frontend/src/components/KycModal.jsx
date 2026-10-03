import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, Landmark, UploadCloud, Eye, AlertCircle, Clock, XCircle } from 'lucide-react';
import api from '../services/api';

const KycModal = ({ onClose, onSuccess, currentKycStatus = 'not_submitted', rejectionReason = '', bankDetails = null }) => {
  const [step, setStep] = useState(1); // 1: Bank Info, 2: Verification & Consent
  const [formData, setFormData] = useState({
    accountName: bankDetails?.accountName || '',
    accountNumber: '',
    ifscCode: bankDetails?.ifscCodeMasked || '',
    idProofUrl: '',
    consentGranted: false
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isPending = currentKycStatus === 'pending_review';
  const isApproved = currentKycStatus === 'approved';
  const isRejected = currentKycStatus === 'rejected';

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

    if (!formData.consentGranted) {
      setValidationError("You must grant consent to process bank details under DPDPA 2023.");
      return;
    }
    
    try {
      setLoading(true);
      await api.post('/technicians/kyc', {
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        idProofUrl: formData.idProofUrl,
        consentGranted: true
      });
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
              <Landmark size={20} className="text-indigo-400" /> Bank Account KYC
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Secure Bank Verification (DPDPA Compliant)</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Lifecycle Indicator Banner */}
        {isPending && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
            <Clock className="text-amber-400 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-amber-300">KYC Under Admin Review</p>
              <p className="text-[10px] text-amber-400/80">Your bank details are currently being verified by Fixvo Compliance.</p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <CheckCircle className="text-emerald-400 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-emerald-300">KYC Verified & Approved</p>
              <p className="text-[10px] text-emerald-400/80">Bank account active: {bankDetails?.accountNumberMasked || '••••••••'}</p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
            <XCircle className="text-rose-400 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-rose-300">KYC Rejected</p>
              <p className="text-[10px] text-rose-400/80">{rejectionReason || 'Verification failed. Please update details and resubmit.'}</p>
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        {!isApproved && !isPending && (
          <div className="px-6 pt-5 flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${step >= 1 ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-white/5 text-slate-500'}`}>1</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Bank Info</span>
            </div>
            <div className="w-10 h-0.5 bg-slate-800"></div>
            <div className="flex-1 flex items-center gap-2 justify-end">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${step >= 2 ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-white/5 text-slate-500'}`}>2</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Consent & Submit</span>
            </div>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-grow flex flex-col justify-between space-y-6 pb-24 sm:pb-6">
          <div className="space-y-4">
            
            {validationError && (
              <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center gap-2 font-bold text-xs animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {!isPending && !isApproved && step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Account Holder Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.accountName} 
                    onChange={(e) => setFormData({...formData, accountName: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold transition-all" 
                    placeholder="Enter recipient name exactly as in bank" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Account Number</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.accountNumber} 
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold tracking-wider transition-all" 
                    placeholder="9-18 digit account number" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">IFSC / Routing Code</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.ifscCode} 
                    onChange={(e) => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold tracking-widest transition-all" 
                    placeholder="e.g. HDFC0001234" 
                  />
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account details are encrypted using AES-256-GCM at rest.</p>
                </div>
              </div>
            )}

            {!isPending && !isApproved && step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passbook / Canceled Cheque Reference URL (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.idProofUrl} 
                    onChange={(e) => setFormData({...formData, idProofUrl: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-slate-100 text-sm font-semibold transition-all" 
                    placeholder="https://example.com/passbook.jpg" 
                  />
                </div>

                {/* Consent Checkbox for DPDPA 2023 */}
                <div className="p-4 bg-slate-900/80 border border-indigo-500/20 rounded-2xl space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.consentGranted}
                      onChange={(e) => setFormData({...formData, consentGranted: e.target.checked})}
                      className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 shrink-0"
                    />
                    <span className="text-xs text-slate-300 leading-normal font-semibold">
                      I consent to Fixvo storing and processing my bank details for payout settlements under Digital Personal Data Protection Act (DPDPA 2023).
                    </span>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* Action Row */}
          {!isPending && !isApproved && (
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
          )}
        </form>
      </div>
    </div>
  );
};

export default KycModal;

