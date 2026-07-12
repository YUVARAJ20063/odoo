const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'AssetFlow Corp' },
  logo: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  maintenancePrefix: { type: String, default: 'MNT-' },
  systemMode: { type: String, enum: ['Production', 'Maintenance'], default: 'Production' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
