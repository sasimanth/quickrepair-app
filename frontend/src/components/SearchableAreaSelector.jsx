import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Check, ChevronDown } from 'lucide-react';

const defaultAreas = [
  'Madanapalle', 
  'Madanapalle Bypass', 
  'Madanapalle Town', 
  'Malepadu', 
  'Kadiri', 
  'Rayachoty', 
  'Galiveedu',
  'Punganoor',
  'Vayalpadu'
];

const SearchableAreaSelector = ({
  value,
  onChange,
  theme = 'light',
  placeholder = 'Select your service area',
  areas = defaultAreas
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const handleSelect = (areaName) => {
    onChange(areaName);
    setIsOpen(false);
    setSearch('');
  };

  const filteredAreas = areas.filter(area =>
    area.toLowerCase().includes(search.toLowerCase())
  );

  const isDark = theme === 'dark';
  
  const bgInput = isDark ? 'bg-slate-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-100 text-slate-800 focus:border-indigo-500';
  const bgDropdown = isDark ? 'bg-[#111827] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-800';
  const hoverItem = isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderCol = isDark ? 'border-white/5' : 'border-slate-100';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition-all relative cursor-pointer outline-none ${bgInput}`}
      >
        <div className="flex items-center gap-2.5">
          <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 ${textMuted}`} size={18} />
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className={textMuted}>{placeholder}</span>
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
              placeholder="Search area..."
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

          {/* Area List */}
          <div className="max-h-48 overflow-y-auto p-2 space-y-1">
            {filteredAreas.map(area => {
              const selected = value === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleSelect(area)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${hoverItem} ${
                    selected 
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' 
                      : 'text-slate-400 hover:text-white border border-transparent'
                  } ${!isDark && !selected ? 'text-slate-700 hover:bg-slate-50' : ''} ${!isDark && selected ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}`}
                >
                  <span>{area}</span>
                  {selected && <Check size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />}
                </button>
              );
            })}
            {filteredAreas.length === 0 && (
              <p className={`p-4 text-xs italic text-center ${textMuted}`}>No areas found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableAreaSelector;
