const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true }, // Laptop, Mobile, Vehicle, Projector, Meeting Room, Furniture, etc.
  model: { type: String, default: '' },
  manufacturer: { type: String, default: '' },
  purchaseDate: { type: Date, default: Date.now },
  purchaseCost: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'], 
    default: 'Available' 
  },
  condition: { 
    type: String, 
    enum: ['New', 'Good', 'Fair', 'Poor'], 
    default: 'New' 
  },
  location: { type: String, default: '' },
  image: { type: String, default: '' },
  documents: [
    {
      name: { type: String },
      url: { type: String }
    }
  ],
  qrCode: { type: String, default: '' },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  assignedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  specifications: { type: Map, of: String, default: {} },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);
