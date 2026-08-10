import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, ShieldCheck, MapPin, Sparkles, Loader2, Compass } from 'lucide-react';
import api from '../services/api';

const NearbyTechnicians = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  // Fetch list of services for the filter dropdown
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services');
        setServices(data || []);
      } catch (err) {
        console.error('Failed to fetch services for discovery', err);
      }
    };
    fetchServices();
  }, []);

  // Local database of verified technicians for instant real-time filtering
  const localTechniciansPool = [
    { _id: 'tech_1', name: "Amit Verma", rating: 4.9, completedJobs: 512, area: "Madanapalle", verified: true, isOnline: true, defaultServiceId: "ac_repair", avatar: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop" },
    { _id: 'tech_2', name: "Suresh Kumar", rating: 4.8, completedJobs: 340, area: "Madanapalle Bypass", verified: true, isOnline: true, defaultServiceId: "ro_install", avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=200&auto=format&fit=crop" },
    { _id: 'tech_3', name: "Rajesh Reddy", rating: 4.9, completedJobs: 620, area: "Madanapalle Town", verified: true, isOnline: true, defaultServiceId: "washing_machine", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
    { _id: 'tech_4', name: "Kalyan Naidu", rating: 4.7, completedJobs: 280, area: "Malepadu", verified: true, isOnline: true, defaultServiceId: "plumbing_work", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
    { _id: 'tech_5', name: "Venkatesh Rao", rating: 4.8, completedJobs: 410, area: "Kadiri", verified: true, isOnline: true, defaultServiceId: "electric_wiring", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
    { _id: 'tech_6', name: "Narahari Sharma", rating: 4.9, completedJobs: 390, area: "Rayachoty", verified: true, isOnline: true, defaultServiceId: "home_clean", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop" },
    { _id: 'tech_7', name: "Prasad Raju", rating: 4.8, completedJobs: 290, area: "Galiveedu", verified: true, isOnline: true, defaultServiceId: "mobile_repair", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop" },
  ];

  // Fetch technicians based on search query and selected service
  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('area', searchQuery.trim());
      }
      if (selectedServiceId) {
        params.append('serviceId', selectedServiceId);
      }
      
      const res = await api.get(`/technicians/nearby?${params.toString()}`);
      if (res.data && res.data.length > 0) {
        setTechnicians(res.data);
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
    let list = localTechniciansPool;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.area.toLowerCase().includes(q) || 
        t.name.toLowerCase().includes(q) ||
        (t.defaultServiceId && t.defaultServiceId.toLowerCase().includes(q)) ||
        (t.skills && t.skills.some(s => s.toLowerCase().includes(q)))
      );
    }
    if (selectedServiceId) {
      list = list.filter(t => t.defaultServiceId === selectedServiceId);
    }
    setTechnicians(list);
  };

  // Debounce search input to avoid hitting API continuously
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTechnicians();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedServiceId]);

  const handleBookDirect = (techId, defaultServiceId) => {
    const serviceParam = defaultServiceId || selectedServiceId || 'mobile_repair';
    window.location.href = `/dashboard?action=book&techId=${techId}&service=${serviceParam}`;
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-4"
          >
            <Compass className="text-indigo-400 w-4 h-4 animate-spin-slow" />
            <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest">Live network discovery</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Available Technicians Nearby
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base sm:text-lg">
            Locate verified, real-time online experts in your town. Search by area name to check instantly available partners.
          </p>
        </div>

        {/* Premium Search and Filter Bar */}
        <div className="bg-[#101626]/70 border border-white/10 backdrop-blur-xl rounded-[2rem] p-5 sm:p-6 shadow-2xl mb-12 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your area (e.g. Galiveedu, Madanapalle, Kadiri...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-950/50 hover:bg-slate-950/70 focus:bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-white font-semibold text-sm outline-none transition-all placeholder:text-slate-500"
            />
          </div>
          
          <div className="w-full md:w-64">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-4 py-4 bg-slate-950/50 hover:bg-slate-950/70 focus:bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-slate-300 focus:text-white font-semibold text-sm outline-none transition-all cursor-pointer"
            >
              <option value="">All Services offered</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Discovery Grid */}
        <div className="min-h-[300px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F19]/40 backdrop-blur-sm rounded-3xl z-20">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {technicians.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-center py-16 bg-[#101626]/40 border border-white/5 rounded-[2rem] backdrop-blur-md"
              >
                <p className="text-slate-400 font-bold text-lg">No technicians currently online in "{searchQuery || 'this area'}"</p>
                <p className="text-slate-500 text-sm mt-2">Try searching another area like "Galiveedu" or clear search parameters.</p>
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {technicians.map((tech) => (
                  <motion.div
                    key={tech.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="group relative bg-gradient-to-b from-[#161D2E]/90 to-[#0F1422]/90 border border-white/5 rounded-[2rem] p-6 shadow-xl hover:border-indigo-500/30 hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                            {tech.avatar || '👨‍🔧'}
                          </div>
                          {/* Live Online Badge */}
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#161D2E]"></span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </div>
                      </div>

                      {/* Profile details */}
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-white text-lg tracking-tight truncate group-hover:text-indigo-300 transition-colors">
                            {tech.name}
                          </h4>
                          {tech.isVerified && (
                            <ShieldCheck size={16} className="text-indigo-400 shrink-0" title="Verified Professional" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                          <span className="flex items-center text-amber-400 font-bold">
                            <Star size={14} className="fill-current mr-1 text-amber-400" />
                            {tech.rating || '4.8'}
                          </span>
                          <span>•</span>
                          <span>{tech.experience || '3 Years'} Exp</span>
                          <span>•</span>
                          <span>{tech.jobsCompleted || 0} Jobs Done</span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-2.5 font-medium select-none">
                          <MapPin size={12} className="text-slate-500" />
                          Serves Area: <span className="text-slate-400 font-semibold">{tech.area || 'Nearby'}</span>
                        </p>
                      </div>

                      {/* Skills tags */}
                      <div className="flex flex-wrap gap-1.5 mt-5">
                        {tech.skills && tech.skills.slice(0, 3).map((skill, index) => (
                          <span 
                            key={index}
                            className="bg-white/5 border border-white/5 text-slate-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Book Now Button */}
                    <button
                      type="button"
                      onClick={() => handleBookDirect(tech.id, tech.services?.[0])}
                      className="mt-6 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md group-hover:shadow-lg active:scale-95 duration-150 border-none cursor-pointer outline-none"
                    >
                      Book Professional
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default NearbyTechnicians;
