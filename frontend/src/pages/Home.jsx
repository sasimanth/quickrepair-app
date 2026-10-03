import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { globalCategories, globalServices, getDbServices } from '../data/services';
import OpenAppModal from '../components/OpenAppModal';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Droplets, 
  Wind, 
  Clock, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  ChevronRight, 
  PhoneCall,
  Search,
  Sparkles,
  MapPin,
  ChevronDown,
  Wrench,
  Smartphone,
  ArrowUpRight,
  Award,
  HelpCircle,
  Building2,
  Check
} from 'lucide-react';
import { FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

// Mapping details to enrich service cards
const serviceDetails = {
  ac_repair: { subtitle: "Fast cooling & leak repairs", price: "₹299", rating: 4.9, jobs: 1240 },
  washing_machine: { subtitle: "Fix spin, drum & drainage", price: "₹199", rating: 4.8, jobs: 890 },
  refrigerator: { subtitle: "Compressor & gas refilling", price: "₹249", rating: 4.7, jobs: 620 },
  microwave: { subtitle: "Magnetron & heating repair", price: "₹199", rating: 4.6, jobs: 340 },
  tv_repair: { subtitle: "Screen & backlight issues", price: "₹349", rating: 4.7, jobs: 510 },
  laptop_repair: { subtitle: "OS install, RAM & hardware fixes", price: "₹399", rating: 4.8, jobs: 420 },
  mobile_repair: { subtitle: "Screen, battery & charging port", price: "₹149", rating: 4.9, jobs: 2110 },
  ac_install: { subtitle: "Split & window AC setup", price: "₹599", rating: 4.8, jobs: 410 },
  cctv_install: { subtitle: "Setup security cameras & DVR", price: "₹499", rating: 4.7, jobs: 180 },
  ro_install: { subtitle: "Filter swap & water purifier setup", price: "₹299", rating: 4.9, jobs: 650 },
  inverter_install: { subtitle: "Home power backup setup", price: "₹499", rating: 4.8, jobs: 230 },
  fan_install: { subtitle: "Ceiling & wall fan mounting", price: "₹99", rating: 4.7, jobs: 1100 },
  lock_install: { subtitle: "Secure door lock replacement", price: "₹149", rating: 4.8, jobs: 340 },
  furniture: { subtitle: "Bed, wardrobe & desk assembly", price: "₹399", rating: 4.9, jobs: 310 },
  sofa_clean: { subtitle: "Deep vacuum & shampoo clean", price: "₹299", rating: 4.8, jobs: 730 },
  bathroom_clean: { subtitle: "Acid cleaning & disinfection", price: "₹199", rating: 4.9, jobs: 1250 },
  water_tank_clean: { subtitle: "Hygienic tank sanitation", price: "₹499", rating: 4.7, jobs: 280 },
  carpet_clean: { subtitle: "Remove dust & stains", price: "₹199", rating: 4.8, jobs: 410 },
  kitchen_clean: { subtitle: "Degrease tiles, chimney & slabs", price: "₹599", rating: 4.9, jobs: 680 },
  home_clean: { subtitle: "Full house deep scrubbing", price: "₹1499", rating: 4.9, jobs: 940 },
  pest_control: { subtitle: "Cockroach, bedbug & termite spray", price: "₹499", rating: 4.8, jobs: 820 },
  electric_wiring: { subtitle: "Short circuit & rewiring work", price: "₹999", rating: 4.9, jobs: 540 },
  plumbing_work: { subtitle: "Leakages, blockages & fittings", price: "₹99", rating: 4.8, jobs: 1670 },
  furniture_repair: { subtitle: "Wood repairs & hinges fixing", price: "₹149", rating: 4.7, jobs: 450 },
  painting: { subtitle: "Wall paint & touch-ups", price: "₹1999", rating: 4.8, jobs: 290 }
};

const categoryVisuals = {
  repair: {
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
    bg: "bg-blue-50 border-blue-100 text-blue-900"
  },
  installation: {
    img: "https://images.unsplash.com/photo-1631545856760-4966d5d59f13?q=80&w=600&auto=format&fit=crop",
    bg: "bg-indigo-50 border-indigo-100 text-indigo-900"
  },
  cleaning: {
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
    bg: "bg-sky-50 border-sky-100 text-sky-900"
  },
  other: {
    img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop",
    bg: "bg-slate-50 border-slate-200 text-slate-900"
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [postAuthAction, setPostAuthAction] = useState(null);
  const [services, setServices] = useState(globalServices);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Madanapalle');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getDbServices()
      .then((dbServices) => {
        if (Array.isArray(dbServices) && dbServices.length > 0) {
          setServices(dbServices);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch DB services, using static services:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleBookingClick = (serviceId = '') => {
    const targetPath = `/dashboard?action=book${serviceId ? `&service=${serviceId}` : ''}`;
    if (user) {
      navigate(targetPath);
    } else {
      setPostAuthAction(() => () => navigate(targetPath));
      setShowAuthModal(true);
    }
  };

  const safeServices = Array.isArray(services) ? services : globalServices;

  const filteredServices = safeServices.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. HERO SECTION */}
      <section className="bg-slate-50 border-b border-slate-200 pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          
          {/* Dispatch Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-extrabold uppercase tracking-wider">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            <span>30-Minute Doorstep Emergency Dispatch • Madanapalle & Region</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Fix Anything, <span className="text-blue-600">Anytime.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            Book certified local specialists for AC repair, home appliances, plumbing, electrical fixes, and deep cleaning with upfront digital quotes and zero hidden fees.
          </p>

          {/* Search Input & Action Buttons */}
          <div className="max-w-2xl mx-auto pt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search services like AC repair, sofa clean, plumbing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-300 rounded-2xl outline-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-sm transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => handleBookingClick()}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer border-none"
              >
                Book a Service
              </button>
              
              <button
                onClick={() => setIsAppModalOpen(true)}
                className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
              >
                <Smartphone size={18} className="text-sky-400" />
                <span>Open App</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-slate-700 text-xs font-extrabold border-t border-slate-200/80 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={18} />
              <span>Police-Verified Technicians</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-blue-600" size={18} />
              <span>30-Min On-Site Arrival</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" size={18} />
              <span>4.9/5 Service Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={18} />
              <span>Fixed Upfront Pricing</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. POPULAR SERVICES GRID */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Popular Home Services</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Select a service to request doorstep repair or inspection.</p>
          </div>
          <button 
            onClick={() => handleBookingClick()} 
            className="text-blue-600 font-extrabold text-xs uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <span>View All Services</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.slice(0, 8).map((service) => {
            const details = serviceDetails[service.id] || { price: "₹199", rating: 4.8 };
            return (
              <div
                key={service.id}
                onClick={() => handleBookingClick(service.id)}
                className="group bg-white border border-slate-200 hover:border-blue-600 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="h-44 overflow-hidden relative bg-slate-100">
                  <img
                    src={service.img}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-slate-900 font-black text-xs shadow-xs flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span>{details.rating}</span>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                      {details.subtitle || service.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Starting from</span>
                      <span className="text-base font-black text-slate-900">{details.price}</span>
                    </div>
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-extrabold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Book Now
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HOW FIXVO WORKS */}
      <section className="bg-slate-50 border-y border-slate-200 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">How Fixvo Works</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Seamless doorstep repairs in 4 easy steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            {[
              { num: '01', title: 'Select Service', desc: 'Choose your repair or maintenance category and describe the issue.' },
              { num: '02', title: 'Lightning Match', desc: 'We assign a verified nearby specialist within 30 minutes.' },
              { num: '03', title: 'Inspection & Quote', desc: 'Technician arrives, inspects on-site, and provides a clear digital quote.' },
              { num: '04', title: 'Work & Payment', desc: 'Approve quote, work completes, and pay securely via cash, UPI, or card.' }
            ].map((step, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3">
                <span className="text-2xl font-black text-blue-600">{step.num}</span>
                <h3 className="font-extrabold text-base text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE FIXVO */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
              <Award size={14} /> Trust & Safety Standard
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for Safety, Transparency, and Quality
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Fixvo connects households with background-checked local repair specialists. Every service is backed by our 30-day warranty and upfront digital estimation guarantee.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { title: "Police & Aadhaar Verified", desc: "Every technician passes mandatory identity and criminal background checks." },
                { title: "Upfront Fixed Quotes", desc: "No surprise charges after work starts. You approve quotes before work begins." },
                { title: "30-Day Service Warranty", desc: "Free re-inspection if the same issue recurs within 30 days of completion." }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 text-blue-600 rounded-full mt-0.5">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 text-center shadow-xs">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <PhoneCall size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">24/7 Customer Emergency Helpline</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Facing an urgent electrical or plumbing emergency? We are on call.</p>
            </div>
            <a
              href="tel:+919515980170"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl uppercase tracking-wider no-underline shadow-md cursor-pointer"
            >
              <span>Call +91 95159 80170</span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-400">
                <img src={fixvoLogo} alt="Fixvo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-xl text-white tracking-tight">Fixvo</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Instant doorstep repair and home maintenance platform serving Madanapalle, Kadiri, Rayachoty, and surrounding regions.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium list-none p-0">
              <li><Link to="/about" className="hover:text-white transition-colors no-underline text-slate-400">About Us</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors no-underline text-slate-400">All Services</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors no-underline text-slate-400">Contact Support</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors no-underline text-slate-400">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-4">Legal Policy</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium list-none p-0">
              <li><Link to="/privacy" className="hover:text-white transition-colors no-underline text-slate-400">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors no-underline text-slate-400">Terms of Service</Link></li>
              <li><Link to="/refund" className="hover:text-white transition-colors no-underline text-slate-400">Refund Policy</Link></li>
              <li><Link to="/technician-agreement" className="hover:text-white transition-colors no-underline text-slate-400">Partner Agreement</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider mb-4">Connect</h4>
            <p className="text-xs text-slate-400 font-medium mb-3">Support email: support@fixvo.com</p>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><FaInstagram size={18} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><FaLinkedin size={18} /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><FaXTwitter size={18} /></a>
              <a href="https://wa.me/9515980170" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><FaWhatsapp size={18} /></a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Fixvo Technologies. All rights reserved.</p>
          <p>Made with precision for Home Services.</p>
        </div>
      </footer>

      {/* Modals */}
      <OpenAppModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (postAuthAction) postAuthAction();
          }}
        />
      )}
    </div>
  );
};

export default Home;
