const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTechnician: { type: String, default: '' },
  requestDate: { type: Date, default: Date.now },
  scheduledDate: { type: Date, default: null },
  resolutionDate: { type: Date, default: null },
  cost: { type: Number, default: 0 },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'In Progress', 'Resolved', 'Cancelled'], 
    default: 'Pending' 
  },
  solution: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
