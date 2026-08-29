const mongoose = require('mongoose');
const Service = require('../models/Service');
const Technician = require('../models/Technician');
const Booking = require('../models/Booking');
const CustomerProfile = require('../models/CustomerProfile');
const User = require('../models/User');
const Message = require('../models/Message');

// Known service catalog with semantic aliases and Telugu keywords
const SERVICE_CATALOG = [
  { id: 'ac_repair', name: 'AC Repair', category: 'repair', aliases: ['ac', 'air conditioner', 'ac cooling', 'ac repair', 'ac gas', 'ac servicing', 'cooling issue', 'ac not cooling', 'ac lo gas', 'ac cooling sarigga pani cheyatledu', 'ac filter', 'split ac', 'window ac'] },
  { id: 'washing_machine', name: 'Washing Machine Repair', category: 'repair', aliases: ['washing machine', 'washer', 'cloth washer', 'spin issue', 'washing machine noise', 'washing machine drum', 'battalu uthike machine', 'drain issue', 'water not draining'] },
  { id: 'refrigerator', name: 'Refrigerator Repair', category: 'repair', aliases: ['fridge', 'refrigerator', 'freezer', 'fridge cooling', 'fridge noise', 'refrigerator repair', 'ice box', 'fridge defrost'] },
  { id: 'microwave', name: 'Microwave Repair', category: 'repair', aliases: ['microwave', 'oven', 'micro oven', 'microwave heating', 'microwave not turning on'] },
  { id: 'tv_repair', name: 'TV Repair', category: 'repair', aliases: ['tv', 'television', 'led tv', 'lcd tv', 'smart tv', 'tv display', 'tv screen', 'tv sound'] },
  { id: 'laptop_repair', name: 'Laptop Repair', category: 'repair', aliases: ['laptop', 'notebook', 'macbook', 'laptop screen', 'laptop slow', 'laptop battery', 'windows repair'] },
  { id: 'mobile_repair', name: 'Mobile Repair', category: 'repair', aliases: ['mobile', 'phone', 'smartphone', 'iphone', 'android', 'screen broken', 'phone battery', 'charging port'] },
  { id: 'ac_install', name: 'AC Installation', category: 'installation', aliases: ['ac install', 'ac installation', 'ac fitting', 'ac unmount', 'ac setup', 'ac shifting'] },
  { id: 'cctv_install', name: 'CCTV Installation', category: 'installation', aliases: ['cctv', 'camera install', 'security camera', 'cctv camera', 'dvr setup'] },
  { id: 'ro_install', name: 'RO Installation', category: 'installation', aliases: ['ro', 'water purifier', 'ro filter', 'water filter', 'ro install', 'ro service', 'filter change'] },
  { id: 'inverter_install', name: 'Inverter Installation', category: 'installation', aliases: ['inverter', 'ups', 'battery backup', 'inverter install', 'inverter battery'] },
  { id: 'fan_install', name: 'Ceiling Fan Installation', category: 'installation', aliases: ['fan install', 'ceiling fan fitting', 'fan setup'] },
  { id: 'lock_install', name: 'Door Lock Installation', category: 'installation', aliases: ['door lock', 'lock install', 'lock change', 'door handle'] },
  { id: 'furniture', name: 'Furniture Assembly', category: 'installation', aliases: ['furniture assembly', 'table assembly', 'bed assembly', 'cupboard assembly'] },
  { id: 'sofa_clean', name: 'Sofa Cleaning', category: 'cleaning', aliases: ['sofa clean', 'couch cleaning', 'cushion clean'] },
  { id: 'bathroom_clean', name: 'Bathroom Deep Cleaning', category: 'cleaning', aliases: ['bathroom clean', 'toilet clean', 'washroom clean', 'bathroom deep clean'] },
  { id: 'water_tank_clean', name: 'Water Tank Cleaning', category: 'cleaning', aliases: ['water tank', 'sump cleaning', 'overhead tank clean'] },
  { id: 'carpet_clean', name: 'Carpet Cleaning', category: 'cleaning', aliases: ['carpet clean', 'rug clean', 'mat clean'] },
  { id: 'kitchen_clean', name: 'Kitchen Cleaning', category: 'cleaning', aliases: ['kitchen clean', 'chimney clean', 'kitchen deep clean'] },
  { id: 'home_clean', name: 'Full Home Cleaning', category: 'cleaning', aliases: ['home clean', 'house cleaning', 'full deep cleaning', 'flat cleaning'] },
  { id: 'pest_control', name: 'Pest Control', category: 'other', aliases: ['pest control', 'cockroach', 'termites', 'bedbugs', 'insects', 'cheemalu', 'domalu', 'pests'] },
  { id: 'electric_wiring', name: 'Electric Wiring', category: 'other', aliases: ['electrician', 'electric', 'wiring', 'switch', 'socket', 'current', 'short circuit', 'current pani', 'meter board', 'fuse', 'fan repair', 'light fix', 'power tripping'] },
  { id: 'plumbing_work', name: 'Plumbing Work', category: 'other', aliases: ['plumber', 'plumbing', 'pipe leak', 'tap repair', 'drain blockage', 'neellu leak', 'tap dripping', 'water leak', 'motor repair', 'flush repair'] },
  { id: 'furniture_repair', name: 'Furniture Repair', category: 'other', aliases: ['carpenter', 'furniture repair', 'door repair', 'wooden repair', 'wood work'] },
  { id: 'painting', name: 'Painting', category: 'other', aliases: ['painter', 'painting', 'wall paint', 'house painting', 'color veyadam', 'texture paint'] }
];

const KNOWN_AREAS = [
  'Madanapalle', 'Madanapalle Town', 'Madanapalle Bypass', 'Angallu', 'Malepadu',
  'Kadiri', 'Rayachoty', 'Galiveedu', 'Punganoor', 'Vayalpadu', 'Kurabalakota',
  'Neerugattuvaripalli', 'Basinikonda', 'Kothapalli', 'Arogyavaram', 'BT College Area'
];

/**
 * Date and time parser supporting English and Telugu terms
 */
const parseDateAndSlot = (text) => {
  const lower = text.toLowerCase();
  let date = new Date();
  let timeSlot = 'ASAP';
  let dateFound = false;

  if (lower.includes('repu') || lower.includes('tomorrow') || lower.includes('next day')) {
    date.setDate(date.getDate() + 1);
    dateFound = true;
  } else if (lower.includes('ellundi') || lower.includes('day after tomorrow')) {
    date.setDate(date.getDate() + 2);
    dateFound = true;
  } else if (lower.includes('eroju') || lower.includes('today') || lower.includes('tonight')) {
    dateFound = true;
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const currentDay = date.getDay();
        let distance = i - currentDay;
        if (distance <= 0) distance += 7;
        date.setDate(date.getDate() + distance);
        dateFound = true;
        break;
      }
    }
  }

  if (lower.includes('morning') || lower.includes('udayam') || lower.includes('subah') || lower.includes('9 am') || lower.includes('10 am') || lower.includes('11 am')) {
    timeSlot = 'Morning (9 AM - 12 PM)';
  } else if (lower.includes('afternoon') || lower.includes('madyanam') || lower.includes('dopahar') || lower.includes('1 pm') || lower.includes('2 pm') || lower.includes('3 pm')) {
    timeSlot = 'Afternoon (12 PM - 4 PM)';
  } else if (lower.includes('evening') || lower.includes('sayantram') || lower.includes('shaam') || lower.includes('5 pm') || lower.includes('6 pm') || lower.includes('7 pm')) {
    timeSlot = 'Evening (4 PM - 8 PM)';
  } else if (lower.includes('asap') || lower.includes('urgent') || lower.includes('tvaraga') || lower.includes('now') || lower.includes('immediately')) {
    timeSlot = 'ASAP (Within 30 Mins)';
  }

  return {
    dateString: date.toISOString().split('T')[0],
    timeSlot,
    hasExplicitDate: dateFound
  };
};

/**
 * Service detection
 */
const detectService = (text) => {
  const lower = text.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const s of SERVICE_CATALOG) {
    for (const alias of s.aliases) {
      if (lower.includes(alias)) {
        const score = alias.length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = s;
        }
      }
    }
  }
  return bestMatch;
};

/**
 * Area detection
 */
const detectArea = (text) => {
  const lower = text.toLowerCase();
  for (const area of KNOWN_AREAS) {
    if (lower.includes(area.toLowerCase())) {
      return area;
    }
  }
  return null;
};

/**
 * Problem description extraction
 */
const extractProblem = (text, detectedService) => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^(please|can you|i want to|i need to|i need a|book|help me fix|fixvo|naa|na)\s+/i, '');
  if (cleaned.length < 5) {
    return detectedService ? `${detectedService.name} issue / inspection required` : 'General repair inspection';
  }
  return cleaned;
};

// ==========================================
// CONTROLLED BACKEND TOOLS IMPLEMENTATION
// ==========================================

/**
 * Tool: Get Home Service Passport (Appliance History & Maintenance Schedule)
 */
const toolGetHomePassport = async (userId) => {
  try {
    if (!userId || mongoose.connection.readyState !== 1) return { appliances: [], totalSpent: 0 };

    const completedBookings = await Booking.find({
      userId: userId,
      status: 'completed'
    }).sort({ date: -1 });

    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.finalQuote || b.amount || 0), 0);

    // Group by service / appliance
    const applianceMap = {};
    for (const b of completedBookings) {
      const name = b.serviceName || b.deviceType || 'Appliance';
      if (!applianceMap[name]) {
        let techName = 'Fixvo Verified Specialist';
        if (b.providerId && mongoose.Types.ObjectId.isValid(b.providerId)) {
          const techDoc = await User.findById(b.providerId);
          if (techDoc) techName = techDoc.name;
        }

        const serviceDate = new Date(b.date || b.createdAt);
        const monthsAgo = Math.max(0, Math.floor((Date.now() - serviceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

        // Maintenance schedule recommendation
        let recommendedMonths = 6;
        if (name.toLowerCase().includes('ac')) recommendedMonths = 6;
        else if (name.toLowerCase().includes('ro')) recommendedMonths = 3;
        else if (name.toLowerCase().includes('washing')) recommendedMonths = 12;

        const isDue = monthsAgo >= recommendedMonths;

        applianceMap[name] = {
          serviceName: name,
          lastServiceDate: serviceDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' }),
          monthsAgo,
          technician: techName,
          lastCost: b.finalQuote || b.amount || 0,
          technicianId: b.providerId,
          maintenanceRecommendation: isDue 
            ? `Maintenance recommended (Last serviced ${monthsAgo} months ago)` 
            : `Good condition (Serviced ${monthsAgo} months ago)`,
          isMaintenanceDue: isDue
        };
      }
    }

    return {
      appliances: Object.values(applianceMap),
      totalServices: completedBookings.length,
      totalSpent
    };
  } catch (err) {
    console.warn('Home Passport Error:', err.message);
    return { appliances: [], totalSpent: 0, totalServices: 0 };
  }
};

/**
 * Tool: Find Previous Technician for an appliance/service
 */
const toolFindPreviousTech = async (userId, serviceId) => {
  try {
    if (!userId || mongoose.connection.readyState !== 1) return null;

    const query = {
      userId: userId,
      status: 'completed'
    };
    if (serviceId) {
      query.serviceId = serviceId;
    }

    const lastJob = await Booking.findOne(query).sort({ date: -1 });
    if (lastJob && lastJob.providerId) {
      const techUser = await User.findById(lastJob.providerId);
      const techProfile = await Technician.findOne({ userId: lastJob.providerId });

      if (techUser) {
        return {
          id: lastJob.providerId,
          name: techUser.name,
          phone: techUser.phone,
          rating: techProfile?.rating || 4.9,
          isOnline: techProfile?.isOnline || true,
          area: techProfile?.area || 'Madanapalle',
          lastJobDate: lastJob.date
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('Previous Tech Lookup Error:', err.message);
    return null;
  }
};

/**
 * Tool: Get Wallet & Rewards Info
 */
const toolGetWalletAndRewards = async (userId, userDoc) => {
  const balance = userDoc?.walletBalance || 0;
  const isPremium = userDoc?.isPremium || false;

  return {
    walletBalance: balance,
    isPremium,
    membershipType: userDoc?.membershipType || 'none',
    loyaltyPoints: 150,
    loyaltyValue: 75,
    tier: isPremium ? 'Plus VIP' : 'Silver Member',
    activeCoupons: [
      { code: 'FIXVO10', discount: '10% OFF', description: 'Valid on first service or direct repair' },
      { code: 'PLUS2026', discount: 'Zero Inspection Fee', description: 'Free ₹99 diagnostic visits for Plus members' }
    ]
  };
};

/**
 * Main Action-Oriented AI Agent Controller
 * @desc    Converse with Fixvo AI Assistant (Text / Speech)
 * @route   POST /api/ai/converse
 * @access  Private (Guarded by JWT protect)
 */
const handleAiConversation = async (req, res) => {
  try {
    const { message = '', currentDraft = {}, conversationHistory = [] } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;
    
    let userDoc = null;
    let profileDoc = null;
    try {
      if (mongoose.connection.readyState === 1) {
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          userDoc = await User.findById(userId);
        }
        if (userId) {
          profileDoc = await CustomerProfile.findOne({ userId });
        }
      }
    } catch (dbErr) {
      console.warn('AI DB lookup warning:', dbErr.message);
    }

    const userText = (message || '').trim();
    const lowerText = userText.toLowerCase();

    // ==========================================
    // 1. INTENT CLASSIFICATION
    // ==========================================
    let intent = 'BOOK_SERVICE';

    if (lowerText.match(/home passport|passport|maintenance schedule|when did i last|my appliances|appliance history|service history|spend on services|how much did i spend/i)) {
      intent = 'HOME_PASSPORT';
    } else if (lowerText.match(/same tech|same technician|who repaired my|who fixed my|technician who came last/i)) {
      intent = 'BOOK_SAME_TECH';
    } else if (lowerText.match(/wallet|balance|points|rewards|cashback|offers|promo code|coupons|fixvo cash/i)) {
      intent = 'WALLET_REWARDS';
    } else if (lowerText.match(/where is my (tech|technician|service|booking)|status of my booking|track booking|booking status|what's happening with my/i)) {
      intent = 'CHECK_BOOKING';
    } else if (lowerText.match(/reschedule|move my|change the date|change time|postpone/i) && !lowerText.startsWith('actually')) {
      intent = 'RESCHEDULE';
    } else if (lowerText.match(/^(cancel booking|cancel my booking|cancel)$/i)) {
      intent = 'CANCEL_BOOKING';
    } else if (lowerText.match(/message my technician|tell my technician|contact technician|chat with technician/i)) {
      intent = 'TECH_MESSAGE';
    } else if (lowerText.match(/what services|show services|list services|services available|catalog|do you have|do you provide|can you fix|is .* available/i)) {
      intent = 'SERVICE_DISCOVERY';
    } else if (lowerText.match(/find tech|nearby technician|show technician|who is available|best technician/i)) {
      intent = 'FIND_TECHNICIAN';
    } else if (lowerText.match(/^(hi|hello|hey|namaste|good morning|good evening)$/i)) {
      intent = 'GREETING';
    }

    // ==========================================
    // 2. INTENT HANDLERS
    // ==========================================

    // GREETING
    if (intent === 'GREETING' && !currentDraft.serviceId) {
      const userName = userDoc?.name || profileDoc?.name || 'there';
      return res.json({
        reply: `Good day, ${userName}! 👋 I am your Fixvo Personal Home Service Agent.\n\nI can book repairs, track your technician live, check appliance maintenance history, manage your wallet, or schedule service visits. What can I do for you today?`,
        intent: 'GREETING',
        draft: currentDraft,
        isDraftComplete: false,
        suggestedActions: ['Book AC Repair', 'My Home Passport', 'Where is My Technician?', 'Wallet & Rewards']
      });
    }

    // HOME SERVICE PASSPORT & MAINTENANCE
    if (intent === 'HOME_PASSPORT') {
      const passport = await toolGetHomePassport(userId);
      let reply = '';
      if (passport.appliances.length === 0) {
        reply = "You don't have any completed repair records in your Fixvo Home Passport yet. Once you complete your first service, I will automatically track your appliance warranty, maintenance schedules, and previous technicians here!";
      } else {
        const applianceSummaries = passport.appliances.map(a => 
          `• **${a.serviceName}**: Last serviced on ${a.lastServiceDate} by ${a.technician}. (${a.maintenanceRecommendation})`
        ).join('\n');
        
        reply = `🏡 **Fixvo Home Service Passport**\nYou have completed ${passport.totalServices} service(s) totaling ₹${passport.totalSpent}:\n\n${applianceSummaries}\n\nWould you like to book a maintenance visit for any of these?`;
      }

      return res.json({
        reply,
        intent: 'HOME_PASSPORT',
        homePassport: passport,
        draft: currentDraft,
        isDraftComplete: false,
        suggestedActions: passport.appliances.map(a => `Book ${a.serviceName}`)
      });
    }

    // WALLET, REWARDS & OFFERS
    if (intent === 'WALLET_REWARDS') {
      const walletInfo = await toolGetWalletAndRewards(userId, userDoc);
      const reply = `💳 **Fixvo Wallet & Rewards**\n• Wallet Balance: ₹${walletInfo.walletBalance}\n• Fixvo Loyalty Points: ${walletInfo.loyaltyPoints} Pts (Value: ₹${walletInfo.loyaltyValue})\n• Member Tier: ${walletInfo.tier}\n• Active Promo Code: **FIXVO10** (10% OFF)\n\nWould you like me to apply your wallet balance or promo code to your next service booking?`;

      return res.json({
        reply,
        intent: 'WALLET_REWARDS',
        walletData: walletInfo,
        draft: currentDraft,
        isDraftComplete: false,
        suggestedActions: ['Book AC Service', 'Top Up Wallet', 'View Offers', 'Fixvo Plus Membership']
      });
    }

    // SERVICE DISCOVERY
    if (intent === 'SERVICE_DISCOVERY') {
      const specific = detectService(userText);
      if (specific) {
        return res.json({
          reply: `Yes! Fixvo provides verified **${specific.name}** at your doorstep with 30-minute priority dispatch. Would you like me to find available technicians in your area?`,
          intent: 'SERVICE_DISCOVERY',
          draft: { ...currentDraft, serviceId: specific.id, serviceName: specific.name },
          isDraftComplete: false,
          suggestedActions: [`Book ${specific.name}`, 'Check Pricing', 'Show All Services']
        });
      }

      const categoriesList = ['Repair Services (AC, Washing Machine, Refrigerator, TV, Microwave, Mobile, Laptop)', 'Installation (AC, CCTV, RO Purifier, Inverter, Fan, Lock)', 'Deep Cleaning (Sofa, Bathroom, Water Tank, Kitchen, Full Home)', 'Electrician, Plumber, Painter & Carpenter'];
      const reply = `Fixvo provides verified doorstep services across Madanapalle & Rayachoty:\n\n${categoriesList.map(c => `• ${c}`).join('\n')}\n\nTell me which appliance or service you need!`;

      return res.json({
        reply,
        intent: 'SERVICE_DISCOVERY',
        draft: currentDraft,
        isDraftComplete: false,
        suggestedActions: ['AC Repair', 'Washing Machine', 'Electrician', 'Plumber']
      });
    }

    // BOOK SAME TECHNICIAN
    if (intent === 'BOOK_SAME_TECH') {
      const matchedService = detectService(userText);
      const prevTech = await toolFindPreviousTech(userId, matchedService?.id);

      if (prevTech) {
        const updatedDraft = {
          ...(currentDraft || {}),
          serviceId: matchedService?.id || 'ac_repair',
          serviceName: matchedService?.name || 'Home Service',
          preferredTechId: prevTech.id,
          preferredTechName: prevTech.name
        };

        const reply = `I found your previous technician **${prevTech.name}** (⭐${prevTech.rating}) who serviced your appliance. He is currently online and available in ${prevTech.area}. Would you like me to schedule a visit with him?`;

        return res.json({
          reply,
          intent: 'BOOK_SAME_TECH',
          draft: updatedDraft,
          preferredTechnician: prevTech,
          isDraftComplete: false,
          suggestedActions: [`Book with ${prevTech.name}`, 'Tomorrow Morning', 'Different Technician']
        });
      } else {
        return res.json({
          reply: "I couldn't find a previous technician on file for this service. I can match you with our highest-rated verified technician nearby instead. Would you like me to proceed?",
          intent: 'BOOK_SAME_TECH',
          draft: currentDraft,
          isDraftComplete: false,
          suggestedActions: ['Find Best Technician', 'AC Repair', 'Plumber']
        });
      }
    }

    // CHECK BOOKING STATUS & LIVE TRACKING
    if (intent === 'CHECK_BOOKING') {
      let activeBooking = null;
      let techName = 'Our verified technician';
      let techPhone = null;

      try {
        if (userId && mongoose.connection.readyState === 1) {
          activeBooking = await Booking.findOne({ 
            userId: userId,
            status: { $in: ['pending', 'assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending', 'quote_clarification'] }
          }).sort({ createdAt: -1 });

          if (activeBooking && activeBooking.providerId && mongoose.Types.ObjectId.isValid(activeBooking.providerId)) {
            const techUser = await User.findById(activeBooking.providerId);
            if (techUser) {
              techName = techUser.name;
              techPhone = techUser.phone;
            }
          }
        }
      } catch (err) {
        console.warn('Booking status lookup error:', err.message);
      }

      if (!activeBooking) {
        return res.json({
          reply: "You don't have any active ongoing service requests right now. Would you like me to help you schedule a new service?",
          intent: 'CHECK_BOOKING',
          draft: currentDraft,
          isDraftComplete: false,
          suggestedActions: ['Book AC Service', 'Book Electrician', 'Home Passport']
        });
      }

      let statusMsg = '';
      let isLiveTracking = false;

      switch (activeBooking.status) {
        case 'pending':
          statusMsg = `Your request for **${activeBooking.serviceName}** is received and we are matching the nearest available technician in ${activeBooking.location}.`;
          break;
        case 'assigned':
          statusMsg = `Technician **${techName}** has been assigned to your ${activeBooking.serviceName} booking and is reviewing details.`;
          break;
        case 'accepted':
          statusMsg = `Technician **${techName}** accepted your ${activeBooking.serviceName} request and is preparing for the visit.`;
          break;
        case 'on_the_way':
          statusMsg = `🚀 Technician **${techName}** is currently on the way to your location in ${activeBooking.location}. Live tracking is active.`;
          isLiveTracking = true;
          break;
        case 'arrived':
          statusMsg = `🏡 Technician **${techName}** has arrived at your address.`;
          break;
        case 'in_progress':
          statusMsg = `🛠️ Technician **${techName}** is actively working on your ${activeBooking.serviceName}.`;
          break;
        case 'quote_pending':
          statusMsg = `📋 Technician **${techName}** submitted a quote of ₹${activeBooking.finalQuote}. Please review and approve it.`;
          break;
        default:
          statusMsg = `Your ${activeBooking.serviceName} booking status is "${activeBooking.status}".`;
      }

      return res.json({
        reply: statusMsg,
        intent: 'CHECK_BOOKING',
        bookingSummary: {
          id: activeBooking._id,
          service: activeBooking.serviceName,
          status: activeBooking.status,
          technician: techName,
          phone: techPhone,
          address: activeBooking.location,
          date: activeBooking.date,
          timeSlot: activeBooking.timeSlot,
          isLiveTracking
        },
        draft: currentDraft,
        isDraftComplete: false,
        suggestedActions: isLiveTracking 
          ? ['Message Technician', 'Call Technician', 'View Dashboard']
          : ['Reschedule', 'Cancel Booking', 'View Details']
      });
    }

    // DIRECT TECHNICIAN MESSAGING
    if (intent === 'TECH_MESSAGE') {
      try {
        if (userId && mongoose.connection.readyState === 1) {
          const activeBooking = await Booking.findOne({ 
            userId: userId,
            status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending'] }
          }).sort({ createdAt: -1 });

          if (activeBooking) {
            const messageText = userText.replace(/^(message my technician that|tell my technician that|message technician)\s+/i, '');
            const newMsg = await Message.create({
              bookingId: activeBooking._id,
              senderId: userId,
              senderName: userDoc?.name || 'Customer',
              text: messageText
            });

            if (global.io) {
              global.io.to(`chat_${activeBooking._id}`).emit('receive_message', newMsg);
            }

            return res.json({
              reply: `📢 Message sent to your technician: "${messageText}". They will be notified immediately.`,
              intent: 'TECH_MESSAGE',
              draft: currentDraft,
              isDraftComplete: false
            });
          }
        }
      } catch (err) {
        console.warn('Tech messaging error:', err.message);
      }
      return res.json({
        reply: "You don't have an active assigned technician to message right now. I can help you schedule a new service instead.",
        intent: 'TECH_MESSAGE',
        draft: currentDraft,
        isDraftComplete: false
      });
    }

    // RESCHEDULE BOOKING
    if (intent === 'RESCHEDULE') {
      const { dateString, timeSlot } = parseDateAndSlot(userText);
      try {
        if (userId && mongoose.connection.readyState === 1) {
          const activeBooking = await Booking.findOne({ 
            userId: userId,
            status: { $in: ['pending', 'assigned', 'accepted'] }
          }).sort({ createdAt: -1 });

          if (activeBooking) {
            activeBooking.date = new Date(dateString);
            activeBooking.timeSlot = timeSlot;
            await activeBooking.save();

            return res.json({
              reply: `✅ Your booking for **${activeBooking.serviceName}** has been rescheduled to **${dateString}** (${timeSlot}). The technician has been updated.`,
              intent: 'RESCHEDULE',
              draft: currentDraft,
              isDraftComplete: false
            });
          }
        }
      } catch (err) {
        console.warn('Reschedule error:', err.message);
      }

      return res.json({
        reply: "I couldn't find an active booking eligible for rescheduling. You can only reschedule bookings before the technician departs.",
        intent: 'RESCHEDULE',
        draft: currentDraft,
        isDraftComplete: false
      });
    }

    // CANCEL BOOKING
    if (intent === 'CANCEL_BOOKING') {
      if (currentDraft.serviceId || currentDraft.serviceName) {
        return res.json({
          reply: "I have cleared your current booking draft. What else can I assist you with?",
          intent: 'CANCEL_BOOKING',
          draft: {},
          isDraftComplete: false
        });
      }
      return res.json({
        reply: "Are you sure you want to cancel your confirmed booking? Please select 'Confirm Cancel' on your dashboard booking card or confirm here.",
        intent: 'CANCEL_BOOKING',
        draft: {},
        isDraftComplete: false
      });
    }

    // ==========================================
    // 3. BOOK_SERVICE INTENT & ENTITY RESOLUTION
    // ==========================================
    const updatedDraft = { ...(currentDraft || {}) };

    // Service matching
    const matchedService = detectService(userText);
    if (matchedService) {
      updatedDraft.serviceId = matchedService.id;
      updatedDraft.serviceName = matchedService.name;
      updatedDraft.category = matchedService.category;
    }

    // Date & Time extraction
    const { dateString, timeSlot, hasExplicitDate } = parseDateAndSlot(userText);
    if (hasExplicitDate || !updatedDraft.date) {
      updatedDraft.date = dateString;
    }
    if (timeSlot !== 'ASAP' || !updatedDraft.timeSlot) {
      updatedDraft.timeSlot = timeSlot;
    }

    // Area extraction
    const detectedLocality = detectArea(userText);
    if (detectedLocality) {
      updatedDraft.area = detectedLocality;
      updatedDraft.location = detectedLocality;
    }

    // Address & Saved Address handling
    const savedAddressMatches = lowerText.match(/home address|saved address|my address|use my saved|use home|use my home|office address/i);
    if (savedAddressMatches) {
      const savedAddr = profileDoc?.address || userDoc?.address || '';
      if (savedAddr) {
        updatedDraft.detailedAddress = savedAddr;
        updatedDraft.useSavedAddress = true;
        if (!updatedDraft.area) {
          const areaFromSaved = detectArea(savedAddr) || 'Madanapalle';
          updatedDraft.area = areaFromSaved;
          updatedDraft.location = areaFromSaved;
        }
      } else {
        updatedDraft.useSavedAddress = true;
      }
    } else if (lowerText.match(/door no|flat|street|road|near|opposite|cross/i)) {
      updatedDraft.detailedAddress = userText;
    }

    // Problem description
    if (userText.length > 8 && !savedAddressMatches && !lowerText.startsWith('use ') && !lowerText.startsWith('actually')) {
      if (matchedService || updatedDraft.serviceId) {
        updatedDraft.problemDescription = extractProblem(userText, matchedService || { name: updatedDraft.serviceName });
      } else if (!updatedDraft.problemDescription) {
        updatedDraft.problemDescription = userText;
      }
    }

    // Default fallback values
    if (!updatedDraft.area) updatedDraft.area = 'Madanapalle';
    if (!updatedDraft.location) updatedDraft.location = updatedDraft.area;
    if (!updatedDraft.date) updatedDraft.date = new Date().toISOString().split('T')[0];
    if (!updatedDraft.timeSlot) updatedDraft.timeSlot = 'Morning (9 AM - 12 PM)';
    if (!updatedDraft.serviceOption) updatedDraft.serviceOption = 'direct';

    // Live technician lookup for draft
    let matchedTechnicians = [];
    if (updatedDraft.serviceId) {
      try {
        if (mongoose.connection.readyState === 1) {
          const areaQuery = updatedDraft.area ? { $regex: new RegExp(`^${updatedDraft.area}$`, 'i') } : {};
          matchedTechnicians = await Technician.find({
            isProfileComplete: true,
            isOnline: true,
            ...(updatedDraft.area ? { area: areaQuery } : {})
          }).limit(5);

          matchedTechnicians.sort((a, b) => b.rating - a.rating);
        }
      } catch (e) {
        console.error('Technician lookup error in AI assistant:', e);
      }
    }

    // Generate conversational response
    let reply = '';
    let isComplete = false;

    if (!updatedDraft.serviceId) {
      reply = "I understand you need assistance. Which appliance or service would you like us to fix? (e.g. AC repair, washing machine, plumbing, electrical, refrigerator)";
    } else if (!updatedDraft.problemDescription || updatedDraft.problemDescription.length < 4) {
      reply = `Got it, ${updatedDraft.serviceName}. Could you briefly describe what specific problem you are experiencing?`;
    } else if (!updatedDraft.area) {
      reply = `Which area should I dispatch the technician to? (e.g. Madanapalle, Angallu, Kadiri)`;
    } else if (!updatedDraft.detailedAddress) {
      if (profileDoc?.address) {
        reply = `I found your saved address: "${profileDoc.address}". Would you like to use this address, or enter a new one?`;
      } else {
        reply = `Please share your street address or landmark in ${updatedDraft.area} for the technician's visit.`;
      }
    } else {
      isComplete = true;
      const techCount = matchedTechnicians.length;
      const bestTech = matchedTechnicians[0];
      const techNotice = bestTech 
        ? `I found ${techCount} verified specialist(s) in ${updatedDraft.area} (Top recommendation: ${bestTech.name}, ⭐${bestTech.rating.toFixed(1)}).`
        : `We will auto-match the closest available verified technician in ${updatedDraft.area}.`;

      reply = `I have prepared your booking summary for **${updatedDraft.serviceName}** on **${updatedDraft.date}** (${updatedDraft.timeSlot}). ${techNotice} Please review the summary card below and confirm your booking.`;
    }

    return res.json({
      reply,
      intent: 'BOOK_SERVICE',
      draft: updatedDraft,
      isDraftComplete: isComplete,
      availableTechnicians: matchedTechnicians.map(t => ({
        id: t.userId,
        name: t.name,
        rating: t.rating,
        experience: t.experience,
        area: t.area,
        isVerified: t.isVerified,
        avatar: t.avatar
      })),
      suggestedActions: isComplete 
        ? ['Confirm Booking', 'Change Time', 'Change Address', 'Cancel']
        : (!updatedDraft.serviceId ? ['AC Repair', 'Washing Machine', 'Plumber', 'Electrician'] : ['Use Saved Address', 'Tomorrow Morning', 'Today ASAP'])
    });

  } catch (error) {
    console.error('AI Conversation Controller Error:', error);
    return res.status(500).json({
      reply: "Sorry, I couldn't complete that request. Please try again or switch to the manual booking form.",
      error: error.message
    });
  }
};

/**
 * Validate Draft Endpoint
 */
const validateDraft = async (req, res) => {
  try {
    const { draft } = req.body;
    if (!draft || !draft.serviceId) {
      return res.status(400).json({ message: 'Service ID is required to validate draft' });
    }

    const validService = SERVICE_CATALOG.find(s => s.id === draft.serviceId);
    const serviceName = validService ? validService.name : (draft.serviceName || 'Custom Service');

    let sortedTechs = [];
    if (mongoose.connection.readyState === 1) {
      const technicians = await Technician.find({
        isProfileComplete: true,
        isOnline: true
      }).limit(10);

      sortedTechs = technicians.sort((a, b) => b.rating - a.rating);
    }

    return res.json({
      valid: true,
      serviceName,
      technicians: sortedTechs.map(t => ({
        id: t.userId,
        name: t.name,
        rating: t.rating,
        experience: t.experience,
        distance: t.area || 'Madanapalle',
        jobsCompleted: t.jobsCompleted,
        isVerified: t.isVerified,
        avatar: t.avatar,
        skills: t.skills
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleAiConversation,
  validateDraft,
  toolGetHomePassport,
  toolFindPreviousTech,
  toolGetWalletAndRewards
};
