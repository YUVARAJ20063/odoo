const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
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

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const employees = await Employee.find({}).populate('department');
    const User = require('../models/User');
    const users = await User.find({}, 'email role');
    
    const roleMap = {};
    users.forEach(u => {
      if (u.email) {
        roleMap[u.email.toLowerCase()] = u.role;
      }
    });

    const enrichedEmployees = employees.map(emp => {
      const empObj = emp.toObject();
      empObj.role = roleMap[emp.email.toLowerCase()] || 'Employee';
      return empObj;
    });

    res.json(enrichedEmployees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single employee detail & history
// @route   GET /api/employees/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Find currently assigned assets
    const activeAssets = await Asset.find({ assignedEmployee: employee._id, status: 'Allocated' });

    // Find asset allocation history
    const allocationHistory = await Allocation.find({ employee: employee._id })
      .populate('asset')
      .populate('allocatedBy', 'name email')
      .sort({ createdAt: -1 });

    const User = require('../models/User');
    const matchingUser = await User.findOne({ email: employee.email }, 'role');
    const empObj = employee.toObject();
    empObj.role = matchingUser ? matchingUser.role : 'Employee';

    res.json({
      employee: empObj,
      activeAssets,
      history: allocationHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin, Asset Manager)
router.post('/', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const { employeeId, name, email, phone, department, designation, status, profileImage } = req.body;

    const empIdExists = await Employee.findOne({ employeeId });
    if (empIdExists) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Employee email already exists' });
    }

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      status: status || 'Active',
      profileImage
    });

    await logActivity(req.user._id, 'Create Employee', `Created employee profile: ${name} (${employeeId})`);

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update employee details
// @route   PUT /api/employees/:id
// @access  Private (Admin, Asset Manager)
router.put('/:id', protect, authorize('Admin', 'Asset Manager'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.name = req.body.name || employee.name;
    employee.email = req.body.email || employee.email;
    employee.phone = req.body.phone || employee.phone;
    employee.department = req.body.department || employee.department;
    employee.designation = req.body.designation || employee.designation;
    employee.status = req.body.status || employee.status;
    employee.profileImage = req.body.profileImage || employee.profileImage;

    const updatedEmployee = await employee.save();

    if (req.user.role === 'Admin' && req.body.role) {
      const User = require('../models/User');
      await User.findOneAndUpdate({ email: employee.email }, { role: req.body.role });
    }

    await logActivity(req.user._id, 'Update Employee', `Updated employee: ${employee.name}`);

    const User = require('../models/User');
    const matchingUser = await User.findOne({ email: employee.email }, 'role');
    const empObj = updatedEmployee.toObject();
    empObj.role = matchingUser ? matchingUser.role : 'Employee';

    res.json(empObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee has assets allocated to them
    const assignedAssetsCount = await Asset.countDocuments({ assignedEmployee: employee._id });
    if (assignedAssetsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete employee. Return or transfer all allocated assets first.' 
      });
    }

    const empName = employee.name;
    await employee.deleteOne();

    await logActivity(req.user._id, 'Delete Employee', `Deleted employee: ${empName}`);

    res.json({ message: 'Employee profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
