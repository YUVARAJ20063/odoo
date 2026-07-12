const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  purpose: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Approved', 'Pending', 'Cancelled'], 
    default: 'Approved' 
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
