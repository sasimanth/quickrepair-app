import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, ShieldCheck, MapPin, Sparkles, Loader2, Compass, Tag, Check, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const NearbyTechnicians = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [showAllTechs, setShowAllTechs] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState('FIXVO100');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services');
        setServices(data || []);
      } catch (err) {
        console.error('Failed to fetch services', err);
      }
    };
    fetchServices();
  }, []);

  const localTechniciansPool = [
    { id: 'tech_1', _id: 'tech_1', name: "Amit Verma", rating: 4.9, jobsCompleted: 512, area: "Madanapalle", isVerified: true, isOnline: true, defaultServiceId: "ac_repair", experience: "5 Years", skills: ["AC Repair", "AC Installation", "Gas Refill"], avatar: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop" },
    { id: 'tech_2', _id: 'tech_2', name: "Suresh Kumar", rating: 4.8, jobsCompleted: 340, area: "Madanapalle", isVerified: true, isOnline: true, defaultServiceId: "ro_install", experience: "4 Years", skills: ["RO Installation", "Filter Change", "Plumbing"], avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=200&auto=format&fit=crop" },
    { id: 'tech_3', _id: 'tech_3', name: "Rajesh Reddy", rating: 4.9, jobsCompleted: 620, area: "Madanapalle Town", isVerified: true, isOnline: true, defaultServiceId: "washing_machine", experience: "6 Years", skills: ["Washing Machine", "Refrigerator", "Microwave"], avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
    { id: 'tech_4', _id: 'tech_4', name: "Kalyan Naidu", rating: 4.7, jobsCompleted: 280, area: "Galiveedu", isVerified: true, isOnline: true, defaultServiceId: "plumbing_work", experience: "3 Years", skills: ["Plumbing Work", "Pipe Fitting", "Tap Repair"], avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
    { id: 'tech_5', _id: 'tech_5', name: "Venkatesh Rao", rating: 4.8, jobsCompleted: 410, area: "Kadiri", isVerified: true, isOnline: true, defaultServiceId: "electric_wiring", experience: "5 Years", skills: ["Electric Wiring", "MCB Repair", "Inverter"], avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
    { id: 'tech_6', _id: 'tech_6', name: "Narahari Sharma", rating: 4.9, jobsCompleted: 390, area: "Rayachoty", isVerified: true, isOnline: true, defaultServiceId: "home_clean", experience: "4 Years", skills: ["Full Home Cleaning", "Sofa Cleaning", "Sanitization"], avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
  ];

  const deduplicate = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      const key = item.id || item._id || item.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedServiceId) params.append('serviceId', selectedServiceId);
      
      const res = await api.get(`/technicians/nearby?${params.toString()}`);
      if (res.data && res.data.length > 0) {
        setTechnicians(deduplicate(res.data));
      } else {
        filterLocalTechnicians();
      }
    } catch (err) {
      filterLocalTechnicians();
    } finally {
      setLoading(false);
    }
  };

  const filterLocalTechnicians = () => {
    let list = [...localTechniciansPool];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        (t.area && t.area.toLowerCase().includes(q)) || 
        (t.name && t.name.toLowerCase().includes(q)) || 
        (t.skills && t.skills.some(s => s.toLowerCase().includes(q)))
      );
    }
    if (selectedServiceId) {
      list = list.filter(t => t.defaultServiceId === selectedServiceId || (t.services && t.services.includes(selectedServiceId)));
    }
    setTechnicians(deduplicate(list));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTechnicians();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedServiceId]);

  const handleBookDirect = (techId, defaultServiceId) => {
    const serviceParam = defaultServiceId || selectedServiceId || 'ac_repair';
    const promoParam = appliedPromo ? `&promo=${appliedPromo}` : '';
    window.location.href = `/dashboard?action=book&techId=${techId}&service=${serviceParam}${promoParam}`;
  };

  // Top Most Match Technician (Highest rating & verified)
  const topMatchTech = technicians[0] || localTechniciansPool[0];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs uppercase tracking-widest mb-3">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Smart Technician Matcher</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Find & Book the Top Expert Instant
          </h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto text-xs sm:text-sm font-semibold">
            We automatically match you with the highest-rated verified technician serving your area. No endless scrolling required.
          </p>
        </div>

        {/* Search & Area Selector Bar */}
        <div className="bg-white border border-slate-200/90 rounded-[2rem] p-4 sm:p-5 shadow-lg mb-8 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search area (e.g. Madanapalle, Kadiri, Rayachoty, Galiveedu...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
          
          <div className="w-full md:w-56">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">All Service Experts</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TOP MATCHED TECHNICIAN FEATURED CARD */}
        {topMatchTech && (
          <div className="bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 border-2 border-blue-500/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
              <Sparkles size={12} /> Top Recommended Match
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              {/* Tech Info */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-blue-300 rounded-2xl flex items-center justify-center text-3xl shadow-md overflow-hidden">
                    {topMatchTech.avatar && topMatchTech.avatar.startsWith('http') ? (
                      <img src={topMatchTech.avatar} alt={topMatchTech.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{topMatchTech.avatar || '👨‍🔧'}</span>
                    )}
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{topMatchTech.name}</h3>
                    <ShieldCheck size={18} className="text-blue-600 shrink-0" title="Verified Fixvo Pro" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-600">
                    <span className="flex items-center text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      ★ {topMatchTech.rating || '4.9'}
                    </span>
                    <span>•</span>
                    <span>{topMatchTech.experience || '5 Years'} Exp</span>
                    <span>•</span>
                    <span className="text-emerald-700">{topMatchTech.jobsCompleted || 500}+ Jobs Done</span>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                    <MapPin size={13} className="text-blue-600" /> Serves: <strong className="text-slate-800">{topMatchTech.area || 'Madanapalle Town'}</strong>
                  </p>
                </div>
              </div>

              {/* Booking Actions & Promo Box */}
              <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-3 shrink-0">
                {/* Promo Code Quick Selector */}
                <div className="bg-white border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs shadow-xs">
                  <Tag size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-slate-600 font-bold">Promo: <strong className="text-emerald-700 font-black">{appliedPromo}</strong></span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded uppercase ml-auto">₹100 OFF</span>
                </div>

                {/* Primary Book Button */}
                <button
                  type="button"
                  onClick={() => handleBookDirect(topMatchTech.id || topMatchTech._id, topMatchTech.defaultServiceId)}
                  className="py-3.5 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all border-none cursor-pointer text-center active:scale-98"
                >
                  Book Top Match Expert (₹0 Service Fee)
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Toggle to view more technicians */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAllTechs(!showAllTechs)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-full cursor-pointer transition-all shadow-xs"
          >
            {showAllTechs ? (
              <><span>Hide Other Technicians</span> <ChevronUp size={14} /></>
            ) : (
              <><span>Compare All Technicians ({technicians.length})</span> <ChevronDown size={14} /></>
            )}
          </button>
        </div>

        {/* Collapsible List of Other Technicians */}
        {showAllTechs && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {technicians.map((tech) => {
              const techKey = tech.id || tech._id || tech.name;
              return (
                <div 
                  key={techKey}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xl overflow-hidden shrink-0">
                      {tech.avatar && tech.avatar.startsWith('http') ? (
                        <img src={tech.avatar} alt={tech.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{tech.avatar || '👨‍🔧'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{tech.name}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">★ {tech.rating || '4.8'} • {tech.area}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookDirect(techKey, tech.defaultServiceId)}
                    className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all border border-blue-200 shrink-0 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

export default NearbyTechnicians;
