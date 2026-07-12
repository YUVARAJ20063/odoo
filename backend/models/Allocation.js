const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  allocatedDate: { type: Date, default: Date.now },
  returnDueDate: { type: Date, default: null },
  returnedDate: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['Active', 'Returned', 'Overdue'], 
    default: 'Active' 
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Allocation', AllocationSchema);
