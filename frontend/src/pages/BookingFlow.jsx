import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, Zap, Droplets, ArrowLeft, ArrowRight,
  UploadCloud, CheckCircle2, MapPin, Map, Navigation, ShieldCheck, Banknote, MessageCircle 
} from 'lucide-react';

import { globalCategories, globalServices, globalProblems } from '../data/services';

const BookingFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialService = queryParams.get('service');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dbServices, setDbServices] = useState([]);
  // Attempt to pre-fill authenticated user data
  const cachedUserStr = localStorage.getItem('user');
  const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;

  const [formData, setFormData] = useState({
    serviceId: initialService || null,
    problemId: null,
    description: '',
    address: '', // Optionally, we could populate user.address if available
    name: cachedUser?.name || '',
    phone: cachedUser?.phone || '',
    timeSlot: 'ASAP',
    areaType: '',
    transportOption: 'doorstep',
  });

  useEffect(() => {
    // Fetch REAL database services on mount
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services');
        setDbServices(data);
      } catch (err) {
        console.error("Failed to load services", err);
      }
    };
    fetchServices();
  }, []);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Auto-advance if initialService is provided
  useEffect(() => {
    if (initialService && step === 1) {
       setStep(2);
    }
  }, [initialService, step]);

  const handleServiceSelect = (id) => {
    setFormData({ ...formData, serviceId: id, problemId: null });
    nextStep();
  };

  const currentService = globalServices.find(s => s.id === formData.serviceId);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const problemLabel = globalProblems[currentService?.id]?.find(p => p.id === formData.problemId)?.label || 'Diagnostic Needed';
      
      const payload = {
        name: formData.name,
        phone: formData.phone,
        service: currentService?.name || 'Unknown Service',
        serviceId: currentService?.id || null,
        problem: problemLabel,
        problemId: formData.problemId,
        address: formData.address,
        timeSlot: formData.timeSlot,
        areaType: formData.areaType,
        transportOption: formData.transportOption,
        transportCharge: formData.transportOption === 'shop' ? 0 : (formData.areaType === 'campus' ? 20 : (formData.areaType === 'nearby' ? 50 : 100)),
      };

      const res = await api.post('/bookings', payload);
      
      if (res.data?.success) {
        setStep(5); // Proceed to success screen
      } else {
        alert(res.data?.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit request. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-12 flex flex-col relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto w-full px-4 relative z-10 flex-grow flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {step < 5 ? (
            <button onClick={() => step > 1 ? prevStep() : navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition">
              <ArrowLeft />
            </button>
          ) : (
            <div className="p-2"></div>
          )}
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-white/10'}`}></div>
            ))}
          </div>
          <div className="text-sm font-bold text-slate-400">Step {Math.min(step, 4)}/4</div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col bg-[#1A2235] rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Select Service */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">What do you need help with?</h2>
                <p className="text-slate-400 mb-8">Choose a service to continue.</p>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 pb-8">
                  {globalCategories.map((cat) => {
                    const catServices = globalServices.filter(s => s.categoryId === cat.id);
                    if (catServices.length === 0) return null;
                    return (
                      <div key={cat.id}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-300">
                          <cat.icon size={20} />
                          {cat.name}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {catServices.map((service) => (
                            <button
                              key={service.id}
                              onClick={() => handleServiceSelect(service.id)}
                              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${formData.serviceId === service.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                            >
                              <div className={`w-12 h-12 rounded-full ${service.bg} flex items-center justify-center mb-3 text-white shadow-lg`}>
                                <service.icon size={24} />
                              </div>
                              <span className="font-bold text-sm text-center">{service.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && currentService && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">What's the issue?</h2>
                <p className="text-slate-400 mb-8">Help us understand the {currentService.name} problem.</p>

                <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                  {globalProblems[currentService.id]?.map((prob) => (
                    <button
                      key={prob.id}
                      onClick={() => setFormData({...formData, problemId: prob.id})}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${formData.problemId === prob.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                    >
                      <span className="font-medium">{prob.label}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.problemId === prob.id ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/30'}`}>
                         {formData.problemId === prob.id && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-auto pt-6 flex justify-end">
                  <button 
                    onClick={nextStep}
                    disabled={!formData.problemId}
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${formData.problemId ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Details & Address */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Almost there!</h2>
                <p className="text-slate-400 mb-8">Where should we send the technician?</p>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Full Name <span className="text-red-400">*</span></label>
                       <input 
                         type="text" 
                         value={formData.name}
                         onChange={(e) => {
                           setFormData({...formData, name: e.target.value});
                           setFormErrors({...formErrors, name: null});
                         }}
                         placeholder="e.g. John Doe" 
                         className={`w-full bg-white/5 border ${formErrors.name ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition`}
                       />
                       {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-300 mb-2">Phone Number <span className="text-red-400">*</span></label>
                       <input 
                         type="tel" 
                         value={formData.phone}
                         onChange={(e) => {
                           setFormData({...formData, phone: e.target.value});
                           setFormErrors({...formErrors, phone: null});
                         }}
                         placeholder="e.g. 9876543210" 
                         className={`w-full bg-white/5 border ${formErrors.phone ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition`}
                       />
                       {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-300 mb-2">Service Address (Optional if visiting shop) <span className="text-red-400">*</span></label>
                     <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                       <input 
                         type="text" 
                         value={formData.address}
                         onChange={(e) => {
                           setFormData({...formData, address: e.target.value});
                           setFormErrors({...formErrors, address: null});
                         }}
                         placeholder="e.g. 123 Main St, Apartment 4B" 
                         className={`w-full bg-white/5 border ${formErrors.address ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition`}
                       />
                     </div>
                     {formErrors.address && <p className="text-red-400 text-xs mt-1">{formErrors.address}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Service Area <span className="text-red-400">*</span></label>
                    <div className="space-y-2">
                      {[
                        { id: 'campus', label: 'Within Campus / Very Near (0–1 km)' },
                        { id: 'nearby', label: 'Nearby Area (1–3 km)' },
                        { id: 'far', label: 'Far Area (>3 km)' }
                      ].map(area => (
                        <label key={area.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${formData.areaType === area.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                          <input 
                            type="radio" 
                            name="areaType" 
                            value={area.id} 
                            checked={formData.areaType === area.id} 
                            onChange={(e) => setFormData({...formData, areaType: e.target.value, transportOption: 'doorstep'})}
                            className="mr-3 w-4 h-4 text-blue-500 bg-transparent border-white/20 focus:ring-blue-500"
                          />
                          <span className="font-medium text-white">{area.label}</span>
                        </label>
                      ))}
                    </div>
                    {formErrors.areaType && <p className="text-red-400 text-xs mt-1">{formErrors.areaType}</p>}
                  </div>

                  {formData.areaType === 'campus' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <p className="text-sm text-emerald-100/90 font-medium mb-3">
                        You are very close to the service location. You can visit directly to save transport cost.
                      </p>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${formData.transportOption === 'shop' ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                          <input type="radio" name="transportOption" value="shop" checked={formData.transportOption === 'shop'} onChange={(e) => setFormData({...formData, transportOption: e.target.value})} className="hidden" />
                          <span className="font-bold text-sm text-white">Visit Shop (₹0)</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${formData.transportOption === 'doorstep' ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                          <input type="radio" name="transportOption" value="doorstep" checked={formData.transportOption === 'doorstep'} onChange={(e) => setFormData({...formData, transportOption: e.target.value})} className="hidden" />
                          <span className="font-bold text-sm text-white">Doorstep (₹20)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Preferred Time Slot <span className="text-red-400">*</span></label>
                    <select 
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition appearance-none"
                    >
                      <option value="ASAP" className="bg-[#1A2235]">ASAP (Immediate)</option>
                      <option value="10:00 AM" className="bg-[#1A2235]">Today 10:00 AM</option>
                      <option value="01:00 PM" className="bg-[#1A2235]">Today 01:00 PM</option>
                      <option value="04:00 PM" className="bg-[#1A2235]">Today 04:00 PM</option>
                      <option value="07:00 PM" className="bg-[#1A2235]">Today 07:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex justify-end">
                  <button 
                    onClick={() => {
                      const errors = {};
                      if (!formData.name) errors.name = "Name is required";
                      if (!formData.phone) errors.phone = "Phone is required";
                      if (!formData.address && formData.transportOption === 'doorstep') errors.address = "Address is required for doorstep service";
                      if (!formData.areaType) errors.areaType = "Area selection is required";
                      if (Object.keys(errors).length > 0) {
                        setFormErrors(errors);
                        return;
                      }
                      nextStep();
                    }}
                    className={`px-8 py-3 rounded-xl font-bold transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30`}
                  >
                    Review Booking
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Review Pricing & Confirm */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Review & Confirm</h2>
                  <p className="text-slate-400">
                    {formData.timeSlot === 'ASAP' 
                      ? "Smart Assignment will find the fastest available technician." 
                      : `You have requested service for ${formData.timeSlot}.`}
                  </p>
                </div>

                <div className="bg-[#0B0F19] rounded-2xl p-6 border border-white/5 space-y-4 mb-6">
                  <div className="flex justify-between items-start border-b border-white/10 pb-4">
                     <div>
                       <p className="text-slate-400 text-sm">Service</p>
                       <p className="font-bold text-lg text-white">{currentService?.name}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-slate-400 text-sm">Issue</p>
                       <p className="font-medium text-slate-300">
                         {globalProblems[currentService?.id]?.find(p => p.id === formData.problemId)?.label}
                       </p>
                     </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-3">
                     <div className="flex justify-between items-center w-full">
                       <span className="font-medium text-slate-300">Visiting/Inspection Fee</span>
                       <span className="font-bold text-white">₹99</span>
                     </div>
                     <div className="flex justify-between items-center w-full pb-2 border-b border-white/10">
                       <span className="font-medium text-slate-300 flex items-center gap-2">
                         Transport Charge <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{formData.transportOption === 'shop' ? 'Shop Visit' : formData.areaType}</span>
                       </span>
                       <span className="font-bold text-white">
                         ₹{formData.transportOption === 'shop' ? 0 : (formData.areaType === 'campus' ? 20 : (formData.areaType === 'nearby' ? 50 : 100))}
                       </span>
                     </div>

                     <div className="flex justify-between items-center w-full pt-1">
                       <span className="font-medium text-slate-300">Repair Estimate</span>
                       <span className="font-bold text-emerald-400">
                         {(() => {
                           const prob = globalProblems[currentService?.id]?.find(p => p.id === formData.problemId);
                           if (prob && prob.minPrice && prob.maxPrice) {
                             return `₹${prob.minPrice} - ₹${prob.maxPrice}`;
                           }
                           return "Based on Inspection";
                         })()}
                       </span>
                     </div>
                  </div>
                  
                  <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                     <div className="flex justify-between items-center w-full">
                       <span className="font-bold text-blue-400 text-lg">Total Estimated Cost</span>
                       <span className="font-extrabold text-blue-400 text-lg">
                         {(() => {
                           const visitCharge = 99;
                           const transportCharge = formData.transportOption === 'shop' ? 0 : (formData.areaType === 'campus' ? 20 : (formData.areaType === 'nearby' ? 50 : 100));
                           const baseCost = visitCharge + transportCharge;
                           
                           const prob = globalProblems[currentService?.id]?.find(p => p.id === formData.problemId);
                           if (prob && prob.minPrice && prob.maxPrice) {
                             return `₹${baseCost + prob.minPrice} - ₹${baseCost + prob.maxPrice}`;
                           }
                           return `₹${baseCost} + Repair Cost`;
                         })()}
                       </span>
                     </div>
                     <p className="text-blue-300/70 text-xs mt-2">* Final repair cost will be confirmed after inspection</p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                   <ShieldCheck className="text-emerald-400 shrink-0" />
                   <p className="text-sm text-emerald-100/80">Covered by QuickRepair 7-day service warranty.</p>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                  <button 
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white text-lg shadow-xl shadow-blue-600/30 hover:scale-[1.02] transition-transform flex justify-center items-center gap-2"
                  >
                    {loading ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Confirm & Find Technician'}
                  </button>
                  <p className="text-center text-xs text-slate-500">By confirming, you agree to our terms of service.</p>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Success & Post-Booking Actions */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full items-center justify-center text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-white">Booking Confirmed!</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md">
                  We've received your request. A technician will be assigned and contact you shortly.
                </p>
                
                <div className="flex flex-col gap-4 w-full sm:w-2/3">
                   <button 
                     onClick={() => {
                        const adminPhone = "919515980170";
                        const problemLabel = globalProblems[currentService?.id]?.find(p => p.id === formData.problemId)?.label || 'Diagnostic Needed';
                        const message = `*New Booking Confirmed:*\nCustomer Name: ${formData.name}\nPhone: ${formData.phone}\nService: ${currentService?.name}\nProblem: ${problemLabel}\nAddress: ${formData.address}\nTime: ${new Date().toLocaleString()}`;
                        window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
                     }}
                     className="w-full py-4 bg-[#25D366] hover:bg-[#1ebd5b] rounded-xl font-bold text-white text-lg shadow-xl shadow-[#25D366]/20 transition-all flex justify-center items-center gap-2"
                   >
                     <MessageCircle size={20} />
                     Chat on WhatsApp
                   </button>
                   <button 
                     onClick={() => navigate('/')}
                     className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-white transition-all"
                   >
                     Return to Home
                   </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
