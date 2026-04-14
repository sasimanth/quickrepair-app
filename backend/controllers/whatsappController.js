const { MessagingResponse } = require('twilio').twiml;
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');

// Simple conversation state tracking in memory (for MVP/Demo)
// A real app would use Redis or DB to maintain chat session states.
const userSessions = {};

const handleIncomingWhatsAppMessage = async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body ? req.body.Body.toLowerCase().trim() : '';
  const fromNumber = req.body.From; // format: 'whatsapp:+1234567890'
  
  if (!userSessions[fromNumber]) {
     userSessions[fromNumber] = { step: 0 };
  }
  
  const session = userSessions[fromNumber];

  try {
    if (incomingMsg === 'hi' || incomingMsg === 'hello' || incomingMsg === 'book') {
       session.step = 1;
       twiml.message(`Welcome to QuickRepair by Startup HQ! 🛠️\n\nWhat do you need help with today?\nReply with a number:\n1. AC Repair\n2. Electrician\n3. Plumber\n4. Other / Help`);
    } 
    else if (session.step === 1) {
       const serviceMap = { '1': 'AC Repair', '2': 'Electrician', '3': 'Plumber' };
       if (serviceMap[incomingMsg]) {
          session.serviceName = serviceMap[incomingMsg];
          session.step = 2;
          twiml.message(`Great, you chose ${session.serviceName}. \n\nCould you briefly describe the problem? (e.g., "AC not cooling", "Switch sparking")`);
       } else if (incomingMsg === '4') {
          session.step = 0;
          twiml.message("Please visit our app https://quickrepair.co or call customer service at 1-800-REPAIR.");
       } else {
          twiml.message("Invalid choice. Please reply '1', '2', '3', or '4'.");
       }
    }
    else if (session.step === 2) {
       session.problemDescription = incomingMsg;
       session.step = 3;
       twiml.message("Got it. Lastly, please reply with your full exact address or a location pin so our technician can reach you.");
    }
    else if (session.step === 3) {
       session.location = incomingMsg;
       
       // Process Booking Creation
       // 1. Find User by phone or fallback
       let user = await User.findOne({ phone: fromNumber.replace('whatsapp:', '') });
       if (!user) {
         // Create mock user or rely on generic user for whatsapp bookings. Assuming mock user ID for MVP
         user = await User.findOne({ email: 'user@example.com' });
       }
       
       // 2. Find Service ID
       let service = null;
       const servicesFound = await Service.find({});
       if (servicesFound.length > 0) {
          service = servicesFound.find(s => s.name.toLowerCase().includes(session.serviceName.toLowerCase())) || servicesFound[0];
       }
       
       // 3. Create Booking
       const newBooking = new Booking({
         userId: user ? user._id : null,
         userEmail: user ? user.email : 'whatsapp_user@example.com',
         serviceId: service ? service._id : null,
         date: new Date().toISOString().split('T')[0],
         deviceType: session.serviceName,
         problemDescription: session.problemDescription,
         location: session.location,
         status: 'pending',
         serviceOption: 'direct'
       });
       
       await newBooking.save();
       
       session.step = 0; // reset
       twiml.message(`Booking Confirmed! ✅\n\nYour ${session.serviceName} request has been received. Our automated dispatcher is assigning a technician to you. Order ID: ${newBooking._id.toString().substring(0,6)}`);
    }
    else {
       twiml.message("I didn't quite catch that. Type 'Hi' or 'Book' to start a new service request.");
    }
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    twiml.message("Oops, something went wrong on our end. Please try again later.");
  }

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
};

module.exports = { handleIncomingWhatsAppMessage };
