import React, { useState, useEffect, useCallback } from 'react';
import { X, Printer, ShieldCheck, Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

/**
 * Derives client-side invoice estimate from a booking object.
 * Used as a fallback when the backend invoice isn't available yet.
 */
function buildClientInvoice(booking) {
  const finalAmount = booking?.finalQuote || booking?.amount || 199;
  const baseServiceFee = Math.round(finalAmount * 0.70);
  const partsOrLabor = Math.round(finalAmount * 0.30);
  const discountAmount = booking?.discountAmount || 0;
  const totalAmount = Math.max(0, finalAmount - discountAmount);
  const invoiceNumber = `INV-FXV-${(booking?._id || '000000').toString().slice(-6).toUpperCase()}`;

  return {
    invoiceNumber,
    issueDate: booking?.updatedAt || new Date().toISOString(),
    paymentMethod: booking?.paymentMethod || 'cash',
    transactionId: booking?.transactionId || `TXN-${(booking?._id || '').toString().slice(-8).toUpperCase()}`,
    totalAmount,
    discountAmount,
    subTotal: baseServiceFee + partsOrLabor,
    isGstApplicable: false,
    cgstRate: 0, cgstAmount: 0,
    sgstRate: 0, sgstAmount: 0,
    customerDetails: {
      name: booking?.name || 'Valued Customer',
      phone: booking?.phone || '',
      address: booking?.location || booking?.detailedAddress || 'Service Address'
    },
    providerDetails: {
      name: booking?.providerName || 'Certified Fixvo Expert',
      phone: booking?.providerPhone || '+91 95159 80170'
    },
    businessDetails: {
      legalName: 'Fixvo Technologies',
      tradeName: 'Fixvo App',
      address: 'Madanapalle & Region, Andhra Pradesh, India',
      phone: '+91 95159 80170',
      email: 'fixvosupport@gmail.com'
    },
    itemizedCharges: [
      {
        description: `${booking?.serviceName || 'Home Repair Service'} — ${booking?.problemDescription || 'Standard diagnosis & repair'}`,
        category: booking?.serviceOption || 'Repair',
        amount: baseServiceFee
      },
      ...(partsOrLabor > 0 ? [{ description: 'Labor, Diagnostics & Accessories', category: 'Labor/Parts', amount: partsOrLabor }] : [])
    ],
    _clientSide: true // marker so we know this is an estimate
  };
}

const InvoiceModal = ({ booking, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);

  // Fetch/generate real invoice from backend
  const fetchInvoice = useCallback(async () => {
    if (!booking?._id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/invoices/generate', { bookingId: booking._id });
      if (data?.invoice) {
        setInvoice(data.invoice);
        setInvoiceId(data.invoice._id);
      }
    } catch (err) {
      console.warn('[InvoiceModal] Backend invoice fetch failed, using client estimate:', err.message);
      // Fall back to client-side estimation
      setInvoice(buildClientInvoice(booking));
      setError('Using estimated invoice. Full server invoice will be available after payment confirmation.');
    } finally {
      setLoading(false);
    }
  }, [booking]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (!booking) return null;

  const inv = invoice || buildClientInvoice(booking);
  const cust = inv.customerDetails || {};
  const prov = inv.providerDetails || {};
  const biz = inv.businessDetails || {};
  const issueDate = inv.issueDate
    ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // ─── PDF Download via backend ────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!invoiceId) {
      // Fallback to HTML download if no backend invoice yet
      handleDownloadHtml();
      return;
    }
    setPdfLoading(true);
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${inv.invoiceNumber}_receipt.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err.message);
      handleDownloadHtml();
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // ─── HTML Fallback Download ───────────────────────────────────────────────────
  const handleDownloadHtml = () => {
    const paidMethod = (inv.paymentMethod || 'cash').toUpperCase();
    const itemRows = (inv.itemizedCharges || []).map(item => `
      <tr>
        <td>${item.description || 'Service'}</td>
        <td style="text-align:center;">${item.category || 'Repair'}</td>
        <td style="text-align:right;font-weight:700;">₹${item.amount || 0}</td>
      </tr>
    `).join('');

    const discountRow = inv.discountAmount > 0 ? `
      <tr style="color:#047857;font-weight:700;">
        <td>Promotional Discount</td><td style="text-align:center;">Discount</td>
        <td style="text-align:right;">-₹${inv.discountAmount}</td>
      </tr>` : '';

    const gstRows = inv.isGstApplicable ? `
      ${inv.cgstAmount > 0 ? `<tr><td colspan="2" style="color:#64748b;">CGST (${inv.cgstRate}%)</td><td style="text-align:right;">₹${inv.cgstAmount}</td></tr>` : ''}
      ${inv.sgstAmount > 0 ? `<tr><td colspan="2" style="color:#64748b;">SGST (${inv.sgstRate}%)</td><td style="text-align:right;">₹${inv.sgstAmount}</td></tr>` : ''}
    ` : '';

    const invoiceHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Fixvo Invoice - ${inv.invoiceNumber}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px;color:#0f172a;max-width:680px;margin:0 auto;line-height:1.5}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px}
  .logo{font-size:28px;font-weight:900;color:#0f172a}.logo span{color:#2563eb}
  .tag{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:9999px;padding:3px 10px;font-size:11px;font-weight:800;text-transform:uppercase}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-radius:12px;margin-bottom:20px;font-size:13px}
  .grid h4{margin:4px 0 2px;font-size:14px;font-weight:700}.grid p{margin:2px 0;color:#475569;font-size:12px}
  .label{font-size:10px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:.5px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px}
  th{text-align:left;padding:8px;border-bottom:1px solid #cbd5e1;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:800}
  td{padding:10px 8px;border-bottom:1px solid #f1f5f9}
  .total-box{display:flex;justify-content:space-between;align-items:flex-start;border-top:2px solid #e2e8f0;padding-top:16px;margin-bottom:20px}
  .total-amount{font-size:24px;font-weight:900;color:#2563eb}
  .warranty{background:#eff6ff;border:1px solid #bfdbfe;padding:12px;border-radius:10px;font-size:12px;color:#1e3a8a;margin-bottom:20px}
  .footer{text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px}
</style></head>
<body>
<div class="header">
  <div><div class="logo">Fix<span>vo</span></div><div style="font-size:11px;color:#64748b;font-weight:600;">${biz.tradeName || 'On-Demand Home Services'}</div></div>
  <div style="text-align:right;"><div class="tag">✓ Verified Paid</div><div style="font-family:monospace;font-weight:800;font-size:13px;margin-top:4px;">${inv.invoiceNumber}</div><div style="font-size:11px;color:#64748b;">Date: ${issueDate}</div></div>
</div>
<div class="grid">
  <div><span class="label">Billed To</span><h4>${cust.name || 'Valued Customer'}</h4><p>${cust.phone || ''}</p><p>${cust.address || ''}</p></div>
  <div><span class="label">Service Professional</span><h4>${prov.name || 'Certified Fixvo Expert'}</h4><p>Contact: ${prov.phone || '+91 95159 80170'}</p><p>✓ Background Verified Partner</p></div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:center;">Category</th><th style="text-align:right;">Amount (₹)</th></tr></thead>
  <tbody>${itemRows}${discountRow}${gstRows}</tbody>
</table>
<div class="total-box">
  <div><span class="label">Payment Method</span><div style="font-size:13px;font-weight:700;margin-top:2px;">${inv.paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Online Payment ('+paidMethod+')'}</div><div style="font-size:11px;color:#64748b;font-family:monospace;margin-top:2px;">Txn: ${inv.transactionId || 'N/A'}</div></div>
  <div style="text-align:right;"><span class="label">Grand Total Paid</span><div class="total-amount">₹${inv.totalAmount}</div><div style="font-size:11px;color:#64748b;">All taxes & platform fees included</div></div>
</div>
<div class="warranty"><strong>🛡️ 30-Day Fixvo Service Warranty</strong><div>This service is covered under Fixvo's 30-day rework warranty. For assistance, reach out at fixvosupport@gmail.com.</div></div>
<div class="footer"><p>${biz.legalName || 'Fixvo Technologies'} • ${biz.address || 'Andhra Pradesh, India'}</p><p>Support: <strong>${biz.email || 'fixvosupport@gmail.com'}</strong> • Phone: <strong>${biz.phone || '+91 95159 80170'}</strong></p></div>
</body></html>`;

    try {
      const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${inv.invoiceNumber}_receipt.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[150] overflow-y-auto p-2 sm:p-6 flex justify-center items-start sm:items-center print:p-0 print:bg-white animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl sm:rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900 print:shadow-none print:border-none print:rounded-none my-auto">

        {/* ── Sticky Top Action Bar ── */}
        <div className="sticky top-0 z-20 flex justify-between items-center px-4 sm:px-6 py-3.5 bg-slate-900 text-white shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wide truncate">Fixvo Tax Invoice &amp; Receipt</span>
            {inv._clientSide && (
              <span className="hidden sm:inline text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">Estimate</span>
            )}
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
              onClick={invoiceId ? handleDownloadPdf : handleDownloadHtml}
              disabled={pdfLoading}
              title="Download Invoice PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold cursor-pointer border border-slate-700 shadow-sm transition-all disabled:opacity-50"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">{pdfLoading ? 'Generating…' : (invoiceId ? 'Download PDF' : 'Download')}</span>
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

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm text-slate-500 font-medium">Generating your invoice…</p>
          </div>
        )}

        {/* ── Error Banner ── */}
        {!loading && error && (
          <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Invoice Body ── */}
        {!loading && (
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
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">{biz.tradeName || 'On-Demand Home Services & Certified Care'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                  ✓ Verified Paid
                </span>
                <div>
                  <p className="text-xs font-mono font-black text-slate-900">{inv.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Date: {issueDate}</p>
                </div>
              </div>
            </div>

            {/* Customer & Technician Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Billed To</span>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{cust.name || 'Valued Customer'}</h4>
                {cust.phone && <p className="text-xs text-slate-600 font-medium mt-0.5">{cust.phone}</p>}
                {cust.address && <p className="text-xs text-slate-500 mt-1 leading-snug">{cust.address}</p>}
              </div>
              <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Service Professional</span>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{prov.name || 'Certified Fixvo Expert'}</h4>
                {prov.phone && <p className="text-xs text-slate-600 font-medium mt-0.5">Contact: {prov.phone}</p>}
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
                  {(inv.itemizedCharges || []).map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 pr-2 font-bold text-slate-900">
                        {item.description || 'Service'}
                        {i === 0 && booking?.problemDescription && (
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                            Issue: {booking.problemDescription}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600 font-medium capitalize whitespace-nowrap">
                        {item.category || 'Repair'}
                      </td>
                      <td className="py-3 pl-2 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{item.amount || 0}
                      </td>
                    </tr>
                  ))}
                  {inv.discountAmount > 0 && (
                    <tr className="text-emerald-700 font-bold">
                      <td className="py-3 pr-2">Promotional Discount</td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">Discount</td>
                      <td className="py-3 pl-2 text-right whitespace-nowrap">-₹{inv.discountAmount}</td>
                    </tr>
                  )}
                  {inv.isGstApplicable && inv.cgstAmount > 0 && (
                    <tr className="text-slate-500">
                      <td colSpan={2} className="py-2 pr-2">CGST ({inv.cgstRate}%)</td>
                      <td className="py-2 pl-2 text-right whitespace-nowrap">₹{inv.cgstAmount}</td>
                    </tr>
                  )}
                  {inv.isGstApplicable && inv.sgstAmount > 0 && (
                    <tr className="text-slate-500">
                      <td colSpan={2} className="py-2 pr-2">SGST ({inv.sgstRate}%)</td>
                      <td className="py-2 pl-2 text-right whitespace-nowrap">₹{inv.sgstAmount}</td>
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
                  {inv.paymentMethod === 'cash' ? '💵 Cash on Delivery' : `💳 ${(inv.paymentMethod || 'Online').toUpperCase()}`}
                </p>
                <p className="text-[10px] text-slate-500 font-mono break-all">
                  Txn: {inv.transactionId || 'N/A'}
                </p>
              </div>
              <div className="text-right space-y-1 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Grand Total Paid</span>
                <h3 className="text-xl sm:text-2xl font-black text-blue-600">₹{inv.totalAmount}</h3>
                <p className="text-[10px] text-slate-400 font-medium">All taxes &amp; platform fees included</p>
              </div>
            </div>

            {/* GST Info (when applicable) */}
            {inv.isGstApplicable && biz.gstin && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-700">GSTIN:</span> {biz.gstin} &nbsp;•&nbsp;
                <span className="font-bold text-slate-700">SAC Code:</span> {biz.sacCode || '998719'}
              </div>
            )}

            {/* 30-Day Warranty */}
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

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
              <p>{biz.legalName || 'Fixvo Technologies'} • {biz.address || 'Madanapalle & Region, Andhra Pradesh, India'}</p>
              <p>Support: <strong>{biz.email || 'fixvosupport@gmail.com'}</strong> • Phone: <strong>{biz.phone || '+91 95159 80170'}</strong></p>
            </div>

          </div>
        )}

        {/* ── Mobile Sticky Bottom Bar ── */}
        <div className="sticky bottom-0 z-20 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden flex items-center gap-2.5 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <X size={15} />
            <span>Close</span>
          </button>
          <button
            onClick={invoiceId ? handleDownloadPdf : handlePrint}
            disabled={pdfLoading}
            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span>{pdfLoading ? 'Generating…' : 'Download PDF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
