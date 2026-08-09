import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-950/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500 w-full"></div>
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-400">
              <AlertCircle size={32} />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Unable to load dashboard
            </h2>
            <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
              We encountered a temporary rendering issue. Please try refreshing or returning home.
            </p>

            {this.state.error?.message && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-left mb-6 overflow-x-auto">
                <p className="text-[11px] font-mono text-rose-400 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} /> Retry Now
              </button>
              <a
                href="/"
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <Home size={14} /> Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
