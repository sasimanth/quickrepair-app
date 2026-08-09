import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { globalCategories, globalServices } from '../data/services';
import { Search, Wrench, ShieldCheck, Star, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredServices = globalServices.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBookService = (serviceId) => {
    navigate(`/book?service=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 mt-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Zap size={14} className="animate-pulse" /> Complete Fixvo Service Directory
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Expert Home Services <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
              At Transparent Upfront Pricing
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-xl mx-auto">
            From emergency repairs to deep cleaning and installations. Background-checked technicians dispatched to your doorstep within 30 minutes.
          </p>

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search services (e.g. AC repair, plumbing, sofa cleaning...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none transition shadow-lg"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
              selectedCategory === 'all'
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            All Services ({globalServices.length})
          </button>
          {globalCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <p className="text-lg font-bold">No services found matching "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/40 rounded-3xl p-6 transition duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                      <Wrench size={20} />
                    </div>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white mb-2 group-hover:text-blue-400 transition">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Starting From</span>
                    <span className="text-lg font-black text-white">₹{service.basePrice}</span>
                  </div>

                  <button
                    onClick={() => handleBookService(service.id)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    Book Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust Footer Card */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-extrabold text-white">Need a custom or bulk repair quote?</h3>
            <p className="text-xs text-slate-400 font-medium">Contact our 24/7 support line or request a callback from a certified technician manager.</p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shrink-0"
          >
            Contact Support Team
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Services;
