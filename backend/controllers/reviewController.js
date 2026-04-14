const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Create a new review
// @route   POST /api/reviews/:bookingId
// @access  Private
const createReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure only the user of the booking can leave a review
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Ensure the booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed jobs' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already submitted for this job' });
    }

    const review = await Review.create({
      bookingId,
      userId: req.user.id,
      technicianId: booking.providerId,
      rating: Number(rating),
      comment
    });

    // Import Technician inside the function to avoid circular dependency issues if any
    const Technician = require('../models/Technician');
    
    // Find technician and update rating
    const techUserId = booking.providerId;
    const technician = await Technician.findOne({ userId: techUserId });
    
    if (technician) {
       const currentCount = technician.reviewCount || 0;
       const currentTotalRating = (technician.rating || 5) * currentCount;
       const newCount = currentCount + 1;
       const newRating = (currentTotalRating + Number(rating)) / newCount;
       
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
