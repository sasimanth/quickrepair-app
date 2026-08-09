import React from 'react';

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full"></div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full uppercase tracking-wider">
            Fixvo Legal Notice
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Legal Disclaimer</h1>
        <p className="text-slate-500 mb-10 font-medium text-sm">
          Last Updated: August 2026 | Version V1
        </p>
        
        <div className="prose max-w-none text-slate-700 space-y-6 text-sm leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">1. General Information Purpose Only</h2>
          <p>
            The information provided by Fixvo ("we," "us," or "our") on our website, mobile application, and customer portal is for general informational and scheduling purposes only. All information on the platform is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding accuracy, adequacy, or completeness.
          </p>
          
          <h2 className="text-xl font-bold text-slate-900">2. Marketplace Facilitator Role</h2>
          <p>
            Fixvo operates strictly as an on-demand technology marketplace matching independent repair service professionals ("Technicians") with customers. Fixvo does not directly employ service technicians, nor do we perform physical home repairs. Each independent technician operates as an independent contractor responsible for their diagnostic conclusions and execution quality.
          </p>

          <h2 className="text-xl font-bold text-slate-900">3. Provisional Service Estimates & Diagnostic Inspections</h2>
          <p>
            Repair estimates provided online or over the telephone are provisional figures based on user-submitted problem descriptions. Final repair costs may vary following on-site physical inspection by the assigned technician. Work will only commence after the customer explicitly reviews and approves the in-app itemized quote.
          </p>
          
          <h2 className="text-xl font-bold text-slate-900">4. Pre-Existing Damages & Manufacturer Faults</h2>
          <p>
            Fixvo and its matched technicians are not liable for inherent manufacturer defects, component corrosion, structural degradation, or pre-existing damages to appliances, wiring, or plumbing fixtures that become apparent during diagnostic inspection or disassembly.
          </p>
          
          <h2 className="text-xl font-bold text-slate-900">5. External Payment Gateways & Third-Party Links</h2>
          <p>
            Our platform integrates certified third-party payment gateways (e.g. Razorpay, Stripe) and mapping services (e.g. OpenStreetMap). We do not control or assume liability for third-party service outages, network interruptions, or payment processor delays beyond our control.
          </p>

          <h2 className="text-xl font-bold text-slate-900">6. Contact Information</h2>
          <p>
            For legal inquiries or clarification regarding this disclaimer, reach out to our legal department at <strong>legal@fixvo.in</strong> or helpline <strong>+91 95159 80170</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
