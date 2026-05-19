import { useState } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const KycModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    idProofUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Bank Validation
    if (formData.accountNumber.length < 9 || formData.accountNumber.length > 18 || !/^\d+$/.test(formData.accountNumber)) {
      alert("Invalid Account Number: Must be 9-18 digits.");
      return;
    }
    
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
    if (!ifscRegex.test(formData.ifscCode)) {
      alert("Invalid IFSC format. Must be 11 characters (e.g. HDFC0001234).");
      return;
    }

    try {
      setLoading(true);
      await api.post('/technicians/kyc', formData);
      onSuccess();
    } catch (error) {
      alert("Failed to submit KYC");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Complete KYC for Withdrawals</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Bank Account Name</label>
            <input required type="text" value={formData.accountName} onChange={(e) => setFormData({...formData, accountName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Bank Account Number</label>
            <input required type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1234567890" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Routing Number / IFSC</label>
            <input required type="text" value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="CODE1234" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ID Proof URL (Optional)</label>
            <input type="url" value={formData.idProofUrl} onChange={(e) => setFormData({...formData, idProofUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2">
            {loading ? "Submitting..." : <><CheckCircle size={18} /> Submit KYC</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KycModal;
