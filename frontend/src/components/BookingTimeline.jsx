import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Truck, 
  MapPin, 
  Wrench, 
  FileText, 
  CheckSquare, 
  CreditCard, 
  FileCheck, 
  XCircle, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const STAGES = [
  { key: 'step_1', stepNum: 1, label: 'Booking Confirmed & Assigned', desc: 'Order placed and matched with specialist', icon: CheckCircle2 },
  { key: 'step_2', stepNum: 2, label: 'Technician Accepted & Diagnostic Quote', desc: 'Specialist confirms slot, inspects issue & sends quote', icon: UserCheck },
  { key: 'step_3', stepNum: 3, label: 'Repair Work In Progress', desc: 'Approved quote & active repair underway', icon: Wrench },
  { key: 'step_4', stepNum: 4, label: 'Job Completed & Verified', desc: 'Service completed successfully & invoice ready', icon: CheckSquare }
];

const getEffectiveStep = (status, paymentStatus) => {
  if (['completed', 'payment_completed', 'cash_completed'].includes(status) || ['completed', 'cash_completed', 'paid'].includes(paymentStatus)) {
    return 4;
  }
  if (['quote_approved', 'in_progress'].includes(status)) {
    return 3;
  }
  if (['accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_pending', 'quote_clarification', 'quote_rejected'].includes(status)) {
    return 2;
  }
  return 1; // pending, queued, assigned
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '';
  }
};

const BookingTimeline = ({ booking }) => {
  if (!booking) return null;

  const currentStatus = booking.status || 'pending';
  const paymentStatus = booking.paymentStatus || 'pending';
  const isCancelled = currentStatus === 'cancelled';
  const isRejected = currentStatus === 'rejected';
  const effectiveStep = isCancelled ? 1 : getEffectiveStep(currentStatus, paymentStatus);
  const isCompleted = effectiveStep === 4;

  const timelineEvents = booking.timelineEvents || [];

  const getEventTime = (stepNum) => {
    if (stepNum === 1) return formatDate(booking.createdAt || booking.date);
    if (stepNum === 4 && isCompleted) return formatDate(booking.updatedAt || new Date());
    if (timelineEvents.length > 0) {
      if (stepNum === 2) {
        const ev = timelineEvents.find(e => ['accepted', 'on_the_way', 'arrived', 'quote_pending'].includes(e.status));
        if (ev?.timestamp) return formatDate(ev.timestamp);
      }
      if (stepNum === 3) {
        const ev = timelineEvents.find(e => ['quote_approved', 'in_progress'].includes(e.status));
        if (ev?.timestamp) return formatDate(ev.timestamp);
      }
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs font-sans space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={16} /> Live Order Tracking Timeline
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">Real-time status updates from doorstep technician</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          isCancelled ? 'bg-rose-100 text-rose-700' :
          isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {isCompleted ? 'Completed & Paid' : currentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Cancelled Alert Banner */}
      {isCancelled && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2 text-xs text-rose-800 font-semibold">
          <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Booking Cancelled</p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Reason: {booking.cancellationReason || 'Cancelled by user'}
            </p>
          </div>
        </div>
      )}

      {/* Flipkart-Style Vertical Connected Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {STAGES.map((stage) => {
          const isDone = !isCancelled && effectiveStep > stage.stepNum;
          const isCurrent = !isCancelled && effectiveStep === stage.stepNum;
          const eventTime = getEventTime(stage.stepNum);

          const StageIcon = stage.icon;

          return (
            <div key={stage.key} className="relative flex items-start justify-between gap-4">
              
              {/* Timeline Indicator Dot / Check */}
              <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                isDone 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                  : isCurrent 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-100 animate-pulse' 
                  : 'bg-white border-slate-300 text-slate-300'
              }`}>
                {isDone ? (
                  <CheckCircle2 size={14} className="stroke-[3]" />
                ) : (
                  <StageIcon size={12} />
                )}
              </div>

              {/* Stage Description & Content */}
              <div className="flex-1">
                <h5 className={`font-extrabold text-xs tracking-tight ${
                  isDone ? 'text-slate-900' : isCurrent ? 'text-blue-600 font-black' : 'text-slate-400'
                }`}>
                  {stage.label}
                </h5>
                <p className={`text-[11px] font-medium mt-0.5 ${
                  isDone || isCurrent ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {stage.desc}
                </p>
              </div>

              {/* Timestamp */}
              {eventTime && (
                <span className="text-[10px] font-extrabold text-slate-400 shrink-0">
                  {eventTime}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingTimeline;
