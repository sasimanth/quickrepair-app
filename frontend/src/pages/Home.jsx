import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { globalCategories, globalServices, getDbServices } from '../data/services';
import OpenAppModal from '../components/OpenAppModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Droplets, 
  Wind, 
  Clock, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  ChevronRight, 
  MessageCircle,
  PhoneCall,
  Camera,
  Banknote,
  Search,
  Sparkles,
  MapPin,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  UserCircle2,
  Mic,
  History,
  Check,
  X,
  Cpu,
  Globe,
  Bell,
  ArrowRight,
  Smartphone,
  ArrowUpRight,
  Wallet,
  Building2,
  Award
} from 'lucide-react';
import { FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp, FaApple, FaGooglePlay } from 'react-icons/fa6';
import founderImg from '../assets/sasi_founder.jpeg';
import fixvoLogo from '../assets/logos/fixvo-app-icon-dark.png';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import NotificationsBell from '../components/NotificationsBell';


// Mapping details to enrich services cards
const serviceDetails = {
  ac_repair: { subtitle: "Fast cooling & leak repairs", price: "₹299", rating: 4.9, jobs: 1240, popular: true },
  washing_machine: { subtitle: "Fix spin, drum & drainage", price: "₹199", rating: 4.8, jobs: 890, popular: false },
  refrigerator: { subtitle: "Compressor & gas refilling", price: "₹249", rating: 4.7, jobs: 620, popular: false },
  microwave: { subtitle: "Magnetron & heating repair", price: "₹199", rating: 4.6, jobs: 340, popular: false },
  tv_repair: { subtitle: "Screen & backlight issues", price: "₹349", rating: 4.7, jobs: 510, popular: false },
  laptop_repair: { subtitle: "OS install, RAM & hardware fixes", price: "₹399", rating: 4.8, jobs: 420, popular: false },
  mobile_repair: { subtitle: "Screen, battery & charging port", price: "₹149", rating: 4.9, jobs: 2110, popular: true },
  ac_install: { subtitle: "Split & window AC setup", price: "₹599", rating: 4.8, jobs: 410, popular: false },
  cctv_install: { subtitle: "Setup security cameras & DVR", price: "₹499", rating: 4.7, jobs: 180, popular: false },
  ro_install: { subtitle: "Filter swap & water purifier setup", price: "₹299", rating: 4.9, jobs: 650, popular: true },
  inverter_install: { subtitle: "Home power backup setup", price: "₹499", rating: 4.8, jobs: 230, popular: false },
  fan_install: { subtitle: "Ceiling & wall fan mounting", price: "₹99", rating: 4.7, jobs: 1100, popular: false },
  lock_install: { subtitle: "Secure door lock replacement", price: "₹149", rating: 4.8, jobs: 340, popular: false },
  furniture: { subtitle: "Bed, wardrobe & desk assembly", price: "₹399", rating: 4.9, jobs: 310, popular: false },
  sofa_clean: { subtitle: "Deep vacuum & shampoo clean", price: "₹299", rating: 4.8, jobs: 730, popular: false },
  bathroom_clean: { subtitle: "Acid cleaning & disinfection", price: "₹199", rating: 4.9, jobs: 1250, popular: true },
  water_tank_clean: { subtitle: "Hygienic tank sanitation", price: "₹499", rating: 4.7, jobs: 280, popular: false },
  carpet_clean: { subtitle: "Remove dust & stains", price: "₹199", rating: 4.8, jobs: 410, popular: false },
  kitchen_clean: { subtitle: "Degrease tiles, chimney & slabs", price: "₹599", rating: 4.9, jobs: 680, popular: false },
  home_clean: { subtitle: "Full house deep scrubbing", price: "₹1499", rating: 4.9, jobs: 940, popular: true },
  pest_control: { subtitle: "Cockroach, bedbug & termite spray", price: "₹499", rating: 4.8, jobs: 820, popular: false },
  electric_wiring: { subtitle: "Short circuit & rewiring work", price: "₹999", rating: 4.9, jobs: 540, popular: false },
  plumbing_work: { subtitle: "Leakages, blockages & fittings", price: "₹99", rating: 4.8, jobs: 1670, popular: true },
  furniture_repair: { subtitle: "Wood repairs & hinges fixing", price: "₹149", rating: 4.7, jobs: 450, popular: false },
  painting: { subtitle: "Wall paint & touch-ups", price: "₹1999", rating: 4.8, jobs: 290, popular: false },
};

// Custom category presentation visuals
const categoryVisuals = {
  repair: {
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
    gradient: "from-blue-600/90 to-indigo-700/90",
  },
  installation: {
    img: "https://images.unsplash.com/photo-1631545856760-4966d5d59f13?q=80&w=600&auto=format&fit=crop",
    gradient: "from-indigo-600/90 to-purple-700/90",
  },
  cleaning: {
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
    gradient: "from-cyan-600/90 to-blue-700/90",
  },
  other: {
    img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop",
    gradient: "from-slate-700/90 to-slate-900/90",
  },
};

// Location-specific popular services mock data mapping
const locationPopularMap = {
  Madanapalle: ['ro_install', 'ac_repair', 'home_clean', 'plumbing_work'],
  Kadiri: ['mobile_repair', 'electric_wiring', 'sofa_clean', 'washing_machine'],
  Rayachoty: ['refrigerator', 'bathroom_clean', 'cctv_install', 'tv_repair'],
  Galiveedu: ['laptop_repair', 'furniture', 'pest_control', 'fan_install']
};

const LoadingSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-12 animate-pulse text-white">
    <div className="h-16 bg-white/5 border border-white/10 rounded-[2rem] w-full mb-12"></div>
    <div className="space-y-4 max-w-xl mx-auto text-center">
      <div className="h-4 bg-white/5 rounded-full w-24 mx-auto"></div>
      <div className="h-10 bg-white/5 rounded-2xl w-3/4 mx-auto"></div>
      <div className="h-14 bg-white/5 rounded-2xl w-full"></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-[2rem]"></div>
      ))}
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [postAuthAction, setPostAuthAction] = useState(null);
  const [highlightPricing, setHighlightPricing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(globalCategories[0].id);
  const [services, setServices] = useState(globalServices);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  // Custom Sticky Shell elements state
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem('fixvo_selected_location') || 'Madanapalle';
  });
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('fixvo_app_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fixvo_search_history')) || [];
    } catch {
      return [];
    }
  });

  const locationRef = useRef(null);
  const profileRef = useRef(null);
  const topSearchRef = useRef(null);
  const heroSearchRef = useRef(null);

  const safeServices = Array.isArray(services) ? services : globalServices;

  // Initialize and simulate skeleton screen
  useEffect(() => {
    getDbServices()
      .then((dbServices) => {
        if (Array.isArray(dbServices) && dbServices.length > 0) {
          setServices(dbServices);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch DB services, falling back to static services:", err);
      })
      .finally(() => {
        setTimeout(() => setLoading(false), 800);
      });
  }, []);

  // Scroll logic for #pricing and #services hash anchor
  useEffect(() => {
    if (location.hash === '#pricing') {
      setHighlightPricing(true);
      const timer = setTimeout(() => {
        setHighlightPricing(false);
      }, 3500);
      return () => clearTimeout(timer);
    } else if (location.hash === '#services' || location.hash?.includes('-services')) {
      const targetId = location.hash.substring(1);
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [location.hash]);

  // Click outside listener for custom menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setIsLocationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
      const isInsideTopSearch = topSearchRef.current && topSearchRef.current.contains(e.target);
      const isInsideHeroSearch = heroSearchRef.current && heroSearchRef.current.contains(e.target);
      if (!isInsideTopSearch && !isInsideHeroSearch) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Standard user profiles
  let role = user?.user_metadata?.role || user?.app_metadata?.role || 'user';
  if (user?.email?.includes('+admin') || user?.email?.startsWith('admin')) role = 'admin';
  if (user?.email?.includes('+tech') || user?.email?.startsWith('tech')) role = 'technician';
  const name = user?.user_metadata?.name || user?.email;

  const handleBookingClick = (serviceId = '') => {
    const targetPath = `/dashboard?action=book${serviceId ? `&service=${serviceId}` : ''}`;
    if (user) {
      navigate(targetPath);
    } else {
      setPostAuthAction(() => () => navigate(targetPath));
      setShowAuthModal(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'technician') return '/technician-dashboard';
    return '/dashboard';
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Autocomplete Suggestions logic
  const getSuggestions = () => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedCategories = globalCategories.filter(c => 
      c.name.toLowerCase().includes(q)
    );

    const matchedServices = services
      .map(s => ({ ...s, ...(serviceDetails[s.id] || {}) }))
      .filter(s => s.name.toLowerCase().includes(q));

    const matchedAreas = ['Madanapalle', 'Kadiri', 'Rayachoty', 'Galiveedu'].filter(a =>
      a.toLowerCase().includes(q)
    );

    const mockTechs = [
      { id: 'tech_1', name: "Amit Verma", rating: "4.9", area: "Madanapalle" },
      { id: 'tech_2', name: "Suresh Kumar", rating: "4.8", area: "Kadiri" },
      { id: 'tech_3', name: "Rajesh Reddy", rating: "4.9", area: "Rayachoty" },
      { id: 'tech_4', name: "Kalyan Naidu", rating: "4.7", area: "Galiveedu" },
    ];
    const matchedTechs = mockTechs.filter(t => t.name.toLowerCase().includes(q));

    return {
      categories: matchedCategories,
      services: matchedServices,
      areas: matchedAreas,
      technicians: matchedTechs
    };
  };

  const suggestions = getSuggestions();
  const hasSuggestions = suggestions && (
    suggestions.categories.length > 0 ||
    suggestions.services.length > 0 ||
    suggestions.areas.length > 0 ||
    suggestions.technicians.length > 0
  );

  const handleSearchSelect = (query, type, valueId = '') => {
    let history = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(history);
    localStorage.setItem('fixvo_search_history', JSON.stringify(history));
    setIsSearchFocused(false);
    setSearchQuery('');

    if (type === 'service') {
      handleBookingClick(valueId);
    } else if (type === 'category') {
      setActiveCategory(valueId);
      scrollToSection('services');
    } else if (type === 'area') {
      setSelectedLocation(query);
      localStorage.setItem('fixvo_selected_location', query);
    } else if (type === 'technician') {
      handleBookingClick('mobile_repair');
    }
  };

  const removeHistoryItem = (e, queryToRemove) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== queryToRemove);
    setSearchHistory(updated);
    localStorage.setItem('fixvo_search_history', JSON.stringify(updated));
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.setItem('fixvo_search_history', JSON.stringify([]));
  };

  // Voice speech simulation & API execution
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setSearchQuery("AC Repair");
        setIsListening(false);
        setIsSearchFocused(true);
      }, 1800);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setSearchQuery(speechResult);
      setIsSearchFocused(true);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  // Horizontal Scrolling Service Carousel Sub-Component
  const ServiceCarousel = ({ title, subtitle, items }) => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth } = scrollRef.current;
        const scrollTo = direction === 'left' 
          ? scrollLeft - clientWidth * 0.75 
          : scrollLeft + clientWidth * 0.75;
        scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };

    if (!items || items.length === 0) return null;

    return (
      <div className="relative group/carousel py-2 sm:py-3 border-b border-slate-200/60 last:border-0">
        <div className="flex justify-between items-end mb-3 sm:mb-4 px-4 md:px-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h3>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          
          <div className="hidden sm:flex gap-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <button 
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronRight className="rotate-180 w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 sm:gap-5 pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar px-4 md:px-0"
        >
          {items.map((service, idx) => {
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => handleBookingClick(service.id)}
                className="group/card shrink-0 snap-start bg-white border border-slate-200/80 hover:border-blue-500 rounded-2xl overflow-hidden flex flex-col justify-between w-[220px] sm:w-[250px] cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 relative"
              >
                <div className="relative h-[185px] sm:h-[210px] w-full overflow-hidden">
                  <img 
                    src={service.img} 
                    alt={service.name} 
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop";
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60"></div>
                </div>

                <div className="p-3 sm:p-4 bg-white flex items-center justify-center border-t border-slate-100 min-h-[52px]">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 group-hover/card:text-blue-600 transition text-center line-clamp-2 leading-snug w-full">
                    {service.name}
                  </h4>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };



  const getServicesByIds = (ids) => {
    return ids.map(id => (safeServices || []).find(s => s && s.id === id)).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#0B0F19]">
        <LoadingSkeleton />
      </div>
    );
  }

  const popularNearYouIds = locationPopularMap[selectedLocation] || locationPopularMap.Madanapalle;

  return (
    <div className="relative w-full min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
      {/* Subtle Light Ambient Gradients */}
      <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[15%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 pb-24 relative z-10">
        
        {/* 2. HERO & SMART SEARCH BAR SECTION */}
        <section className="pt-24 sm:pt-28 md:pt-32 pb-14 text-center max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-black uppercase tracking-widest text-blue-700 shadow-sm">
              <Zap size={13} className="text-amber-500 fill-current" />
              <span>⚡ 30-Minute Dispatch Guarantee • Madanapalle & Region</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
              Instant Doorstep Repairs & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
                Certified Home Care.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              Book background-checked local technicians for AC, appliance, plumbing, and deep home cleaning with fixed upfront quotes and zero hidden fees.
            </p>

            {/* 4 Trust Pills */}
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
                <ShieldCheck size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Certified Technicians</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
                <Clock size={14} className="text-sky-600" />
                <span className="text-xs font-bold text-slate-700">30-Min Dispatch</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
                <Star size={14} className="text-amber-500 fill-current" />
                <span className="text-xs font-bold text-slate-700">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">Upfront Digital Quotes</span>
              </div>
            </div>

            {/* Service Promise Cards */}
            <div className="grid gap-4 sm:grid-cols-2 pt-6 text-left">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fixvo Guarantee</p>
                    <p className="text-sm font-extrabold text-slate-800">Upfront digital estimates. Police-verified fixers.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                    <MapPin size={20} />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Active Coverage</p>
                    <p className="text-sm font-extrabold text-slate-800">Madanapalle, Kadiri, Rayachoty, Galiveedu & region.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. HOW FIXVO WORKS IN 4 STEPS (Premium White Card Theme) */}
        <section className="my-12 py-10 px-6 sm:px-10 bg-white border border-slate-200/90 rounded-[2.5rem] shadow-xl text-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
            <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs uppercase tracking-widest border border-blue-200/80">
              Simple & Fast Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-3">How Fixvo Works in 4 Easy Steps</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-semibold">Get doorstep repairs and home services done hassle-free in minutes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              { step: "01", title: "Select Service", desc: "Choose from 25+ repair, installation, or cleaning services.", icon: "📱", badge: "bg-blue-50 text-blue-600 border-blue-100" },
              { step: "02", title: "Instant Match", desc: "Police-verified local fixer assigned & dispatched in 30 mins.", icon: "⚡", badge: "bg-amber-50 text-amber-600 border-amber-100" },
              { step: "03", title: "Upfront Quote", desc: "Approve the transparent in-app quote before any work starts.", icon: "📋", badge: "bg-purple-50 text-purple-600 border-purple-100" },
              { step: "04", title: "Pay & Warranty", desc: "Pay via online or cash after completion with 30-day warranty.", icon: "✨", badge: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 relative flex flex-col justify-between hover:bg-white hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Step {s.step}</span>
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl border ${s.badge}`}>
                    {s.icon}
                  </span>
                </div>
                <div className="my-4 text-left">
                  <h3 className="font-black text-lg text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.desc}</p>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(idx + 1) * 25}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CATEGORY GRID */}
        <section className="mt-8 mb-16 px-4 md:px-0">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">Explore Categories</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto font-medium">Select a category to quickly discover available home maintenance solutions.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {globalCategories.map((cat) => {
              const visual = categoryVisuals[cat.id] || categoryVisuals.other;
              const CatIcon = cat.icon || Sparkles;
              const sectionTargetId = cat.id === 'repair' ? 'repair-services' 
                : cat.id === 'installation' ? 'installation-services' 
                : cat.id === 'cleaning' ? 'cleaning-services' 
                : 'other-services';
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    scrollToSection(sectionTargetId);
                  }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative h-32 sm:h-40 rounded-[2rem] overflow-hidden group border border-slate-200 hover:border-blue-500/50 transition-all duration-300 text-left shadow-sm hover:shadow-lg cursor-pointer w-full bg-white"
                >
                  <img 
                    src={visual.img} 
                    alt={cat.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-80 group-hover:opacity-85 transition-opacity`}></div>
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm">
                      <CatIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">{cat.name}</h4>
                      <p className="text-[10px] text-slate-100 mt-0.5 line-clamp-1">{cat.desc}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>



        {/* 4. HORIZONTAL SERVICE CAROUSELS SECTION */}
        <section id="services" className="space-y-4 sm:space-y-6 mt-6 sm:mt-10">
          
          {/* Dynamic Carousel: Popular Near You */}
          <div id="most-booked-services">
            <ServiceCarousel 
              title="Most Booked Services"
              subtitle="The highest volume services requested by our community."
              items={getServicesByIds(popularNearYouIds)}
            />
          </div>

          {/* Carousel: Repair Services */}
          <div id="repair-services">
            <ServiceCarousel 
              title="Repair Services"
              subtitle="Fast, verified diagnostics and repairs for AC, TV, fridges & washing machines."
              items={getServicesByIds(['ac_repair', 'washing_machine', 'refrigerator', 'tv_repair', 'laptop_repair', 'mobile_repair'])}
            />
          </div>

          {/* Carousel: Installation Services */}
          <div id="installation-services">
            <ServiceCarousel 
              title="Installation Services"
              subtitle="Expert mounting, wiring setup, and appliance installation."
              items={getServicesByIds(['ac_install', 'cctv_install', 'ro_install', 'inverter_install', 'fan_install', 'lock_install'])}
            />
          </div>

          {/* Carousel: Cleaning Services */}
          <div id="cleaning-services">
            <ServiceCarousel 
              title="Cleaning Services"
              subtitle="Hygienic deep scrubbing, sanitization, and eco-friendly home care."
              items={getServicesByIds(['home_clean', 'kitchen_clean', 'bathroom_clean', 'sofa_clean', 'water_tank_clean', 'carpet_clean'])}
            />
          </div>

          {/* Carousel: Other Services */}
          <div id="other-services">
            <ServiceCarousel 
              title="Other Services"
              subtitle="Pest control, electrical rewiring, furniture assembly, and custom fixes."
              items={getServicesByIds(['pest_control', 'electric_wiring', 'plumbing_work', 'furniture_repair', 'painting'])}
            />
          </div>

        </section>

        {/* 5. DAY & NIGHT SERVICES PROMINENT SHOWCASE */}
        <section id="emergency-section" className="mt-16 md:mt-24 relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-white border border-blue-200 rounded-[2.5rem] p-6 sm:p-10 shadow-md text-slate-900">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-wider mb-3">
                <span>🌙</span> 24×7 Day & Night Services
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">Emergency Repairs Anytime, Anywhere</h2>
              <p className="text-slate-600 text-sm mt-1 font-medium">Whether it's midnight or a Sunday holiday, verified Fixvo technicians are on call.</p>
            </div>
            <a 
              href="tel:+919515980170" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition transform hover:-translate-y-0.5 flex items-center gap-2 no-underline"
            >
              <PhoneCall size={16} className="text-white" /> 24/7 Helpline: +91 95159 80170
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            {[
              { title: "Available Anytime", desc: "Round the clock booking", icon: Clock, badge: "24/7 Live" },
              { title: "Emergency Repairs", desc: "30-min urgent dispatch", icon: Zap, badge: "Fast Track" },
              { title: "Late Night Support", desc: "Night technician safety", icon: ShieldCheck, badge: "Verified" },
              { title: "Weekend Availability", desc: "Sat & Sun active slots", icon: CheckCircle2, badge: "No Extra Charge" },
              { title: "Holiday Service", desc: "Open 365 days a year", icon: Sparkles, badge: "Open Today" }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-36 hover:shadow-md transition duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">{item.badge}</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. WHY FIXVO EXCELS */}
        <section id="why-fixvo" className="mt-16 md:mt-24 bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="text-blue-600 w-6 h-6 animate-pulse" /> Why Fixvo Excels
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Our platform standards ensure you get professional, trustworthy repair and installation solutions.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { id: 'emergency', label: "24×7 Support", value: "Instant Emergency Response", icon: Zap, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              { id: 'tracking', label: "Live Tracking", value: "Real-time Technician ETA", icon: MapPin, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
              { id: 'payments', label: "Digital Payments", value: "100% Secure Checkout", icon: Banknote, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
              { id: 'techs', label: "Verified Professionals", value: "Background & Police Checked", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              { id: 'sameday', label: "Same Day Service", value: "30-Min Dispatch Guarantee", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
              { id: 'pricing', label: "Transparent Pricing", value: "Upfront Quotes & No Hidden Fees", icon: Star, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
            ].map((stat) => (
              <div 
                key={stat.id}
                className="p-6 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-[2rem] flex flex-col justify-between gap-4 transition duration-300 shadow-sm"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1 leading-snug">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. TRUST & TRANSPARENCY SECTION */}
        <section className="mt-16 md:mt-24 border-t border-slate-200/60 pt-16 md:pt-24 px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Elevating the home service industry.</h2>
              <div className="space-y-6 sm:space-y-8 mt-8 sm:mt-10">
                {[
                  { title: "No Hidden Prices", desc: "Standard inspection fee of ₹99. We show an estimated range upfront. The technician must enter the exact quote in-app before starting, and wait for your one-click approval.", icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
                  { title: "Quality Backed by Data", desc: "See technician skill scores. We track success rates, repeat bookings, and require before/after photo proof for high-priced jobs.", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { title: "30-Minute Arrival Guarantee", desc: "Water leaking? AC dead in summer? Select our premium emergency option and we guarantee a verified technician at your door within 30 minutes.", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-full ${item.bg} border border-slate-200 flex items-center justify-center ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative z-10 w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">Smart AC Diagnostics</h3>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] sm:text-xs font-bold border border-amber-200">Inspection Completed</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-slate-200" alt="Tech" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Amit Verma</h4>
                    <p className="text-[11px] text-blue-600 font-bold">Senior HVAC Specialist</p>
                    <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-500 gap-2 mt-1">
                       <span className="flex items-center text-amber-500"><Star size={14} className="fill-current mr-1"/> 4.9</span>
                       <span>• 512 Jobs</span>
                       <span className="flex items-center text-emerald-600"><ShieldCheck size={14} className="mr-1"/> Verified</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3 border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-wider">Diagnosed Issue:</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">AC Starter Capacitor failed. Condenser unable to start. Requires swap.</p>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Diagnostic Visit Fee:</span>
                      <span className="text-slate-300 font-semibold">₹0 <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 rounded ml-1 uppercase">Plus Benefit</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Replacement Part (Capacitor):</span>
                      <span className="text-slate-300 font-semibold">₹850</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor Charge:</span>
                      <span className="text-slate-300 font-semibold">₹250</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-white/10 pt-3">
                     <div>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fixed Total Invoice</p>
                       <p className="text-xl sm:text-2xl font-black text-white">₹1100</p>
                     </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleBookingClick('ac_repair')} 
                    type="button" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black py-3 text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all border-none cursor-pointer"
                  >
                    Approve & Start Work →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fixvo Plus Member section */}
        <div id="pricing" className="mt-24 sm:mt-32 border-t border-slate-200/80 pt-24 sm:pt-32 px-4 sm:px-0">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight inline-flex items-center gap-3">
              <Sparkles className="text-amber-500 w-8 h-8 md:w-10 md:h-10"/> Fixvo Plus Tiers
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
              Upgrade to our premier membership tiers for priority dispatch, zero inspection fees, and exclusive repair discounts.
            </p>
          </div>
          
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            highlightPricing ? 'scale-[1.02]' : ''
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Monthly Premier Tier Card */}
              <div className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between shadow-lg transition-all duration-300 text-slate-900 group">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="inline-flex items-center justify-center px-3.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                      Monthly Premier Tier
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Flexible Access</span>
                  </div>

                  <h3 className="text-4xl sm:text-5xl font-black text-slate-900 mb-1 tracking-tight">
                    ₹99<span className="text-base sm:text-lg text-slate-500 font-medium tracking-normal">/mo</span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Billed monthly. Cancel anytime.</p>

                  <ul className="space-y-4 text-xs sm:text-sm text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-start gap-3">
                      <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Priority Dispatch:</strong> Fast-track queue for nearby fixes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Banknote size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Zero Inspection Fee:</strong> Free diagnosis visit every month</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>5% Repair Discount:</strong> Instant savings on final quotes</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button 
                    onClick={() => handleBookingClick()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm cursor-pointer border-none"
                  >
                    Get Monthly Premier (₹99/mo)
                  </button>
                </div>
              </div>

              {/* Annual Premier Tier Card */}
              <div className="bg-white border-2 border-amber-400 hover:border-amber-500 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between shadow-xl text-slate-900 transition-all duration-300 group">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="inline-flex items-center justify-center px-3.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                      Annual Premier Tier
                    </span>
                    <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">Save 35% • Best Value</span>
                  </div>

                  <h3 className="text-4xl sm:text-5xl font-black text-slate-900 mb-1 tracking-tight">
                    ₹999<span className="text-base sm:text-lg text-slate-500 font-medium tracking-normal">/yr</span>
                  </h3>
                  <p className="text-xs text-amber-700 mb-6 font-semibold">Billed annually (effectively ₹83/mo). Cancel anytime.</p>

                  <ul className="space-y-4 text-xs sm:text-sm text-slate-700 border-t border-slate-100 pt-6">
                    <li className="flex items-start gap-3">
                      <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Top VIP Priority:</strong> Instant dispatch matching with 4.9★ fixers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Banknote size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Unlimited Zero Inspection Fees:</strong> Standard ₹99 fee waived all year</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>5% Flat Discount + Free Checkup:</strong> Maximum household savings</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <button 
                    onClick={() => handleBookingClick()}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-xl shadow-md transition-all text-sm cursor-pointer border-none"
                  >
                    Get Annual Premier (₹999/yr)
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Founder profile presentation card (White Theme High-Contrast) */}
        <div className="mt-16 sm:mt-24 border-t border-slate-200/80 pt-16 sm:pt-24 px-4 sm:px-0">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Meet the Founder</h2>
            <div className="w-16 sm:w-20 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16 max-w-5xl mx-auto bg-white border border-slate-200/90 rounded-[2.5rem] p-8 sm:p-10 md:p-14 shadow-xl relative overflow-hidden text-slate-900"
          >
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-50/60 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-50/60 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 shrink-0 mx-auto md:mx-0">
              <div className="relative group p-2">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                  <img 
                    src={founderImg} 
                    alt="G. Sasimanth Reddy" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
              </div>
            </div>
            
            <div className="relative z-10 text-center md:text-left flex-1">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-2 tracking-tight">G. Sasimanth Reddy</h3>
              <p className="text-blue-600 font-extrabold mb-5 sm:mb-6 flex items-center justify-center md:justify-start gap-2 text-sm sm:text-base uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Founder & CEO
              </p>
              
              <div className="relative mb-6 sm:mb-8">
                <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed relative z-10 font-medium">
                  G. Sasimanth Reddy is the Founder & CEO of Fixvo, focused on building a reliable and transparent platform that connects customers with verified service professionals. With a vision to simplify everyday service needs, Fixvo aims to deliver fast, trustworthy, and hassle-free solutions for modern households.
                </p>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4">
                {[
                  { icon: FaLinkedin, link: "https://www.linkedin.com/in/gsasimanthreddy", color: "hover:bg-[#0077b5] hover:text-white" },
                  { icon: FaInstagram, link: "https://www.instagram.com/sasimanth_9515?igsh=NXZ5amZxaDlkeGxy", color: "hover:bg-pink-600 hover:text-white" },
                  { icon: FaXTwitter, link: "https://x.com/sasimanth_9515", color: "hover:bg-black hover:text-white" },
                  { icon: FaWhatsapp, link: "https://wa.me/9515980170", color: "hover:bg-emerald-600 hover:text-white" }
                ].map((social, i) => (
                  <a key={i} href={social.link} target="_blank" rel="noopener noreferrer" className={`w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 ${social.color} transition-all duration-300 transform hover:-translate-y-1 shadow-xs`}>
                    <social.icon className="text-lg" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 10. GET STARTED & MOBILE ROLLOUT SECTION (Fixvo Unique) */}
        <section className="mt-24 sm:mt-32">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 p-8 sm:p-12 shadow-2xl">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <span className="inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 mb-4">
                  Fixvo Mobile App
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Your Home Repairs, Simplified on Mobile.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                  Request instant repairs, track technician arrival live on the map, and approve digital job estimates right from your phone.
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <button
                    onClick={() => setIsAppModalOpen(true)}
                    className="px-6 py-3.5 bg-white text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition cursor-pointer border-none flex items-center gap-2"
                  >
                    <Smartphone size={16} className="text-blue-600" />
                    <span>Open App</span>
                    <ArrowRight size={14} />
                  </button>
                  <Link
                    to="/technician-agreement"
                    className="px-6 py-3.5 bg-slate-800 text-white font-black text-xs sm:text-sm rounded-full border border-slate-700 hover:bg-slate-700 transition cursor-pointer no-underline"
                  >
                    Earn As A Fixer
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {/* Why Homeowners Choose Fixvo */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Why Homeowners Trust Fixvo</p>
                  <ul className="space-y-2 text-xs font-semibold text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>Upfront digital estimates approved before work begins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>Direct emergency helpline with 30-minute dispatch</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>100% background-checked and police-verified fixers</span>
                    </li>
                  </ul>
                </div>

                {/* Mobile App Download Rollout Cards */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Mobile Rollout</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-white">
                      <FaApple size={22} className="text-slate-200" />
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">iOS Web App</p>
                        <p className="text-xs font-bold text-white">App Store</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-white">
                      <FaGooglePlay size={20} className="text-emerald-400" />
                      <div>
                        <p className="text-[9px] font-black uppercase text-slate-400">Android APK</p>
                        <p className="text-xs font-bold text-white">Play Store</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. FINAL CONVERSION CTA BLOCK */}
        <div className="mt-24 sm:mt-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 lg:p-20 relative overflow-hidden shadow-2xl shadow-blue-900/20"
          >
            <div className="absolute top-0 right-0 p-8 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/50 rounded-full blur-[100px]"></div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 relative z-10">Stop guessing. Get it fixed.</h2>
            <p className="text-lg sm:text-xl text-blue-200/80 mb-8 sm:mb-10 max-w-2xl mx-auto relative z-10">
              Book now and get a <span className="text-white font-bold">100% Free Inspection</span> on your first booking.
            </p>
            <button
              onClick={() => handleBookingClick('')}
              className="inline-flex relative z-10 px-8 sm:px-10 py-4 sm:py-5 bg-white text-blue-900 font-extrabold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 items-center justify-center gap-2 w-full sm:w-auto border-none cursor-pointer outline-none font-sans"
            >
              <span className="text-lg sm:text-xl font-bold">Book Now in 10 Seconds</span>
            </button>
          </motion.div>
        </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (postAuthAction) postAuthAction();
          }}
        />
      )}

      {/* Voice Listening Overlay Modal */}
      {isListening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-[#101524] border border-white/10 p-8 rounded-3xl text-center space-y-6 max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <div className="relative flex justify-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 animate-pulse">
                <Mic size={32} />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-blue-500/10 rounded-full animate-ping mx-auto"></div>
            </div>
            <div>
              <h4 className="font-extrabold text-white text-lg">Listening...</h4>
              <p className="text-slate-400 text-xs mt-1">Speak the service name (e.g., AC Repair)</p>
            </div>
          </div>
        </div>
      )}

      {/* Open App Modal */}
      <OpenAppModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />

      {/* Unified App & Website Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (postAuthAction) {
              postAuthAction();
              setPostAuthAction(null);
            } else {
              navigate('/dashboard');
            }
          }}
        />
      )}

      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Home;

