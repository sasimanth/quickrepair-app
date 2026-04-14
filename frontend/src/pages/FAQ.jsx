import React, { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How fast can a technician arrive?",
      answer: "In major areas, we aim to have a technician at your door within 2 hours. You can also schedule an appointment for a specific date and time that suits you."
    },
    {
      question: "Do I need to provide tools or parts?",
      answer: "No! Our technicians arrive fully equipped with professional tools. If specific replacement parts are needed for your appliance, they will procure them and add the cost transparently to your final bill."
    },
    {
      question: "Is there a guarantee on the repair?",
      answer: "Absolutely. Every QuickRepair service comes with a 7-day workmanship guarantee. If the same issue returns within a week, we fix it for free."
    },
    {
      question: "How do I pay?",
      answer: "We support secure online payments via credit/debit card, UPI, and net banking right from your dashboard. We do not encourage direct cash payments to technicians for your security."
    },
    {
      question: "Are your technicians trustworthy?",
      answer: "Yes, 100%. Every technician undergoes a strict 3-step background verification process, including identity checks, criminal record checks, and a technical skills assessment."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl flex-grow">
      <h1 className="text-4xl font-bold font-heading mb-4 text-center">Frequently Asked Questions</h1>
      <p className="text-gray-600 text-center mb-12">Everything you need to know about QuickRepair.</p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              className="w-full px-6 py-4 text-left font-semibold flex justify-between items-center hover:bg-gray-50 transition-colors"
              onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
            >
              <span className="text-lg">{faq.question}</span>
              <svg 
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${index === openIndex ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {index === openIndex && (
              <div className="px-6 py-4 bg-blue-50 border-t border-gray-200 text-gray-700">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
