const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// Helper to log activities
const logActivity = async (userId, action, details) => {
  try {
    await ActivityLog.create({ user: userId, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('resource')
      .populate('bookedBy', 'name email role')
      .sort({ startTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get bookable resources (Assets of category: Meeting Room, Projector, Vehicle)
// @route   GET /api/bookings/resources
// @access  Private
router.get('/resources', protect, async (req, res) => {
  try {
    const resources = await Asset.find({
      category: { $in: ['Meeting Room', 'Projector', 'Vehicle'] },
      status: { $nin: ['Lost', 'Retired', 'Disposed'] }
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { resourceId, startTime, endTime, purpose, notes } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const resource = await Asset.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check overlaps
    const overlap = await Booking.findOne({
      resource: resourceId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlap) {
      return res.status(400).json({ 
        message: 'This resource is already booked during the selected timeframe' 
      });
    }

    const booking = await Booking.create({
      resource: resourceId,
      bookedBy: req.user._id,
      startTime: start,
      endTime: end,
      purpose,
      notes: notes || '',
      status: 'Approved' // auto approved for this demo flow
    });

    // Populate resource before returning
    const populatedBooking = await Booking.findById(booking._id)
      .populate('resource')
      .populate('bookedBy', 'name email');

    await logActivity(
      req.user._id, 
      'Create Booking', 
      `Booked resource ${resource.name} from ${start.toLocaleString()} to ${end.toLocaleString()}`
    );

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a booking status / time
// @route   PUT /api/bookings/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('resource');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check edit authorization (only creator or managers)
    if (booking.bookedBy.toString() !== req.user._id.toString() && !['Admin', 'Asset Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to edit this booking' });
    }

    const startTime = req.body.startTime ? new Date(req.body.startTime) : booking.startTime;
    const endTime = req.body.endTime ? new Date(req.body.endTime) : booking.endTime;

    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const status = req.body.status || booking.status;

    if (status !== 'Cancelled') {
      // Check overlaps
      const overlap = await Booking.findOne({
        _id: { $ne: booking._id },
        resource: booking.resource._id,
        status: { $ne: 'Cancelled' },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      });

      if (overlap) {
        return res.status(400).json({ 
          message: 'This resource is already booked during the selected timeframe' 
        });
      }
    }

    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.purpose = req.body.purpose || booking.purpose;
    booking.notes = req.body.notes !== undefined ? req.body.notes : booking.notes;
    booking.status = status;

    const updatedBooking = await booking.save();
    
    // Populate relations
    const populated = await Booking.findById(updatedBooking._id)
      .populate('resource')
      .populate('bookedBy', 'name email');

    await logActivity(req.user._id, 'Update Booking', `Updated booking status/time for ${booking.resource.name} (${status})`);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookedBy.toString() !== req.user._id.toString() && !['Admin', 'Asset Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    await booking.deleteOne();
    await logActivity(req.user._id, 'Delete Booking', `Cancelled booking schedule`);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
