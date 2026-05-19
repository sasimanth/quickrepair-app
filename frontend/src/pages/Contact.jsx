import React, { useState } from 'react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      message: formData.get('message'),
    };
    try {
      // Use full URL or proxy handled by vite/create-react-app
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to send message');
      setSubmitted(true);
      e.target.reset();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold font-heading mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Have a question or need emergency assistance? Our team is available 24/7 to help you out.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Contact Info */}
        <div className="bg-blue-600 text-white p-10 flex flex-col justify-between hidden md:flex">
          <div>
            <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
            <p className="text-blue-100 mb-8">We'd love to hear from you. Fill out the form or use our direct contact info below.</p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-full hidden sm:block">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Phone Support (24/7)</p>
                  <p className="font-semibold text-lg">
                    <a href="tel:9515980170" className="hover:underline">+91 95159 80170</a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-full hidden sm:block">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Email Inquiries</p>
                  <p className="font-semibold text-lg">support@fixvo.com</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <p className="italic text-blue-200 border-l-4 border-blue-400 pl-4 py-2">
              "We prioritize urgent requests. For emergency leaks or electrical faults, please call immediately."
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="p-10">
          <h2 className="text-2xl font-semibold mb-6 md:hidden">Send a Message</h2>
          {submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg text-center h-full flex flex-col justify-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
              <p>Thanks for reaching out. Our support team will get back to you within 24 hours.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-6 text-blue-600 hover:underline font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && <div className="text-red-500 bg-red-100 p-3 rounded-lg text-sm">{errorMsg}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input name="firstName" required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input name="lastName" required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input name="email" required type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How can we help?</label>
                <textarea name="message" required rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Describe your issue or inquiry..."></textarea>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md disabled:bg-blue-300">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
