import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, QrCode, Download, ExternalLink, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FaApple, FaGooglePlay } from 'react-icons/fa6';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const OpenAppModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentWebUrl = window.location.origin;

  const handleDeepLink = () => {
    // Attempt deep link schema
    window.location.href = 'fixvo://open';
    setTimeout(() => {
      // Fallback to web app dashboard
      window.location.href = '/dashboard';
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/40 bg-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(15,23,42,0.25)] z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 overflow-hidden">
              <img src={fixvoLogo} alt="Fixvo Logo" className="h-full w-full object-cover scale-110" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 border border-indigo-100">
                Fixvo Mobile Experience
              </span>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Open Fixvo App</h3>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Get instant access to verified local fixers, live service tracking, and exclusive discounts right on your mobile device.
          </p>

          {/* Quick Actions */}
          <div className="space-y-3 mb-6">
            {/* Launch Installed App / Web App */}
            <button
              onClick={handleDeepLink}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white shadow-lg shadow-slate-950/20 transition-all hover:bg-slate-900 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Installed Users</p>
                  <p className="text-sm font-bold text-white">Launch App Directly</p>
                </div>
              </div>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>

            {/* Direct Web App Dashboard */}
            <a
              href="/dashboard"
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800 transition-all hover:bg-slate-100 hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ExternalLink size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Browser Access</p>
                  <p className="text-sm font-bold text-slate-900">Continue in Mobile Web</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900" />
            </a>
          </div>

          {/* Desktop QR Code Section */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-sky-50/60 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white p-2 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentWebUrl)}`}
                  alt="Fixvo QR Code"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 mb-1 flex items-center gap-1.5">
                  <QrCode size={14} /> Scan with Mobile Camera
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Scan this QR code with your phone camera to instantly open Fixvo on your mobile browser or app.
                </p>
              </div>
            </div>
          </div>

          {/* Store Rollout Badges */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">
              Mobile Store Downloads
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
                <FaApple size={22} className="text-slate-900" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">iOS App</p>
                  <p className="text-xs font-bold text-slate-900">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
                <FaGooglePlay size={20} className="text-emerald-600" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Android App</p>
                  <p className="text-xs font-bold text-slate-900">Play Store</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security guarantee footer */}
          <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>100% Safe & Verified Fixvo Platform</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OpenAppModal;
