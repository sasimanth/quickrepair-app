import React from 'react';
import { MapPin, Plus, Trash2, CheckCircle, Home, Briefcase, Compass, X } from 'lucide-react';

const SavedAddresses = ({
  addresses,
  handleAddAddress,
  handleDeleteAddress,
  handleMarkAddressDefault,
  showAddressForm,
  setShowAddressForm,
  addressEditId,
  setAddressEditId,
  addressForm,
  setAddressForm
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <MapPin className="text-indigo-400" /> Saved Addresses
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Manage locations for your service visits</p>
        </div>
        <button
          onClick={() => {
            setAddressEditId(null);
            setAddressForm({ type: 'Home', name: '', details: '', isDefault: false });
            setShowAddressForm(!showAddressForm);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/15 cursor-pointer"
        >
          {showAddressForm ? <X size={14} /> : <Plus size={14} />}
          {showAddressForm ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {showAddressForm && (
        <form onSubmit={handleAddAddress} className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <h3 className="font-extrabold text-sm text-slate-200">{addressEditId ? 'Edit Address' : 'Add New Address'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Address Type</label>
              <select
                value={addressForm.type}
                onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none font-semibold text-white text-xs focus:border-indigo-500"
              >
                <option value="Home">🏡 Home</option>
                <option value="Office">💼 Office</option>
                <option value="Other">📍 Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Label / Name</label>
              <input
                required
                type="text"
                placeholder="e.g. My Apartment, Mom's House"
                value={addressForm.name}
                onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none font-semibold text-white text-xs focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Full Details & Street Address</label>
            <textarea
              required
              rows={2.5}
              placeholder="e.g. Flat 302, Building A, Main Road, Madanapalle"
              value={addressForm.details}
              onChange={(e) => setAddressForm({ ...addressForm, details: e.target.value })}
              className="w-full p-4 bg-slate-950 border border-white/10 rounded-xl outline-none font-semibold text-white text-xs focus:border-indigo-500 resize-none"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="w-4.5 h-4.5 text-indigo-650 rounded bg-slate-950 border-white/10 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-300 font-extrabold">Set as default service address</span>
          </label>
          <button
            type="submit"
            className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Save Address
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/20 border border-white/5 rounded-2xl p-6 text-slate-500 font-bold text-sm">
            No saved addresses found.
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-indigo-500/40 bg-indigo-950/10 shadow-[0_4px_20px_rgba(99,102,241,0.06)]'
                  : 'border-white/5 bg-slate-900/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {addr.type === 'Home' ? '🏡' : addr.type === 'Office' ? '💼' : '📍'}
                    </span>
                    <h3 className="font-extrabold text-white text-sm tracking-tight">{addr.name}</h3>
                  </div>
                  {addr.isDefault && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">{addr.details}</p>
              </div>

              <div className="flex justify-between items-center pt-3.5 border-t border-white/5 mt-2">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleMarkAddressDefault(addr.id)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-extrabold uppercase tracking-wider cursor-pointer border-none bg-transparent outline-none"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                    <CheckCircle size={12} /> Primary Address
                  </span>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAddressEditId(addr.id);
                      setAddressForm({
                        type: addr.type,
                        name: addr.name,
                        details: addr.details,
                        isDefault: addr.isDefault
                      });
                      setShowAddressForm(true);
                    }}
                    className="text-xs text-slate-400 hover:text-indigo-400 font-semibold cursor-pointer border-none bg-transparent outline-none"
                  >
                    Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-rose-400 hover:text-rose-350 font-semibold cursor-pointer border-none bg-transparent outline-none"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedAddresses;
