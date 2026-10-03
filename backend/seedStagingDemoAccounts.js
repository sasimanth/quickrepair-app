const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

if (process.platform === 'win32') {
  try { dns.setServers(['8.8.8.8']); } catch (e) {}
}

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const User = require('./models/User');
const Technician = require('./models/Technician');

const seedDemoAccounts = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI missing in .env');
      process.exit(1);
    }

    console.log('Connecting to database for demo account seed...');
    await mongoose.connect(uri);

    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('FixvoDemo2026!', salt);

    // 1. Demo Customer Account
    let customer = await User.findOne({ email: 'demo.customer@fixvo.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Demo Customer',
        email: 'demo.customer@fixvo.com',
        phone: '9988776655',
        password: demoPasswordHash,
        role: 'user',
        isVerified: true
      });
      console.log('✅ Created Demo Customer: demo.customer@fixvo.com');
    } else {
      console.log('ℹ️ Demo Customer already exists');
    }

    // 2. Demo Technician Account
    let techUser = await User.findOne({ email: 'demo.technician@fixvo.com' });
    if (!techUser) {
      techUser = await User.create({
        name: 'Demo Specialist (Rajesh)',
        email: 'demo.technician@fixvo.com',
        phone: '9988776656',
        password: demoPasswordHash,
        role: 'technician',
        isVerified: true
      });

      await Technician.create({
        userId: techUser._id.toString(),
        name: techUser.name,
        email: techUser.email,
        phone: techUser.phone,
        services: ['ac_repair', 'washing_machine', 'plumbing_work', 'home_clean'],
        skills: ['AC Maintenance', 'Washing Machine Repair', 'Plumbing Diagnostics'],
        area: 'Madanapalle',
        experienceYears: 5,
        rating: 4.9,
        jobsCompleted: 142,
        isVerified: true,
        verificationStatus: 'approved',
        kycStatus: 'approved',
        availability: 'Available'
      });
      console.log('✅ Created Demo Technician: demo.technician@fixvo.com');
    } else {
      console.log('ℹ️ Demo Technician already exists');
    }

    // 3. Demo Admin Account
    let adminUser = await User.findOne({ email: 'demo.admin@fixvo.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Demo Administrator',
        email: 'demo.admin@fixvo.com',
        phone: '9988776657',
        password: demoPasswordHash,
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created Demo Admin: demo.admin@fixvo.com');
    } else {
      console.log('ℹ️ Demo Admin already exists');
    }

    console.log('\n✨ Demo Accounts Seed Completed Successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error seeding demo accounts:', error);
    process.exit(1);
  }
};

seedDemoAccounts();
