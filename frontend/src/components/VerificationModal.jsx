import React, { useState, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, CheckCircle2, ScanFace, FileSignature, X, Loader2, Camera, Upload, Check } from 'lucide-react';
import api from '../services/api';

const VerificationModal = ({ currentStatus, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Document states (contain base64 data URLs)
  const [govId, setGovId] = useState(null);
  const [govIdName, setGovIdName] = useState('');
  const [addressProof, setAddressProof] = useState(null);
  const [addressProofName, setAddressProofName] = useState('');
  const [selfie, setSelfie] = useState(null);

  // Webcam states
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Maximum file size allowed is 5MB.");
      return;
    }

    try {
      const b64 = await fileToBase64(file);
      if (type === 'gov') {
        setGovId(b64);
        setGovIdName(file.name);
      } else if (type === 'address') {
        setAddressProof(b64);
        setAddressProofName(file.name);
      } else if (type === 'selfie') {
        setSelfie(b64);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to read file.");
    }
  };

  const startCamera = async () => {
    setUseCamera(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 400, facingMode: 'user' } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.error("Camera access error:", e);
      setUseCamera(false);
      setError("Webcam access denied. Please upload a selfie manually.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop to square selfie
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    canvas.width = 300;
    canvas.height = 300;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setSelfie(dataUrl);
    stopCamera();
  };

  const handleVerifySubmit = async () => {
    if (!govId || !selfie || !addressProof) {
      setError("Please ensure all documents are loaded.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/technicians/verify', {
        governmentId: govId,
        selfie,
        addressProof
      });
      setStep(5); // Success state
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl overflow-hidden relative transform transition-all animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={handleModalClose} 
          className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full z-10 transition duration-150"
        >
          <X size={20} />
        </button>

        {step === 1 && (
          <div className="p-8 sm:p-10 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative border border-indigo-100">
              <ShieldAlert className="text-indigo-600" size={38} />
              <div className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full border-4 border-white animate-pulse"></div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Identity Verification</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              To activate your Fixvo Technician profile, we must verify your credentials.
              Please prepare your Government ID and Address Proof.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition duration-150 active:scale-98 cursor-pointer"
              >
                Begin Onboarding
              </button>
              <button onClick={handleModalClose} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl transition duration-150 cursor-pointer">
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 sm:p-10">
            <div className="mb-6 flex justify-between items-center text-xs font-black uppercase text-indigo-600 tracking-wider">
              <span>Step 1 of 4</span>
              <span>Government ID</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Upload Government ID</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Please upload a clear picture of your National ID, Passport, or Driver's license (Max 5MB).
            </p>

            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 cursor-pointer transition-colors duration-150 ${
              govId ? 'bg-indigo-50/20 border-indigo-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}>
              <input type="file" accept="image/png, image/jpeg, image/jpg, application/pdf" onChange={(e) => handleFileChange(e, 'gov')} className="hidden" />
              {govId ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} />
                  </div>
                  <p className="text-slate-800 font-bold text-sm truncate max-w-[250px]">{govIdName}</p>
                  <p className="text-slate-400 text-xs mt-1">Click to replace document</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="text-slate-400 w-12 h-12 mx-auto mb-3" />
                  <p className="text-slate-800 font-bold text-sm">Select Document File</p>
                  <p className="text-slate-400 text-xs mt-1">PNG, JPG, JPEG, or PDF up to 5MB</p>
                </div>
              )}
            </label>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition cursor-pointer">
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!govId}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 sm:p-10">
            <div className="mb-6 flex justify-between items-center text-xs font-black uppercase text-indigo-600 tracking-wider">
              <span>Step 2 of 4</span>
              <span>Address Proof</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Upload Address Proof</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Please upload a utility bill, bank statement, or rent agreement verifying your address (Max 5MB).
            </p>

            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 cursor-pointer transition-colors duration-150 ${
              addressProof ? 'bg-indigo-50/20 border-indigo-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}>
              <input type="file" accept="image/png, image/jpeg, image/jpg, application/pdf" onChange={(e) => handleFileChange(e, 'address')} className="hidden" />
              {addressProof ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} />
                  </div>
                  <p className="text-slate-800 font-bold text-sm truncate max-w-[250px]">{addressProofName}</p>
                  <p className="text-slate-400 text-xs mt-1">Click to replace document</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="text-slate-400 w-12 h-12 mx-auto mb-3" />
                  <p className="text-slate-800 font-bold text-sm">Select Proof File</p>
                  <p className="text-slate-400 text-xs mt-1">PNG, JPG, JPEG, or PDF up to 5MB</p>
                </div>
              )}
            </label>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition cursor-pointer">
                Back
              </button>
              <button 
                onClick={() => setStep(4)} 
                disabled={!addressProof}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-8 sm:p-10 text-center">
            <div className="mb-6 flex justify-between items-center text-xs font-black uppercase text-indigo-600 tracking-wider">
              <span>Step 3 of 4</span>
              <span>Selfie Match</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Capture Live Selfie</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Align your face to matching frame. This is compared to your Government ID photograph.
            </p>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 py-3 px-4 rounded-xl text-xs font-bold text-left flex items-center gap-2">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden bg-slate-950 border-4 border-indigo-50 shadow-inner flex items-center justify-center">
              {useCamera ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 border-4 border-indigo-500/50 pointer-events-none rounded-full animate-pulse"></div>
                </>
              ) : selfie ? (
                <img src={selfie} className="w-full h-full object-cover" alt="Captured Selfie" />
              ) : (
                <Camera className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-3">
              {useCamera ? (
                <button 
                  onClick={captureSelfie}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera size={18} /> Take Snapshot
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={startCamera}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera size={18} /> {selfie ? 'Retake Selfie' : 'Use Webcam'}
                  </button>
                  
                  {/* File Upload Fallback */}
                  <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer border border-slate-200 transition">
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleFileChange(e, 'selfie')} className="hidden" />
                    <Upload size={18} /> Upload Image
                  </label>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => { stopCamera(); setStep(3); }} 
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleVerifySubmit} 
                disabled={loading || !selfie}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin text-white" /> : 'Submit Verification'}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="p-8 sm:p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="text-emerald-500" size={42} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Documents Submitted!</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Your credentials are under review by our administrative team.
              We will notify you via email/SMS as soon as review is complete (usually in 12-24 hours).
            </p>

            <button 
              onClick={handleModalClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerificationModal;
