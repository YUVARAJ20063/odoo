const mongoose = require('mongoose');

const AuditCycleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  scopeType: { type: String, enum: ['Department', 'Location', 'All'], required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  location: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Draft', 'Active', 'Completed'], default: 'Draft' },
  results: [
    {
      asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
      status: { type: String, enum: ['Pending', 'Verified', 'Missing', 'Damaged'], default: 'Pending' },
      notes: { type: String, default: '' },
      auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      auditedAt: { type: Date }
    }
  ],
  discrepancyReport: { type: String, default: '' },
  closedAt: { type: Date, default: null },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('AuditCycle', AuditCycleSchema);
