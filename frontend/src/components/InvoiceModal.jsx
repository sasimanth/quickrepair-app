import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle, FileText, Wrench, MapPin, Phone, Mail, ArrowDownToLine } from 'lucide-react';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const InvoiceModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const invoiceNumber = `INV-FXV-${(booking._id || '000000').toString().slice(-6).toUpperCase()}`;
  const invoiceDate = booking.updatedAt 
    ? new Date(booking.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const finalAmount = booking.finalQuote || booking.amount || 199;
  const baseServiceFee = Math.round(finalAmount * 0.70);
  const partsOrLabor = Math.round(finalAmount * 0.30);
  const discount = booking.discountAmount || (booking.discountPercentage ? (finalAmount * (booking.discountPercentage / 100)) : 0);
  const totalPaid = Math.max(0, finalAmount - discount);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // Generate clean self-contained HTML invoice document for offline saving / printing
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Fixvo Invoice - ${invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 680px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 900; color: #0f172a; }
          .logo span { color: #2563eb; }
          .tag { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 3px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; margin-bottom: 20px; font-size: 13px; }
          .grid h4 { margin: 4px 0 2px; font-size: 14px; font-weight: 700; }
          .grid p { margin: 2px 0; color: #475569; font-size: 12px; }
          .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th { text-align: left; padding: 8px; border-bottom: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; }
          td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
          .total-box { display: flex; justify-content: space-between; align-items: flex-start; border-top: 2px solid #e2e8f0; padding-top: 16px; margin-bottom: 20px; }
          .total-amount { font-size: 24px; font-weight: 900; color: #2563eb; }
          .warranty { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 10px; font-size: 12px; color: #1e3a8a; margin-bottom: 20px; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Fix<span>vo</span></div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">On-Demand Home Services & Certified Care</div>
          </div>
          <div style="text-align: right;">
            <div class="tag">✓ Verified Paid</div>
            <div style="font-family: monospace; font-weight: 800; font-size: 13px; margin-top: 4px;">${invoiceNumber}</div>
            <div style="font-size: 11px; color: #64748b;">Date: ${invoiceDate}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <span class="label">Billed To</span>
            <h4>${booking.name || 'Valued Customer'}</h4>
            <p>${booking.phone || ''}</p>
            <p>${booking.location || booking.detailedAddress || 'Service Address'}</p>
          </div>
          <div>
            <span class="label">Service Professional</span>
            <h4>${booking.providerName || 'Certified Fixvo Expert'}</h4>
            <p>Contact: ${booking.providerPhone || '+91 95159 80170'}</p>
            <p>✓ Background Verified Partner</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Category</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${booking.serviceName || booking.serviceId?.name || 'Home Repair Service'}</strong>
                <div style="font-size: 11px; color: #64748b;">Issue: ${booking.problemDescription || 'Standard diagnosis & repair'}</div>
              </td>
              <td style="text-align: center; text-transform: capitalize;">${booking.serviceOption || 'Repair'}</td>
              <td style="text-align: right; font-weight: 700;">₹${baseServiceFee}</td>
            </tr>
            ${partsOrLabor > 0 ? `
            <tr>
              <td>Labor / Diagnostics / Parts Adjustment</td>
              <td style="text-align: center;">Included</td>
              <td style="text-align: right; font-weight: 700;">₹${partsOrLabor}</td>
            </tr>` : ''}
            ${discount > 0 ? `
            <tr style="color: #047857; font-weight: 700;">
              <td>Fixvo Cash / Promotional Discount</td>
              <td style="text-align: center;">Discount</td>
              <td style="text-align: right;">-₹${discount}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <div class="total-box">
          <div>
            <span class="label">Payment Method</span>
            <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">
              ${booking.paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Online Payment (Razorpay/Card)'}
            </div>
            <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">
              Txn: ${booking.transactionId || `TXN-${(booking._id || '').toString().slice(-8).toUpperCase()}`}
            </div>
          </div>
          <div style="text-align: right;">
            <span class="label">Grand Total Paid</span>
            <div class="total-amount">₹${totalPaid}</div>
            <div style="font-size: 11px; color: #64748b;">All taxes & platform fees included</div>
          </div>
        </div>

        <div class="warranty">
          <strong>🛡️ 30-Day Fixvo Service Warranty</strong>
          <div>This service is covered under Fixvo's 30-day rework warranty. For assistance, reach out at fixvosupport@gmail.com.</div>
        </div>

        <div class="footer">
          <p>Fixvo Technologies • Madanapalle & Region • Andhra Pradesh, India</p>
          <p>Support: <strong>fixvosupport@gmail.com</strong> • Phone: <strong>+91 95159 80170</strong></p>
        </div>
      </body>
      </html>
    `;

    // Try creating a direct blob download link
    try {
      const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}_receipt.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to print dialog
      window.print();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[150] overflow-y-auto p-2 sm:p-6 flex justify-center items-start sm:items-center print:p-0 print:bg-white animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl sm:rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900 print:shadow-none print:border-none print:rounded-none my-auto">
        
        {/* Sticky Header Bar with Title, Download & Close Button */}
        <div className="sticky top-0 z-20 flex justify-between items-center px-4 sm:px-6 py-3.5 bg-slate-900 text-white shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wide truncate">Fixvo Tax Invoice & Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print or Save as PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm transition-all"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadInvoice}
              title="Download Invoice File"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold cursor-pointer border border-slate-700 shadow-sm transition-all"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              title="Close invoice"
              className="p-1.5 bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border-none flex items-center justify-center"
              aria-label="Close invoice"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-4 sm:p-8 md:p-10 space-y-5 sm:space-y-6 text-left">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 p-1 shadow-md shadow-blue-600/20 overflow-hidden flex items-center justify-center shrink-0">
                <img src={fixvoLogo} alt="Fixvo" className="w-full h-full object-cover scale-110" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  Fix<span className="text-blue-600">vo</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">On-Demand Home Services & Certified Care</p>
              </div>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                ✓ Verified Paid
              </span>
              <div>
                <p className="text-xs font-mono font-black text-slate-900">{invoiceNumber}</p>
                <p className="text-[10px] text-slate-500 font-medium">Date: {invoiceDate}</p>
              </div>
            </div>
          </div>

          {/* Customer & Technician Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Billed To</span>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{booking.name || 'Valued Customer'}</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{booking.phone || 'Phone not specified'}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{booking.location || booking.detailedAddress || 'Service Address'}</p>
            </div>

            <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Service Professional</span>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{booking.providerName || 'Certified Fixvo Expert'}</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Contact: {booking.providerPhone || '+91 95159 80170'}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                <span>Background Verified Partner</span>
              </p>
            </div>
          </div>

          {/* Service Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[280px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                  <th className="py-2.5 pr-2">Description</th>
                  <th className="py-2.5 px-2 text-center">Category</th>
                  <th className="py-2.5 pl-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 pr-2 font-bold text-slate-900">
                    {booking.serviceName || booking.serviceId?.name || 'Home Repair Service'}
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                      Issue: {booking.problemDescription || 'Standard diagnosis & repair'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600 font-medium capitalize whitespace-nowrap">
                    {booking.serviceOption || 'Repair / Inspection'}
                  </td>
                  <td className="py-3 pl-2 text-right font-bold text-slate-900 whitespace-nowrap">
                    ₹{baseServiceFee}
                  </td>
                </tr>
                {partsOrLabor > 0 && (
                  <tr>
                    <td className="py-3 pr-2 font-semibold text-slate-700">
                      Labor / Diagnostics / Parts Adjustment
                    </td>
                    <td className="py-3 px-2 text-center text-slate-500 font-medium whitespace-nowrap">Included</td>
                    <td className="py-3 pl-2 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{partsOrLabor}
                    </td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr className="text-emerald-700 font-bold">
                    <td className="py-3 pr-2">Fixvo Cash / Promotional Discount</td>
                    <td className="py-3 px-2 text-center whitespace-nowrap">Discount</td>
                    <td className="py-3 pl-2 text-right whitespace-nowrap">-₹{discount}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary Box */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Payment Method</span>
              <p className="text-xs font-extrabold text-slate-900 uppercase">
                {booking.paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Online Payment'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono break-all">
                Txn: {booking.transactionId || `TXN-${(booking._id || '').toString().slice(-8).toUpperCase()}`}
              </p>
            </div>

            <div className="text-right space-y-1 shrink-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Grand Total Paid</span>
              <h3 className="text-xl sm:text-2xl font-black text-blue-600">₹{totalPaid}</h3>
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
              <p className="text-[10px] text-blue-800 leading-tight mt-0.5">
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

        {/* Mobile Sticky Bottom Action Bar with Download & Close */}
        <div className="sticky bottom-0 z-20 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden flex items-center gap-2.5 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <X size={15} />
            <span>Close</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Download size={15} />
            <span>Download / PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
