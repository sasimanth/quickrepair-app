import React from 'react';

const Disclaimer = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold font-heading mb-8">Disclaimer</h1>
      <p className="text-gray-500 mb-8 italic">Last Updated: April 2026</p>
      
      <div className="prose max-w-none text-gray-700">
        <p className="mb-4">The information provided by Fixvo on our platform is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Service Estimates</h2>
        <p className="mb-4">Repair estimates provided online are provisional, based on your initial description of the problem. The final cost may change once the technician inspects the appliance in person. You will always be informed of any price changes before work begins.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Manufacturer Defects</h2>
        <p className="mb-4">Fixvo is not responsible for inherent manufacturer defects, structural deterioration, or past damages to appliances. Interventions by our technicians are geared towards fixing the immediate reported issue.</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Links</h2>
        <p className="mb-4">Our platform may contain links to external websites or payment gateways. We do not investigate, monitor, or check these external platforms for accuracy or reliability, though we partner only with trusted industry leaders.</p>
      </div>
    </div>
  );
};

export default Disclaimer;
