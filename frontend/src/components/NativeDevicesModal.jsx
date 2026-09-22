import React, { useState } from 'react';
import { X, Smartphone, Tv, Wrench, ShieldCheck, Plus, CheckCircle2, ChevronRight, Cpu, Laptop, HardDrive } from 'lucide-react';

const NativeDevicesModal = ({ onClose, onRequestService }) => {
  const [devices, setDevices] = useState([
    { id: 1, name: 'Living Room Inverter AC', type: 'Air Conditioner', brand: 'Daikin 1.5 Ton', serial: 'DK-2025-9981', warranty: 'Active (Fixvo Protect)', lastService: '12 Aug 2026', status: 'Optimal' },
    { id: 2, name: 'Double Door Refrigerator', type: 'Refrigerator', brand: 'Samsung 340L', serial: 'SS-340-RF77', warranty: 'Active (Manufacturer)', lastService: '04 Jun 2026', status: 'Optimal' },
    { id: 3, name: 'Front Load Washing Machine', type: 'Washing Machine', brand: 'Bosch 8Kg', serial: 'BS-800-WM12', warranty: 'Expired', lastService: '15 Jan 2026', status: 'Needs Service' },
    { id: 4, name: 'RO Water Purifier', type: 'Water Purifier', brand: 'Kent Grand Plus', serial: 'KT-RO-4421', warranty: 'Active (Fixvo Protect)', lastService: '01 Jul 2026', status: 'Filter Change Due' }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', type: 'Air Conditioner', brand: '', serial: '' });

  const handleAddDevice = (e) => {
    e.preventDefault();
    if (!newDevice.name.trim() || !newDevice.brand.trim()) return;

    const device = {
      id: Date.now(),
      name: newDevice.name,
      type: newDevice.type,
      brand: newDevice.brand,
      serial: newDevice.serial || 'N/A',
      warranty: 'Active (Fixvo Care)',
      lastService: 'Registered Today',
      status: 'Optimal'
    };

    setDevices([device, ...devices]);
    setNewDevice({ name: '', type: 'Air Conditioner', brand: '', serial: '' });
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white border-0 sm:border border-slate-200 rounded-none sm:rounded-[2rem] w-full h-full sm:h-auto min-h-[100dvh] sm:min-h-0 sm:max-w-lg sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative font-sans text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">My Native Devices & Appliances</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Manage home devices, warranties & 1-click service requests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer shadow-xs shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
                Fixvo Smart Hub
              </span>
              <h4 className="text-sm font-black">All registered devices covered under Fixvo Protection</h4>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 font-black rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer border-none shadow-xs shrink-0"
            >
              <Plus size={16} /> Add Device
            </button>
          </div>

          {/* Add Device Form */}
          {showAddForm && (
            <form onSubmit={handleAddDevice} className="bg-slate-50 border border-blue-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Add New Native Device</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Device Name / Location</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Master Bedroom AC"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Device Category</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option>Air Conditioner</option>
                    <option>Refrigerator</option>
                    <option>Washing Machine</option>
                    <option>Water Purifier</option>
                    <option>Smart TV / Entertainment</option>
                    <option>Laptop / Computer</option>
                    <option>Geyser / Water Heater</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Brand & Model</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. LG Inverter 1.5T"
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Serial Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-9988-12"
                    value={newDevice.serial}
                    onChange={(e) => setNewDevice({ ...newDevice, serial: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs cursor-pointer border-none shadow-xs"
                >
                  Save Device
                </button>
              </div>
            </form>
          )}

          {/* Devices List */}
          <div className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 shadow-2xs space-y-3 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                      <Cpu size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{device.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{device.brand} • <span className="font-mono text-[11px] text-slate-400">{device.serial}</span></p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    device.status === 'Optimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {device.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Warranty Cover</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={13} className="text-emerald-600" /> {device.warranty}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Serviced</span>
                    <span className="text-slate-800 font-bold mt-0.5 block">{device.lastService}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (onRequestService) onRequestService(device);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                >
                  <Wrench size={14} className="text-blue-400" /> Request Service For This Device
                </button>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span>{devices.length} Devices Registered</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-extrabold text-xs cursor-pointer border-none"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default NativeDevicesModal;
