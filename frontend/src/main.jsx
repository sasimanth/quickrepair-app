import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute top-[-30%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/5">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">System Encountered an Error</h1>
              <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                An unexpected crash occurred. Don't worry, your sessions and data remain completely secure.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 outline-none cursor-pointer active:scale-95 shadow-lg shadow-indigo-600/15"
              >
                <RefreshCw size={14} /> Reload System
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 outline-none cursor-pointer active:scale-95 border border-white/5"
              >
                <Home size={14} /> Go Back Home
              </button>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-widest transition-colors outline-none"
              >
                {this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostics Logs'}
              </button>

              {this.state.showDetails && (
                <div className="mt-4 text-left bg-slate-950 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-rose-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
                  <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] mb-2 border-b border-white/5 pb-1">Error Trace Log</p>
                  {this.state.error?.toString()}
                  <br />
                  {this.state.error?.stack}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() || '232674695663-poi562drcj2t6s6usrh84vbbnrn7maib.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
