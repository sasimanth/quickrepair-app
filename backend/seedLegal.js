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
      <h2>1. Welcome and Role of the Platform</h2>
      <p>Welcome to Fixvo. By registering, downloading, or using our platform, you agree to comply with and be bound by these Terms & Conditions. Fixvo acts strictly as an on-demand marketplace connecting customers with independent, qualified repair and maintenance technicians. We do not provide physical repair services directly and are not employers of the technicians.</p>
      
      <h2>2. User Responsibilities</h2>
      <p>Users must provide accurate, complete, and current information when creating a booking, including exact address details, contact numbers, and description of the device or issue. Users must ensure a safe, respectful, and cooperative working environment for the technician upon arrival.</p>
      
      <h2>3. Technician Responsibilities</h2>
      <p>Technicians agree to perform services with professional skill and diligence, represent their qualifications honestly, maintain necessary background checks, and respect user privacy. Technicians must coordinate all quote proposals and work approvals strictly through the Fixvo application.</p>
      
      <h2>4. Service Booking and Quote Terms</h2>
      <p>All service bookings are processed through the platform. Any diagnostic inspections result in a cost estimate or quote. Work may only begin after the customer has explicitly approved the quote in-app. Technicians are prohibited from modifying quotes or charging additional fees outside the approved quote structure.</p>
      
      <h2>5. Payment Policies</h2>
      <p>Payments for services completed must be processed through the platform using integrated online payment options or confirmed cash-on-service payments. Any off-platform payments or direct solicitation violate these terms, void service warranties, and will result in immediate account termination.</p>
      
      <h2>6. Cancellation and Dispute Handling</h2>
      <p>Cancellations are governed by our Cancellation Policy. Disputes between users and technicians should be reported to Fixvo Support within 48 hours. While Fixvo facilitates resolution, final liability for service quality and performance remains between the customer and the independent technician.</p>
      
      <h2>7. Limitations of Liability</h2>
      <p>To the maximum extent permitted by law, Fixvo shall not be liable for any indirect, incidental, special, exemplary, or consequential damages, including personal injury or property damage, arising out of or in connection with any service matches facilitated by the platform.</p>
    `,
    version: 1
  },
  {
    type: 'privacy_policy',
    title: 'Privacy Policy',
    content: `
      <h2>1. User Data Collection</h2>
      <p>We collect information you provide directly to us, including your name, email address, phone number, physical address, and device profiles, to coordinate on-demand repair bookings. We also collect usage data, device metadata, and feedback reports.</p>
      
      <h2>2. Technician Information</h2>
      <p>For technicians, we collect professional certifications, government identity records, contact details, background check status, vehicle information, and performance ratings to verify credentials and ensure safety.</p>
      
      <h2>3. Location Permissions and Tracking</h2>
      <p>To facilitate matching and arrival tracking, our mobile application collects precise geolocation data. Technicians share continuous location updates when en route to a job. Customers share location details to ensure accurate dispatching. You can enable or disable location tracking via your device settings, though this may limit service availability.</p>
      
      <h2>4. Payment Information Security</h2>
      <p>All online payment transactions are processed securely through certified PCI-DSS compliant third-party payment gateways (e.g., Stripe, Razorpay). Your payment card details, bank account credentials, or UPI details are encrypted and never stored on Fixvo servers.</p>
      
      <h2>5. Cookies and Tracking Technologies</h2>
      <p>We use cookies and similar tracking tokens to authenticate sessions, remember dashboard preferences, and analyze platform traffic patterns to optimize performance and user experience.</p>
      
      <h2>6. Data Security Measures</h2>
      <p>We implement industry-standard secure socket layers (SSL/TLS) encryption, access control walls, and database encryption to safeguard personal data. However, no transmission over the internet can be guaranteed as 100% secure.</p>
      
      <h2>7. Contact Information</h2>
      <p>If you have any questions or concerns regarding this Privacy Policy, your data rights, or location tracking, please contact our Data Protection Office at <strong>privacy@fixvo.in</strong> or via phone at <strong>+91 95159 80170</strong>.</p>
    `,
    version: 1
  },
  {
    type: 'refund_policy',
    title: 'Refund Policy',
    content: `
      <h2>1. Inspection Visits and Fees</h2>
      <p>Fixvo charges a standard inspection/diagnostic fee of ₹99 for regular users (waived entirely for Fixvo Plus members). If you cancel a booking before the technician departs, no fee is charged. Once the technician arrives and performs the diagnostic inspection, the inspection fee is non-refundable regardless of whether you proceed with the suggested repairs.</p>
      
      <h2>2. Online Payment Refunds</h2>
      <p>For online payments processed through the app, refunds will be credited back to your original payment method. Once approved by our support team, refunds typically clear within 5 to 7 business days depending on your banking institution.</p>
      
      <h2>3. Failed or Unresolved Services</h2>
      <p>If a technician is unable to resolve the agreed-upon issue, or if the repair fails within our standard warranty window (if applicable), customer support will review the case. If verified, you will receive a full refund of the repair service charges. This does not cover secondary problems or unrelated hardware failures.</p>
      
      <h2>4. Customer Cancellation Fees</h2>
      <p>Customers can cancel requests for free any time before the technician departs. If cancellation occurs after the technician is already 'En Route' to your location, a late cancellation dispatch fee of ₹99 may be deducted or billed to your account to compensate the technician for fuel and time.</p>
      
      <h2>5. Technician Cancellation</h2>
      <p>If a technician cancels the job after acceptance or fails to arrive within the guarantee window, the job will be immediately reassigned to another technician. If you choose not to proceed with a reassignment, any pre-paid amounts for that booking will be fully refunded without fees.</p>
    `,
    version: 1
  },
  {
    type: 'technician_terms',
    title: 'Technician Service Agreement',
    content: `
      <h2>1. Service Quality & Professional Standards</h2>
      <p>As a verified technician on Fixvo, you represent and warrant that you possess the necessary technical skills, equipment, and experience to carry out repair services. You agree to deliver high-quality services, maintain a professional and respectful demeanor, and keep your overall rating above 4.2 stars.</p>
      
      <h2>2. Conduct Guidelines and Safety</h2>
      <p>Technicians must wear proper identification, arrive within the scheduled time windows, and provide transparent diagnosis feedback. You are strictly prohibited from soliciting customers for off-platform repairs, sharing user contact details with third parties, or performing unauthorized activities.</p>
      
      <h2>3. Commission Rules and Wallet Balances</h2>
      <p>Fixvo retains a standard 10% platform commission on the gross total of all completed bookings (including labour and materials). The remaining 90% is credited to your technician wallet balance. Cash payments collected directly from customers are logged, and the 10% platform commission due is deducted from your online wallet balance.</p>
      
      <h2>4. Payouts and Withdrawals</h2>
      <p>Technicians can request a withdrawal of their available online balance to their registered bank account or UPI ID. The minimum payout request is ₹500. Withdrawal requests are processed by Admin within 24 to 48 hours.</p>
      
      <h2>5. Account Suspension Policies</h2>
      <p>Fixvo reserves the right to suspend or terminate technician accounts immediately for: rating drops below 4.2, safety violations, fraudulent quotes, off-platform soliciting, excessive cancellations, or failing background check updates.</p>
    `,
    version: 1
  },
  {
    type: 'user_safety',
    title: 'Community & Safety Guidelines',
    content: `
      <h2>1. Respectful Communication</h2>
      <p>Fixvo is committed to providing a safe and friendly community. Customers and technicians must treat each other with respect, courtesy, and professional dignity. Abusive language, harassment, discrimination, or physical confrontation of any kind will result in immediate and permanent ban from the platform.</p>
      
      <h2>2. Fraud Prevention and Quote Integrity</h2>
      <p>All quotes must be documented, itemized, and approved inside the Fixvo app. Technicians are prohibited from inflating pricing artificially or using low-quality materials. Customers must not attempt to alter agreed prices or request work beyond the scope of approved quotes without updating the invoice.</p>
      
      <h2>3. Prohibited Activities</h2>
      <p>To protect the safety of all users, the following are strictly prohibited:</p>
      <ul>
        <li>Bypassing the platform to arrange off-platform services or cash agreements.</li>
        <li>Sharing private phone numbers or personal credentials for off-platform work.</li>
        <li>Impersonation, sharing accounts, or allowing unverified individuals to complete assigned jobs.</li>
        <li>Submitting fake reviews, false reports, or promotional spam.</li>
      </ul>
      
      <h2>4. Reporting Violations</h2>
      <p>If you encounter safety issues, fraud attempts, or violations of these guidelines, please report them immediately to <strong>support@fixvo.in</strong> or use the in-app help center. We take all reports seriously and investigate promptly.</p>
    `,
    version: 1
  },
  {
    type: 'cancellation_policy',
    title: 'Cancellation Policy',
    content: `
      <h2>1. Free Cancellation Window</h2>
      <p>Customers may cancel any home service or repair booking free of charge up until the moment a technician accepts the job and initiates transit ("En Route"). You can cancel directly from your User Dashboard with a single tap.</p>
      
      <h2>2. Late Cancellation Dispatch Charges</h2>
      <p>If a booking is cancelled after the technician is already en route or has arrived at your registered service address, a standard dispatch and travel fee of ₹99 will apply. This fee directly compensates the independent service professional for fuel costs, time, and travel allocation.</p>
      
      <h2>3. Rescheduling Bookings</h2>
      <p>You can reschedule your booking time slot free of charge up to 2 hours prior to the scheduled start window. Rescheduling within 2 hours of technician dispatch may be treated as a late cancellation if the technician is already in transit.</p>
      
      <h2>4. Technician-Initiated Cancellations</h2>
      <p>In rare instances where an assigned technician encounters an emergency, severe traffic delay, or safety concern and must cancel the job, Fixvo will immediately reassign your booking to another top-rated technician nearby. If no suitable technician is available or if you decline the reassignment, any pre-paid amounts will be refunded in full automatically.</p>
      
      <h2>5. Abusive Cancellation Patterns</h2>
      <p>To prevent platform fraud and protect technician livelihoods, accounts exhibiting repetitive suspicious cancellations (e.g. 5+ consecutive en-route cancellations) may be subjected to temporary booking restrictions or upfront deposit requirements.</p>

      <h2>6. Contact & Support</h2>
      <p>For questions or assistance regarding cancellations, contact our customer operations team at <strong>fixvosupport@gmail.com</strong> or via phone at <strong>+91 95159 80170</strong>.</p>
    `,
    version: 1
  }
];

const seedLegal = async () => {
  try {
    await connectDB();
    console.log('Connected to database for seeding legal documents...');

    // Find any admin user to attribute updates to
    let admin = await User.findOne({ role: 'admin' });
    const adminId = admin ? admin._id.toString() : 'admin-seeder-id';

    for (const doc of initialDocuments) {
      await LegalDocument.findOneAndUpdate(
        { type: doc.type },
        { 
          ...doc, 
          updatedBy: adminId,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Upserted legal document: ${doc.title}`);
    }

    console.log('Legal documents seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed legal documents:', error);
    process.exit(1);
  }
};

seedLegal();
