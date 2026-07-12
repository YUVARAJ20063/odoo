const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Employee = require('../models/Employee');
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

// @desc    Get departments (Public for Signup)
// @route   GET /api/departments/public
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const depts = await Department.find({ status: 'Active' }, 'name code');
    res.json(depts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({}).populate('manager', 'name email').populate('parentDepartment', 'name code');
    
    // Enrich departments with employee count and asset value dynamically for listings
    const enrichedDepts = await Promise.all(departments.map(async (dept) => {
      const employeeCount = await Employee.countDocuments({ department: dept._id });
      const assets = await Asset.find({ assignedDepartment: dept._id });
      const assetValue = assets.reduce((sum, asset) => sum + (asset.purchaseCost || 0), 0);
      const assetCount = assets.length;

      return {
        ...dept.toObject(),
        employeeCount,
        assetCount,
        assetValue
      };
    }));

    res.json(enrichedDepts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, code, manager, budget, description, parentDepartment, status } = req.body;

    const codeExists = await Department.findOne({ code });
    if (codeExists) {
      return res.status(400).json({ message: 'Department code already exists' });
    }

    const department = await Department.create({
      name,
      code,
      manager: manager || null,
      budget: budget || 0,
      description: description || '',
      parentDepartment: parentDepartment || null,
      status: status || 'Active'
    });

    await logActivity(req.user._id, 'Create Department', `Created department: ${name} (${code})`);

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    department.name = req.body.name || department.name;
    department.code = req.body.code || department.code;
    department.manager = req.body.manager !== undefined ? req.body.manager : department.manager;
    department.budget = req.body.budget !== undefined ? req.body.budget : department.budget;
    department.description = req.body.description || department.description;
    department.parentDepartment = req.body.parentDepartment !== undefined ? req.body.parentDepartment : department.parentDepartment;
    department.status = req.body.status || department.status;

    const updatedDept = await department.save();

    await logActivity(req.user._id, 'Update Department', `Updated department: ${department.name}`);

    res.json(updatedDept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has employees assigned
    const employeeCount = await Employee.countDocuments({ department: department._id });
    if (employeeCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with active employee profiles assigned to it.' 
      });
    }

    // Check if department has assets allocated
    const assignedAssetsCount = await Asset.countDocuments({ assignedDepartment: department._id });
    if (assignedAssetsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department. Retract or reassign all allocated assets first.' 
      });
    }

    const deptName = department.name;
    await department.deleteOne();

    await logActivity(req.user._id, 'Delete Department', `Deleted department: ${deptName}`);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
