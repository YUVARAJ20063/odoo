const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
router.post('/register', protect, authorize('Admin'), async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || null,
      phone: phone || ''
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Register a new user (Public Signup)
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password, department, phone, designation } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const employeeId = 'EMP-' + Math.floor(100000 + Math.random() * 900000);

    // Create Employee record
    const employee = await Employee.create({
      employeeId,
      name,
      email,
      phone: phone || '',
      department: department || null,
      designation: designation || 'Employee',
      status: 'Active'
    });

    // Create User record
    const user = await User.create({
      name,
      email,
      password,
      role: 'Employee',
      department: department || null,
      phone: phone || ''
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'assetflow_secret_key',
      { expiresIn: '30d' }
    );

    await ActivityLog.create({
      user: user._id,
      action: 'Public Signup',
      details: `New employee registered self: ${name} (${employeeId})`
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('department');

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Suspended') {
        return res.status(401).json({ message: 'User account is suspended' });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'assetflow_secret_key',
        { expiresIn: '30d' }
      );

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find({}).populate('department').select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Promote/update system role of a user
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, authorize('Admin'), async (req, res) => {
  const { role } = req.body;
  try {
    const userToPromote = await User.findById(req.params.id);
    if (!userToPromote) {
      return res.status(404).json({ message: 'User login account not found' });
    }

    const oldRole = userToPromote.role;
    userToPromote.role = role;
    await userToPromote.save();

    // Log the change
    await ActivityLog.create({
      user: req.user._id,
      action: 'Promote User',
      details: `Changed role of user ${userToPromote.name} (${userToPromote.email}) from ${oldRole} to ${role}`
    });

    res.json({ message: `Successfully updated role to ${role}`, user: userToPromote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Password Reset Placeholder
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  // This is a placeholder as requested. In a real environment, it would send an email.
  res.json({ 
    message: `Password reset instructions sent to ${email} (mock link generated). In a production environment, this triggers a verification token link.` 
  });
});

module.exports = router;
