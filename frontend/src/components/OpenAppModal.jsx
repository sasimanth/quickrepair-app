import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Smartphone, X } from 'lucide-react';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const OpenAppModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <motion.button
          type="button"
          aria-label="Close Open App dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-default border-0 bg-slate-950/75 backdrop-blur-md"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="open-app-title"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-900 p-6 text-white shadow-[0_25px_70px_rgba(0,0,0,0.5)] sm:p-8"
        >
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-start justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-600/20 p-1">
                  <img src={fixvoLogo} alt="Fixvo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h2 id="open-app-title" className="text-lg font-black tracking-tight">Welcome to Fixvo</h2>
                  <p className="mt-1 text-xs font-medium text-slate-400">Sign in or create your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => goTo('/login')}
                className="flex w-full items-center justify-between rounded-2xl bg-blue-600 px-5 py-4 text-sm font-extrabold text-white transition hover:bg-blue-500"
              >
                <span className="flex items-center gap-3"><Smartphone size={18} /> Sign In</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo('/signup')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-sm font-extrabold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                <span>Create an Account</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 transition hover:text-white"
            >
              <ShieldCheck size={15} className="text-emerald-400" /> Continue browsing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OpenAppModal;
