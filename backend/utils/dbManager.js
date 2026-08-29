const mongoose = require('mongoose');
const dns = require('dns');
if (process.platform === 'win32') {
  try { dns.setServers(['8.8.8.8']); } catch (e) {}
}
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../models/User');
const Technician = require('../models/Technician');
const CustomerProfile = require('../models/CustomerProfile');
const Booking = require('../models/Booking');
const QuickBooking = require('../models/QuickBooking');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const DeviceSession = require('../models/DeviceSession');
const PushSubscription = require('../models/PushSubscription');
const PayoutLog = require('../models/PayoutLog');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const SecurityAlert = require('../models/SecurityAlert');
const LegalAcceptance = require('../models/LegalAcceptance');
const LegalDocument = require('../models/LegalDocument');
const Service = require('../models/Service');
const Contact = require('../models/Contact');

const connect = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');
  await mongoose.connect(uri);
};

// 1. Explore entire Database
const exploreDB = async () => {
  await connect();
  console.log('\n======================================================');
  console.log('📊 FIXVO PRODUCTION DATABASE HEALTH & EXPLORER');
  console.log('======================================================');
  console.log(`Database Name : ${mongoose.connection.name}`);
  console.log(`Connected Host: ${mongoose.connection.host}`);
  console.log('------------------------------------------------------');

  const collections = await mongoose.connection.db.listCollections().toArray();
  let totalDocs = 0;

  for (const col of collections) {
    const count = await mongoose.connection.collection(col.name).countDocuments();
    totalDocs += count;
    const indexes = await mongoose.connection.collection(col.name).indexes();
    const indexNames = indexes.map(i => i.name).join(', ');
    console.log(`📁 ${col.name.padEnd(20)} | ${String(count).padStart(5)} docs | Indexes: ${indexNames}`);
  }

  console.log('------------------------------------------------------');
  console.log(`Total Database Documents: ${totalDocs}`);

  // Summary breakdown of key business entities
  const adminCount = await User.countDocuments({ role: 'admin' });
  const techCount = await Technician.countDocuments();
  const customerCount = await User.countDocuments({ role: 'user' });
  const bookingCount = await Booking.countDocuments();
  const serviceCount = await Service.countDocuments();
  const legalDocCount = await LegalDocument.countDocuments();

  console.log('\n--- Business Entities Breakdown ---');
  console.log(`👑 Admin Accounts     : ${adminCount}`);
  console.log(`👨‍🔧 Technicians        : ${techCount}`);
  console.log(`👤 Customer Accounts  : ${customerCount}`);
  console.log(`📦 Bookings           : ${bookingCount}`);
  console.log(`🛠️ Catalog Services   : ${serviceCount}`);
  console.log(`📜 Legal Documents    : ${legalDocCount}`);
  console.log('======================================================\n');
  
  await mongoose.disconnect();
};

// 2. Clean test/unwanted data while preserving essential baseline
const cleanTestData = async () => {
  await connect();
  console.log('\n🧹 Starting Safe Database Cleanup...');
  console.log('------------------------------------------------------');
  
  // 1. Clean test bookings, messages, reviews, notifications
  const bRes = await Booking.deleteMany({});
  const qbRes = await QuickBooking.deleteMany({});
  const mRes = await Message.deleteMany({});
  const nRes = await Notification.deleteMany({});
  const rRes = await Review.deleteMany({});
  const pRes = await PayoutLog.deleteMany({});
  const wRes = await WithdrawalRequest.deleteMany({});
  const sRes = await SecurityAlert.deleteMany({});
  const dsRes = await DeviceSession.deleteMany({});
  const psRes = await PushSubscription.deleteMany({});

  console.log(`✅ Deleted ${bRes.deletedCount} Bookings`);
  console.log(`✅ Deleted ${qbRes.deletedCount} Quick Bookings`);
  console.log(`✅ Deleted ${mRes.deletedCount} Messages`);
  console.log(`✅ Deleted ${nRes.deletedCount} Notifications`);
  console.log(`✅ Deleted ${rRes.deletedCount} Reviews`);
  console.log(`✅ Deleted ${pRes.deletedCount} Payout Logs`);
  console.log(`✅ Deleted ${wRes.deletedCount} Withdrawal Requests`);
  console.log(`✅ Deleted ${sRes.deletedCount} Security Alerts`);
  console.log(`✅ Deleted ${dsRes.deletedCount} Device Sessions`);
  console.log(`✅ Deleted ${psRes.deletedCount} Push Subscriptions`);

  // 2. Clean test users & customer profiles (Preserve admin users!)
  const testUsers = await User.find({ role: { $ne: 'admin' } }).select('_id');
  const testUserIds = testUsers.map(u => u._id.toString());
  
  const uRes = await User.deleteMany({ role: { $ne: 'admin' } });
  const tRes = await Technician.deleteMany({});
  const cpRes = await CustomerProfile.deleteMany({ userId: { $in: testUserIds } });
  const laRes = await LegalAcceptance.deleteMany({ userId: { $in: testUserIds } });

  console.log(`✅ Deleted ${uRes.deletedCount} non-admin test users`);
  console.log(`✅ Deleted ${tRes.deletedCount} test technicians`);
  console.log(`✅ Deleted ${cpRes.deletedCount} test customer profiles`);
  console.log(`✅ Deleted ${laRes.deletedCount} test legal acceptances`);
  
  console.log('------------------------------------------------------');
  console.log('✨ Database cleanup finished! Essential admin, services & legal structures remain intact.\n');
  await mongoose.disconnect();
};

// 3. Complete seed runner
const seedAll = async () => {
  console.log('\n🌱 Running Full Production Baseline Seeding...');
  const { execSync } = require('child_process');
  const backendDir = require('path').resolve(__dirname, '..');

  console.log('1. Seeding Services Catalog & Categories...');
  execSync('node seedServices.js', { cwd: backendDir, stdio: 'inherit' });

  console.log('\n2. Seeding Legal Documents & Terms...');
  execSync('node seedLegal.js', { cwd: backendDir, stdio: 'inherit' });

  console.log('\n3. Checking / Seeding Admin Account...');
  execSync('node seedAdmin.js', { cwd: backendDir, stdio: 'inherit' });

  console.log('\n✨ All baseline production seeds completed!\n');
};

// 4. Force Index Synchronization
const syncIndexes = async () => {
  await connect();
  console.log('\n🔄 Syncing Mongoose Indexes with MongoDB Atlas...');
  const models = [User, Technician, Booking, CustomerProfile, Review, Notification, Message, DeviceSession, PushSubscription, LegalDocument, Service];
  
  for (const model of models) {
    try {
      console.log(`Syncing ${model.modelName}...`);
      await model.syncIndexes();
    } catch (e) {
      console.warn(`Notice for ${model.modelName}:`, e.message);
    }
  }
  console.log('✅ Indexes synchronized successfully.\n');
  await mongoose.disconnect();
};

// CLI Entrypoint
const action = process.argv[2] || 'explore';

const run = async () => {
  try {
    if (action === 'explore') {
      await exploreDB();
    } else if (action === 'clean') {
      await cleanTestData();
    } else if (action === 'seed') {
      await seedAll();
    } else if (action === 'sync') {
      await syncIndexes();
    } else {
      console.log(`Unknown action: ${action}. Available: explore, clean, seed, sync`);
    }
  } catch (err) {
    console.error('❌ Database Manager Error:', err);
    process.exit(1);
  }
};

run();
