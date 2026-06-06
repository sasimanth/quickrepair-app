import { useState } from 'react';
import { Camera, Layers, CheckCircle2, Maximize2, X } from 'lucide-react';

export default function WorkProofGallery({ quotePhoto }) {
  const [activeTab, setActiveTab] = useState('before');
  const [zoomImg, setZoomImg] = useState(null);

  if (!quotePhoto) return null;

  let photos = { before: null, progress: null, after: null };

  try {
    if (quotePhoto.trim().startsWith('{')) {
      const parsed = JSON.parse(quotePhoto);
      photos.before = parsed.damagedPart || null;
      photos.progress = parsed.repairProof || null;
      photos.after = parsed.completedWork || null;
    } else {
      photos.before = quotePhoto;
    }
  } catch (err) {
    photos.before = quotePhoto;
  }

  const tabs = [
    { id: 'before', label: 'Before Repair', img: photos.before, icon: Camera, color: 'text-rose-500' },
    { id: 'progress', label: 'In Progress', img: photos.progress, icon: Layers, color: 'text-amber-500' },
    { id: 'after', label: 'Completed Work', img: photos.after, icon: CheckCircle2, color: 'text-emerald-500' }
  ];

  const activeTabs = tabs.filter(t => t.img);

  if (activeTabs.length === 0) return null;

  const currentTab = activeTabs.find(t => t.id === activeTab) || activeTabs[0];

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-6">
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <span>Work Verification Gallery</span>
      </h4>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/60 pb-3 mb-4 gap-2 overflow-x-auto">
        {activeTabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = currentTab.id === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-50/50 text-indigo-600 border-indigo-200 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={tab.color} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Image Preview Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm w-full bg-slate-900 aspect-video flex items-center justify-center group">
        <img
          src={currentTab.img}
          alt={currentTab.label}
          className="w-full h-full object-contain"
        />

        {/* Floating Zoom Action */}
        <button
          onClick={() => setZoomImg(currentTab.img)}
          className="absolute right-3 bottom-3 p-2 bg-slate-950/70 hover:bg-slate-950/85 text-white rounded-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border border-white/10 shadow-md cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Zoom Overlay Lightbox */}
      {zoomImg && (
        <div
          onClick={() => setZoomImg(null)}
          className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button
            onClick={() => setZoomImg(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={zoomImg}
            alt="Zoomed Work Proof"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
}
