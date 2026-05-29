import { useState } from 'react';
import api from '../services/api';
import { Star, X, Loader2, CheckCircle } from 'lucide-react';

const ReviewModal = ({ booking, onClose, onSuccess }) => {
  const [ratings, setRatings] = useState({
    quality: 0,
    communication: 0,
    timeliness: 0,
    value: 0
  });
  
  const [hoverRatings, setHoverRatings] = useState({
    quality: 0,
    communication: 0,
    timeliness: 0,
    value: 0
  });

  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const calculateOverall = () => {
    const { quality, communication, timeliness, value } = ratings;
    if (!quality || !communication || !timeliness || !value) return 0;
    return ((quality + communication + timeliness + value) / 4);
  };

  const overallRating = calculateOverall();

  const handleRatingChange = (category, val) => {
    setRatings(prev => ({ ...prev, [category]: val }));
  };

  const handleHoverChange = (category, val) => {
    setHoverRatings(prev => ({ ...prev, [category]: val }));
  };

  const isFormValid = ratings.quality > 0 && ratings.communication > 0 && ratings.timeliness > 0 && ratings.value > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      alert("Please rate all categories.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/reviews/${booking._id}`, {
        ratingQuality: ratings.quality,
        ratingCommunication: ratings.communication,
        ratingTimeliness: ratings.timeliness,
        ratingValue: ratings.value,
        comment
      });
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { key: 'quality', label: '🛠️ Quality of Service', desc: 'Satisfaction with the repair quality' },
    { key: 'communication', label: '💬 Communication', desc: 'Technician politeness & clarity' },
    { key: 'timeliness', label: '⏰ Timeliness', desc: 'Punctuality & speed of work' },
    { key: 'value', label: '💰 Value for Money', desc: 'Fairness of the final quote' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative transform transition-all">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 relative animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => onSuccess(booking._id)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            <CheckCircle className="text-emerald-500 w-16 h-16 mb-4 animate-[bounce_1s_ease-in-out]" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Feedback Checked In!</h3>
            <p className="text-center text-sm text-slate-500 font-medium mb-2">
              Overall Rating: <span className="font-extrabold text-indigo-600 text-lg">{overallRating.toFixed(1)} / 5.0</span>
            </p>
            {overallRating <= 3 ? (
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
            <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Leave a Detailed Review</h3>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Rate your repair experience on specific criteria</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Star Rating Grid */}
              <div className="space-y-4">
                {categories.map(({ key, label, desc }) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">{label}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{desc}</p>
                    </div>
                    <div className="flex items-center gap-1 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRatings[key] || ratings[key]) >= star;
                        return (
                          <Star
                            key={star}
                            size={22}
                            className={`transition-all ${
                              active
                                ? 'fill-amber-400 text-amber-400 transform scale-110'
                                : 'fill-transparent text-slate-300 hover:text-amber-200'
                            }`}
                            onMouseEnter={() => handleHoverChange(key, star)}
                            onMouseLeave={() => handleHoverChange(key, 0)}
                            onClick={() => handleRatingChange(key, star)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Overall Live Calculator */}
              {overallRating > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex justify-between items-center text-xs animate-in fade-in duration-300">
                  <span className="font-bold text-indigo-900 uppercase tracking-wider">Calculated Rating:</span>
                  <span className="font-black text-indigo-700 text-base">{overallRating.toFixed(2)} / 5.00</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Share more details (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How was the communication?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-slate-700 resize-none text-xs"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center transform active:scale-[0.98] text-sm uppercase tracking-wider"
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
