const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');
const connectDB = require('./config/db');

dotenv.config();

const seedServices = async () => {
  try {
    await connectDB();
    
    // Check if services already exist
    const existingServices = await Service.find({});
    if (existingServices.length > 0) {
      console.log('Services already exist in database. Skipping seed.');
      process.exit(0);
    }
    
    // Default services
    const servicesToInsert = [
      {
        name: 'Screen Replacement',
        price: 99.99,
        description: 'Replace a cracked or broken smartphone or tablet screen.'
      },
      {
        name: 'Battery Replacement',
        price: 49.99,
        description: 'Replace an old, degraded battery with a fresh one.'
      },
      {
        name: 'Water Damage Repair',
        price: 149.99,
        description: 'Cleanup and repair for a device dropped in water.'
      },
      {
        name: 'Diagnostics',
        price: 29.99,
        description: 'Diagnose unknown hardware or software issues.'
      }
    ];
    
    await Service.insertMany(servicesToInsert);
    console.log('Successfully seeded default services!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding services:', err);
    process.exit(1);
  }
};

seedServices();
