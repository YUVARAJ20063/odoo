const mongoose = require('mongoose');

const AssetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  fields: [
    {
      name: { type: String, required: true },
      type: { type: String, enum: ['String', 'Number', 'Boolean', 'Date'], default: 'String' },
      required: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('AssetCategory', AssetCategorySchema);
