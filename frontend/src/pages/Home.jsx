import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { globalCategories, globalServices, getDbServices } from '../data/services';
import SmartDiagnosis from '../components/SmartDiagnosis/SmartDiagnosis';
import { motion, AnimatePresence, useMotionValue, useAnimationFrame } from 'framer-motion';
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
  Camera,
  Banknote,
  Search,
  Sparkles
} from 'lucide-react';
import { FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import founderImg from '../assets/sasi_founder.jpeg';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [postAuthAction, setPostAuthAction] = useState(null);
  
  const handleBookingClick = (serviceId = '') => {
    const targetPath = `/dashboard?action=book${serviceId ? `&service=${serviceId}` : ''}`;
    if (user) {
      navigate(targetPath);
    } else {
      setPostAuthAction(() => () => navigate(targetPath));
      setShowAuthModal(true);
    }
  };
  const [activeCategory, setActiveCategory] = useState(globalCategories[0].id);
  const [services, setServices] = useState(globalServices);

  useEffect(() => {
    getDbServices().then(setServices);
  }, []);

  const marqueeX = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [wrapWidth, setWrapWidth] = useState(1032);

  useEffect(() => {
    const handleResize = () => {
      const cardWidth = window.innerWidth < 640 ? 324 : 344;
      setWrapWidth(cardWidth * 4);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useAnimationFrame(() => {
    let currentX = marqueeX.get();
    if (isHovered || isDragging) {
      if (currentX < -wrapWidth * 2) {
        marqueeX.set(currentX + wrapWidth);
      } else if (currentX > 0) {
        marqueeX.set(currentX - wrapWidth);
      }
      return;
    }
    
    currentX -= 0.8; // Butter-smooth slow scrolling marquee
    if (currentX <= -wrapWidth) {
      currentX += wrapWidth;
    }
    marqueeX.set(currentX);
  });

  return (
    <div className="relative w-full min-h-screen bg-[#0B0F19] text-white overflow-x-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[15%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-24 relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 space-y-6 lg:space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm select-none mx-auto lg:mx-0">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">10-Min Arrival Guarantee</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15]">
              Premium Home Services.<br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                On-Demand.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Experience hassle-free repairs, expert installations, and deep cleaning. Verified technicians, transparent upfront pricing, and a 60-minute arrival guarantee.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2 lg:pt-4 justify-center lg:justify-start w-full sm:w-auto">
              <button
                onClick={() => handleBookingClick()}
                className="group relative px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/30 hover:shadow-blue-600/40 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1 w-full sm:w-auto text-center border-none cursor-pointer outline-none font-sans"
              >
                <span className="relative z-10 text-lg">Book Service</span>
                <ChevronRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="tel:+919515980170"
                className="px-6 sm:px-8 py-4 bg-white/5 backdrop-blur-md text-white font-bold rounded-2xl border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <span>📞 Call Now</span>
              </a>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-8 border-t border-white/10 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                   <img key={i} src={`https://i.pravatar.cc/100?img=${i+40}`} alt="User" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#0B0F19] shadow-sm" />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400">
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <span className="text-white font-bold ml-2">4.9/5</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">From 10,000+ verified reviews</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2 relative mt-8 lg:mt-0"
          >
            {/* Main Image Grid / Collage */}
            <div className="relative rounded-[2rem] p-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-2 h-[350px] sm:h-[450px] md:h-[500px]">
                <img 
                  src="https://images.unsplash.com/photo-1621245645300-305f69e96f13?q=80&w=600&auto=format&fit=crop" 
                  alt="AC Repair" 
                  className="rounded-[1.5rem] w-full h-full object-cover col-span-1 row-span-2"
                />
                <img 
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop" 
                  alt="Electrician" 
                  className="rounded-[1.5rem] w-full h-full object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop" 
                  alt="Plumbing" 
                  className="rounded-[1.5rem] w-full h-full object-cover"
                />
              </div>
              
              {/* Floating UI Elements */}
              <div className="absolute top-4 sm:top-10 -left-2 sm:-left-6 bg-[#1A2235]/90 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 sm:gap-4 animate-[bounce_4s_infinite]">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <Banknote size={18} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Transparent</p>
                  <p className="font-extrabold text-white text-xs sm:text-sm">Approve Quote First</p>
                </div>
              </div>
              
              <div className="absolute bottom-6 sm:bottom-12 -right-2 sm:-right-8 bg-[#1A2235]/95 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 sm:gap-4 animate-[bounce_5s_infinite_reverse]">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={18} className="sm:w-6 sm:h-6" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Trust</p>
                  <p className="font-extrabold text-white text-xs sm:text-sm">Background Verified</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Service Selection - Horizontal Interactive Carousel */}
        <div className="mt-24 sm:mt-32 relative z-10" id="services">
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Explore Our Premium Services</h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Select a category to view services and book a verified professional instantly.</p>
          </div>
          
          {/* Categories Tabs - Horizontal Scroll on Mobile */}
          <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 px-4 sm:px-0 sm:justify-center snap-x snap-mandatory">
            {globalCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 snap-center flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeCategory === cat.id 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border-transparent' 
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <cat.icon size={18} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Horizontal Swiper for Services */}
          <div className="relative px-4 sm:px-0">
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex overflow-x-auto gap-4 sm:gap-6 pb-8 snap-x snap-mandatory hide-scrollbar custom-scrollbar-hide"
            >
              {services.filter(s => s.categoryId === activeCategory).map((service, idx) => (
                <motion.div 
                  key={service.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  onClick={() => handleBookingClick(service.id)}
                  className="group cursor-pointer rounded-[2rem] overflow-hidden relative h-[320px] sm:h-[360px] min-w-[260px] sm:min-w-[300px] snap-center shadow-2xl border border-white/10 hover:border-blue-500/50 transition-all shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80"></div>
                  <img src={service.img} alt={service.name} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end h-full">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 text-white shadow-lg group-hover:bg-blue-600 transition-colors duration-300">
                      <service.icon size={24} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md mb-2">{service.name}</h3>
                    <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto overflow-hidden line-clamp-2">
                      Professional {service.name.toLowerCase()} services by verified experts.
                    </p>
                    <div className="mt-4 flex items-center text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <span>Book Now</span>
                      <ChevronRight size={18} className="ml-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

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

        {/* Urgent Repair Needed */}
        <div className="mt-24 sm:mt-32 relative z-10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 border border-white/10 text-center mx-4 sm:mx-0">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <Zap size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">Urgent Repair Needed?</h2>
            <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl mx-auto">Skip the booking form and call us directly for an instant technician dispatch. We prioritize emergencies.</p>
            <a href="tel:+919515980170" className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 transition-transform">
              <MessageCircle /> 
              <span className="hidden sm:inline">Call Now:</span> +91 95159 80170
            </a>
        </div>

        {/* Trust & Transparency Section */}
        <div className="mt-24 sm:mt-32 border-t border-white/5 pt-24 sm:pt-32 px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Elevating the home service industry.</h2>
              <div className="space-y-6 sm:space-y-8 mt-8 sm:mt-10">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2">No Hidden Prices</h4>
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed">Standard inspection fee of ₹99. We show an estimated range upfront. The technician must enter the exact quote in-app before starting, and wait for your one-click approval.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Quality Backed by Data</h4>
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed">See technician skill scores. We track success rates, repeat bookings, and require before/after photo proof for high-priced jobs.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-2">1-Hour Emergency Service</h4>
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed">Water leaking? AC dead in summer? Select our premium emergency option and we guarantee a verified technician at your door in 60 minutes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-[#1A2235] border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative z-10 w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <h3 className="font-bold text-base sm:text-lg text-white">Job: AC Not Cooling</h3>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] sm:text-xs font-bold">Awaiting Approval</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src="https://i.pravatar.cc/150?img=11" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" alt="Tech" />
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">Rahul Sharma</h4>
                    <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-400 gap-2 mt-1">
                       <span className="flex items-center text-amber-400"><Star size={14} className="fill-current mr-1"/> 4.8</span>
                       <span>• 240 Jobs</span>
                       <span className="flex items-center text-emerald-400"><ShieldCheck size={14} className="mr-1"/> Verified</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0B0F19] rounded-xl p-4 mb-6">
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Diagnosed Issue:</p>
                  <p className="font-medium text-white mb-4 text-sm sm:text-base">Gas Leakage in Outdoor Unit. Requires welding and gas refill.</p>
                  
                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                     <div>
                       <p className="text-xs text-slate-500">Fixed Total Quote</p>
                       <p className="text-xl sm:text-2xl font-extrabold text-white">₹1,850</p>
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white"><Camera size={18}/></button>
                     </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 text-sm sm:text-base rounded-xl transition-colors">Reject</button>
                  <button className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/20">Approve</button>
                </div>
              </div>
              
              {/* Decorative background blob */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Fixvo Plus Section */}
        <div className="mt-24 sm:mt-32 border-t border-white/5 pt-24 sm:pt-32 px-4 sm:px-0">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 mb-4 inline-flex items-center gap-3"><Sparkles className="text-amber-400 w-8 h-8 md:w-10 md:h-10"/> Fixvo Plus</h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Upgrade to our premium membership for an unparalleled home service experience.</p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#1A2235] to-[#0B0F19] border-2 border-amber-500/30 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-14 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12">
               <div className="flex-1 space-y-6 sm:space-y-8 relative z-10 w-full">
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
                     <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Exclusive 15% Discount</h4>
                     <p className="text-sm sm:text-base text-slate-400">Automatically save 15% on all repair quotes, parts, and maintenance services.</p>
                   </div>
                 </div>
               </div>
               
               <div className="w-full md:w-[320px] shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 text-center relative z-10 shadow-2xl">
                 <div className="inline-flex items-center justify-center px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6">Premium Tier</div>
                 <h3 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">₹499<span className="text-sm sm:text-lg text-slate-500 font-medium tracking-normal">/yr</span></h3>
                 <p className="text-xs sm:text-sm text-slate-400 mb-8 font-medium">Billed annually. Cancel anytime.</p>
                 <button 
                   onClick={() => navigate('/dashboard?action=premium')}
                   className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0B0F19] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base"
                 >
                   Get Fixvo Plus
                 </button>
               </div>
            </div>
          </div>
        </div>
        
        {/* Meet the Founder Section */}
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
            className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 lg:gap-20 max-w-5xl mx-auto bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            {/* Background glowing effects */}
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

        {/* Customer Testimonials Section */}
        <div className="mt-24 sm:mt-32 border-t border-white/5 pt-20 sm:pt-32 px-4 sm:px-0">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">What Our Users Say</h2>
            <p className="text-base sm:text-lg text-slate-400">Real feedback from thousands of satisfied customers across the city.</p>
          </div>
          
          <div className="relative w-full overflow-hidden py-4">
            {/* Left and Right Fade Overlays for Premium Depth */}
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-r from-[#0B0F19] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-l from-[#0B0F19] to-transparent z-10 pointer-events-none"></div>
            
            <motion.div 
              style={{ x: marqueeX }}
              drag="x"
              dragConstraints={{ left: -wrapWidth * 2, right: 0 }}
              dragElastic={0.05}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex gap-6 cursor-grab active:cursor-grabbing select-none"
            >
              {[
                { name: "Priya Sharma", location: "Kondapur, Hyderabad", service: "AC Repair & Gas Refill", text: "My AC stopped cooling in peak May. Dispatched a technician within 25 minutes! Extremely professional, showed me the pressure gauge before and after refilling.", rating: 5, bg: "from-blue-500/10 to-transparent", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
                { name: "Vikram Reddy", location: "Indiranagar, Bangalore", service: "Electrical Wiring", text: "Had a complete power outage on Sunday night. The technician arrived in 30 minutes, diagnosed a burnt main MCB, and replaced it in no time. Literal lifesaver!", rating: 5, bg: "from-amber-500/10 to-transparent", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" },
                { name: "Anjali Krishnan", location: "Adyar, Chennai", service: "Bathroom Deep Clean", text: "Absolutely stellar work! They deep cleaned two bathrooms. Removed tough hard-water scaling that regular cleaning couldn't budge. Worth every rupee.", rating: 5, bg: "from-emerald-500/10 to-transparent", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop" },
                { name: "Sandeep Nair", location: "Gachibowli, Hyderabad", service: "CCTV Installation", text: "Seamless installation of a 4-camera setup for my home. The technician guided me on camera angles, set up the app on my phone, and kept the wiring very neat.", rating: 5, bg: "from-purple-500/10 to-transparent", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop" }
              ].reduce((acc, current) => acc.concat([current, current, current]), []).map((testimonial, idx) => (
                 <div 
                   key={idx}
                   className={`p-6 sm:p-8 rounded-[2rem] border border-white/10 bg-[#161D2E]/60 bg-gradient-to-b ${testimonial.bg} shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-md relative w-[300px] sm:w-[320px] flex-shrink-0 flex flex-col group hover:-translate-y-2 transition-transform duration-300`}
                 >
                   <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/5 font-serif text-5xl sm:text-7xl pointer-events-none transition-transform group-hover:scale-110">"</div>
                   
                   <div className="flex items-center gap-4 mb-6">
                     <img 
                       src={testimonial.avatar} 
                       alt={testimonial.name} 
                       className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-inner" 
                     />
                     <div>
                       <p className="font-extrabold text-white text-base sm:text-lg">{testimonial.name}</p>
                       <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{testimonial.location}</p>
                       <div className="flex items-center gap-1 text-amber-400 mt-1">
                          {[...Array(testimonial.rating)].map((_, i) => <Star key={i} size={11} className="fill-current sm:w-2.5 sm:h-2.5" />)}
                       </div>
                     </div>
                   </div>
                   
                   <p className="text-[13px] sm:text-[14px] text-slate-300 italic mb-6 relative z-10 leading-relaxed grow font-medium">"{testimonial.text}"</p>
                   
                   <div className="flex flex-wrap gap-2 justify-between items-center border-t border-white/5 pt-5 mt-auto">
                      <span className="text-[10px] sm:text-xs text-emerald-400 flex items-center gap-1.5 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"><CheckCircle2 size={12} className="text-emerald-400"/> Verified</span>
                      <span className="text-[10px] sm:text-xs font-extrabold text-slate-300 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">{testimonial.service}</span>
                   </div>
                 </div>
              ))}
            </motion.div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-24 sm:mt-32 pt-16 border-t border-white/5 text-center px-4 sm:px-0">
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
                  onClick={() => handleBookingClick()}
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

      </div>

      {/* Global CSS for hiding scrollbar visually but keeping functionality */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-1032px); }
        }
        .animate-infinite-scroll {
          display: flex;
          width: max-content;
          animation: scroll 32s linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Home;
