const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');
const Notification = require('../models/Notification');

class DispatchService {
  constructor() {
    this.activeDispatches = new Map(); // bookingId -> { radiusIndex, timeoutId }
    this.RADII = [2, 5, 10, 50]; // Radii in km
    this.TIMEOUT_DURATION = 20 * 1000; // 20 seconds
  }

  async startDispatch(bookingId) {
    console.log(`[Dispatch] Starting progressive dispatch loop for Booking: ${bookingId}`);
    
    // Clear any existing dispatch loop for this booking
    this.cancelDispatch(bookingId);

    // Initial state
    this.activeDispatches.set(bookingId.toString(), {
      radiusIndex: 0,
      timeoutId: null
    });

    await this.processDispatchStep(bookingId);
  }

  async processDispatchStep(bookingId) {
    const dispatchState = this.activeDispatches.get(bookingId.toString());
    if (!dispatchState) {
      console.log(`[Dispatch] Dispatch state not found for ${bookingId}, terminating loop.`);
      return;
    }

    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        console.log(`[Dispatch] Booking ${bookingId} not found, terminating loop.`);
        this.activeDispatches.delete(bookingId.toString());
        return;
      }

      // If booking is no longer pending or is assigned elsewhere, stop
      if (booking.status !== 'pending' && booking.status !== 'assigned') {
        console.log(`[Dispatch] Booking ${bookingId} status is ${booking.status}, stopping loop.`);
        this.activeDispatches.delete(bookingId.toString());
        return;
      }

      // If booking is already assigned, skip search and do not set timeout
      if (booking.status === 'assigned' && booking.providerId) {
        console.log(`[Dispatch] Booking ${bookingId} is pre-assigned to tech ${booking.providerId}.`);
        
        // Find technician's name to emit correct dispatch status
        const assignedTech = await Technician.findOne({ userId: booking.providerId });
        const techName = assignedTech ? assignedTech.name : 'Technician';

        if (global.io) {
          global.io.to(`user_${booking.userId}`).emit('dispatch_status', {
            bookingId: booking._id.toString(),
            status: 'assigned',
            radius: this.RADII[dispatchState.radiusIndex],
            technicianName: techName,
            timeout: null
          });
        }

        return;
      }

      const radius = this.RADII[dispatchState.radiusIndex];
      console.log(`[Dispatch] Booking ${bookingId}: scanning at ${radius}km radius (attempt index: ${dispatchState.radiusIndex})`);

      // Emit scanning status to customer room
      if (global.io) {
        global.io.to(`user_${booking.userId}`).emit('dispatch_status', {
          bookingId: booking._id.toString(),
          status: 'scanning',
          radius: radius
        });
      }

      // Find busy technicians
      const busyTechIds = await Booking.find({
        providerId: { $ne: null },
        status: { $in: ['assigned', 'accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_pending', 'quote_approved', 'in_progress'] }
      }).distinct('providerId');

      // Exclude technicians who have already rejected or timed out
      const excludedTechs = [...(booking.rejectedTechnicians || []), ...busyTechIds];

      // Base query for online eligible technicians
      const eligibleTechQuery = {
        userId: { $nin: excludedTechs },
        currentStatus: { $in: ['online', 'available'] },
        isOnline: true
      };

      if (booking.serviceId) {
        eligibleTechQuery.services = booking.serviceId;
      }

      let matchedTech = null;

      // Try geospatial first if coordinates are available
      if (booking.latitude !== null && booking.longitude !== null) {
        const geoQuery = {
          ...eligibleTechQuery,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(booking.longitude), parseFloat(booking.latitude)]
              },
              $maxDistance: radius * 1000 // Convert km to meters
            }
          }
        };

        matchedTech = await Technician.findOne(geoQuery);
      }

      // If no GPS or no geo match, fallback to area match in the first step or if we expand beyond 10km
      if (!matchedTech) {
        // Find distinct technician areas and check if booking location matches
        const distinctAreas = await Technician.distinct('area');
        let matchedArea = null;
        const locationLower = (booking.location || '').toLowerCase();
        for (const area of distinctAreas) {
          if (area && locationLower.includes(area.toLowerCase())) {
            matchedArea = area;
            break;
          }
        }

        if (matchedArea) {
          const areaQuery = {
            ...eligibleTechQuery,
            area: matchedArea
          };
          matchedTech = await Technician.findOne(areaQuery).sort('-rating');
        }
      }

      // If we still don't have a technician, try expanding to any online tech in this step if it's the last step
      if (!matchedTech && radius === 50) {
        matchedTech = await Technician.findOne(eligibleTechQuery).sort('-rating');
      }

      if (matchedTech) {
        console.log(`[Dispatch] Found eligible tech ${matchedTech.name} (ID: ${matchedTech.userId}) at radius ${radius}km.`);
        
        // Assign booking
        const techUserDoc = await User.findById(matchedTech.userId);
        
        booking.providerId = matchedTech.userId;
        booking.providerPhone = matchedTech.phone || techUserDoc?.phone || null;
        booking.providerEmail = matchedTech.email;
        booking.status = 'assigned';
        
        const updatedBooking = await booking.save();

        // Emit socket events
        if (global.io) {
          const payload = updatedBooking.toObject();
          payload.technicianName = matchedTech.name;
          
          global.io.to(`user_${matchedTech.userId}`).emit('new_job', payload);
          global.io.to(`user_${matchedTech.userId}`).emit('new_job_request', payload);
          
          global.io.to(`user_${booking.userId}`).emit('dispatch_status', {
            bookingId: booking._id.toString(),
            status: 'assigned',
            radius: radius,
            technicianName: matchedTech.name,
            timeout: null
          });
          global.io.to(`user_${booking.userId}`).emit('job_reassigned', payload);
          global.io.to(`user_${booking.userId}`).emit('job_update', payload);
        }

        // Notify technician (Push, email, SMS, in-app notification)
        const { notifyUser } = require('./NotificationService');
        await notifyUser({
          userId: matchedTech.userId,
          email: matchedTech.email,
          phone: matchedTech.phone || techUserDoc?.phone || null,
          type: 'both',
          subject: 'New Job Assigned! 💼',
          text: `New repair request for ${booking.serviceName} at ${booking.location}.`,
          notifType: 'booking',
          bookingId: booking._id.toString()
        });

        // Trigger push to user's notifications collection
        const techNotif = await Notification.create({
          userId: matchedTech.userId,
          title: 'New Job Request 💼',
          message: `New repair request for ${booking.serviceName} at ${booking.location}.`,
          type: 'booking',
          bookingId: booking._id.toString()
        });

        if (global.io && techNotif) {
          global.io.to(`user_${matchedTech.userId}`).emit('new_notification', techNotif.toObject());
        }
      } else {
        // No technician found in this radius. Expand radius.
        if (dispatchState.radiusIndex < this.RADII.length - 1) {
          dispatchState.radiusIndex += 1;
          console.log(`[Dispatch] No tech found at ${radius}km. Expanding to next step...`);
          // Immediately schedule next step search
          setTimeout(async () => {
            await this.processDispatchStep(bookingId);
          }, 1000); // 1s cooldown between radius changes
        } else {
          console.log(`[Dispatch] Exhausted all dispatch search radii for Booking ${bookingId}. Terminating dispatch.`);
          this.activeDispatches.delete(bookingId.toString());
          
          if (global.io) {
            global.io.to(`user_${booking.userId}`).emit('dispatch_status', {
              bookingId: booking._id.toString(),
              status: 'no_tech_found'
            });
          }
        }
      }
    } catch (err) {
      console.error(`[Dispatch] Error in processDispatchStep for Booking ${bookingId}:`, err);
      this.activeDispatches.delete(bookingId.toString());
    }
  }

  async handleAcceptanceTimeout(bookingId, techUserId) {
    console.log(`[Dispatch] Timeout expired for Booking ${bookingId} and Tech ${techUserId}.`);
    
    const dispatchState = this.activeDispatches.get(bookingId.toString());
    if (!dispatchState) return;

    try {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.status === 'assigned' && booking.providerId === techUserId) {
        console.log(`[Dispatch] Reverting assignment for booking ${bookingId}.`);

        booking.rejectedTechnicians = booking.rejectedTechnicians || [];
        if (!booking.rejectedTechnicians.includes(techUserId)) {
          booking.rejectedTechnicians.push(techUserId);
        }

        const techProfile = await Technician.findOne({ userId: techUserId });
        const techName = techProfile ? techProfile.name : 'Technician';

        booking.rejectionReason = 'Response timeout (20 seconds exceeded)';
        booking.rejectedByTechName = techName;
        booking.providerId = null;
        booking.providerPhone = null;
        booking.providerEmail = null;
        booking.status = 'pending';

        if (techProfile) {
          techProfile.currentStatus = 'available';
          techProfile.currentJobId = null;
          await techProfile.save();
        }

        const savedBooking = await booking.save();

        if (global.io) {
          global.io.to(`user_${techUserId}`).emit('job_expired', { bookingId: bookingId.toString() });
          global.io.to(`user_${booking.userId}`).emit('job_rejected', {
            bookingId: booking._id.toString(),
            rejectedByTechName: booking.rejectedByTechName,
            rejectionReason: booking.rejectionReason
          });
          global.io.to(`user_${booking.userId}`).emit('job_update', savedBooking.toObject());
        }

        // Notify technician of expired assignment
        const expireNotif = await Notification.create({
          userId: techUserId,
          title: 'Request Expired ⏰',
          message: `The assigned request for ${booking.serviceName} expired because it was not accepted within 20s.`,
          type: 'booking',
          bookingId: booking._id.toString()
        });

        if (global.io && expireNotif) {
          global.io.to(`user_${techUserId}`).emit('new_notification', expireNotif.toObject());
        }

        // Send push notification about re-matching
        const { notifyUser } = require('./NotificationService');
        await notifyUser({
          userId: booking.userId,
          email: booking.userEmail,
          type: 'both',
          subject: 'Searching for nearby technicians... 🔄',
          text: `Finding the best available technician for your request. We are matching your booking with another expert.`,
          notifType: 'booking',
          bookingId: booking._id.toString()
        });

        // Trigger the next search step!
        await this.processDispatchStep(bookingId);
      }
    } catch (err) {
      console.error(`[Dispatch] Error in handleAcceptanceTimeout:`, err);
    }
  }

  cancelDispatch(bookingId) {
    const state = this.activeDispatches.get(bookingId.toString());
    if (state) {
      console.log(`[Dispatch] Cancelling dispatch loop for Booking ${bookingId}`);
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
      this.activeDispatches.delete(bookingId.toString());
    }
  }
}

module.exports = new DispatchService();
