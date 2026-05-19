const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
dotenv.config();

const Service = require('./models/Service');

const globalServices = [
  // Repair
  { id: 'ac_repair', categoryId: 'repair', name: 'AC Repair', color: 'text-sky-500', bg: 'bg-sky-500/20', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop', description: 'Fix your AC quickly' },
  { id: 'washing_machine', categoryId: 'repair', name: 'Washing Machine Repair', color: 'text-indigo-500', bg: 'bg-indigo-500/20', image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop', description: 'Washing machine repair service' },
  { id: 'refrigerator', categoryId: 'repair', name: 'Refrigerator Repair', color: 'text-teal-500', bg: 'bg-teal-500/20', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop', description: 'Expert fridge repair' },
  { id: 'microwave', categoryId: 'repair', name: 'Microwave Repair', color: 'text-orange-500', bg: 'bg-orange-500/20', image: 'https://images.unsplash.com/photo-1585659722983-3a6750f2fd82?q=80&w=600&auto=format&fit=crop', description: 'Microwave repair' },
  { id: 'tv_repair', categoryId: 'repair', name: 'TV Repair', color: 'text-purple-500', bg: 'bg-purple-500/20', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=600&auto=format&fit=crop', description: 'TV and electronics repair' },
  { id: 'laptop_repair', categoryId: 'repair', name: 'Laptop Repair', color: 'text-slate-500', bg: 'bg-slate-500/20', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=600&auto=format&fit=crop', description: 'Laptop repair and maintenance' },
  { id: 'mobile_repair', categoryId: 'repair', name: 'Mobile Repair', color: 'text-rose-500', bg: 'bg-rose-500/20', image: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?q=80&w=600&auto=format&fit=crop', description: 'Mobile screen and battery replacement' },
  
  // Installation
  { id: 'ac_install', categoryId: 'installation', name: 'AC Installation', color: 'text-sky-500', bg: 'bg-sky-500/20', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop', description: 'Professional AC Installation' },
  { id: 'cctv_install', categoryId: 'installation', name: 'CCTV Installation', color: 'text-zinc-500', bg: 'bg-zinc-500/20', image: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=600&auto=format&fit=crop', description: 'Security camera installation' },
  { id: 'ro_install', categoryId: 'installation', name: 'RO Installation', color: 'text-blue-500', bg: 'bg-blue-500/20', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=600&auto=format&fit=crop', description: 'Water purifier installation' },
  { id: 'inverter_install', categoryId: 'installation', name: 'Inverter Installation', color: 'text-amber-500', bg: 'bg-amber-500/20', image: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=600&auto=format&fit=crop', description: 'Inverter and battery setup' },
  { id: 'fan_install', categoryId: 'installation', name: 'Ceiling Fan Installation', color: 'text-slate-500', bg: 'bg-slate-500/20', image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600&auto=format&fit=crop', description: 'Fan installation' },
  { id: 'lock_install', categoryId: 'installation', name: 'Door Lock Installation', color: 'text-yellow-600', bg: 'bg-yellow-600/20', image: 'https://images.unsplash.com/photo-1558025137-0b4ecefb8fa1?q=80&w=600&auto=format&fit=crop', description: 'Digital and manual door lock install' },
  { id: 'furniture', categoryId: 'installation', name: 'Furniture Assembly', color: 'text-orange-500', bg: 'bg-orange-500/20', image: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=600&auto=format&fit=crop', description: 'Professional furniture assembly' },

  // Cleaning
  { id: 'sofa_clean', categoryId: 'cleaning', name: 'Sofa Cleaning', color: 'text-rose-500', bg: 'bg-rose-500/20', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=600&auto=format&fit=crop', description: 'Sofa deep cleaning' },
  { id: 'bathroom_clean', categoryId: 'cleaning', name: 'Bathroom Deep Cleaning', color: 'text-cyan-500', bg: 'bg-cyan-500/20', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=600&auto=format&fit=crop', description: 'Intensive bathroom cleaning' },
  { id: 'water_tank_clean', categoryId: 'cleaning', name: 'Water Tank Cleaning', color: 'text-blue-600', bg: 'bg-blue-600/20', image: 'https://images.unsplash.com/photo-1606558230588-ac498dd20df2?q=80&w=600&auto=format&fit=crop', description: 'Underground and overhead tank clean' },
  { id: 'carpet_clean', categoryId: 'cleaning', name: 'Carpet Cleaning', color: 'text-indigo-400', bg: 'bg-indigo-400/20', image: 'https://images.unsplash.com/photo-1581579186913-46eaeca56eb4?q=80&w=600&auto=format&fit=crop', description: 'Carpet shampooing and dry clean' },
  { id: 'kitchen_clean', categoryId: 'cleaning', name: 'Kitchen Cleaning', color: 'text-yellow-500', bg: 'bg-yellow-500/20', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop', description: 'Deep kitchen cleaning' },
  { id: 'home_clean', categoryId: 'cleaning', name: 'Full Home Cleaning', color: 'text-emerald-500', bg: 'bg-emerald-500/20', image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600&auto=format&fit=crop', description: 'Complete home deep cleaning' },

  // Other Services
  { id: 'pest_control', categoryId: 'other', name: 'Pest Control', color: 'text-zinc-500', bg: 'bg-zinc-500/20', image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=600&auto=format&fit=crop', description: 'Pest eradication services' },
  { id: 'electric_wiring', categoryId: 'other', name: 'Electric Wiring', color: 'text-amber-500', bg: 'bg-amber-500/20', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop', description: 'Home electrical wiring' },
  { id: 'plumbing_work', categoryId: 'other', name: 'Plumbing Work', color: 'text-blue-500', bg: 'bg-blue-500/20', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600&auto=format&fit=crop', description: 'Plumbing and pipe repairs' },
  { id: 'furniture_repair', categoryId: 'other', name: 'Furniture Repair', color: 'text-orange-600', bg: 'bg-orange-600/20', image: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=600&auto=format&fit=crop', description: 'Woodwork and furniture repair' },
  { id: 'painting', categoryId: 'other', name: 'Painting', color: 'text-pink-500', bg: 'bg-pink-500/20', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop', description: 'Professional residential painting' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    await Service.deleteMany({});
    await Service.insertMany(globalServices);

    console.log('Services seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
