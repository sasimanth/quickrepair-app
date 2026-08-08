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
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <MapPin className="text-blue-600" /> Saved Addresses
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage locations for your doorstep service visits</p>
        </div>
        <button
          onClick={() => {
            setAddressEditId(null);
            setAddressForm({ type: 'Home', name: '', details: '', isDefault: false });
            setShowAddressForm(!showAddressForm);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-600/10 cursor-pointer"
        >
          {showAddressForm ? <X size={14} /> : <Plus size={14} />}
          {showAddressForm ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {showAddressForm && (
        <form onSubmit={handleAddAddress} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <h3 className="font-extrabold text-sm text-slate-900">{addressEditId ? 'Edit Address' : 'Add New Address'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">Address Type</label>
              <select
                value={addressForm.type}
                onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-xs focus:border-blue-600"
              >
                <option value="Home">🏡 Home</option>
                <option value="Office">💼 Office</option>
                <option value="Other">📍 Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">Label / Name</label>
              <input
                required
                type="text"
                placeholder="e.g. My Apartment, Mom's House"
                value={addressForm.name}
                onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-xs focus:border-blue-600"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">Full Street Address & Landmarks</label>
            <textarea
              required
              rows={2.5}
              placeholder="e.g. Flat 302, Building A, Main Road, Madanapalle"
              value={addressForm.details}
              onChange={(e) => setAddressForm({ ...addressForm, details: e.target.value })}
              className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 text-xs focus:border-blue-600 resize-none"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="w-4.5 h-4.5 text-blue-600 rounded bg-white border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-extrabold">Set as default service address</span>
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-600/10"
          >
            Save Address
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-500 font-semibold text-sm">
            No saved addresses found. Click "Add New" above to save your service address.
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-blue-300 bg-blue-50/40 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {addr.type === 'Home' ? '🏡' : addr.type === 'Office' ? '💼' : '📍'}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{addr.name}</h3>
                  </div>
                  {addr.isDefault && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">{addr.details}</p>
              </div>

              <div className="flex justify-between items-center pt-3.5 border-t border-slate-100 mt-2">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleMarkAddressDefault(addr.id)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold uppercase tracking-wider cursor-pointer border-none bg-transparent outline-none"
                  >
                    Set as Primary
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle size={12} /> Primary Address ✓
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
                    className="text-xs text-slate-500 hover:text-blue-600 font-semibold cursor-pointer border-none bg-transparent outline-none"
                  >
                    Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer border-none bg-transparent outline-none"
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
