import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { globalCategories, globalServices } from '../data/services';
import SmartDiagnosis from '../components/SmartDiagnosis/SmartDiagnosis';
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
  MessageCircle,
  Wrench,
  Camera,
  Banknote,
  Search,
  X
} from 'lucide-react';
import { FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import founderImg from '../assets/founder.jpeg';

const Home = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(globalCategories[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredServices = globalServices.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full min-h-screen bg-[#0B0F19] text-white overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-32 pb-20 relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm select-none">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">10-Min Arrival Guarantee</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Trusted Home Repairs.<br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Instantly.
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-medium">
              Don't know the exact problem? No worries. Book top-rated professionals for AC, Plumbing, and Electrical work. No hidden fees. Approve pricing before work begins.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/book"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/30 hover:shadow-blue-600/40 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                <span className="relative z-10 text-lg">Book Service Now</span>
                <ChevronRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/book"
                className="px-8 py-4 bg-white/5 backdrop-blur-md text-white font-bold rounded-2xl border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                <span>Start Booking</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-6 pt-8 border-t border-white/10">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                   <img key={i} src={`https://i.pravatar.cc/100?img=${i+40}`} alt="User" className="w-12 h-12 rounded-full border-2 border-[#0B0F19] shadow-sm" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <Star size={16} className="fill-current"/>
                  <span className="text-white font-bold ml-2">4.9/5</span>
                </div>
                <p className="text-sm font-medium text-slate-400 mt-1">From 10,000+ verified reviews</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2 relative"
          >
            {/* Main Image Grid / Collage */}
            <div className="relative rounded-[2rem] p-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-2 h-[500px]">
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
              <div className="absolute top-10 -left-6 bg-[#1A2235]/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-[bounce_4s_infinite]">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <Banknote size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transparent</p>
                  <p className="font-extrabold text-white text-sm">Approve Quote First</p>
                </div>
              </div>
              
              <div className="absolute bottom-12 -right-8 bg-[#1A2235]/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-[bounce_5s_infinite_reverse]">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={24} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trust</p>
                  <p className="font-extrabold text-white text-sm">Background Verified</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Service Selection */}
        <div className="mt-32 relative z-10" id="services">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">What service do you need?</h2>
            <p className="text-slate-400 mb-8">Search or select a category below to get started in 3 easy steps.</p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative" ref={searchRef}>
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-400" size={24} />
                <input 
                  type="text"
                  placeholder="e.g. AC Repair, TV Mounting, Full Home Cleaning..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-[#1A2235]/80 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg shadow-2xl"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                )}
              </div>
              
              {/* Dynamic Suggestions */}
              {showSuggestions && searchQuery && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#1A2235] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {filteredServices.length > 0 ? (
                    filteredServices.map(service => (
                      <button
                        key={service.id}
                        onClick={() => navigate(`/book?service=${service.id}`)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg ${service.bg} flex items-center justify-center text-white shrink-0`}>
                          <service.icon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{service.name}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">{globalCategories.find(c => c.id === service.categoryId)?.name}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      No services found for "{searchQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Categories Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-10">
            {globalCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <cat.icon size={18} />
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <motion.div 
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {globalServices.filter(s => s.categoryId === activeCategory).map((service, idx) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => navigate(`/book?service=${service.id}`)}
                className="group cursor-pointer rounded-[2rem] overflow-hidden relative h-64 shadow-2xl border border-white/10 hover:border-blue-500/50 transition-colors"
               >
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80"></div>
                 <img src={service.img} alt={service.name} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end h-full">
                   <div className="flex items-end justify-between w-full">
                     <div>
                       <div className={`w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-3 text-white shadow-lg`}>
                         <service.icon size={24} />
                       </div>
                       <h3 className="text-xl font-extrabold text-white drop-shadow-sm">{service.name}</h3>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-4 shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                       <ChevronRight className="text-white" />
                     </div>
                   </div>
                 </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* AI Diagnosis Section */}
        <div className="mt-32 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Not Sure What's Wrong?</h2>
            <p className="text-slate-400">Use our Smart AI-like Diagnosis to find the problem & estimated cost.</p>
          </div>
          
          <SmartDiagnosis />
        </div>

        {/* Trust & Transparency Section */}
        <div className="mt-32 border-t border-white/5 pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">We fixed the broken repair industry.</h2>
              <div className="space-y-8 mt-10">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">No Hidden Prices</h4>
                    <p className="text-slate-400">Standard inspection fee of ₹99. We show an estimated range upfront. The technician must enter the exact quote in-app before starting, and wait for your one-click approval.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Quality Backed by Data</h4>
                    <p className="text-slate-400">See technician skill scores. We track success rates, repeat bookings, and require before/after photo proof for high-priced jobs.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">1-Hour Emergency Service</h4>
                    <p className="text-slate-400">Water leaking? AC dead in summer? Select our premium emergency option and we guarantee a verified technician at your door in 60 minutes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-[#1A2235] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <h3 className="font-bold text-lg">Job: AC Not Cooling</h3>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">Awaiting Approval</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src="https://i.pravatar.cc/150?img=11" className="w-16 h-16 rounded-full" alt="Tech" />
                  <div>
                    <h4 className="font-bold text-white">Rahul Sharma</h4>
                    <div className="flex items-center text-sm text-slate-400 gap-2">
                       <span className="flex items-center text-amber-400"><Star size={14} className="fill-current mr-1"/> 4.8</span>
                       <span>• 240 Jobs</span>
                       <span className="flex items-center text-emerald-400"><ShieldCheck size={14} className="mr-1"/> Verified</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0B0F19] rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-400 mb-1">Diagnosed Issue:</p>
                  <p className="font-medium text-white mb-4">Gas Leakage in Outdoor Unit. Requires welding and gas refill.</p>
                  
                  <div className="flex justify-between items-end border-t border-white/10 pt-4">
                     <div>
                       <p className="text-xs text-slate-500">Fixed Total Quote</p>
                       <p className="text-2xl font-extrabold text-white">₹1,850</p>
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white"><Camera size={20}/></button>
                     </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors">Reject</button>
                  <button className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20">Approve Work</button>
                </div>
              </div>
              
              {/* Decorative background blob */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl -z-10 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Meet the Founder Section */}
        <div className="mt-32 border-t border-white/5 pt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Meet the Founder</h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 max-w-5xl mx-auto bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden backdrop-blur-xl"
          >
            {/* Background glowing effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 shrink-0 mx-auto md:mx-0">
              <div className="relative group p-2">
                {/* Subtle glowing ring behind image */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#0B0F19] shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-[#0B0F19]">
                  <img 
                    src={founderImg} 
                    alt="G. Sasimanth Reddy" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              </div>
            </div>
            
            <div className="relative z-10 text-center md:text-left flex-1">
              <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">G. Sasimanth Reddy</h3>
              <p className="text-indigo-400 font-bold mb-8 flex items-center justify-center md:justify-start gap-2 text-lg uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></span>
                Founder & CEO
              </p>
              
              <div className="relative mb-10">
                <span className="absolute -top-6 -left-6 text-7xl text-white/5 font-serif select-none pointer-events-none">"</span>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed relative z-10 font-medium">
                  G. Sasimanth Reddy is the Founder & CEO of QuickRepair, focused on building a reliable and transparent platform that connects customers with verified service professionals. With a vision to simplify everyday service needs, QuickRepair aims to deliver fast, trustworthy, and hassle-free solutions for modern households.
                </p>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-4">
                <a href="https://www.linkedin.com/in/gsasimanthreddy" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0077b5] hover:border-[#0077b5] hover:shadow-lg hover:shadow-[#0077b5]/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110">
                  <FaLinkedin size={22} />
                </a>
                <a href="https://www.instagram.com/sasimanth_9515?igsh=NXZ5amZxaDlkeGxy" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110">
                  <FaInstagram size={22} />
                </a>
                <a href="https://x.com/sasimanth_9515" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-black hover:border-white/30 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-110">
                  <FaXTwitter size={22} />
                </a>
                <a href="https://wa.me/9515980170" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110">
                  <FaWhatsapp size={22} />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-32 pt-16 border-t border-white/5 text-center">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-8 w-full h-full opacity-30 pointer-events-none">
                 <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/50 rounded-full blur-[100px]"></div>
               </div>
               
               <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10">Stop guessing. Get it fixed.</h2>
               <p className="text-xl text-blue-200/80 mb-10 max-w-2xl mx-auto relative z-10">
                 Book now and get a <span className="text-white font-bold">100% Free Inspection</span> on your first booking.
               </p>
               <Link
                to="/book"
                className="inline-flex relative z-10 px-10 py-5 bg-white text-blue-900 font-extrabold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 items-center justify-center gap-2"
              >
                <span className="text-xl">Book Now in 10 Seconds</span>
              </Link>
            </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Home;
