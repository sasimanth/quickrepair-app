import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import { globalCategories, globalServices } from '../data/services';
import { Search, Wrench, ShieldCheck, Star, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredServices = globalServices.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBookService = (serviceId) => {
    if (user) {
      navigate(`/dashboard?action=book&service=${serviceId}`);
    } else {
      setPendingServiceId(serviceId);
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-widest">
            <Zap size={14} className="animate-pulse text-blue-600" /> Complete Fixvo Service Directory
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Expert Doorstep Services <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
              At Upfront Guaranteed Pricing
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-semibold max-w-xl mx-auto">
            From emergency AC repairs to deep house cleaning and TV installation. Verified experts dispatched to your door within 30 minutes.
          </p>

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search services (e.g. AC repair, plumbing, sofa cleaning...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:border-blue-600 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
              selectedCategory === 'all'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Services ({globalServices.length})
          </button>
          {globalCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 font-semibold text-xs">
            <p className="text-sm font-extrabold text-slate-800">No services found matching "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition border-none cursor-pointer"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-6 transition duration-300 flex flex-col justify-between group shadow-xs hover:shadow-md hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
                      <Wrench size={20} />
                    </div>
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified Pro
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-blue-600 transition">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Starting From</span>
                    <span className="text-lg font-black text-slate-900">₹{service.basePrice}</span>
                  </div>

                  <button
                    onClick={() => handleBookService(service.id)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-1.5 border-none cursor-pointer"
                  >
                    Book Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust Footer Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border border-blue-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-black text-white">Need a custom or bulk service quote?</h3>
            <p className="text-xs text-blue-100 font-semibold">Contact our 24/7 support line or request an instant callback from our service dispatch manager.</p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-3 bg-white text-blue-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shrink-0 no-underline"
          >
            Contact Support Team
          </Link>
        </div>

      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            navigate(`/dashboard?action=book${pendingServiceId ? `&service=${pendingServiceId}` : ''}`);
          }}
        />
      )}
    </div>
  );
};

export default Services;
