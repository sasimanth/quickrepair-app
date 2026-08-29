import React, { useState } from 'react';
import { X, ShieldAlert, Wrench, Calendar, Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const WarrantyModal = ({ booking, onClose, onSuccess }) => {
  const [complaintReason, setComplaintReason] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('Morning (9 AM - 12 PM)');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintReason.trim()) {
      setError('Please describe the issue or fault observed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create a warranty rework booking linked to original booking with 0 charges
      const payload = {
        serviceId: booking.serviceId?._id || booking.serviceId || 'repair',
        service: `[WARRANTY CLAIM] ${booking.serviceName || 'Service Rework'}`,
        serviceOption: 'inspection',
        problemDescription: `WARRANTY REWORK CLAIM for Booking #${(booking._id || '').toString().slice(-6).toUpperCase()}: ${complaintReason.trim()}`,
        location: booking.location || booking.detailedAddress || 'Registered Address',
        detailedAddress: booking.detailedAddress || booking.location || 'Registered Address',
        date: preferredDate,
        timeSlot: preferredTime,
        phone: booking.phone,
        name: booking.name,
        amount: 0,
        finalQuote: 0,
        providerId: booking.providerId || null
      };

      await api.post('/bookings', payload);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to submit warranty claim:', err);
      setError(err.response?.data?.message || 'Failed to submit warranty complaint. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Raise Warranty Claim</h3>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">30-Day Fixvo Free Rework Guarantee</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full border-none bg-transparent cursor-pointer transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Original Service</span>
            <h4 className="text-xs font-black text-slate-900 mt-0.5">{booking.serviceName || 'Home Repair'}</h4>
            <p className="text-[10px] text-slate-500">Booking ID: #{booking._id?.toString().slice(-6).toUpperCase()}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Describe the Fault / Issue
            </label>
            <textarea
              required
              rows={3}
              value={complaintReason}
              onChange={(e) => setComplaintReason(e.target.value)}
              placeholder="Explain what is not working properly after the repair..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Preferred Visit Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Preferred Time Slot
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                <option value="Night (6 PM - 9 PM)">Night (6 PM - 9 PM)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <p className="text-[10px] text-emerald-800 font-semibold leading-tight">
              Zero charges apply. A verified technician will inspect and rework the issue under your Fixvo warranty.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md shadow-amber-600/20 border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Warranty Claim'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default WarrantyModal;
