const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Create a new review
// @route   POST /api/reviews/:bookingId
// @access  Private
const createReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ratingQuality, ratingCommunication, ratingTimeliness, ratingValue, comment } = req.body;

    if (!ratingQuality || !ratingCommunication || !ratingTimeliness || !ratingValue) {
      return res.status(400).json({ message: 'All rating categories (Quality, Communication, Timeliness, Value) are required' });
    }

    const overallRating = Math.round(((Number(ratingQuality) + Number(ratingCommunication) + Number(ratingTimeliness) + Number(ratingValue)) / 4) * 10) / 10;

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const User = require('../models/User');
    const userDoc = await User.findById(req.user.id);
    
    const normalizePhone = (phone) => {
      if (!phone) return null;
      return phone.replace(/\D/g, "").slice(-10);
    };

    const pPhone = userDoc && userDoc.phone ? normalizePhone(userDoc.phone) : null;
    const bPhone = booking.phone ? normalizePhone(booking.phone) : null;
    
    const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isOwnerByPhone = pPhone && bPhone && pPhone === bPhone;

    // Ensure only the user of the booking can leave a review
    if (!isOwnerById && !isOwnerByPhone) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Ensure the booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed jobs' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId: booking._id });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already submitted for this job' });
    }

    const review = await Review.create({
      bookingId,
      userId: req.user.id,
      technicianId: booking.providerId,
      rating: overallRating,
      ratingQuality: Number(ratingQuality),
      ratingCommunication: Number(ratingCommunication),
      ratingTimeliness: Number(ratingTimeliness),
      ratingValue: Number(ratingValue),
      comment
    });

    // Import Technician inside the function to avoid circular dependency issues
    const Technician = require('../models/Technician');
    
    // Find technician and update rating
    const techUserId = booking.providerId;
    const technician = await Technician.findOne({ userId: techUserId });
    
    if (technician) {
       const currentCount = technician.reviewCount || 0;
       const currentTotalRating = (technician.rating || 5) * currentCount;
       const newCount = currentCount + 1;
       const newRating = (currentTotalRating + overallRating) / newCount;
       
       technician.reviewCount = newCount;
       technician.rating = Math.round(newRating * 10) / 10; // keep one decimal
       await technician.save();
    }

    // Mark booking as reviewed
    booking.isReviewed = true;
    await booking.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews for a specific technician
// @route   GET /api/reviews/technician/:technicianId
// @access  Private
const getTechnicianReviews = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const reviews = await Review.find({ technicianId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getTechnicianReviews };
