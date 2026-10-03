/**
 * Email layout wrapper with responsive container, Fixvo Indigo/Slate styling, and typography.
 */
const compileLayout = ({ title, preheader, contentHtml, ctaText, ctaUrl }) => {
  const ctaButton = ctaText && ctaUrl ? `
    <div style="margin: 30px 0; text-align: center;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:45px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#4f46e5">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${ctaText}</center>
      </v:roundrect>
      <![endif]-->
      <a href="${ctaUrl}" style="background-color: #4f46e5; border: none; border-radius: 6px; color: #ffffff; display: inline-block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; line-height: 45px; text-align: center; text-decoration: none; width: 200px; -webkit-text-size-adjust: none; mso-hide: all; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: background-color 0.2s;">
        ${ctaText}
      </a>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    table {
      border-collapse: collapse !important;
    }
    td {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding-bottom: 40px;
    }
    .main-table {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      overflow: hidden;
      margin-top: 40px;
    }
    .header {
      background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px 32px;
      color: #334155;
      line-height: 1.6;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #64748b;
      font-size: 13px;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .kv-table {
      width: 100%;
      margin: 20px 0;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 0;
    }
    .kv-row td {
      padding: 8px 0;
    }
    .kv-label {
      font-weight: 600;
      color: #475569;
      width: 120px;
    }
    .kv-value {
      color: #0f172a;
    }
    @media only screen and (max-width: 600px) {
      .main-table {
        width: 100% !important;
        margin-top: 0 !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 24px 16px !important;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; font-size: 0; line-height: 0;">${preheader}</span>` : ''}
  <div class="wrapper">
    <table class="main-table" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          <h1>Fixvo</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${contentHtml}
          ${ctaButton}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>© ${new Date().getFullYear()} Fixvo Inc. All rights reserved.</p>
          <p>Need help? Contact support at <a href="mailto:support@fixvo.com">support@fixvo.com</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

// Generates key-value tables for transactional info
const generateKvTable = (items) => {
  let rowsHtml = '';
  Object.keys(items).forEach(label => {
    rowsHtml += `
      <tr class="kv-row">
        <td class="kv-label">${label}</td>
        <td class="kv-value">${items[label]}</td>
      </tr>
    `;
  });
  return `<table class="kv-table" role="presentation">${rowsHtml}</table>`;
};

// --- CUSTOMER TEMPLATES ---

const customerWelcome = (name, url) => compileLayout({
  title: 'Welcome to Fixvo',
  preheader: 'Get ready for premium, fast repair services right at your door.',
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Hi ${name}, welcome to Fixvo!</h2>
    <p>We're thrilled to have you join our platform. Fixvo connects you with certified, vetted repair technicians in your neighborhood for home repairs, appliances, electronics, and plumbing.</p>
    <p>Get started today by logging into your dashboard and making your first booking request.</p>
  `,
  ctaText: 'Access Dashboard',
  ctaUrl: url || 'http://localhost:5173/dashboard'
});

const customerBookingConfirmation = (name, bookingDetails, url) => compileLayout({
  title: 'Booking Request Received',
  preheader: 'We have received your booking request and are searching for a technician.',
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Hi ${name}, booking request confirmed!</h2>
    <p>We've received your booking request. We are matching your job with qualified technicians nearby.</p>
    ${generateKvTable(bookingDetails)}
    <p>We will notify you immediately once a technician is assigned to your job.</p>
  `,
  ctaText: 'View Booking',
  ctaUrl: url
});

const customerTechAssigned = (name, techName, bookingDetails, url) => compileLayout({
  title: 'Technician Assigned',
  preheader: `${techName} has been assigned to your booking.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Good news, ${name}!</h2>
    <p>We've matched your request with our certified professional, <strong>${techName}</strong>. They are currently reviewing the details of your request.</p>
    ${generateKvTable(bookingDetails)}
    <p>You can chat directly with ${techName} or track progress from your dashboard.</p>
  `,
  ctaText: 'Open Dashboard',
  ctaUrl: url
});

const customerQuoteProposal = (name, techName, amount, details, url) => compileLayout({
  title: 'Service Quote Proposed',
  preheader: `${techName} has submitted a price estimate for your approval.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Hi ${name}, action required!</h2>
    <p><strong>${techName}</strong> has sent a pricing quote for your booking request.</p>
    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="font-size: 28px; font-weight: 700; color: #4f46e5; margin-bottom: 8px;">₹${amount}</div>
      <div style="font-size: 14px; color: #475569;"><strong>Details:</strong> ${details || 'Diagnostics and Repair Service'}</div>
    </div>
    <p>Please review and approve or decline the estimate inside your dashboard to proceed with the service.</p>
  `,
  ctaText: 'Review Estimate',
  ctaUrl: url
});

const customerPaymentReceipt = (name, amount, bookingDetails, dashboardUrl) => compileLayout({
  title: 'Payment Receipt',
  preheader: `Thank you for your payment of ₹${amount}.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Thank you, ${name}!</h2>
    <p>We've successfully processed your payment of <strong>₹${amount}</strong> for your repair service.</p>
    ${generateKvTable(bookingDetails)}
    <p>You can download invoices anytime on your portal.</p>
  `,
  ctaText: 'View Order',
  ctaUrl: dashboardUrl
});

const customerServiceCompleted = (name, techName, bookingDetails, url) => compileLayout({
  title: 'Service Completed',
  preheader: `Your service by ${techName} has been marked as completed.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">All done, ${name}!</h2>
    <p><strong>${techName}</strong> has marked your repair job as completed. We hope you are satisfied with the service!</p>
    ${generateKvTable(bookingDetails)}
    <p>Please take a moment to rate and review your experience. Reviews help keep our service community reliable and professional.</p>
  `,
  ctaText: 'Leave a Review',
  ctaUrl: url
});

// --- TECHNICIAN TEMPLATES ---

const technicianWelcome = (name, url) => compileLayout({
  title: 'Welcome to Fixvo Partner Network',
  preheader: 'Complete your registration and start receiving repair jobs nearby.',
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Hi ${name}, welcome!</h2>
    <p>Thank you for registering to become a Fixvo Professional Partner. We're reviewing your registration details.</p>
    <p>Please ensure you've uploaded your profile picture, ID documentation, and service specialties. Once verified by our admin team, you'll be able to receive booking invites, send quotes, and earn payouts.</p>
  `,
  ctaText: 'Open Partner Portal',
  ctaUrl: url || 'http://localhost:5173/dashboard'
});

const technicianProfileApproved = (name, url) => compileLayout({
  title: 'Fixvo Profile Approved!',
  preheader: 'Your profile is approved. Log in and go online to get jobs.',
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Congratulations, ${name}!</h2>
    <p>Our verification team has approved your Fixvo registration. Your profile is officially active!</p>
    <p>You can now go online in your dashboard, search for nearby jobs, receive automated booking assignments, and send estimates to customers.</p>
  `,
  ctaText: 'Go Online Now',
  ctaUrl: url
});

const technicianNewJobAssigned = (name, bookingDetails, url) => compileLayout({
  title: 'New Job Assigned',
  preheader: 'A new repair booking request is assigned to you.',
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Hi ${name}, new job alert!</h2>
    <p>A new customer booking request matching your skills has been assigned to you. Here are the job details:</p>
    ${generateKvTable(bookingDetails)}
    <p>Please review and accept or decline the job invitation promptly.</p>
  `,
  ctaText: 'Review Job Details',
  ctaUrl: url
});

const technicianQuoteApproved = (name, customerName, amount, bookingDetails, url) => compileLayout({
  title: 'Quote Approved!',
  preheader: `${customerName} approved your estimate of ₹${amount}.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Great news, ${name}!</h2>
    <p>The customer <strong>${customerName}</strong> has accepted your service estimate of <strong>₹${amount}</strong>.</p>
    ${generateKvTable(bookingDetails)}
    <p>You can now head to the customer's location or contact them directly in the chat interface to finalize the appointment.</p>
  `,
  ctaText: 'Start Service',
  ctaUrl: url
});

const technicianWithdrawalProcessed = (name, amount, referenceNo, url) => compileLayout({
  title: 'Withdrawal Payout Sent',
  preheader: `Your payout request of ₹${amount} has been processed.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Payout Processed, ${name}!</h2>
    <p>We've successfully processed your withdrawal request of <strong>₹${amount}</strong> to your registered bank account.</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <strong>Transaction reference:</strong> ${referenceNo || 'TRX-' + Math.floor(Math.random()*900000 + 100000)}<br/>
      <strong>Status:</strong> Transferred
    </div>
    <p>Funds should appear in your account shortly depending on bank processing times.</p>
  `,
  ctaText: 'View Ledger',
  ctaUrl: url
});

const technicianPaymentReleased = (name, amount, jobDetails, url) => compileLayout({
  title: 'Payment Released',
  preheader: `₹${amount} has been added to your balance.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Earnings Credited, ${name}!</h2>
    <p>The customer's payment has been released! <strong>₹${amount}</strong> has been added to your partner earnings balance.</p>
    ${generateKvTable(jobDetails)}
    <p>You can request a withdrawal to your bank account anytime from the payout tab in your dashboard.</p>
  `,
  ctaText: 'Withdraw Funds',
  ctaUrl: url
});

// --- ADMIN TEMPLATES ---

const adminNewTechRegistration = (techName, specialties, url) => compileLayout({
  title: 'New Technician Signup',
  preheader: `${techName} has registered as a service provider partner.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">New Partner Registration</h2>
    <p>A new technician, <strong>${techName}</strong>, has signed up on the platform and is awaiting profile verification.</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <strong>Name:</strong> ${techName}<br/>
      <strong>Specialties:</strong> ${specialties || 'General repairs'}<br/>
    </div>
    <p>Please review their credentials and profile status in the admin dashboard.</p>
  `,
  ctaText: 'Review Profile',
  ctaUrl: url
});

const adminWithdrawalRequest = (techName, amount, balance, url) => compileLayout({
  title: 'New Payout Request',
  preheader: `${techName} requested a payout of ₹${amount}.`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Withdrawal Request Pending</h2>
    <p>Technician partner <strong>${techName}</strong> has submitted a withdrawal request.</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <strong>Technician:</strong> ${techName}<br/>
      <strong>Request Amount:</strong> ₹${amount}<br/>
      <strong>Current Balance:</strong> ₹${balance}<br/>
    </div>
    <p>Please confirm their bank details and process the transfer via our corporate dashboard.</p>
  `,
  ctaText: 'Manage Requests',
  ctaUrl: url
});

const adminAlert = (subject, message, url) => compileLayout({
  title: 'Fixvo System Alert',
  preheader: `Attention: ${subject}`,
  contentHtml: `
    <h2 style="margin-top: 0; font-size: 20px; color: #dc2626;">System Alert: ${subject}</h2>
    <p>${message}</p>
    <p>Please check system logs or take administrative action if necessary.</p>
  `,
  ctaText: 'Admin Dashboard',
  ctaUrl: url
});

/**
 * Invoice email sent to customer after booking completion.
 * @param {object} invoice - Invoice document fields
 * @param {string} appUrl - Base URL of the Fixvo frontend
 */
const customerInvoiceEmail = (invoice, appUrl = 'https://fixvo.in') => {
  const cust = invoice.customerDetails || {};
  const biz = invoice.businessDetails || {};
  const paidMethod = (invoice.paymentMethod || 'cash').toUpperCase();
  const issueDate = invoice.issueDate
    ? new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const itemRows = (invoice.itemizedCharges || []).map(item => `
    <tr>
      <td style="padding: 10px 8px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${item.description || 'Service'}</td>
      <td style="padding: 10px 8px; font-size: 13px; color: #64748b; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.category || 'Repair'}</td>
      <td style="padding: 10px 8px; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${item.amount || 0}</td>
    </tr>
  `).join('');

  const discountRow = invoice.discountAmount > 0 ? `
    <tr>
      <td colspan="2" style="padding: 8px; font-size: 12px; color: #047857;">Promotional Discount</td>
      <td style="padding: 8px; font-size: 12px; font-weight: 700; color: #047857; text-align: right;">-₹${invoice.discountAmount}</td>
    </tr>
  ` : '';

  const gstRows = invoice.isGstApplicable ? `
    ${invoice.cgstAmount > 0 ? `
    <tr>
      <td colspan="2" style="padding: 6px 8px; font-size: 12px; color: #64748b;">CGST (${invoice.cgstRate}%)</td>
      <td style="padding: 6px 8px; font-size: 12px; color: #0f172a; text-align: right;">₹${invoice.cgstAmount}</td>
    </tr>` : ''}
    ${invoice.sgstAmount > 0 ? `
    <tr>
      <td colspan="2" style="padding: 6px 8px; font-size: 12px; color: #64748b;">SGST (${invoice.sgstRate}%)</td>
      <td style="padding: 6px 8px; font-size: 12px; color: #0f172a; text-align: right;">₹${invoice.sgstAmount}</td>
    </tr>` : ''}
  ` : '';

  const contentHtml = `
    <p style="font-size: 15px; color: #334155; margin: 0 0 6px;">Hi <strong>${cust.name || 'Valued Customer'}</strong>,</p>
    <p style="font-size: 14px; color: #475569; margin: 0 0 20px; line-height: 1.6;">
      Thank you for using <strong>Fixvo</strong>! Your service has been completed and payment received. Please find your tax invoice below for your records.
    </p>

    <!-- Invoice Header Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 14px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size: 22px; font-weight: 900; color: #0f172a; line-height: 1;">Fix<span style="color: #2563eb;">vo</span></div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${biz.tradeName || 'On-Demand Home Services & Certified Care'}</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <span style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 999px; padding: 3px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">✓ Verified Paid</span>
                <div style="font-family: monospace; font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 6px;">${invoice.invoiceNumber}</div>
                <div style="font-size: 11px; color: #64748b;">Date: ${issueDate}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Billed To / Provider -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td width="50%" style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; vertical-align: top;">
          <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Billed To</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${cust.name || 'Valued Customer'}</div>
          ${cust.phone ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px;">${cust.phone}</div>` : ''}
          ${cust.address ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${cust.address}</div>` : ''}
        </td>
        <td width="8px"></td>
        <td width="50%" style="padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; vertical-align: top;">
          <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Service Professional</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${(invoice.providerDetails || {}).name || 'Certified Fixvo Expert'}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 3px;">✓ Background Verified Partner</div>
        </td>
      </tr>
    </table>

    <!-- Line Items Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 10px 8px; font-size: 10px; color: #64748b; text-align: left; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
          <th style="padding: 10px 8px; font-size: 10px; color: #64748b; text-align: center; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Category</th>
          <th style="padding: 10px 8px; font-size: 10px; color: #64748b; text-align: right; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${discountRow}
        ${gstRows}
        <tr style="background: #eff6ff;">
          <td colspan="2" style="padding: 12px 8px; font-size: 14px; font-weight: 800; color: #1e40af;">Total Paid (${paidMethod})</td>
          <td style="padding: 12px 8px; font-size: 16px; font-weight: 900; color: #2563eb; text-align: right;">₹${invoice.totalAmount}</td>
        </tr>
      </tbody>
    </table>

    <!-- Transaction ID -->
    <p style="font-size: 11px; color: #94a3b8; font-family: monospace; margin: 0 0 18px;">
      Transaction ID: ${invoice.transactionId || 'N/A'}
    </p>

    <!-- Warranty Note -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px 16px;">
          <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px;">🛡️ 30-Day Fixvo Service Warranty</div>
          <div style="font-size: 12px; color: #1d4ed8; line-height: 1.5;">This service is protected under Fixvo's 30-day rework guarantee. For warranty claims, contact <a href="mailto:fixvosupport@gmail.com" style="color: #2563eb;">fixvosupport@gmail.com</a>.</div>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      ${biz.legalName || 'Fixvo Technologies'} • ${biz.address || 'Andhra Pradesh, India'}<br>
      ${biz.email || 'fixvosupport@gmail.com'} • ${biz.phone || '+91 95159 80170'}
    </p>
  `;

  return compileLayout({
    title: `Fixvo Invoice ${invoice.invoiceNumber}`,
    preheader: `Your Fixvo invoice ${invoice.invoiceNumber} for ₹${invoice.totalAmount}. Service completed & payment received.`,
    contentHtml,
    ctaText: 'View Bookings',
    ctaUrl: `${appUrl}/bookings`
  });
};

module.exports = {
  customerWelcome,
  customerBookingConfirmation,
  customerTechAssigned,
  customerQuoteProposal,
  customerPaymentReceipt,
  customerServiceCompleted,
  customerInvoiceEmail,

  technicianWelcome,
  technicianProfileApproved,
  technicianNewJobAssigned,
  technicianQuoteApproved,
  technicianWithdrawalProcessed,
  technicianPaymentReleased,

  adminNewTechRegistration,
  adminWithdrawalRequest,
  adminAlert
};
