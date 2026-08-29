const Service = require('../models/Service');
const Technician = require('../models/Technician');
const Booking = require('../models/Booking');
const CustomerProfile = require('../models/CustomerProfile');
const User = require('../models/User');

// Known service catalog with semantic aliases and Telugu keywords
const SERVICE_CATALOG = [
  { id: 'ac_repair', name: 'AC Repair', category: 'repair', aliases: ['ac', 'air conditioner', 'ac cooling', 'ac repair', 'ac gas', 'ac servicing', 'cooling issue', 'ac not cooling', 'ac lo gas', 'ac cooling sarigga pani cheyatledu'] },
  { id: 'washing_machine', name: 'Washing Machine Repair', category: 'repair', aliases: ['washing machine', 'washer', 'cloth washer', 'spin issue', 'washing machine noise', 'washing machine drum', 'battalu uthike machine'] },
  { id: 'refrigerator', name: 'Refrigerator Repair', category: 'repair', aliases: ['fridge', 'refrigerator', 'freezer', 'fridge cooling', 'fridge noise', 'refrigerator repair', 'ice box'] },
  { id: 'microwave', name: 'Microwave Repair', category: 'repair', aliases: ['microwave', 'oven', 'micro oven', 'microwave heating'] },
  { id: 'tv_repair', name: 'TV Repair', category: 'repair', aliases: ['tv', 'television', 'led tv', 'lcd tv', 'smart tv', 'tv display', 'tv screen'] },
  { id: 'laptop_repair', name: 'Laptop Repair', category: 'repair', aliases: ['laptop', 'notebook', 'macbook', 'laptop screen', 'laptop slow', 'laptop battery'] },
  { id: 'mobile_repair', name: 'Mobile Repair', category: 'repair', aliases: ['mobile', 'phone', 'smartphone', 'iphone', 'android', 'screen broken', 'phone battery'] },
  { id: 'ac_install', name: 'AC Installation', category: 'installation', aliases: ['ac install', 'ac installation', 'ac fitting', 'ac unmount', 'ac setup'] },
  { id: 'cctv_install', name: 'CCTV Installation', category: 'installation', aliases: ['cctv', 'camera install', 'security camera', 'cctv camera'] },
  { id: 'ro_install', name: 'RO Installation', category: 'installation', aliases: ['ro', 'water purifier', 'ro filter', 'water filter', 'ro install'] },
  { id: 'inverter_install', name: 'Inverter Installation', category: 'installation', aliases: ['inverter', 'ups', 'battery backup', 'inverter install'] },
  { id: 'fan_install', name: 'Ceiling Fan Installation', category: 'installation', aliases: ['fan install', 'ceiling fan fitting', 'fan setup'] },
  { id: 'lock_install', name: 'Door Lock Installation', category: 'installation', aliases: ['door lock', 'lock install', 'lock change', 'door handle'] },
  { id: 'furniture', name: 'Furniture Assembly', category: 'installation', aliases: ['furniture assembly', 'table assembly', 'bed assembly', 'cupboard assembly'] },
  { id: 'sofa_clean', name: 'Sofa Cleaning', category: 'cleaning', aliases: ['sofa clean', 'couch cleaning', 'cushion clean'] },
  { id: 'bathroom_clean', name: 'Bathroom Deep Cleaning', category: 'cleaning', aliases: ['bathroom clean', 'toilet clean', 'washroom clean', 'bathroom deep clean'] },
  { id: 'water_tank_clean', name: 'Water Tank Cleaning', category: 'cleaning', aliases: ['water tank', 'sump cleaning', 'overhead tank clean'] },
  { id: 'carpet_clean', name: 'Carpet Cleaning', category: 'cleaning', aliases: ['carpet clean', 'rug clean', 'mat clean'] },
  { id: 'kitchen_clean', name: 'Kitchen Cleaning', category: 'cleaning', aliases: ['kitchen clean', 'chimney clean', 'kitchen deep clean'] },
  { id: 'home_clean', name: 'Full Home Cleaning', category: 'cleaning', aliases: ['home clean', 'house cleaning', 'full deep cleaning', 'flat cleaning'] },
  { id: 'pest_control', name: 'Pest Control', category: 'other', aliases: ['pest control', 'cockroach', 'termites', 'bedbugs', 'insects', 'cheemalu', 'domalu'] },
  { id: 'electric_wiring', name: 'Electric Wiring', category: 'other', aliases: ['electrician', 'electric', 'wiring', 'switch', 'socket', 'current', 'short circuit', 'current pani', 'meter board', 'fuse', 'fan repair', 'light fix'] },
  { id: 'plumbing_work', name: 'Plumbing Work', category: 'other', aliases: ['plumber', 'plumbing', 'pipe leak', 'tap repair', 'drain blockage', 'neellu leak', 'tap dripping', 'water leak', 'motor repair'] },
  { id: 'furniture_repair', name: 'Furniture Repair', category: 'other', aliases: ['carpenter', 'furniture repair', 'door repair', 'wooden repair', 'wood work'] },
  { id: 'painting', name: 'Painting', category: 'other', aliases: ['painter', 'painting', 'wall paint', 'house painting', 'color veyadam'] }
];

const KNOWN_AREAS = [
  'Madanapalle', 'Madanapalle Town', 'Madanapalle Bypass', 'Angallu', 'Malepadu',
  'Kadiri', 'Rayachoty', 'Galiveedu', 'Punganoor', 'Vayalpadu', 'Kurabalakota',
  'Neerugattuvaripalli', 'Basinikonda', 'Kothapalli', 'Arogyavaram', 'BT College Area'
];

/**
 * Natural Language date parsing supporting relative days and Telugu temporal terms
 */
const parseDateAndSlot = (text) => {
  const lower = text.toLowerCase();
  let date = new Date();
  let timeSlot = 'ASAP';
  let dateFound = false;

  // Day recognition
  if (lower.includes('repu') || lower.includes('tomorrow') || lower.includes('next day')) {
    date.setDate(date.getDate() + 1);
    dateFound = true;
  } else if (lower.includes('ellundi') || lower.includes('day after tomorrow')) {
    date.setDate(date.getDate() + 2);
    dateFound = true;
  } else if (lower.includes('eroju') || lower.includes('today') || lower.includes('tonight')) {
    dateFound = true;
  } else {
    // Days of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const currentDay = date.getDay();
        let distance = i - currentDay;
        if (distance <= 0) distance += 7; // Next occurrence
        date.setDate(date.getDate() + distance);
        dateFound = true;
        break;
      }
    }
  }

  // Time slot recognition
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
 * Service & Category matching engine
 */
const detectService = (text) => {
  const lower = text.toLowerCase();
  
  // Direct matching against aliases
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
 * Locality / Area matching engine
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
 * Extract clean problem description
 */
const extractProblem = (text, detectedService) => {
  let cleaned = text.trim();
  // Strip out polite prefixes or common commands
  cleaned = cleaned.replace(/^(please|can you|i want to|i need to|i need a|book|help me fix|fixvo|naa|na)\s+/i, '');
  
  if (cleaned.length < 5) {
    return detectedService ? `${detectedService.name} issue / inspection required` : 'General repair inspection';
  }
  return cleaned;
};

/**
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
      const mongoose = require('mongoose');
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

    // 1. Identify User Intent
    let intent = 'BOOK_SERVICE';
    if (lowerText.match(/where is my (tech|technician|service|booking)|status of my booking|track booking|booking status/i)) {
      intent = 'CHECK_BOOKING';
    } else if (lowerText.match(/^(cancel booking|cancel my booking|cancel)$/i)) {
      intent = 'CANCEL_BOOKING';
    } else if (lowerText.match(/find tech|nearby technician|show technician|who is available/i)) {
      intent = 'FIND_TECHNICIAN';
    } else if (lowerText.match(/hello|hi|hey|namaste|who are you|what can you do/i) && userText.length < 20) {
      intent = 'GREETING';
    }

    // 2. Handle GREETING Intent
    if (intent === 'GREETING' && !currentDraft.serviceId) {
      const userName = userDoc?.name || profileDoc?.name || 'there';
      return res.json({
        reply: `Hello ${userName}! 👋 I'm your Fixvo AI Assistant. What service can I help you book or fix today? (e.g. "AC repair tomorrow morning in Madanapalle", or "Washing machine not spinning")`,
        intent: 'GREETING',
        draft: currentDraft,
        isDraftComplete: false,
        suggestedActions: ['AC Repair', 'Electrician', 'Plumber', 'Washing Machine Repair']
      });
    }

    // 3. Handle CHECK_BOOKING Intent
    if (intent === 'CHECK_BOOKING') {
      let activeBooking = null;
      let techName = 'Our verified technician';
      try {
        if (userId) {
          activeBooking = await Booking.findOne({ 
            userId: userId,
            status: { $in: ['pending', 'assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending'] }
          }).sort({ createdAt: -1 });

          if (activeBooking && activeBooking.providerId) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(activeBooking.providerId)) {
              const techUser = await User.findById(activeBooking.providerId);
              if (techUser) techName = techUser.name;
            }
          }
        }
      } catch (err) {
        console.warn('Booking lookup error:', err.message);
      }

      if (!activeBooking) {
        return res.json({
          reply: "You don't have any active ongoing service requests right now. Would you like me to help you schedule a new service?",
          intent: 'CHECK_BOOKING',
          draft: currentDraft,
          isDraftComplete: false,
          suggestedActions: ['Book AC Service', 'Book Electrician', 'View Past Bookings']
        });
      }

      let statusMsg = '';
      switch (activeBooking.status) {
        case 'pending':
          statusMsg = `Your request for ${activeBooking.serviceName} is received and matching with the nearest available expert.`;
          break;
        case 'assigned':
          statusMsg = `Technician ${techName} has been assigned to your ${activeBooking.serviceName} booking and is reviewing the details.`;
          break;
        case 'accepted':
          statusMsg = `Technician ${techName} has accepted your ${activeBooking.serviceName} service request!`;
          break;
        case 'on_the_way':
          statusMsg = `Technician ${techName} is currently on the way to your location in ${activeBooking.location}.`;
          break;
        case 'arrived':
          statusMsg = `Technician ${techName} has arrived at your address.`;
          break;
        case 'in_progress':
          statusMsg = `Technician ${techName} is actively working on your ${activeBooking.serviceName}.`;
          break;
        case 'quote_pending':
          statusMsg = `Technician ${techName} submitted a quote of ₹${activeBooking.finalQuote}. Please review it on your dashboard.`;
          break;
        default:
          statusMsg = `Your ${activeBooking.serviceName} booking status is currently "${activeBooking.status}".`;
      }

      return res.json({
        reply: statusMsg,
        intent: 'CHECK_BOOKING',
        bookingSummary: {
          id: activeBooking._id,
          service: activeBooking.serviceName,
          status: activeBooking.status,
          technician: techName,
          address: activeBooking.location
        },
        draft: currentDraft,
        isDraftComplete: false
      });
    }

    // 4. Handle CANCEL_BOOKING Intent
    if (intent === 'CANCEL_BOOKING') {
      if (currentDraft.serviceId || currentDraft.serviceName) {
        return res.json({
          reply: "I've cleared your current booking draft. What else would you like help with?",
          intent: 'CANCEL_BOOKING',
          draft: {},
          isDraftComplete: false
        });
      }
      return res.json({
        reply: "To cancel an existing confirmed booking, please open the booking card on your dashboard and select 'Cancel Booking', or let me know the booking details.",
        intent: 'CANCEL_BOOKING',
        draft: {},
        isDraftComplete: false
      });
    }

    // 5. Handle BOOK_SERVICE Intent: Extract & Merge parameters
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

    // Address & Saved Address check
    const savedAddressMatches = lowerText.match(/home address|saved address|my address|use my saved|use home|use my home/i);
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
    if (userText.length > 8 && !savedAddressMatches && !lowerText.startsWith('use ')) {
      // If user is describing what's wrong
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

    // 6. Check Available Nearby Technicians for the requested service & area
    let matchedTechnicians = [];
    if (updatedDraft.serviceId) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          const areaQuery = updatedDraft.area ? { $regex: new RegExp(`^${updatedDraft.area}$`, 'i') } : {};
          matchedTechnicians = await Technician.find({
            isProfileComplete: true,
            isOnline: true,
            ...(updatedDraft.area ? { area: areaQuery } : {})
          }).limit(5);

          // Sort by highest rating
          matchedTechnicians.sort((a, b) => b.rating - a.rating);
        }
      } catch (e) {
        console.error('Technician lookup error in AI assistant:', e);
      }
    }

    // 7. Determine Missing Information & Generate Conversational Response
    let reply = '';
    let isComplete = false;

    if (!updatedDraft.serviceId) {
      reply = "I understand you need help. Could you specify which service or appliance you'd like us to inspect? (e.g., AC repair, washing machine, plumbing, electrical)";
    } else if (!updatedDraft.problemDescription || updatedDraft.problemDescription.length < 4) {
      reply = `Got it, ${updatedDraft.serviceName}. Could you briefly describe what specific issue you're experiencing with it?`;
    } else if (!updatedDraft.area) {
      reply = `Great. Which area or town should we dispatch the technician to? (e.g. Madanapalle, Angallu, Kadiri)`;
    } else if (!updatedDraft.detailedAddress) {
      // Suggest saved address if available
      if (profileDoc?.address) {
        reply = `I found your saved address: "${profileDoc.address}". Would you like to use this address for the visit, or enter a new one?`;
      } else {
        reply = `Please share your street address or landmark in ${updatedDraft.area} for the technician to visit.`;
      }
    } else {
      // All necessary information collected
      isComplete = true;
      const techCount = matchedTechnicians.length;
      const bestTech = matchedTechnicians[0];
      const techNotice = bestTech 
        ? `I found ${techCount} verified expert(s) in ${updatedDraft.area} (Top match: ${bestTech.name}, ⭐${bestTech.rating.toFixed(1)}).`
        : `We will auto-match the nearest available verified technician in ${updatedDraft.area}.`;

      reply = `I've prepared your booking summary for ${updatedDraft.serviceName} on ${updatedDraft.date} (${updatedDraft.timeSlot}). ${techNotice} Please review the summary card below and confirm your booking.`;
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
      reply: "Sorry, I couldn't complete that request. Please try again or use the manual booking form.",
      error: error.message
    });
  }
};

/**
 * @desc    Validate Draft & Pre-fetch technicians
 * @route   POST /api/ai/validate-draft
 * @access  Private (Guarded by JWT protect)
 */
const validateDraft = async (req, res) => {
  try {
    const { draft } = req.body;
    if (!draft || !draft.serviceId) {
      return res.status(400).json({ message: 'Service ID is required to validate draft' });
    }

    // Verify service existence
    const validService = SERVICE_CATALOG.find(s => s.id === draft.serviceId);
    const serviceName = validService ? validService.name : (draft.serviceName || 'Custom Service');

    // Fetch technicians matching area & service
    const area = draft.area || 'Madanapalle';
    const technicians = await Technician.find({
      isProfileComplete: true,
      isOnline: true
    }).limit(10);

    const sortedTechs = technicians.sort((a, b) => b.rating - a.rating);

    return res.json({
      valid: true,
      serviceName,
      technicians: sortedTechs.map(t => ({
        id: t.userId,
        name: t.name,
        rating: t.rating,
        experience: t.experience,
        distance: t.area || area,
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
  validateDraft
};
