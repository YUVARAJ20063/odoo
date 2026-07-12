const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
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

// @desc    Get all maintenance requests
// @route   GET /api/maintenance
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const requests = await Maintenance.find({})
      .populate('asset')
      .populate('requestedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Raise a maintenance request
// @route   POST /api/maintenance
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { assetId, description } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const request = await Maintenance.create({
      asset: assetId,
      requestedBy: req.user._id,
      description,
      status: 'Pending'
    });

    const populated = await Maintenance.findById(request._id)
      .populate('asset')
      .populate('requestedBy', 'name email');

    await logActivity(req.user._id, 'Raise Maintenance', `Requested maintenance for asset ${asset.name}`);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve / Schedule a request
// @route   PUT /api/maintenance/:id/approve
// @access  Private (Admin, Asset Manager)
router.put('/:id/approve', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    const request = await Maintenance.findById(req.params.id).populate('asset');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    request.status = 'Approved';
    request.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    await request.save();

    // Set Asset status to Under Maintenance
    const asset = await Asset.findById(request.asset._id);
    if (asset) {
      asset.status = 'Under Maintenance';
      await asset.save();
    }

    await logActivity(req.user._id, 'Approve Maintenance', `Approved maintenance request for asset ${request.asset.name}`);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Assign technician & Start work
// @route   PUT /api/maintenance/:id/assign
// @access  Private (Admin, Asset Manager)
router.put('/:id/assign', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { technician } = req.body;
    const request = await Maintenance.findById(req.params.id).populate('asset');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    request.status = 'In Progress';
    request.assignedTechnician = technician || 'Default Technician';
    await request.save();

    // Ensure Asset is Under Maintenance
    const asset = await Asset.findById(request.asset._id);
    if (asset && asset.status !== 'Under Maintenance') {
      asset.status = 'Under Maintenance';
      await asset.save();
    }

    await logActivity(req.user._id, 'Assign Maintenance', `Assigned technician ${request.assignedTechnician} to asset ${request.asset.name}`);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Resolve a maintenance request
// @route   PUT /api/maintenance/:id/resolve
// @access  Private (Admin, Asset Manager)
router.put('/:id/resolve', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { cost, solution, notes } = req.body;
    const request = await Maintenance.findById(req.params.id).populate('asset');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    request.status = 'Resolved';
    request.cost = cost || 0;
    request.solution = solution || 'Completed standard repair procedures.';
    request.notes = notes || '';
    request.resolutionDate = new Date();
    await request.save();

    // Release Asset back to Available
    const asset = await Asset.findById(request.asset._id);
    if (asset) {
      asset.status = 'Available';
      await asset.save();
    }

    await logActivity(req.user._id, 'Resolve Maintenance', `Resolved maintenance for asset ${request.asset.name} (Cost: $${cost})`);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Cancel a request
// @route   PUT /api/maintenance/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id).populate('asset');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Only creator or manager can cancel
    if (request.requestedBy.toString() !== req.user._id.toString() && !['Admin', 'Asset Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    request.status = 'Cancelled';
    await request.save();

    // Release Asset back to Available
    const asset = await Asset.findById(request.asset._id);
    if (asset && asset.status === 'Under Maintenance') {
      asset.status = 'Available';
      await asset.save();
    }

    await logActivity(req.user._id, 'Cancel Maintenance', `Cancelled maintenance request for asset ${request.asset.name}`);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
