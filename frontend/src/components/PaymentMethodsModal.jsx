import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Plus, CheckCircle2, QrCode, Building2, Banknote, Trash2 } from 'lucide-react';

const PaymentMethodsModal = ({ onClose, showToast }) => {
  const [methods, setMethods] = useState([
    { id: 'upi-1', type: 'upi', title: 'Google Pay (GPay)', detail: 'sasi@okaxis', isDefault: true },
    { id: 'upi-2', type: 'upi', title: 'PhonePe UPI', detail: '9515980170@ybl', isDefault: false },
    { id: 'card-1', type: 'card', title: 'HDFC Millennia Credit Card', detail: '•••• •••• •••• 4421', isDefault: false },
    { id: 'cod-1', type: 'cash', title: 'Cash / Pay After Service', detail: 'Handover cash directly to verified technician', isDefault: false }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethodType, setNewMethodType] = useState('upi');
  const [newVpa, setNewVpa] = useState('');

  const handleSetDefault = (id) => {
    setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
    if (showToast) showToast('Default Payment Updated 💳', 'Preferred payment method updated for future orders.', 'success', true);
  };

  const handleAddMethod = (e) => {
    e.preventDefault();
    if (!newVpa.trim()) return;

    const newM = {
      id: 'custom-' + Date.now(),
      type: newMethodType,
      title: newMethodType === 'upi' ? 'Saved UPI ID' : 'Saved Card',
      detail: newVpa,
      isDefault: false
    };

    setMethods([...methods, newM]);
    setNewVpa('');
    setShowAddForm(false);
    if (showToast) showToast('Payment Method Saved ✨', 'New payment option added successfully.', 'success', true);
  };

  const handleDelete = (id) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white border-0 sm:border border-slate-200 rounded-none sm:rounded-[2rem] w-full h-full sm:h-auto min-h-[100dvh] sm:min-h-0 sm:max-w-lg sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative font-sans text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">Manage Payment Methods</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Configure saved UPI, Cards, Net Banking & Pay-On-Delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Secure Payments</span>
              <p className="text-xs font-bold">256-Bit Encrypted Gateways (Razorpay & Cashfree)</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer border-none shadow-xs"
            >
              <Plus size={14} /> Add New
            </button>
          </div>

          {/* Add Method Form */}
          {showAddForm && (
            <form onSubmit={handleAddMethod} className="bg-slate-50 border border-indigo-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Add Saved Payment Handle</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMethodType('upi')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${newMethodType === 'upi' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}
                  >
                    UPI VPA Handle
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMethodType('card')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${newMethodType === 'card' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}
                  >
                    Card Number
                  </button>
                </div>
                <input
                  required
                  type="text"
                  placeholder={newMethodType === 'upi' ? 'e.g. mobile@upi or user@okaxis' : 'e.g. 4532 8812 9901 2234'}
                  value={newVpa}
                  onChange={(e) => setNewVpa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs cursor-pointer border-none shadow-xs"
                >
                  Save Method
                </button>
              </div>
            </form>
          )}

          {/* List of Saved Methods */}
          <div className="space-y-3">
            {methods.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSetDefault(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.isDefault
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    item.type === 'upi' ? 'bg-emerald-100 text-emerald-700' :
                    item.type === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.type === 'upi' && <QrCode size={20} />}
                    {item.type === 'card' && <CreditCard size={20} />}
                    {item.type === 'cash' && <Banknote size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{item.title}</h4>
                      {item.isDefault && (
                        <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{item.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.isDefault ? (
                    <CheckCircle2 size={18} className="text-indigo-600" />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 hover:text-indigo-600">Set Default</span>
                  )}
                  {!item.isDefault && item.id.startsWith('custom') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 font-semibold space-y-1">
            <span className="font-black text-slate-800 block">💡 Pro Tip</span>
            <p>You can also use Fixvo Cash wallet balance or instant QR payment when paying for completed bookings!</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> Verified Payment Vault</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-extrabold text-xs cursor-pointer border-none shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentMethodsModal;
