const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const LegalDocument = require('./models/LegalDocument');
const User = require('./models/User');

dotenv.config();

const initialDocuments = [
  {
    type: 'terms_conditions',
    title: 'Terms & Conditions',
    content: `
      <h2>1. Introduction</h2>
      <p>Welcome to Fixvo. By using our platform, you agree to comply with and be bound by these Terms & Conditions. Please read them carefully.</p>
      
      <h2>2. Services</h2>
      <p>Fixvo acts as an on-demand marketplace connecting customers with independent, qualified repair technicians. We do not provide physical repair services directly.</p>
      
      <h2>3. Quote Approval & Payments</h2>
      <p>All quotes are subject to user approval before work begins. Payments must be processed through the platform or verified cash exchange. Technicians cannot increase prices directly without a customer-approved quote revision.</p>
      
      <h2>4. User Responsibilities</h2>
      <p>You agree to provide accurate information regarding your service needs and location. You must ensure a safe working environment for the technician.</p>
    `,
    version: 1
  },
  {
    type: 'privacy_policy',
    title: 'Privacy Policy',
    content: `
      <h2>1. Information We Collect</h2>
      <p>We collect personal information such as name, email, phone number, location, and payment details to coordinate service delivery.</p>
      
      <h2>2. Location Data</h2>
      <p>Technicians share continuous location updates when en route. Customers share their exact address to facilitate repair location matching.</p>
      
      <h2>3. Data Protection</h2>
      <p>We use SSL encryption to safeguard all transmission. Your payment credentials are encrypted by our gateway partners and never stored on our servers.</p>
    `,
    version: 1
  },
  {
    type: 'refund_policy',
    title: 'Refund Policy',
    content: `
      <h2>1. Refund Eligibility</h2>
      <p>Refunds are evaluated for bookings where the technician failed to resolve the agreed issue, caused damage, or failed to arrive.</p>
      
      <h2>2. Process</h2>
      <p>To request a refund, submit details through customer support within 48 hours of service completion. Approved refunds clear to the original payment method in 5-7 business days.</p>
    `,
    version: 1
  },
  {
    type: 'cancellation_policy',
    title: 'Cancellation Policy',
    content: `
      <h2>1. Free Cancellation Window</h2>
      <p>Customers can cancel requests for free any time before the technician accepts the job or starts their journey.</p>
      
      <h2>2. Late Cancellation Fee</h2>
      <p>If a technician has already started their route ('En Route'), a standard ₹99 dispatch charge may apply if cancelled by the customer.</p>
    `,
    version: 1
  },
  {
    type: 'technician_terms',
    title: 'Technician Service Agreement',
    content: `
      <h2>1. Professional Standard</h2>
      <p>As a verified technician on Fixvo, you agree to maintain high professional standards, complete jobs successfully, and maintain a rating above 4.2.</p>
      
      <h2>2. Commission and Fees</h2>
      <p>Fixvo retains a 10% platform commission on all booking earnings. The remaining 90% is cleared to your wallet balance upon successful payment confirmation.</p>
      
      <h2>3. Revisions & Timeouts</h2>
      <p>ASAP job requests must be accepted within 60 seconds. All quotes and revisions must be approved by the customer before starting work.</p>
    `,
    version: 1
  },
  {
    type: 'user_agreement',
    title: 'User Agreement',
    content: `
      <h2>1. Account Registration</h2>
      <p>You must register a secure account to access Fixvo booking and dashboard services. You are responsible for keeping your password confidential.</p>
      
      <h2>2. Prohibited Activities</h2>
      <p>Users may not attempt to bypass the platform by directly hiring matched technicians. Doing so voids all service warranties and results in account suspension.</p>
    `,
    version: 1
  }
];

const seedLegal = async () => {
  try {
    await connectDB();
    console.log('connected to database');

    // Find any admin user to attribute updates to
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      // Create a dummy admin ID if none exists yet
      admin = { _id: 'admin-seeder-id' };
    }

    for (const doc of initialDocuments) {
      const exists = await LegalDocument.findOne({ type: doc.type });
      if (!exists) {
        await LegalDocument.create({
          ...doc,
          updatedBy: admin._id.toString()
        });
        console.log(`✅ Seeded legal document: ${doc.title}`);
      } else {
        console.log(`ℹ️ Document already exists: ${doc.title}`);
      }
    }

    console.log('Legal documents seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed legal documents:', error);
    process.exit(1);
  }
};

seedLegal();
