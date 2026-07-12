const express = require('express');
const router = express.Router();
const AuditCycle = require('../models/AuditCycle');
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

// @desc    Get all audit cycles
// @route   GET /api/audits
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const audits = await AuditCycle.find({})
      .populate('department', 'name code')
      .populate('auditors', 'name email')
      .sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single audit cycle detail
// @route   GET /api/audits/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const audit = await AuditCycle.findById(req.params.id)
      .populate('department', 'name code')
      .populate('auditors', 'name email')
      .populate('closedBy', 'name email')
      .populate('results.asset')
      .populate('results.auditedBy', 'name email');

    if (!audit) {
      return res.status(404).json({ message: 'Audit cycle not found' });
    }

    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new draft audit cycle
// @route   POST /api/audits
// @access  Private (Admin, Asset Manager)
router.post('/', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { title, scopeType, department, location, startDate, endDate, auditors } = req.body;

    // Determine query filter for asset scope
    let filter = {};
    if (scopeType === 'Department') {
      if (!department) return res.status(400).json({ message: 'Department is required for Department scope' });
      filter.assignedDepartment = department;
    } else if (scopeType === 'Location') {
      if (!location) return res.status(400).json({ message: 'Location is required for Location scope' });
      filter.location = { $regex: new RegExp(location, 'i') };
    }

    // Find scoped assets
    const scopedAssets = await Asset.find(filter);

    // Build initial results array
    const results = scopedAssets.map(asset => ({
      asset: asset._id,
      status: 'Pending',
      notes: ''
    }));

    const audit = await AuditCycle.create({
      title,
      scopeType,
      department: scopeType === 'Department' ? department : null,
      location: scopeType === 'Location' ? location : '',
      startDate,
      endDate,
      auditors: auditors || [],
      status: 'Draft',
      results
    });

    await logActivity(req.user._id, 'Create Audit Cycle', `Created draft audit cycle: ${title} scoping ${scopedAssets.length} assets`);

    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Launch audit cycle
// @route   POST /api/audits/:id/start
// @access  Private (Admin, Asset Manager)
router.post('/:id/start', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const audit = await AuditCycle.findById(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Audit cycle not found' });
    }

    if (audit.status !== 'Draft') {
      return res.status(400).json({ message: 'Audit cycle is already started or completed' });
    }

    audit.status = 'Active';
    await audit.save();

    await logActivity(req.user._id, 'Start Audit Cycle', `Launched audit cycle: ${audit.title}`);

    res.json(audit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auditor submits evaluation for a single asset in a cycle
// @route   POST /api/audits/:id/submit
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { assetId, status, notes } = req.body;
    const audit = await AuditCycle.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({ message: 'Audit cycle not found' });
    }

    if (audit.status !== 'Active') {
      return res.status(400).json({ message: 'Audit cycle is not in Active state' });
    }

    // Verify requesting user is an assigned auditor or Admin/Manager
    const isAuditor = audit.auditors.some(aId => aId.toString() === req.user._id.toString());
    const isAdminOrManager = ['Admin', 'Asset Manager'].includes(req.user.role);
    if (!isAuditor && !isAdminOrManager) {
      return res.status(453).json({ message: 'Not authorized as auditor for this cycle' });
    }

    // Find asset row inside results
    const resultItem = audit.results.find(item => item.asset.toString() === assetId);
    if (!resultItem) {
      return res.status(404).json({ message: 'Asset not in scope of this audit cycle' });
    }

    resultItem.status = status;
    resultItem.notes = notes || '';
    resultItem.auditedBy = req.user._id;
    resultItem.auditedAt = new Date();

    await audit.save();
    res.json({ message: 'Asset status recorded successfully', item: resultItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Close Audit Cycle & auto-resolve asset records
// @route   POST /api/audits/:id/close
// @access  Private (Admin, Asset Manager)
router.post('/:id/close', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const audit = await AuditCycle.findById(req.params.id).populate('results.asset');
    if (!audit) {
      return res.status(404).json({ message: 'Audit cycle not found' });
    }

    if (audit.status !== 'Active') {
      return res.status(400).json({ message: 'Only active audit cycles can be closed' });
    }

    // Generate Discrepancy report statistics
    let total = audit.results.length;
    let verified = 0;
    let missing = [];
    let damaged = [];
    let pending = 0;

    for (const item of audit.results) {
      if (item.status === 'Verified') {
        verified++;
      } else if (item.status === 'Missing') {
        missing.push(item);
        // Lock asset state to "Lost"
        await Asset.findByIdAndUpdate(item.asset._id, { status: 'Lost' });
      } else if (item.status === 'Damaged') {
        damaged.push(item);
        // Flip to Under Maintenance
        await Asset.findByIdAndUpdate(item.asset._id, { status: 'Under Maintenance', condition: 'Poor' });
      } else {
        pending++;
      }
    }

    const reportSummary = `Audit Cycle closed on ${new Date().toLocaleDateString()}.\n` +
      `Total assets audited: ${total}.\n` +
      `Verified successfully: ${verified}.\n` +
      `Discrepancies found: Missing/Lost: ${missing.length}, Damaged: ${damaged.length}.\n` +
      `Un-audited/Pending items: ${pending}.\n` +
      `Affected assets database statuses have been auto-updated.`;

    audit.status = 'Completed';
    audit.discrepancyReport = reportSummary;
    audit.closedAt = new Date();
    audit.closedBy = req.user._id;

    await audit.save();

    await logActivity(req.user._id, 'Close Audit Cycle', `Closed audit cycle: ${audit.title}. Discrepancies: ${missing.length} Lost, ${damaged.length} Damaged`);

    res.json({ message: 'Audit cycle successfully completed and locked', audit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
