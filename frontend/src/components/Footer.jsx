import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden">
                 <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
               </div>
               <h3 className="text-2xl font-bold font-heading text-white">Fix<span className="text-blue-500">vo</span></h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">Fast. Trusted. Done.</p>
            <div className="flex space-x-4 mb-6">
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> 24/7 Support
              </span>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/sasimanth_9515?igsh=NXZ5amZxaDlkeGxy" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-pink-500 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1">
                <FaInstagram size={18} />
              </a>
              <a href="https://www.linkedin.com/in/gsasimanthreddy" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1">
                <FaLinkedin size={18} />
              </a>
              <a href="https://x.com/sasimanth_9515" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1">
                <FaXTwitter size={18} />
              </a>
              <a href="https://wa.me/9515980170" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1">
                <FaWhatsapp size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 border-b border-gray-800 pb-2">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><a href="/#services" className="hover:text-blue-400 transition-colors">Services</a></li>
              <li><Link to="/book" className="hover:text-blue-400 transition-colors">Book Service</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 border-b border-gray-800 pb-2">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-blue-400 transition-colors">Refund Policy</Link></li>
              <li><Link to="/cancellation" className="hover:text-blue-400 transition-colors">Cancellation Policy</Link></li>
              <li><Link to="/disclaimer" className="hover:text-blue-400 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Column 4: Trust */}
          <div>
            <h4 className="text-white font-semibold mb-4 border-b border-gray-800 pb-2">Guaranteed Trust</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/50 p-2 rounded-lg text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <span className="text-sm">100% Background Checked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/50 p-2 rounded-lg text-blue-400">
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
