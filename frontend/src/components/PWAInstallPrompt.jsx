import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // For Demo: Always show the banner after 3 seconds in Development
    const timer = setTimeout(() => setShowPrompt(true), 3000);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      console.log('PWA was installed');
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        alert("PWA Native Install is active! (Note: In a true production environment with HTTPS, this will directly launch the native device OS installer dialog).");
        setShowPrompt(false);
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 p-5 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1 transition-colors"
      >
        <X size={16} />
      </button>
      
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
          <Download className="text-white" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Install QuickRepair App</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">Add to your home screen for faster access, notifications, and an app-like experience.</p>
          <button
            onClick={handleInstallClick}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2 rounded-lg transition-colors shadow-sm"
          >
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
