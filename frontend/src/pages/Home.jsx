import { Link } from 'react-router-dom';
import { Settings, Clock, ShieldCheck, MapPin } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Fix Your Devices <br />
          <span className="text-blue-600">Fast & Securely</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Connect with trusted, expert technicians in your area for quick and transparent electronics repair. We bring the repair to you.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/signup"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-50 border border-blue-100 transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
          <p className="text-gray-600">Our technicians prioritize speed without compromising quality, getting your device back ASAP.</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Trusted Experts</h3>
          <p className="text-gray-600">Every technician on our platform is vetted and rated by the community for peace of mind.</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Local Support</h3>
          <p className="text-gray-600">Find help nearby. We connect you with local professionals right in your neighborhood.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
