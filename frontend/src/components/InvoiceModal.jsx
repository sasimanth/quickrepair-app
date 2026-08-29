import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle, FileText, Wrench, MapPin, Phone, Mail } from 'lucide-react';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const InvoiceModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-FXV-${(booking._id || '000000').toString().slice(-6).toUpperCase()}`;
  const invoiceDate = booking.updatedAt 
    ? new Date(booking.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const finalAmount = booking.finalQuote || booking.amount || 199;
  const baseServiceFee = Math.round(finalAmount * 0.70);
  const partsOrLabor = Math.round(finalAmount * 0.30);
  const discount = booking.discountAmount || (booking.discountPercentage ? (finalAmount * (booking.discountPercentage / 100)) : 0);
  const totalPaid = Math.max(0, finalAmount - discount);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900 print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Actions Bar (Hidden on Print) */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider">Fixvo Tax Invoice & Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer border-none shadow-sm transition-all"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border-none"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-10 space-y-6 text-left">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 p-1 shadow-md shadow-blue-600/20 overflow-hidden flex items-center justify-center">
                <img src={fixvoLogo} alt="Fixvo" className="w-full h-full object-cover scale-110" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Fix<span className="text-blue-600">vo</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold">On-Demand Home Services & Certified Care</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                ✓ Verified Paid
              </span>
              <p className="text-xs font-mono font-black text-slate-900">{invoiceNumber}</p>
              <p className="text-[10px] text-slate-500 font-medium">Date: {invoiceDate}</p>
            </div>
          </div>

          {/* Customer & Technician Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Billed To</span>
              <h4 className="text-sm font-extrabold text-slate-900">{booking.name || 'Valued Customer'}</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{booking.phone || 'Phone not specified'}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{booking.location || booking.detailedAddress || 'Service Address'}</p>
            </div>

            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Service Professional</span>
              <h4 className="text-sm font-extrabold text-slate-900">{booking.providerName || 'Certified Fixvo Expert'}</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Contact: {booking.providerPhone || '+91 95159 80170'}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>Background Verified Partner</span>
              </p>
            </div>
          </div>

          {/* Service Line Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 text-center">Category</th>
                  <th className="py-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-bold text-slate-900">
                    {booking.serviceName || booking.serviceId?.name || 'Home Repair Service'}
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                      Issue: {booking.problemDescription || 'Standard diagnosis & repair'}
                    </span>
                  </td>
                  <td className="py-3 text-center text-slate-600 font-medium capitalize">
                    {booking.serviceOption || 'Repair / Inspection'}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    ₹{baseServiceFee}
                  </td>
                </tr>
                {partsOrLabor > 0 && (
                  <tr>
                    <td className="py-3 font-semibold text-slate-700">
                      Labor / Diagnostics / Parts Adjustment
                    </td>
                    <td className="py-3 text-center text-slate-500 font-medium">Included</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      ₹{partsOrLabor}
                    </td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr className="text-emerald-700 font-bold">
                    <td className="py-3">Fixvo Cash / Promotional Discount</td>
                    <td className="py-3 text-center">Discount</td>
                    <td className="py-3 text-right">-₹{discount}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary Box */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Payment Method</span>
              <p className="text-xs font-extrabold text-slate-900 uppercase">
                {booking.paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Online Payment (Razorpay/Card)'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Txn: {booking.transactionId || `TXN-${(booking._id || '').toString().slice(-8).toUpperCase()}`}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Grand Total Paid</span>
              <h3 className="text-2xl font-black text-blue-600">₹{totalPaid}</h3>
              <p className="text-[10px] text-slate-400 font-medium">All taxes & platform fees included</p>
            </div>
          </div>

          {/* 30-Day Fixvo Warranty Guarantee Note */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h5 className="text-xs font-black text-blue-950">30-Day Fixvo Service Warranty</h5>
              <p className="text-[10px] text-blue-800 leading-tight">
                This job is covered by Fixvo's 30-day rework guarantee. If any issue arises, raise a free warranty claim directly from your dashboard.
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>Fixvo Technologies • Madanapalle & Region • Andhra Pradesh, India</p>
            <p>Support: <strong>fixvosupport@gmail.com</strong> • Phone: <strong>+91 95159 80170</strong></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
