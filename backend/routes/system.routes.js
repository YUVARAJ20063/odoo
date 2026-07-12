const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// @desc    Get system settings
// @route   GET /api/system/settings
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        companyName: 'AssetFlow Enterprise Ltd',
        logo: '',
        currency: 'USD',
        maintenancePrefix: 'MNT-',
        systemMode: 'Production'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update system settings
// @route   PUT /api/system/settings
// @access  Private/Admin
router.put('/settings', protect, authorize('Admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings();
    }

    settings.companyName = req.body.companyName || settings.companyName;
    settings.logo = req.body.logo !== undefined ? req.body.logo : settings.logo;
    settings.currency = req.body.currency || settings.currency;
    settings.maintenancePrefix = req.body.maintenancePrefix || settings.maintenancePrefix;
    settings.systemMode = req.body.systemMode || settings.systemMode;

    const updatedSettings = await settings.save();

    // Log this settings modification
    await ActivityLog.create({
      user: req.user._id,
      action: 'Update Settings',
      details: `Modified global enterprise settings for ${updatedSettings.companyName}`
    });

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get global activity logs
// @route   GET /api/system/logs
// @access  Private/Admin
router.get('/logs', protect, authorize('Admin'), async (req, res) => {
  try {
    const logs = await ActivityLog.find({})
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user notifications
// @route   GET /api/system/notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    // Find notifications matching this user, or global notifications (user = null)
    const notifications = await Notification.find({
      $or: [
        { user: req.user._id },
        { user: null }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/system/notifications/:id/read
// @access  Private
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a system notification (Admin / System generated)
// @route   POST /api/system/notifications
// @access  Private/Admin
router.post('/notifications', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const notification = await Notification.create({
      user: userId || null, // null means global
      title,
      message,
      type: type || 'Info'
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
