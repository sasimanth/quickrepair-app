import React from 'react';
import { MapPin, Navigation, ChevronDown, RefreshCw } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

const LocationHeader = () => {
  const { location, loadingLocation, openLocationExplanationModal } = useLocation();

  const area = location?.area || 'Select Location';
  const city = location?.city || '';
  const isGps = location?.isRealGps;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Location Display */}
        <button
          onClick={openLocationExplanationModal}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
            <MapPin size={18} className="animate-pulse text-sky-400" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isGps ? '📍 GPS Location' : '📍 Selected Location'}
              </span>
              {isGps && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                {area}{city ? `, ${city}` : ''}
              </span>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-white transition-colors shrink-0" />
            </div>
          </div>
        </button>

        {/* Right: Change Location / Refresh Button */}
        <button
          onClick={openLocationExplanationModal}
          disabled={loadingLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-sky-400 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shrink-0"
        >
          {loadingLocation ? (
            <RefreshCw size={13} className="animate-spin text-sky-400" />
          ) : (
            <Navigation size={13} />
          )}
          <span>{loadingLocation ? 'Detecting...' : 'Change'}</span>
        </button>

      </div>
    </div>
  );
};

export default LocationHeader;
