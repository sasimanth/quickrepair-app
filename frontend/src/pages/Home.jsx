import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { globalCategories, globalServices, getDbServices } from '../data/services';
import SmartDiagnosis from '../components/SmartDiagnosis/SmartDiagnosis';
import NearbyTechnicians from '../components/NearbyTechnicians';
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
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop",
    gradient: "from-blue-600/90 to-indigo-700/90",
  },
  installation: {
    img: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=400&auto=format&fit=crop",
    gradient: "from-indigo-600/90 to-purple-700/90",
  },
  cleaning: {
    img: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop",
    gradient: "from-cyan-600/90 to-blue-700/90",
  },
  other: {
    img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop",
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

  // Initialize and simulate skeleton screen
  useEffect(() => {
    getDbServices().then((dbServices) => {
      setServices(dbServices);
      setTimeout(() => setLoading(false), 800);
    });
  }, []);

  // Scroll logic for #pricing hash anchor
  useEffect(() => {
    if (location.hash === '#pricing') {
      setHighlightPricing(true);
      const timer = setTimeout(() => {
        setHighlightPricing(false);
      }, 3500);
      return () => clearTimeout(timer);
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
      <div className="relative group/carousel py-8 border-b border-white/5 last:border-0">
        <div className="flex justify-between items-end mb-6 px-4 md:px-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {title}
            </h3>
            {subtitle && <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-1">{subtitle}</p>}
          </div>
          
          <div className="hidden sm:flex gap-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <button 
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <ChevronRight className="rotate-180 w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory scroll-smooth hide-scrollbar px-4 md:px-0"
        >
          {items.map((service, idx) => {
            const details = serviceDetails[service.id] || {};
            const rating = details.rating || 4.8;
            const jobs = details.jobs || 150;
            const price = details.price || "₹99";
            const subtitleText = details.subtitle || "Expert service on demand";
            const popular = details.popular || false;
            const Icon = service.icon || Sparkles;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group/card shrink-0 snap-start bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-blue-500/40 rounded-[2rem] overflow-hidden flex flex-col justify-between w-[290px] h-[370px] transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative"
              >
                {popular && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-20 shadow-md">
                    Popular
                  </div>
                )}
                
                <div className="relative h-[150px] overflow-hidden shrink-0">
                  <img 
                    src={service.img} 
                    alt={service.name} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black text-cyan-400 border border-white/5">
                    Starting {price}
                  </div>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Icon size={16} />
                      </div>
                      <h4 className="font-extrabold text-sm text-white group-hover/card:text-blue-400 transition truncate max-w-[180px]">{service.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {subtitleText}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-semibold">
                      <span className="flex items-center text-amber-400">
                        <Star size={12} className="fill-current mr-0.5" />
                        {rating}
                      </span>
                      <span>•</span>
                      <span>{jobs} completed jobs</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(service.id);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-lg active:scale-95 border-none"
                    >
                      Quick Book
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const getServicesByIds = (ids) => {
    return ids.map(id => services.find(s => s.id === id)).filter(Boolean);
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
    <div className="relative w-full min-h-screen bg-[#0B0F19] text-white overflow-x-hidden font-sans">
      {/* Dynamic Ambient Light Gradients */}
      <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[50%] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[15%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. CUSTOM PREMIUM STICKY HEADER WITH QUICK LINKS */}
      <div className="sticky top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="relative pointer-events-auto bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-[2rem] w-full max-w-5xl transition-all duration-500">
          <div className="px-4 sm:px-6">
            <div className="flex justify-between items-center h-16 sm:h-20">
              
              {/* Logo & Brand */}
              <div className="flex items-center gap-6">
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/30 rounded-full overflow-hidden">
                    <img src={fixvoLogo} alt="Fixvo Logo" className="w-full h-full object-cover scale-110" />
                  </div>
                  <span className="font-black text-xl sm:text-2xl tracking-tight text-blue-500 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600">
                    Fixvo
                  </span>
                </Link>
              </div>

              {/* Profile, Auth & Notifications */}
              <div className="flex items-center gap-2 sm:gap-3">

                {user ? (
                  <>
                    <NotificationsBell />

                    <div ref={profileRef} className="relative ml-1">
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg border border-white/20 transition active:scale-95 cursor-pointer uppercase text-xs"
                      >
                        {name ? name[0] : 'U'}
                      </button>
                      {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-[#101524]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="border-b border-white/10 pb-3 mb-3">
                            <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">{name?.split('@')[0]}</h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {user?.isPremium && (
                                <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-500 text-[#0B0F19] text-[8px] font-black rounded uppercase tracking-wider shadow-sm">
                                  Plus
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[8px] font-black rounded uppercase tracking-wider">
                                {role}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Link
                              to={getDashboardLink()}
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
                            >
                              <LayoutDashboard size={14} />
                              <span>Dashboard</span>
                            </Link>
                            <button
                              onClick={() => {
                                setIsProfileMenuOpen(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left cursor-pointer border-none bg-transparent"
                            >
                              <LogOut size={14} />
                              <span>Log Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="text-slate-400 hover:text-white font-bold transition-colors px-2 py-1.5 text-[11px] sm:px-3 sm:py-2 sm:text-xs"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-[11px] sm:px-4 sm:py-2.5 sm:text-xs font-black shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      Join Fixvo
                    </Link>
                  </>
                )}
              </div>

            </div>
          </div>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24 relative z-10">
        
        {/* 2. HERO & SMART SEARCH BAR SECTION (Fixipy Benchmark) */}
        <section className="pt-24 sm:pt-28 md:pt-32 pb-16 text-center max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm text-xs font-black uppercase tracking-widest text-blue-400">
              <Zap size={13} className="text-amber-400 fill-current" />
              <span>⚡ 30-Minute Dispatch Guarantee • Madanapalle & Region</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]">
              Instant Doorstep Repairs & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400">
                Certified Home Care.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
              Book background-checked local technicians for AC, appliance, plumbing, and deep home cleaning with fixed upfront quotes and zero hidden fees.
            </p>

            {/* 4 Trust Pills (Fixvo Unique) */}
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                <ShieldCheck size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Certified Technicians</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                <Clock size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">30-Min Dispatch</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                <Star size={14} className="text-amber-400 fill-current" />
                <span className="text-xs font-bold text-slate-200">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Upfront Digital Quotes</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleBookingClick('')}
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-full shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer border-none"
              >
                <span>Book a Service</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
              
              <button
                onClick={() => setIsAppModalOpen(true)}
                className="px-6 py-3 bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs sm:text-sm rounded-full shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer border-none"
              >
                <Smartphone size={15} className="text-sky-600" />
                <span>Open App</span>
              </button>
            </div>

            {/* Premium Smart Search Container */}
            <div ref={heroSearchRef} className="relative max-w-2xl mx-auto pt-4">
              <div className="relative flex items-center bg-white/[0.03] border border-white/10 focus-within:border-blue-500/50 hover:border-white/20 rounded-2xl p-1 transition shadow-xl backdrop-blur-md">
                <Search className="text-slate-500 w-5 h-5 ml-4 shrink-0" />
                <input 
                  type="text"
                  placeholder="Search Repair, Installation, Cleaning or Home Services..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 pl-3 pr-4 py-3 text-white text-xs sm:text-sm font-semibold outline-none focus:ring-0 placeholder:text-slate-500"
                />
                
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="p-2 text-slate-400 hover:text-white rounded-lg transition mr-1 cursor-pointer border-none bg-transparent"
                  >
                    <X size={16} />
                  </button>
                )}

                <button 
                  onClick={handleVoiceSearch}
                  className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 rounded-xl transition cursor-pointer mr-1"
                  title="Voice Search"
                >
                  <Mic size={16} />
                </button>
              </div>

              {/* Suggestions Panel */}
              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 mt-3 bg-[#101524]/98 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-40 text-left overflow-hidden max-h-[420px] overflow-y-auto"
                  >
                    
                    {/* Empty Query: Show History & Popular tags */}
                    {!searchQuery.trim() && (
                      <div className="space-y-5">
                        {searchHistory.length > 0 && (
                          <div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                              <span className="flex items-center gap-1"><History size={11} /> Search History</span>
                              <button onClick={clearHistory} className="hover:text-white cursor-pointer bg-transparent border-0">Clear All</button>
                            </div>
                            <div className="space-y-1">
                              {searchHistory.map((item, i) => (
                                <div 
                                  key={i} 
                                  onClick={() => handleSearchSelect(item, 'service', services.find(s => s.name === item)?.id || '')}
                                  className="flex justify-between items-center px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer text-xs font-semibold"
                                >
                                  <span>{item}</span>
                                  <button 
                                    onClick={(e) => removeHistoryItem(e, item)}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer border-none bg-transparent"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-2">
                            <Sparkles size={11} className="text-cyan-400" /> Popular Searches
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {["AC Repair", "Washing Machine Repair", "Bathroom Deep Cleaning", "Electrician", "RO Installation"].map((pop, i) => (
                              <button
                                key={i}
                                onClick={() => handleSearchSelect(pop, 'service', services.find(s => s.name.toLowerCase() === pop.toLowerCase())?.id || '')}
                                className="px-3.5 py-1.5 bg-white/5 border border-white/5 hover:border-blue-500/20 text-slate-300 hover:text-white hover:bg-blue-600/10 text-xs font-bold rounded-full transition cursor-pointer"
                              >
                                {pop}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Autocomplete active suggestion categories */}
                    {searchQuery.trim() && (
                      <div className="space-y-4">
                        {hasSuggestions ? (
                          <>
                            {suggestions.services.length > 0 && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Services</p>
                                <div className="space-y-0.5">
                                  {suggestions.services.map(s => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleSearchSelect(s.name, 'service', s.id)}
                                      className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 flex items-center justify-between text-xs font-bold transition cursor-pointer border-none bg-transparent"
                                    >
                                      <span>{s.name}</span>
                                      <span className="text-[10px] font-black text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-wide">Starting {s.price}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {suggestions.categories.length > 0 && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Categories</p>
                                <div className="space-y-0.5">
                                  {suggestions.categories.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => handleSearchSelect(c.name, 'category', c.id)}
                                      className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 text-xs font-bold transition cursor-pointer border-none bg-transparent"
                                    >
                                      <Sparkles size={12} className="text-indigo-400" />
                                      <span>{c.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-500 font-semibold italic">
                            No matching services or categories found for "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Service Promise Cards & App Live Preview (Fixvo Unique) */}
            <div className="grid gap-4 sm:grid-cols-2 pt-6 text-left">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fixvo Guarantee</p>
                    <p className="text-sm font-extrabold text-white">Upfront digital estimates. Police-verified fixers.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                    <MapPin size={20} />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Active Coverage</p>
                    <p className="text-sm font-extrabold text-white">Madanapalle, Kadiri, Rayachoty, Galiveedu & region.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Smartphone Live Preview Container */}
            <div className="relative pt-8">
              <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl relative overflow-hidden max-w-lg mx-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    app.fixvo.com
                  </span>
                </div>

                <div className="rounded-2xl bg-[#0B0F19] p-4 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <img src={fixvoLogo} className="w-full h-full object-cover rounded-full" alt="Fixvo" />
                      </div>
                      <span className="font-extrabold text-sm text-white">Fixvo App Preview</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 p-3 border border-white/10 text-left">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Instant Broadcast</p>
                    <p className="text-xs font-bold text-white mt-0.5">Need a repair? Broadcast request to nearby fixers.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. CATEGORY GRID */}
        <section className="mt-8 mb-16 px-4 md:px-0">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Explore Categories</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">Select a category to quickly discover available home maintenance solutions.</p>
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
                  className="relative h-32 sm:h-40 rounded-[2rem] overflow-hidden group border border-white/5 hover:border-blue-500/30 transition-all duration-300 text-left shadow-lg cursor-pointer w-full bg-transparent"
                >
                  <img 
                    src={visual.img} 
                    alt={cat.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-80 group-hover:opacity-85 transition-opacity`}></div>
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-sm">
                      <CatIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">{cat.name}</h4>
                      <p className="text-[10px] text-slate-200 mt-0.5 line-clamp-1">{cat.desc}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 4. HORIZONTAL SERVICE CAROUSELS SECTION */}
        <section id="services" className="space-y-12">
          
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
        <section id="emergency-section" className="mt-16 md:mt-24 relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0D1322] to-slate-950 border border-indigo-500/20 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3">
                <span>🌙</span> 24×7 Day & Night Services
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Emergency Repairs Anytime, Anywhere</h2>
              <p className="text-slate-400 text-sm mt-1">Whether it's midnight or a Sunday holiday, verified Fixvo technicians are on call.</p>
            </div>
            <a 
              href="tel:+919515980170" 
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2 no-underline"
            >
              <PhoneCall size={16} /> 24/7 Helpline: +91 95159 80170
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
              <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-36 hover:bg-white/[0.05] transition duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">{item.badge}</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white leading-snug">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. WHY FIXVO EXCELS */}
        <section id="why-fixvo" className="mt-16 md:mt-24 bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-10 mx-4 sm:mx-0">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-cyan-400 w-6 h-6 animate-pulse" /> Why Fixvo Excels
            </h2>
            <p className="text-slate-400 text-sm mt-1">Our platform standards ensure you get professional, trustworthy repair and installation solutions.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { id: 'emergency', label: "24×7 Support", value: "Instant Emergency Response", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { id: 'tracking', label: "Live Tracking", value: "Real-time Technician ETA", icon: MapPin, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { id: 'payments', label: "Digital Payments", value: "100% Secure Checkout", icon: Banknote, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
              { id: 'techs', label: "Verified Professionals", value: "Background & Police Checked", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { id: 'sameday', label: "Same Day Service", value: "30-Min Dispatch Guarantee", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { id: 'pricing', label: "Transparent Pricing", value: "Upfront Quotes & No Hidden Fees", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            ].map((stat) => (
              <div 
                key={stat.id}
                className="p-6 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/30 rounded-[2rem] flex flex-col justify-between gap-4 transition duration-300 shadow-md"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-sm font-extrabold text-white mt-1 leading-snug">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. TRUST & TRANSPARENCY SECTION */}
        <section className="mt-16 md:mt-24 border-t border-white/5 pt-16 md:pt-24 px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Elevating the home service industry.</h2>
              <div className="space-y-6 sm:space-y-8 mt-8 sm:mt-10">
                {[
                  { title: "No Hidden Prices", desc: "Standard inspection fee of ₹99. We show an estimated range upfront. The technician must enter the exact quote in-app before starting, and wait for your one-click approval.", icon: Banknote, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { title: "Quality Backed by Data", desc: "See technician skill scores. We track success rates, repeat bookings, and require before/after photo proof for high-priced jobs.", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { title: "30-Minute Arrival Guarantee", desc: "Water leaking? AC dead in summer? Select our premium emergency option and we guarantee a verified technician at your door within 30 minutes.", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-[#101524] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <h3 className="font-bold text-base sm:text-lg text-white">Smart AC Diagnostics</h3>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] sm:text-xs font-bold">Inspection Completed</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-white/10" alt="Tech" />
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Amit Verma</h4>
                    <p className="text-[11px] text-indigo-400 font-bold">Senior HVAC Specialist</p>
                    <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-400 gap-2 mt-1">
                       <span className="flex items-center text-amber-400"><Star size={14} className="fill-current mr-1"/> 4.9</span>
                       <span>• 512 Jobs</span>
                       <span className="flex items-center text-emerald-400"><ShieldCheck size={14} className="mr-1"/> Verified</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0b0f19] rounded-xl p-4 mb-6 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-wider">Diagnosed Issue:</p>
                    <p className="font-semibold text-slate-200 text-sm mt-0.5">AC Starter Capacitor failed. Condenser unable to start. Requires swap.</p>
                  </div>
                  
                  <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs text-slate-400">
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

        {/* Available Technicians Nearby Discovery Section */}
        <NearbyTechnicians />

        {/* AI Diagnosis Section */}
        <div className="mt-24 sm:mt-32 relative z-10 px-4 sm:px-0">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">AI Smart Diagnosis</h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Not sure what the exact problem is? Answer a few quick questions to identify the issue and get an estimated cost instantly.</p>
          </div>
          <SmartDiagnosis onOpenAuth={(redirectUrl) => {
            setPostAuthAction(() => () => navigate(redirectUrl));
            setShowAuthModal(true);
          }} />
        </div>

        {/* 8. CUSTOMER SUCCESS & SERVICE STATISTICS SECTION */}
        <section className="mt-24 sm:mt-32 border-t border-white/5 pt-24 sm:pt-32 px-4 sm:px-0">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
              <Star size={12} className="fill-current text-amber-400" /> Trusted by 10,000+ Households
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Customer Success Stories</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Read how Fixvo delivers transparent, 30-minute doorstep service to homeowners.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { stat: "12,400+", label: "Completed Repairs", icon: CheckCircle2, color: "text-emerald-400" },
              { stat: "4.9 / 5.0", label: "Average Customer Rating", icon: Star, color: "text-amber-400" },
              { stat: "30 Mins", label: "Guaranteed Dispatch", icon: Clock, color: "text-cyan-400" },
              { stat: "100%", label: "Verified Technicians", icon: ShieldCheck, color: "text-indigo-400" }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#101524]/60 border border-white/10 rounded-2xl p-5 text-center">
                <div className={`w-8 h-8 rounded-full bg-white/5 mx-auto mb-2 flex items-center justify-center ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">{item.stat}</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                quote: "Fixvo technician Rahul arrived in 25 minutes on a Sunday night when our main AC failed. Quick diagnosis, genuine parts, and transparent quote. Lifesaver!",
                author: "Priya Sharma",
                area: "Madanapalle Town",
                rating: 5,
                service: "AC Deep Repair"
              },
              {
                quote: "Got our RO water filter installed and tested in under an hour. The digital quote required my one-tap approval before work started. Very trustworthy!",
                author: "K. Mohan Rao",
                area: "Kadiri Area",
                rating: 5,
                service: "RO Filter Setup"
              }
            ].map((story, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="bg-gradient-to-b from-[#101524]/90 to-[#0B0F19] border border-white/10 rounded-[2rem] p-6 shadow-xl relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex text-amber-400 text-xs">
                      {[...Array(story.rating)].map((_, r) => (
                        <Star key={r} size={14} className="fill-current mr-0.5" />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{story.service}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium italic">"{story.quote}"</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-xs text-white">{story.author}</h5>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={10} className="text-blue-400" /> {story.area}</p>
                  </div>
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Verified Customer</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Urgent Repair dispatch Call block */}
        <div className="mt-24 sm:mt-32 relative z-10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 border border-white/10 text-center mx-4 sm:mx-0">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
            <Zap size={32} />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Urgent Repair Needed?</h2>
          <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl mx-auto">Skip the booking form and call us directly for an instant technician dispatch. We prioritize emergencies.</p>
          <a href="tel:+919515980170" className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 transition-transform no-underline">
            <PhoneCall size={22} /> 
            <span className="hidden sm:inline">Call Now:</span> +91 95159 80170
          </a>
        </div>

        {/* Fixvo Plus Member section */}
        <div id="pricing" className="mt-24 sm:mt-32 border-t border-white/5 pt-24 sm:pt-32 px-4 sm:px-0">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 mb-4 inline-flex items-center gap-3"><Sparkles className="text-amber-400 w-8 h-8 md:w-10 md:h-10"/> Fixvo Plus</h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Upgrade to our premium membership for an unparalleled home service experience.</p>
          </div>
          
          <div className={`max-w-4xl mx-auto bg-gradient-to-br from-[#1A2235] to-[#0B0F19] border-2 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-14 relative overflow-hidden group transition-all duration-1000 ${
            highlightPricing 
              ? 'border-amber-400 scale-[1.03] shadow-[0_0_60px_rgba(245,158,11,0.4)] ring-4 ring-amber-500/20' 
              : 'border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)]'
          }`}>
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
               <div className="flex-1 space-y-6 sm:space-y-8 relative z-10 w-full text-left">
                 <div className="flex items-start gap-4">
                   <div className="mt-1 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30"><Clock size={18}/></div>
                   <div>
                     <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Priority Technician Dispatch</h4>
                     <p className="text-sm sm:text-base text-slate-400">Skip the queue. Your bookings are instantly routed to the highest-rated technicians nearby.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="mt-1 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30"><Banknote size={18}/></div>
                   <div>
                     <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Zero Inspection Fees</h4>
                     <p className="text-sm sm:text-base text-slate-400">Never pay the standard ₹99 inspection fee. Diagnosis is completely free for members.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="mt-1 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30"><CheckCircle2 size={18}/></div>
                   <div>
                     <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Exclusive 5% Discount</h4>
                     <p className="text-sm sm:text-base text-slate-400">Automatically save 5% on all repair quotes, parts, and maintenance services.</p>
                   </div>
                 </div>
               </div>
               
               <div className="w-full md:w-[320px] shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center relative z-10 shadow-2xl">
                 <div className="inline-flex items-center justify-center px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6">Premium Tier</div>
                 <h3 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">₹999<span className="text-sm sm:text-lg text-slate-500 font-medium tracking-normal">/yr</span></h3>
                 <p className="text-xs sm:text-sm text-slate-400 mb-8 font-medium">Billed annually. Cancel anytime.</p>
                 <button 
                   onClick={() => handleBookingClick()}
                   className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0B0F19] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base cursor-pointer border-none"
                 >
                   Get Fixvo Plus
                 </button>
               </div>
            </div>
          </div>
        </div>
        
        {/* Founder profile presentation card */}
        <div className="mt-24 sm:mt-32 border-t border-white/5 pt-24 sm:pt-32 px-4 sm:px-0">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Meet the Founder</h2>
            <div className="w-16 sm:w-20 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 lg:gap-20 max-w-5xl mx-auto bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-[2.5rem] p-8 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 shrink-0 mx-auto md:mx-0">
              <div className="relative group p-2">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#0B0F19] shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-[#0B0F19]">
                  <img 
                    src={founderImg} 
                    alt="G. Sasimanth Reddy" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              </div>
            </div>
            
            <div className="relative z-10 text-center md:text-left flex-1">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">G. Sasimanth Reddy</h3>
              <p className="text-indigo-400 font-bold mb-6 sm:mb-8 flex items-center justify-center md:justify-start gap-2 text-sm sm:text-base lg:text-lg uppercase tracking-wide">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></span>
                Founder & CEO
              </p>
              
              <div className="relative mb-8 sm:mb-10">
                <span className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 text-5xl sm:text-7xl text-white/5 font-serif select-none pointer-events-none">"</span>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 leading-relaxed relative z-10 font-medium">
                  G. Sasimanth Reddy is the Founder & CEO of Fixvo, focused on building a reliable and transparent platform that connects customers with verified service professionals. With a vision to simplify everyday service needs, Fixvo aims to deliver fast, trustworthy, and hassle-free solutions for modern households.
                </p>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4">
                {[
                  { icon: FaLinkedin, link: "https://www.linkedin.com/in/gsasimanthreddy", hover: "hover:bg-[#0077b5] hover:border-[#0077b5] hover:shadow-[#0077b5]/50" },
                  { icon: FaInstagram, link: "https://www.instagram.com/sasimanth_9515?igsh=NXZ5amZxaDlkeGxy", hover: "hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:border-pink-500 hover:shadow-pink-500/50" },
                  { icon: FaXTwitter, link: "https://x.com/sasimanth_9515", hover: "hover:bg-black hover:border-white/30" },
                  { icon: FaWhatsapp, link: "https://wa.me/9515980170", hover: "hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-emerald-500/50" }
                ].map((social, i) => (
                  <a key={i} href={social.link} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white ${social.hover} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-110`}>
                    <social.icon className="text-lg sm:text-xl" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 9. TRUST & VERIFICATION METRICS GRID (Fixipy Benchmark) */}
        {/* 9. TRUST & VERIFICATION METRICS GRID (Fixvo Unique) */}
        <section className="mt-24 sm:mt-32 border-t border-white/5 pt-20 px-4 sm:px-0">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 mb-3">
              The Fixvo Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Built on Speed, Transparency, and Local Trust.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
              We optimize every single dispatch to get a background-checked technician to your door in 30 minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] transition">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Repairs Done</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">12,400+</p>
              <p className="text-xs font-bold text-slate-400 mt-2">Doorstep jobs delivered</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] transition">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">User Score</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">4.9 / 5</p>
              <p className="text-xs font-bold text-slate-400 mt-2">Average customer rating</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] transition">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Local Pros</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">150+</p>
              <p className="text-xs font-bold text-slate-400 mt-2">Verified fixers in region</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center hover:bg-white/[0.04] transition">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Arrival Time</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">30 Mins</p>
              <p className="text-xs font-bold text-slate-400 mt-2">Guaranteed dispatch window</p>
            </div>
          </div>
        </section>

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

