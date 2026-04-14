import { 
  Wrench, Hammer, Sparkles, MoreHorizontal,
  Wind, Zap, Droplets, Snowflake, Disc,
  Tv, Bath, Utensils, Home
} from 'lucide-react';

export const globalCategories = [
  { id: 'repair', name: 'Repair Services', icon: Wrench, desc: 'Fix broken appliances and systems' },
  { id: 'installation', name: 'Installation', icon: Hammer, desc: 'Setup and mounting services' },
  { id: 'cleaning', name: 'Cleaning', icon: Sparkles, desc: 'Deep cleaning and sanitization' },
  { id: 'other', name: 'Other Services', icon: MoreHorizontal, desc: 'Pest control, painting, etc.' },
];

export const globalServices = [
  { id: 'ac_repair', categoryId: 'repair', name: 'AC Repair', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/20', img: 'https://images.unsplash.com/photo-1621245645300-305f69e96f13?q=80&w=600&auto=format&fit=crop' },
  { id: 'electrician', categoryId: 'repair', name: 'Electrician', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/20', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop' },
  { id: 'plumber', categoryId: 'repair', name: 'Plumber', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/20', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop' },
  { id: 'refrigerator', categoryId: 'repair', name: 'Refrigerator', icon: Snowflake, color: 'text-teal-500', bg: 'bg-teal-500/20', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' },
  { id: 'washing_machine', categoryId: 'repair', name: 'Washing Machine', icon: Disc, color: 'text-indigo-500', bg: 'bg-indigo-500/20', img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop' },
  
  { id: 'ac_install', categoryId: 'installation', name: 'AC Installation', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/20', img: 'https://images.unsplash.com/photo-1621245645300-305f69e96f13?q=80&w=600&auto=format&fit=crop' },
  { id: 'tv_install', categoryId: 'installation', name: 'TV Mounting', icon: Tv, color: 'text-purple-500', bg: 'bg-purple-500/20', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=600&auto=format&fit=crop' },
  { id: 'ro_install', categoryId: 'installation', name: 'RO Installation', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/20', img: 'https://images.unsplash.com/photo-1574620021381-8972bedbe2b8?q=80&w=600&auto=format&fit=crop' },
  { id: 'furniture', categoryId: 'installation', name: 'Furniture Assembly', icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-500/20', img: 'https://images.unsplash.com/photo-1622372728956-6218fdcbfa87?q=80&w=600&auto=format&fit=crop' },

  { id: 'bathroom_clean', categoryId: 'cleaning', name: 'Bathroom Cleaning', icon: Bath, color: 'text-cyan-500', bg: 'bg-cyan-500/20', img: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=600&auto=format&fit=crop' },
  { id: 'kitchen_clean', categoryId: 'cleaning', name: 'Kitchen Cleaning', icon: Utensils, color: 'text-yellow-500', bg: 'bg-yellow-500/20', img: 'https://images.unsplash.com/photo-1556910103-1c02745a5538?q=80&w=600&auto=format&fit=crop' },
  { id: 'home_clean', categoryId: 'cleaning', name: 'Full Home Clean', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-500/20', img: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600&auto=format&fit=crop' },
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
