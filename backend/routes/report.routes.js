const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Booking = require('../models/Booking');
const Maintenance = require('../models/Maintenance');
const Allocation = require('../models/Allocation');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// @desc    Get dashboard metrics & trends
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // 1. Core KPIs
    const totalAssets = await Asset.countDocuments({});
    const availableAssets = await Asset.countDocuments({ status: 'Available' });
    const allocatedAssets = await Asset.countDocuments({ status: 'Allocated' });
    const maintenanceAssets = await Asset.countDocuments({ status: 'Under Maintenance' });
    
    const totalEmployees = await Employee.countDocuments({});
    const totalDepartments = await Department.countDocuments({});
    
    const activeBookingsCount = await Booking.countDocuments({ status: 'Approved', endTime: { $gte: new Date() } });
    
    // Total value of inventory
    const valuationAggregation = await Asset.aggregate([
      { $group: { _id: null, totalValue: { $sum: '$purchaseCost' } } }
    ]);
    const totalValue = valuationAggregation.length > 0 ? valuationAggregation[0].totalValue : 0;

    // Overdue allocations
    const overdueAllocations = await Allocation.find({
      status: 'Active',
      returnDueDate: { $lt: new Date() }
    }).populate('asset').populate('employee').populate('department');

    // 2. Status Breakdown
    const statusCounts = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3. Category Breakdown
    const categoryCounts = await Asset.aggregate([
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 }, 
          value: { $sum: '$purchaseCost' } 
        } 
      }
    ]);

    // 4. Maintenance cost over time
    const monthlyMaintenance = await Maintenance.aggregate([
      { $match: { status: 'Resolved' } },
      {
        $group: {
          _id: {
            year: { $year: '$resolutionDate' },
            month: { $month: '$resolutionDate' }
          },
          cost: { $sum: '$cost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 5. Shared resource booking frequency
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: '$resource',
          bookingsCount: { $sum: 1 }
        }
      }
    ]);
    const populatedBookingsStats = await Asset.populate(bookingStats, { path: '_id', select: 'name category model' });

    // 6. Recent activity stream (last 10 items)
    const recentActivities = await ActivityLog.find({})
      .populate('user', 'name role avatar')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      kpis: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        totalEmployees,
        totalDepartments,
        activeBookingsCount,
        totalValue,
        overdueCount: overdueAllocations.length
      },
      overdueAllocations,
      statusCounts,
      categoryCounts,
      monthlyMaintenance,
      bookingStats: populatedBookingsStats,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get detailed asset utilization report
// @route   GET /api/reports/utilization
// @access  Private
router.get('/utilization', protect, async (req, res) => {
  try {
    const total = await Asset.countDocuments({});
    const allocated = await Asset.countDocuments({ status: 'Allocated' });
    const maintenance = await Asset.countDocuments({ status: 'Under Maintenance' });
    const reserved = await Asset.countDocuments({ status: 'Reserved' });
    const available = await Asset.countDocuments({ status: 'Available' });

    const utilizationRate = total > 0 ? ((allocated + reserved) / total) * 100 : 0;

    res.json({
      total,
      allocated,
      maintenance,
      reserved,
      available,
      utilizationRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get department budget summaries
// @route   GET /api/reports/departments
// @access  Private
router.get('/departments', protect, async (req, res) => {
  try {
    const departments = await Department.find({}).populate('manager', 'name email');
    
    const report = await Promise.all(departments.map(async (dept) => {
      const employeeCount = await Employee.countDocuments({ department: dept._id });
      const assets = await Asset.find({ assignedDepartment: dept._id });
      const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
      
      const empAssets = await Asset.find({ 
        assignedEmployee: { $in: await Employee.find({ department: dept._id }).select('_id') } 
      });
      
      const totalEmpAssetValue = empAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
      const combinedAssetValue = totalAssetValue + totalEmpAssetValue;

      return {
        departmentName: dept.name,
        code: dept.code,
        managerName: dept.manager ? dept.manager.name : 'Unassigned',
        budget: dept.budget,
        employeeCount,
        assetCount: assets.length + empAssets.length,
        totalValue: combinedAssetValue,
        budgetUtilization: dept.budget > 0 ? (combinedAssetValue / dept.budget) * 100 : 0
      };
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get maintenance costs report
// @route   GET /api/reports/maintenance
// @access  Private
router.get('/maintenance', protect, async (req, res) => {
  try {
    const records = await Maintenance.find({ status: 'Resolved' })
      .populate('asset')
      .populate('requestedBy', 'name');

    const totalCost = records.reduce((sum, rec) => sum + (rec.cost || 0), 0);

    res.json({
      records,
      totalCost,
      count: records.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
