const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const dns = require('dns');

// Fix potential MongoDB DNS lookup issue on some environments
dns.setServers(['8.8.8.8']);
dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI environment variable is missing in .env');
      process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@fixvo.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️ Admin account (${adminEmail}) already exists. No action taken.`);
      
      // Ensure role is exactly 'admin'
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('🔄 Updated existing user role to admin.');
      }
      
      process.exit(0);
    }

    console.log('🔑 Creating new secure admin account...');
    const salt = await bcrypt.genSalt(10);
    const password = process.env.ADMIN_RECOVERY_PASSWORD || 'AdminFixvo2026!';
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin',
      isPremium: true
    });

    console.log('🎉 Admin account seeded successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔒 Password: ${password} (change after login)`);
    console.log(`📱 Phone: ${admin.phone}`);
    console.log(`💼 Role: ${admin.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Admin Error:', error);
    process.exit(1);
  }
};

seedAdmin();
