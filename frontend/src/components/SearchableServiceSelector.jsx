import React, { useState, useRef, useEffect } from 'react';
import { Wrench, Search, Check, X, ChevronDown } from 'lucide-react';
import { globalServices, globalCategories } from '../data/services';

const SearchableServiceSelector = ({
  value,
  onChange,
  multiSelect = false,
  theme = 'light',
  placeholder = 'Select a service'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSelected = (serviceId) => {
    if (multiSelect) {
      return Array.isArray(value) && value.includes(serviceId);
    }
    return value === serviceId;
  };

  const handleSelect = (serviceId) => {
    if (multiSelect) {
      const currentVal = Array.isArray(value) ? value : [];
      let newVal;
      if (currentVal.includes(serviceId)) {
        newVal = currentVal.filter(id => id !== serviceId);
      } else {
        newVal = [...currentVal, serviceId];
      }
      onChange(newVal);
    } else {
      onChange(serviceId);
      setIsOpen(false);
    }
  };

  const removeService = (serviceId, e) => {
    e.stopPropagation();
    if (multiSelect && Array.isArray(value)) {
      onChange(value.filter(id => id !== serviceId));
    }
  };

  // Filter services based on search query and category
  const filteredServices = globalServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get current single selection object
  const selectedServiceObj = !multiSelect && globalServices.find(s => s.id === value);

  // Theme-based style variables
  const isDark = theme === 'dark';
  
  const bgInput = isDark ? 'bg-slate-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-100 text-slate-800 focus:border-indigo-500';
  const bgDropdown = isDark ? 'bg-[#111827] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-800';
  const hoverItem = isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderCol = isDark ? 'border-white/5' : 'border-slate-100';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected chips for MultiSelect (rendered above/outside the dropdown trigger if preferred, or inside) */}
      {multiSelect && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map(id => {
            const svc = globalServices.find(s => s.id === id);
            if (!svc) return null;
            const Icon = svc.icon || Wrench;
            return (
              <div
                key={id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                  isDark 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                <Icon size={12} className="shrink-0" />
                <span>{svc.name}</span>
                <button
                  type="button"
                  onClick={(e) => removeService(id, e)}
                  className={`p-0.5 rounded-full hover:bg-indigo-500/20 transition-colors ml-1 cursor-pointer`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition-all relative cursor-pointer outline-none ${bgInput}`}
      >
        <div className="flex items-center gap-2.5">
          {selectedServiceObj ? (
            <>
              <div className={`p-1.5 rounded-lg flex items-center justify-center ${selectedServiceObj.bg || 'bg-indigo-500/20'} ${selectedServiceObj.color || 'text-indigo-600'}`}>
                {React.createElement(selectedServiceObj.icon || Wrench, { size: 16 })}
              </div>
              <span className="truncate">{selectedServiceObj.name}</span>
            </>
          ) : (
            <>
              <Wrench className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`} size={18} />
              <span className={textMuted}>{multiSelect ? 'Select skills to add' : placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${textMuted}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`absolute left-0 right-0 mt-2 border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${bgDropdown}`}>
          {/* Search Input */}
          <div className={`p-3 border-b relative ${borderCol}`}>
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-all ${
                isDark 
                  ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>

          {/* Category Tabs */}
          <div className={`flex border-b overflow-x-auto scrollbar-none px-2 py-1 gap-1 text-[10px] uppercase font-bold tracking-wider ${borderCol}`}>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            {globalCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Service List */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {filteredServices.map(service => {
              const selected = isSelected(service.id);
              const Icon = service.icon || Wrench;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleSelect(service.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${hoverItem} ${
                    selected 
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-400 hover:text-white border border-transparent'
                  } ${!isDark && !selected ? 'text-slate-700 hover:bg-slate-50' : ''} ${!isDark && selected ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg flex items-center justify-center ${service.bg || 'bg-slate-100'} ${service.color || 'text-slate-500'}`}>
                      <Icon size={14} />
                    </div>
                    <span>{service.name}</span>
                  </div>
                  {selected && <Check size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />}
                </button>
              );
            })}
            {filteredServices.length === 0 && (
              <p className={`p-4 text-xs italic text-center ${textMuted}`}>No services found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableServiceSelector;
