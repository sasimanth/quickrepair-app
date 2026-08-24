import { 
  Wrench, Hammer, Sparkles, MoreHorizontal,
  Wind, Zap, Droplets, Snowflake, Disc, Smartphone,
  Tv, Bath, Utensils, Home
} from 'lucide-react';

export const globalCategories = [
  { id: 'repair', name: 'Repair Services', icon: Wrench, desc: 'Fix broken appliances and systems' },
  { id: 'installation', name: 'Installation Services', icon: Hammer, desc: 'Setup and mounting services' },
  { id: 'cleaning', name: 'Cleaning Services', icon: Sparkles, desc: 'Deep cleaning and sanitization' },
  { id: 'other', name: 'Other Services', icon: MoreHorizontal, desc: 'Pest control, painting, etc.' },
];

export const globalServices = [
  // Repair
  { id: 'ac_repair', categoryId: 'repair', name: 'AC Repair', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/20', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop' },
  { id: 'washing_machine', categoryId: 'repair', name: 'Washing Machine Repair', icon: Disc, color: 'text-indigo-500', bg: 'bg-indigo-500/20', img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop' },
  { id: 'refrigerator', categoryId: 'repair', name: 'Refrigerator Repair', icon: Snowflake, color: 'text-teal-500', bg: 'bg-teal-500/20', img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=600&auto=format&fit=crop' },
  { id: 'microwave', categoryId: 'repair', name: 'Microwave Repair', icon: Sparkles, color: 'text-orange-500', bg: 'bg-orange-500/20', img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600&auto=format&fit=crop' },
  { id: 'tv_repair', categoryId: 'repair', name: 'TV Repair', icon: Tv, color: 'text-purple-500', bg: 'bg-purple-500/20', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=600&auto=format&fit=crop' },
  { id: 'laptop_repair', categoryId: 'repair', name: 'Laptop Repair', icon: Smartphone, color: 'text-slate-500', bg: 'bg-slate-500/20', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=600&auto=format&fit=crop' },
  { id: 'mobile_repair', categoryId: 'repair', name: 'Mobile Repair', icon: Smartphone, color: 'text-rose-500', bg: 'bg-rose-500/20', img: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?q=80&w=600&auto=format&fit=crop' },
  
  // Installation
  { id: 'ac_install', categoryId: 'installation', name: 'AC Installation', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/20', img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=600&auto=format&fit=crop' },
  { id: 'cctv_install', categoryId: 'installation', name: 'CCTV Installation', icon: Hammer, color: 'text-zinc-500', bg: 'bg-zinc-500/20', img: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=600&auto=format&fit=crop' },
  { id: 'ro_install', categoryId: 'installation', name: 'RO Installation', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/20', img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?q=80&w=600&auto=format&fit=crop' },
  { id: 'inverter_install', categoryId: 'installation', name: 'Inverter Installation', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/20', img: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop' },
  { id: 'fan_install', categoryId: 'installation', name: 'Ceiling Fan Installation', icon: Wind, color: 'text-slate-500', bg: 'bg-slate-500/20', img: 'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=600&auto=format&fit=crop' },
  { id: 'lock_install', categoryId: 'installation', name: 'Door Lock Installation', icon: Hammer, color: 'text-yellow-600', bg: 'bg-yellow-600/20', img: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=600&auto=format&fit=crop' },
  { id: 'furniture', categoryId: 'installation', name: 'Furniture Assembly', icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-500/20', img: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=600&auto=format&fit=crop' },

  // Cleaning
  { id: 'sofa_clean', categoryId: 'cleaning', name: 'Sofa Cleaning', icon: Sparkles, color: 'text-rose-500', bg: 'bg-rose-500/20', img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=600&auto=format&fit=crop' },
  { id: 'bathroom_clean', categoryId: 'cleaning', name: 'Bathroom Deep Cleaning', icon: Bath, color: 'text-cyan-500', bg: 'bg-cyan-500/20', img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=600&auto=format&fit=crop' },
  { id: 'water_tank_clean', categoryId: 'cleaning', name: 'Water Tank Cleaning', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-600/20', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop' },
  { id: 'carpet_clean', categoryId: 'cleaning', name: 'Carpet Cleaning', icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-400/20', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop' },
  { id: 'kitchen_clean', categoryId: 'cleaning', name: 'Kitchen Cleaning', icon: Utensils, color: 'text-yellow-500', bg: 'bg-yellow-500/20', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop' },
  { id: 'home_clean', categoryId: 'cleaning', name: 'Full Home Cleaning', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-500/20', img: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600&auto=format&fit=crop' },

  // Other Services
  { id: 'pest_control', categoryId: 'other', name: 'Pest Control', icon: MoreHorizontal, color: 'text-zinc-500', bg: 'bg-zinc-500/20', img: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?q=80&w=600&auto=format&fit=crop' },
  { id: 'electric_wiring', categoryId: 'other', name: 'Electric Wiring', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/20', img: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=600&auto=format&fit=crop' },
  { id: 'plumbing_work', categoryId: 'other', name: 'Plumbing Work', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/20', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop' },
  { id: 'furniture_repair', categoryId: 'other', name: 'Furniture Repair', icon: Hammer, color: 'text-orange-600', bg: 'bg-orange-600/20', img: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=600&auto=format&fit=crop' },
  { id: 'painting', categoryId: 'other', name: 'Painting', icon: MoreHorizontal, color: 'text-pink-500', bg: 'bg-pink-500/20', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop' },
];

export const globalProblems = {
  ac_repair: [
    { id: 'ac_not_cooling', label: 'AC Not Cooling', minPrice: 800, maxPrice: 2000 },
    { id: 'ac_noise', label: 'Making loud noise', minPrice: 500, maxPrice: 1500 },
    { id: 'ac_water', label: 'Water dripping', minPrice: 400, maxPrice: 1200 },
    { id: 'ac_other', label: 'Other/I don\'t know', minPrice: 300, maxPrice: 2500 },
  ],
  electrician: [
    { id: 'elec_no_power', label: 'No Power / Tripping', minPrice: 300, maxPrice: 1500 },
    { id: 'elec_switch', label: 'Switch/Socket Repair', minPrice: 150, maxPrice: 500 },
    { id: 'elec_fan', label: 'Fan/Light issue', minPrice: 200, maxPrice: 800 },
    { id: 'elec_wiring', label: 'Wiring Issue', minPrice: 500, maxPrice: 3000 },
    { id: 'elec_other', label: 'Other/I don\'t know', minPrice: 200, maxPrice: 2000 },
  ],
  plumber: [
    { id: 'plum_leak', label: 'Pipe Leakage', minPrice: 300, maxPrice: 1000 },
    { id: 'plum_blockage', label: 'Drain Blockage', minPrice: 400, maxPrice: 1500 },
    { id: 'plum_tap', label: 'Tap/Shower Repair', minPrice: 150, maxPrice: 600 },
    { id: 'plum_motor', label: 'Water Motor Issue', minPrice: 500, maxPrice: 2000 },
    { id: 'plum_other', label: 'Other/I don\'t know', minPrice: 200, maxPrice: 1500 },
  ],
  refrigerator: [
    { id: 'ref_not_cooling', label: 'Not Cooling', minPrice: 600, maxPrice: 2500 },
    { id: 'ref_noise', label: 'Making Noise/Vibration', minPrice: 400, maxPrice: 1000 },
    { id: 'ref_leak', label: 'Water Leakage', minPrice: 300, maxPrice: 800 },
    { id: 'ref_other', label: 'Other Issue', minPrice: 200, maxPrice: 2000 },
  ],
  washing_machine: [
    { id: 'wm_not_starting', label: 'Not Starting', minPrice: 500, maxPrice: 2000 },
    { id: 'wm_water', label: 'Water Not Draining/Filling', minPrice: 400, maxPrice: 1500 },
    { id: 'wm_spin', label: 'Drum Not Spinning', minPrice: 600, maxPrice: 2500 },
    { id: 'wm_other', label: 'Other Issue', minPrice: 300, maxPrice: 2000 },
  ],
  mobile_repair: [
    { id: 'mob_screen', label: 'Screen Replacement', minPrice: 1500, maxPrice: 8000 },
    { id: 'mob_battery', label: 'Battery Replacement', minPrice: 800, maxPrice: 2500 },
    { id: 'mob_port', label: 'Charging Port Issue', minPrice: 400, maxPrice: 1200 },
    { id: 'mob_other', label: 'Other/Software Issue', minPrice: 300, maxPrice: 2000 },
  ],
  ac_install: [
    { id: 'aci_split', label: 'Split AC Installation' },
    { id: 'aci_window', label: 'Window AC Installation' },
    { id: 'acu_split', label: 'Split AC Uninstallation' },
    { id: 'acu_window', label: 'Window AC Uninstallation' },
  ],
  tv_install: [
    { id: 'tv_wall', label: 'Wall Mounting (Up to 55")' },
    { id: 'tv_wall_large', label: 'Wall Mounting (Above 55")' },
    { id: 'tv_unmount', label: 'TV Unmounting' },
  ],
  ro_install: [
    { id: 'ro_install', label: 'RO Water Purifier Installation' },
    { id: 'ro_unmount', label: 'RO Uninstallation' },
    { id: 'ro_filter', label: 'Filter Replacement' },
  ],
  furniture: [
    { id: 'furn_bed', label: 'Bed Assembly' },
    { id: 'furn_wardrobe', label: 'Wardrobe Assembly' },
    { id: 'furn_table', label: 'Table/Chair Assembly' },
    { id: 'furn_other', label: 'Other Furniture' },
  ],
  bathroom_clean: [
    { id: 'bc_single', label: '1 Bathroom Deep Clean' },
    { id: 'bc_double', label: '2 Bathrooms Deep Clean' },
    { id: 'bc_triple', label: '3 Bathrooms Deep Clean' },
  ],
  kitchen_clean: [
    { id: 'kc_basic', label: 'Basic Kitchen Cleaning' },
    { id: 'kc_deep', label: 'Deep Kitchen Cleaning (with Chimney)' },
  ],
  home_clean: [
    { id: 'hc_1bhk', label: '1 BHK Full Home Clean' },
    { id: 'hc_2bhk', label: '2 BHK Full Home Clean' },
    { id: 'hc_3bhk', label: '3 BHK+ Full Home Clean' },
  ],
};

import api from '../services/api';

export const getDbServices = async () => {
  try {
    const { data } = await api.get('/services');
    return data.map(dbSvc => {
      const staticSvc = globalServices.find(s => s.id === dbSvc.id) || {};
      // Wrench imported at top
      return {
        ...dbSvc,
        img: dbSvc.image || staticSvc.img,
        icon: staticSvc.icon
      };
    });
  } catch (err) {
    return globalServices;
  }
};
