const express = require('express');
const router = express.Router();
const AssetCategory = require('../models/AssetCategory');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// Helper to log activities
const logActivity = async (userId, action, details) => {
  try {
    await ActivityLog.create({ user: userId, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// @desc    Get all asset categories
// @route   GET /api/categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const categories = await AssetCategory.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create asset category
// @route   POST /api/categories
// @access  Private (Admin, Asset Manager)
router.post('/', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { name, code, description, fields } = req.body;

    const nameExists = await AssetCategory.findOne({ name });
    if (nameExists) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const codeExists = await AssetCategory.findOne({ code });
    if (codeExists) {
      return res.status(400).json({ message: 'Category code already exists' });
    }

    const category = await AssetCategory.create({
      name,
      code,
      description: description || '',
      fields: fields || []
    });

    await logActivity(req.user._id, 'Create Category', `Created asset category: ${name} (${code})`);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update asset category
// @route   PUT /api/categories/:id
// @access  Private (Admin, Asset Manager)
router.put('/:id', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = req.body.name || category.name;
    category.code = req.body.code || category.code;
    category.description = req.body.description !== undefined ? req.body.description : category.description;
    category.fields = req.body.fields !== undefined ? req.body.fields : category.fields;

    const updatedCategory = await category.save();

    await logActivity(req.user._id, 'Update Category', `Updated asset category: ${category.name}`);

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete asset category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categoryName = category.name;
    await category.deleteOne();

    await logActivity(req.user._id, 'Delete Category', `Deleted asset category: ${categoryName}`);

    res.json({ message: 'Asset category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
