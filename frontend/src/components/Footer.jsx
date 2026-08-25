import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaLinkedin, FaXTwitter, FaYoutube, FaArrowUp } from 'react-icons/fa6';
import { Mail, Phone, MapPin, ArrowUpRight, ShieldCheck, Lock, Smartphone } from 'lucide-react';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import OpenAppModal from './OpenAppModal';

const Footer = () => {
  const location = useLocation();
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  // Helper to determine if a route/hash is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' && !location.hash;
    }
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    return location.pathname === path;
  };

  const getLinkClass = (path) => {
    return `transition-all duration-300 flex items-center gap-1.5 ${
      isActive(path)
        ? 'text-sky-400 font-extrabold translate-x-1'
        : 'text-slate-400 hover:text-white hover:translate-x-1'
    }`;
  };

  return (
    <>
      <footer className="relative overflow-hidden border-t border-slate-800/80 bg-slate-950 text-slate-300 pt-16 pb-12 mt-auto">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/5 blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">

          {/* Pre-Footer Banner (Fixipy Benchmark) */}
          <div className="relative mb-14 overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-6 md:p-10 shadow-2xl">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15),transparent_65%)] md:block"></div>
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-400">Ready when you are</p>
                <h2 className="mt-2 font-black text-2xl md:text-3xl text-white tracking-tight">
                  Book a reliable fixer without the usual back-and-forth.
                </h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Upfront estimates, background-verified professionals, and real-time status updates from booking to completion.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsAppModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition-all hover:bg-slate-100 hover:-translate-y-0.5"
                >
                  <Smartphone size={16} className="text-sky-600" />
                  <span>Open the App</span>
                </button>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-extrabold text-white transition-all hover:bg-slate-700"
                >
                  <span>Talk to Support</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Column 1: Brand & Contact Action Cards */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl shadow-lg shadow-sky-500/20 overflow-hidden border border-white/10">
                  <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Fix<span className="text-sky-400">vo</span></h3>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                A calmer, faster way to book home repairs with verified professionals and transparent pricing.
              </p>

              {/* Direct Contact Cards */}
              <div className="grid gap-2.5 max-w-md">
                <a
                  href="mailto:support@fixvo.com"
                  className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-300 transition-all hover:border-slate-700 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <Mail size={16} className="text-sky-400" />
                    <span className="text-xs font-bold">support@fixvo.com</span>
                  </span>
                  <ArrowUpRight size={14} className="text-slate-500 group-hover:text-white" />
                </a>

                <a
                  href="tel:+919515980170"
                  className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-300 transition-all hover:border-slate-700 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <Phone size={16} className="text-sky-400" />
                    <span className="text-xs font-bold">+91 95159 80170</span>
                  </span>
                  <ArrowUpRight size={14} className="text-slate-500 group-hover:text-white" />
                </a>

                <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/50 px-4 py-3 text-slate-400">
                  <MapPin size={16} className="text-sky-400" />
                  <span className="text-xs font-bold">Madanapalle & Region, Andhra Pradesh</span>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href="https://www.instagram.com/fixvo.in?igsh=Mm1ubnEzeWM2d2Zi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-pink-400 hover:border-pink-500/40 transition-all cursor-pointer"
                  title="Instagram"
                >
                  <FaInstagram size={16} />
                </a>
                <a
                  href="https://www.linkedin.com/company/fixvo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-all cursor-pointer"
                  title="LinkedIn"
                >
                  <FaLinkedin size={16} />
                </a>
                <a
                  href="https://x.com/fixvo_in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                  title="X (Twitter)"
                >
                  <FaXTwitter size={16} />
                </a>
                <a
                  href="https://www.youtube.com/@G.SasimanthReddy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-500/40 transition-all cursor-pointer"
                  title="YouTube Channel"
                >
                  <FaYoutube size={16} />
                </a>
              </div>
            </div>

            {/* Column 2: Services & Quick Links */}
            <div className="md:col-span-4 grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-extrabold mb-4 border-b border-slate-800 pb-2 uppercase tracking-wider text-[11px]">Explore</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/" className={getLinkClass('/')}>Home</Link></li>
                  <li><Link to="/services" className={getLinkClass('/services')}>Services</Link></li>
                  <li><Link to="/book" className={getLinkClass('/book')}>Book Repair</Link></li>
                  <li><Link to="/about" className={getLinkClass('/about')}>About Us</Link></li>
                  <li><Link to="/pricing" className={getLinkClass('/pricing')}>Pricing</Link></li>
                  <li><Link to="/faq" className={getLinkClass('/faq')}>FAQ</Link></li>
                  <li><Link to="/contact" className={getLinkClass('/contact')}>Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-extrabold mb-4 border-b border-slate-800 pb-2 uppercase tracking-wider text-[11px]">Legal</h4>
                <ul className="space-y-2.5 text-xs">
                  <li><Link to="/terms" className={getLinkClass('/terms')}>Terms of Service</Link></li>
                  <li><Link to="/privacy" className={getLinkClass('/privacy')}>Privacy Policy</Link></li>
                  <li><Link to="/refund" className={getLinkClass('/refund')}>Refund Policy</Link></li>
                  <li><Link to="/cancellation" className={getLinkClass('/cancellation')}>Cancellation</Link></li>
                  <li><Link to="/technician-agreement" className={getLinkClass('/technician-agreement')}>Fixer Agreement</Link></li>
                  <li><Link to="/safety" className={getLinkClass('/safety')}>User Safety</Link></li>
                  <li><Link to="/disclaimer" className={getLinkClass('/disclaimer')}>Disclaimer</Link></li>
                </ul>
              </div>
            </div>

            {/* Column 3: Trust & Assurance */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-white font-extrabold mb-4 border-b border-slate-800 pb-2 uppercase tracking-wider text-[11px]">Trust Guarantee</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Verified Technicians</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <Lock size={18} className="text-sky-400" />
                  <span className="text-xs font-semibold text-slate-300">256-Bit Encrypted Payments</span>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2026 Fixvo. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Fast & Verified Home Services</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-700"
                title="Back to top"
              >
                <FaArrowUp size={12} />
                <span>Top</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      <OpenAppModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    </>
  );
};

export default Footer;
