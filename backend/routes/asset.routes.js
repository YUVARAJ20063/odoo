const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Maintenance = require('../models/Maintenance');
const ActivityLog = require('../models/ActivityLog');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Helper to log user activities
const logActivity = async (userId, action, details) => {
  try {
    await ActivityLog.create({ user: userId, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// @desc    Upload file/image
// @route   POST /api/assets/upload
// @access  Private
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ 
    message: 'File uploaded successfully', 
    url: fileUrl,
    filename: req.file.originalname
  });
});

// @desc    Get all assets (with Search, Filter, Sort, Pagination)
// @route   GET /api/assets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status, 
      condition, 
      sortBy = 'createdAt', 
      order = 'desc', 
      page = 1, 
      limit = 100 
    } = req.query;

    const query = {};

    // Global Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .populate('assignedEmployee')
      .populate('assignedDepartment')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      assets,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single asset detail with history
// @route   GET /api/assets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Standard query matches object ID or the assetId code!
    let asset;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      asset = await Asset.findById(req.params.id)
        .populate('assignedEmployee')
        .populate('assignedDepartment');
    } else {
      asset = await Asset.findOne({ assetId: req.params.id })
        .populate('assignedEmployee')
        .populate('assignedDepartment');
    }

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Get Allocation History
    const allocations = await Allocation.find({ asset: asset._id })
      .populate('employee')
      .populate('department')
      .populate('allocatedBy', 'name email')
      .sort({ createdAt: -1 });

    // Get Maintenance History
    const maintenances = await Maintenance.find({ asset: asset._id })
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      asset,
      history: {
        allocations,
        maintenances
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private (Admin, Asset Manager)
router.post('/', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { 
      assetId, name, category, model, manufacturer, 
      purchaseDate, purchaseCost, status, condition, 
      location, image, documents, specifications, notes 
    } = req.body;

    const assetExists = await Asset.findOne({ assetId });
    if (assetExists) {
      return res.status(400).json({ message: 'Asset ID (Serial/Barcode) already exists' });
    }

    const qrCode = `AF-QR-${assetId}`; // Simplified QR code payload readable by simulation

    const asset = await Asset.create({
      assetId, name, category, model, manufacturer,
      purchaseDate, purchaseCost, status: status || 'Available',
      condition, location, image, documents, qrCode,
      specifications, notes
    });

    await logActivity(req.user._id, 'Create Asset', `Created asset ${name} (${assetId})`);

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin, Asset Manager)
router.put('/:id', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Fields to update
    const fields = [
      'name', 'category', 'model', 'manufacturer', 'purchaseDate',
      'purchaseCost', 'status', 'condition', 'location', 'image',
      'documents', 'specifications', 'notes'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        asset[field] = req.body[field];
      }
    });

    // If status changes to Under Maintenance, Available, Lost, Disposed - handle employee associations accordingly
    if (['Under Maintenance', 'Lost', 'Retired', 'Disposed'].includes(asset.status)) {
      // If we are retiring or placing in maintenance, we might close out current allocation
      if (asset.assignedEmployee || asset.assignedDepartment) {
        // Complete the active allocation
        await Allocation.updateMany(
          { asset: asset._id, status: 'Active' },
          { status: 'Returned', returnedDate: new Date(), notes: `Returned automatically due to asset status change: ${asset.status}` }
        );
        asset.assignedEmployee = null;
        asset.assignedDepartment = null;
      }
    }

    const updatedAsset = await asset.save();

    await logActivity(req.user._id, 'Update Asset', `Updated asset ${asset.name} (${asset.assetId})`);

    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin, Asset Manager)
router.delete('/:id', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Clean up active allocations
    await Allocation.deleteMany({ asset: asset._id });
    await Maintenance.deleteMany({ asset: asset._id });

    const assetName = asset.name;
    const assetId = asset.assetId;
    await asset.deleteOne();

    await logActivity(req.user._id, 'Delete Asset', `Deleted asset ${assetName} (${assetId})`);

    res.json({ message: 'Asset and associated allocation/maintenance logs deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Allocate asset to employee or department
// @route   POST /api/assets/:id/allocate
// @access  Private (Admin, Asset Manager)
router.post('/:id/allocate', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { employeeId, departmentId, returnDueDate, notes } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.status !== 'Available') {
      return res.status(400).json({ message: `Asset is not available for allocation. Current status: ${asset.status}` });
    }

    let emp = null;
    let dept = null;

    if (employeeId) {
      emp = await Employee.findById(employeeId);
      if (!emp) return res.status(404).json({ message: 'Employee not found' });
      asset.assignedEmployee = emp._id;
      asset.assignedDepartment = null;
    } else if (departmentId) {
      dept = await Department.findById(departmentId);
      if (!dept) return res.status(404).json({ message: 'Department not found' });
      asset.assignedDepartment = dept._id;
      asset.assignedEmployee = null;
    } else {
      return res.status(400).json({ message: 'Please specify an Employee or Department for allocation' });
    }

    asset.status = 'Allocated';
    await asset.save();

    const allocation = await Allocation.create({
      asset: asset._id,
      employee: emp ? emp._id : null,
      department: dept ? dept._id : null,
      allocatedBy: req.user._id,
      returnDueDate: returnDueDate || null,
      notes: notes || ''
    });

    const targetName = emp ? emp.name : dept.name;
    await logActivity(req.user._id, 'Allocate Asset', `Allocated asset ${asset.name} to ${targetName}`);

    res.json({ asset, allocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Transfer asset to another employee or department
// @route   POST /api/assets/:id/transfer
// @access  Private (Admin, Asset Manager)
router.post('/:id/transfer', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { employeeId, departmentId, returnDueDate, notes } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Complete current active allocations
    await Allocation.updateMany(
      { asset: asset._id, status: 'Active' },
      { status: 'Returned', returnedDate: new Date(), notes: 'Closed due to asset transfer' }
    );

    let emp = null;
    let dept = null;

    if (employeeId) {
      emp = await Employee.findById(employeeId);
      if (!emp) return res.status(404).json({ message: 'Employee not found' });
      asset.assignedEmployee = emp._id;
      asset.assignedDepartment = null;
    } else if (departmentId) {
      dept = await Department.findById(departmentId);
      if (!dept) return res.status(404).json({ message: 'Department not found' });
      asset.assignedDepartment = dept._id;
      asset.assignedEmployee = null;
    } else {
      return res.status(400).json({ message: 'Please specify an Employee or Department for transfer' });
    }

    asset.status = 'Allocated';
    await asset.save();

    const allocation = await Allocation.create({
      asset: asset._id,
      employee: emp ? emp._id : null,
      department: dept ? dept._id : null,
      allocatedBy: req.user._id,
      returnDueDate: returnDueDate || null,
      notes: notes || 'Transferred from previous assignment'
    });

    const targetName = emp ? emp.name : dept.name;
    await logActivity(req.user._id, 'Transfer Asset', `Transferred asset ${asset.name} to ${targetName}`);

    res.json({ asset, allocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Return asset to inventory
// @route   POST /api/assets/:id/return
// @access  Private (Admin, Asset Manager)
router.post('/:id/return', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { notes } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.status !== 'Allocated' && !asset.assignedEmployee && !asset.assignedDepartment) {
      return res.status(400).json({ message: 'Asset is not allocated' });
    }

    const previousEmployee = asset.assignedEmployee;
    const previousDept = asset.assignedDepartment;

    asset.status = 'Available';
    asset.assignedEmployee = null;
    asset.assignedDepartment = null;
    await asset.save();

    // Mark current active allocations as returned
    await Allocation.updateMany(
      { asset: asset._id, status: 'Active' },
      { status: 'Returned', returnedDate: new Date(), notes: notes || 'Returned to inventory' }
    );

    let senderName = 'Inventory';
    if (previousEmployee) {
      const emp = await Employee.findById(previousEmployee);
      if (emp) senderName = emp.name;
    } else if (previousDept) {
      const dept = await Department.findById(previousDept);
      if (dept) senderName = dept.name;
    }

    await logActivity(req.user._id, 'Return Asset', `Returned asset ${asset.name} from ${senderName}`);

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
