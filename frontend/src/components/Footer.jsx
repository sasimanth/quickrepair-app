import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const Footer = () => {
  const location = useLocation();

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
        ? 'text-blue-400 font-extrabold translate-x-1'
        : 'text-gray-400 hover:text-white hover:translate-x-1'
    }`;
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto border-t border-gray-800/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden border border-white/5">
                 <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
               </div>
               <h3 className="text-2xl font-bold font-heading text-white">Fix<span className="text-blue-500">vo</span></h3>
            </div>
            <p className="text-sm text-gray-400">Fast. Trusted. Done.</p>
            <div className="flex space-x-4">
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 24/7 Support
              </span>
            </div>
            
            {/* Enhanced Social Media Icons with Glows */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <a 
                href="https://www.instagram.com/fixvo.in?igsh=Mm1ubnEzeWM2d2Zi" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-slate-800/80 border border-white/5 rounded-xl text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/30 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center cursor-pointer"
                title="Instagram"
              >
                <FaInstagram size={18} />
              </a>
              <a 
                href="https://www.linkedin.com/company/fixvo/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-slate-800/80 border border-white/5 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 hover:border-blue-400/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center cursor-pointer"
                title="LinkedIn"
              >
                <FaLinkedin size={18} />
              </a>
              <a 
                href="https://x.com/fixvo_in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-slate-800/80 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center cursor-pointer"
                title="X (Twitter)"
              >
                <FaXTwitter size={18} />
              </a>

              <a 
                href="https://www.youtube.com/@G.SasimanthReddy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-slate-800/80 border border-white/5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center cursor-pointer"
                title="YouTube Channel"
              >
                <FaYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 border-b border-gray-800 pb-2 uppercase tracking-wider text-xs">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className={getLinkClass('/')}>
                  {isActive('/') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Home
                </Link>
              </li>
              <li>
                <Link to="/#services" className={getLinkClass('/#services')}>
                  {isActive('/#services') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Services
                </Link>
              </li>
              <li>
                <Link to="/book" className={getLinkClass('/book')}>
                  {isActive('/book') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Book Service
                </Link>
              </li>
              <li>
                <Link to="/about" className={getLinkClass('/about')}>
                  {isActive('/about') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className={getLinkClass('/#pricing')}>
                  {isActive('/#pricing') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className={getLinkClass('/faq')}>
                  {isActive('/faq') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className={getLinkClass('/contact')}>
                  {isActive('/contact') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal Pages */}
          <div>
            <h4 className="text-white font-semibold mb-4 border-b border-gray-800 pb-2 uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className={getLinkClass('/terms')}>
                  {isActive('/terms') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={getLinkClass('/privacy')}>
                  {isActive('/privacy') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className={getLinkClass('/refund')}>
                  {isActive('/refund') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/cancellation" className={getLinkClass('/cancellation')}>
                  {isActive('/cancellation') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className={getLinkClass('/disclaimer')}>
                  {isActive('/disclaimer') && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust */}
          <div>
            <h4 className="text-white font-semibold mb-4 border-b border-gray-800 pb-2 uppercase tracking-wider text-xs">Guaranteed Trust</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/60 p-2 rounded-lg text-blue-400 border border-blue-900/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <span className="text-sm">100% Background Checked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/60 p-2 rounded-lg text-blue-400 border border-blue-900/30">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <span className="text-sm">256-bit Secure Booking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">© 2026 Fixvo. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-sm text-gray-500">
             <span>Crafted with passion for fast service.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
