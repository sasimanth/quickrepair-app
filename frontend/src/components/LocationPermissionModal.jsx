import React from 'react';
import { MapPin, Navigation, ShieldCheck, AlertCircle, X, ChevronRight, Settings } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import SearchableAreaSelector from './SearchableAreaSelector';

const LocationPermissionModal = () => {
  const {
    showExplanationModal,
    closeLocationExplanationModal,
    requestDeviceLocation,
    loadingLocation,
    permissionState,
    error,
    setManualLocation
  } = useLocation();

  if (!showExplanationModal) return null;

  const handleAllowClick = async () => {
    await requestDeviceLocation();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Top Decorative Header */}
        <div className="relative pt-8 pb-6 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <button
            onClick={closeLocationExplanationModal}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-900/30">
            <Navigation className="w-8 h-8 text-white animate-bounce" />
          </div>

          <h3 className="text-2xl font-black tracking-tight">Help Us Find Services Near You</h3>
          <p className="text-blue-100 text-xs font-medium mt-1 max-w-xs mx-auto">
            Enable device location to instantly match with top-rated technicians in your exact area.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs text-blue-900 font-medium">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Fixvo uses your location only when needed to detect nearby technicians and estimate accurate arrival times. Your privacy is strictly protected.
            </p>
          </div>

          {/* Error / State Messages */}
          {error && (
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-xs font-bold text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{error}</p>
                {permissionState === 'denied_permanently' && (
                  <p className="text-[11px] text-rose-600 font-normal">
                    To enable location, open your phone's Settings &gt; Apps &gt; Fixvo &gt; Permissions &gt; Location.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleAllowClick}
              disabled={loadingLocation}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer transform hover:-translate-y-0.5"
            >
              {loadingLocation ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Detecting GPS Location...</span>
                </div>
              ) : (
                <>
                  <MapPin size={20} />
                  <span>Allow Location</span>
                </>
              )}
            </button>

            <button
              onClick={closeLocationExplanationModal}
              disabled={loadingLocation}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
            >
              Not Now
            </button>
          </div>

          {/* Manual Selection Fallback */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Or Select Your Area Manually</p>
            <SearchableAreaSelector
              value=""
              onChange={(areaName) => setManualLocation({ area: areaName, city: areaName })}
              placeholder="Search & choose your city or area..."
              theme="light"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default LocationPermissionModal;
