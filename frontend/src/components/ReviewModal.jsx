import { useState } from 'react';
import api from '../services/api';
import { Star, X, Loader2, CheckCircle } from 'lucide-react';

const ReviewModal = ({ booking, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/reviews/${booking._id}`, { rating, comment });
      setSuccess(true);
      // Wait for user to interact with the success modal (Google review link or close button)
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative transform transition-all">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => onSuccess(booking._id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            <CheckCircle className="text-emerald-500 w-16 h-16 mb-4 animate-[bounce_1s_ease-in-out]" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Feedback Checked In!</h3>
            {rating <= 3 ? (
              <div className="bg-rose-50 border border-rose-200 mt-2 p-4 rounded-xl w-full">
                <p className="text-rose-800 text-center text-xs font-bold leading-relaxed">
                  We take bad experiences very seriously. A senior support rep has been instantly notified and will reach out to you within 60 minutes to resolve your issue.
                </p>
              </div>
            ) : (
              <div className="text-center mt-2 w-full">
                <p className="text-slate-500 text-sm font-medium mb-6">We're totally thrilled you loved your repair. As a growing startup, public word-of-mouth means the world to us!</p>
                <button onClick={() => { window.open('https://google.com/search?q=fixvo+reviews', '_blank'); onSuccess(booking._id); }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black tracking-wide py-3.5 px-6 rounded-xl shadow-lg shadow-slate-900/20 text-sm transition-transform active:scale-95 mb-4 border border-slate-700">
                   ⭐ Post on Google Reviews
                </button>
                <button onClick={() => onSuccess(booking._id)} className="text-slate-400 hover:text-slate-600 text-sm font-bold block w-full">Maybe Later</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Leave a Review</h3>
                <p className="text-slate-500 text-xs font-medium mt-0.5">Rate your repair experience</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <span className="text-sm font-bold text-slate-700">How would you rate the service?</span>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={36}
                      className={`transition-all ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400 transform scale-110'
                          : 'fill-transparent text-slate-300 hover:text-amber-200'
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium h-4 mt-2">
                  {['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'][hoverRating || rating]}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Share more details (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the communication?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-slate-700 resize-none"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center transform active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
