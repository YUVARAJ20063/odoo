const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Import Models
const User = require('../models/User');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const Booking = require('../models/Booking');
const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');

const seedData = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow');
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await Asset.deleteMany({});
    await Allocation.deleteMany({});
    await Booking.deleteMany({});
    await Maintenance.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    await Settings.deleteMany({});
    console.log('Database cleared.');

    // 1. Create Departments
    console.log('Seeding Departments...');
    const depts = [
      { name: 'Information Technology', code: 'IT', budget: 150000, description: 'Handles system administration, network infrastructures, and computing hardware.' },
      { name: 'Human Resources', code: 'HR', budget: 50000, description: 'Manages employee relations, staffing, onboarding, and internal corporate operations.' },
      { name: 'Finance & Accounts', code: 'FIN', budget: 85000, description: 'Coordinates accounting audits, payroll distributions, and asset tax valuations.' },
      { name: 'Marketing & Sales', code: 'MKT', budget: 110000, description: 'Conducts advertising campaigns, client outreach, and product demonstrations.' },
      { name: 'Operations & Facilities', code: 'OPS', budget: 200000, description: 'Maintains physical office structures, fleet operations, and shared resource bookings.' }
    ];
    const createdDepts = await Department.insertMany(depts);
    console.log(`Seeded ${createdDepts.length} departments.`);

    const itDept = createdDepts.find(d => d.code === 'IT');
    const hrDept = createdDepts.find(d => d.code === 'HR');
    const mktDept = createdDepts.find(d => d.code === 'MKT');
    const finDept = createdDepts.find(d => d.code === 'FIN');
    const opsDept = createdDepts.find(d => d.code === 'OPS');

    // 2. Create Users
    console.log('Seeding Users...');
    
    // We will create the users directly. Note that save() pre-hook hashes the password, 
    // but if we do insertMany, we need to hash passwords manually or save them one by one.
    // Let's create users one by one to trigger the password hashing hook.
    
    const adminUser = new User({
      name: 'yuvaraj',
      email: 'admin@assetflow.com',
      password: 'admin123',
      role: 'Admin',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: 'Active'
    });
    await adminUser.save();

    const managerUser = new User({
      name: 'Marcus Brody',
      email: 'manager@assetflow.com',
      password: 'manager123',
      role: 'Asset Manager',
      phone: '+1 (555) 019-5839',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: 'Active'
    });
    await managerUser.save();

    const headUser = new User({
      name: 'Sophia Sterling',
      email: 'head@assetflow.com',
      password: 'head123',
      role: 'Department Head',
      department: itDept._id,
      phone: '+1 (555) 019-3329',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: 'Active'
    });
    await headUser.save();

    const employeeUser = new User({
      name: 'John Doe',
      email: 'employee@assetflow.com',
      password: 'employee123',
      role: 'Employee',
      department: itDept._id,
      phone: '+1 (555) 019-9948',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: 'Active'
    });
    await employeeUser.save();

    console.log('Seeded 4 users (Admin, Manager, Head, Employee).');

    // Link IT Dept Manager
    itDept.manager = headUser._id;
    await itDept.save();

    // 3. Create Employees
    console.log('Seeding Employees...');
    const employees = [
      { employeeId: 'EMP-001', name: 'John Doe', email: 'employee@assetflow.com', phone: '+1 (555) 019-9948', department: itDept._id, designation: 'Senior IT Engineer', status: 'Active', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
      { employeeId: 'EMP-002', name: 'Sarah Jenkins', email: 'sarah.j@assetflow.com', phone: '+1 (555) 019-1234', department: mktDept._id, designation: 'Marketing Coordinator', status: 'Active', profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
      { employeeId: 'EMP-003', name: 'James Wilson', email: 'j.wilson@assetflow.com', phone: '+1 (555) 019-5678', department: finDept._id, designation: 'Financial Comptroller', status: 'Active', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
      { employeeId: 'EMP-004', name: 'Patricia Albers', email: 'p.albers@assetflow.com', phone: '+1 (555) 019-8765', department: hrDept._id, designation: 'HR Generalist', status: 'Active', profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
      { employeeId: 'EMP-005', name: 'Robert Vance', email: 'r.vance@assetflow.com', phone: '+1 (555) 019-4321', department: opsDept._id, designation: 'Facilities Lead', status: 'Active', profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }
    ];
    const createdEmployees = await Employee.insertMany(employees);
    console.log(`Seeded ${createdEmployees.length} employee records.`);

    const empJohn = createdEmployees.find(e => e.employeeId === 'EMP-001');
    const empSarah = createdEmployees.find(e => e.employeeId === 'EMP-002');
    const empJames = createdEmployees.find(e => e.employeeId === 'EMP-003');

    // 4. Create Assets
    console.log('Seeding Assets...');
    const assets = [
      // Laptops & IT Equipment
      {
        assetId: 'AST-LPT-1001',
        name: 'Dell XPS 15 9530',
        category: 'Laptop',
        model: 'XPS 15 9530',
        manufacturer: 'Dell',
        purchaseDate: new Date('2025-01-15'),
        purchaseCost: 1899,
        status: 'Allocated',
        condition: 'New',
        location: 'HQ Floor 3',
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80',
        assignedEmployee: empJohn._id,
        specifications: { CPU: 'Intel i7-13700H', RAM: '32GB', Storage: '1TB SSD', GPU: 'NVIDIA RTX 4060' },
        notes: 'Assigned as primary workstation.',
        qrCode: 'AF-QR-AST-LPT-1001'
      },
      {
        assetId: 'AST-LPT-1002',
        name: 'Macbook Pro 16" M3 Max',
        category: 'Laptop',
        model: 'MacBook Pro 16"',
        manufacturer: 'Apple',
        purchaseDate: new Date('2025-03-10'),
        purchaseCost: 3499,
        status: 'Allocated',
        condition: 'New',
        location: 'HQ Floor 2',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
        assignedEmployee: empSarah._id,
        specifications: { Chip: 'Apple M3 Max', RAM: '48GB', Storage: '1TB SSD', Core: '16-core CPU, 40-core GPU' },
        notes: 'High-end design laptop.',
        qrCode: 'AF-QR-AST-LPT-1002'
      },
      {
        assetId: 'AST-LPT-1003',
        name: 'Lenovo ThinkPad T14 Gen 4',
        category: 'Laptop',
        model: 'ThinkPad T14 Gen 4',
        manufacturer: 'Lenovo',
        purchaseDate: new Date('2024-11-05'),
        purchaseCost: 1250,
        status: 'Under Maintenance',
        condition: 'Fair',
        location: 'IT Storage A',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
        specifications: { CPU: 'AMD Ryzen 7 7840U', RAM: '16GB', Storage: '512GB SSD' },
        notes: 'Reported keyboard failure. Under repair.',
        qrCode: 'AF-QR-AST-LPT-1003'
      },
      {
        assetId: 'AST-MOB-2001',
        name: 'iPhone 15 Pro Max',
        category: 'Mobile',
        model: 'iPhone 15 Pro Max',
        manufacturer: 'Apple',
        purchaseDate: new Date('2025-02-20'),
        purchaseCost: 1199,
        status: 'Available',
        condition: 'New',
        location: 'IT Secure Vault',
        image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80',
        specifications: { Storage: '256GB', Color: 'Natural Titanium' },
        notes: 'Executive deployment pool.',
        qrCode: 'AF-QR-AST-MOB-2001'
      },
      // Bookable Shared Resources - Meeting Rooms
      {
        assetId: 'RES-MR-001',
        name: 'Boardroom Alfa (HQ-301)',
        category: 'Meeting Room',
        model: 'Capacity: 16 Pax',
        manufacturer: 'Office Facilities',
        purchaseDate: new Date('2024-06-01'),
        purchaseCost: 15000,
        status: 'Available',
        condition: 'Good',
        location: 'HQ Floor 3, East Wing',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
        specifications: { Display: '86" Interactive Screen', Conferencing: 'Logitech Rally Bar', Whiteboard: 'SmartBoard Dual' },
        notes: 'Premium conference space for corporate reviews.',
        qrCode: 'AF-QR-RES-MR-001'
      },
      {
        assetId: 'RES-MR-002',
        name: 'Innovation Hub (HQ-102)',
        category: 'Meeting Room',
        model: 'Capacity: 8 Pax',
        manufacturer: 'Office Facilities',
        purchaseDate: new Date('2024-06-01'),
        purchaseCost: 8000,
        status: 'Available',
        condition: 'Good',
        location: 'HQ Floor 1, West Wing',
        image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80',
        specifications: { Display: '65" TV Screen', Board: 'Magnetic Whiteboard' },
        notes: 'Cozy room for technical syncs.',
        qrCode: 'AF-QR-RES-MR-002'
      },
      // Bookable Shared Resources - Projectors
      {
        assetId: 'RES-PRJ-001',
        name: 'Epson Pro EX11000 4K',
        category: 'Projector',
        model: 'Pro EX11000',
        manufacturer: 'Epson',
        purchaseDate: new Date('2024-10-18'),
        purchaseCost: 999,
        status: 'Available',
        condition: 'Good',
        location: 'IT Rental Locker 3',
        image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=400&q=80',
        specifications: { Resolution: '4K UHD', Brightness: '4600 Lumens', Inputs: 'HDMI, Wireless' },
        notes: 'Portable projector. Must return with bag & accessories.',
        qrCode: 'AF-QR-RES-PRJ-001'
      },
      // Bookable Shared Resources - Vehicles
      {
        assetId: 'RES-VEH-001',
        name: 'Tesla Model S Long Range',
        category: 'Vehicle',
        model: 'Model S LR 2024',
        manufacturer: 'Tesla',
        purchaseDate: new Date('2024-08-12'),
        purchaseCost: 74990,
        status: 'Available',
        condition: 'Good',
        location: 'Basement Parking Slot B-12',
        image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80',
        specifications: { Range: '405 miles', Autopilot: 'Enhanced FSD', Color: 'Solid Black' },
        notes: 'Executive transportation only. Charge to 80% on return.',
        qrCode: 'AF-QR-RES-VEH-001'
      },
      {
        assetId: 'RES-VEH-002',
        name: 'Ford Transit Cargo Van',
        category: 'Vehicle',
        model: 'Transit 250',
        manufacturer: 'Ford',
        purchaseDate: new Date('2024-04-10'),
        purchaseCost: 45000,
        status: 'Available',
        condition: 'Fair',
        location: 'Rear Loading Dock Slot D-2',
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
        specifications: { Engine: '3.5L V6 EcoBoost', CargoVolume: '357 cu. ft.', Color: 'Oxford White' },
        notes: 'Logistics and heavy asset transit van.',
        qrCode: 'AF-QR-RES-VEH-002'
      },
      // Office Furnitures
      {
        assetId: 'AST-FUR-3001',
        name: 'Herman Miller Aeron Chair',
        category: 'Furniture',
        model: 'Aeron Size B',
        manufacturer: 'Herman Miller',
        purchaseDate: new Date('2024-09-02'),
        purchaseCost: 1450,
        status: 'Allocated',
        condition: 'Good',
        location: 'HQ Floor 2, Desk D-18',
        image: 'https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&w=400&q=80',
        assignedEmployee: empJames._id,
        specifications: { Color: 'Graphite', Armrests: 'Fully Adjustable' },
        notes: 'Special ergonomic deployment.',
        qrCode: 'AF-QR-AST-FUR-3001'
      }
    ];

    const createdAssets = await Asset.insertMany(assets);
    console.log(`Seeded ${createdAssets.length} assets.`);

    const dellAsset = createdAssets.find(a => a.assetId === 'AST-LPT-1001');
    const macAsset = createdAssets.find(a => a.assetId === 'AST-LPT-1002');
    const thinkAsset = createdAssets.find(a => a.assetId === 'AST-LPT-1003');
    const boardroomAsset = createdAssets.find(a => a.assetId === 'RES-MR-001');
    const teslaAsset = createdAssets.find(a => a.assetId === 'RES-VEH-001');
    const projectorAsset = createdAssets.find(a => a.assetId === 'RES-PRJ-001');

    // 5. Seed Allocations
    console.log('Seeding Allocations...');
    const allocations = [
      {
        asset: dellAsset._id,
        employee: empJohn._id,
        allocatedBy: adminUser._id,
        allocatedDate: new Date('2025-01-16'),
        returnDueDate: new Date('2027-01-16'),
        status: 'Active',
        notes: 'Initial developer deployment.'
      },
      {
        asset: macAsset._id,
        employee: empSarah._id,
        allocatedBy: managerUser._id,
        allocatedDate: new Date('2025-03-11'),
        returnDueDate: new Date('2026-03-11'),
        status: 'Active',
        notes: 'Creative department workstation lease.'
      }
    ];
    await Allocation.insertMany(allocations);
    console.log('Seeded active asset allocations.');

    // 6. Seed Maintenance
    console.log('Seeding Maintenance...');
    const maintenanceRequests = [
      {
        asset: thinkAsset._id,
        requestedBy: headUser._id,
        assignedTechnician: 'Alice Fixer (Hardware Specialist)',
        requestDate: new Date('2026-07-10'),
        scheduledDate: new Date('2026-07-13'),
        description: 'Keyboard keys "F", "G", "H" are stuck due to accidental coffee splash.',
        status: 'In Progress'
      },
      {
        asset: dellAsset._id,
        requestedBy: employeeUser._id,
        assignedTechnician: 'Alice Fixer (Hardware Specialist)',
        requestDate: new Date('2026-06-01'),
        scheduledDate: new Date('2026-06-02'),
        resolutionDate: new Date('2026-06-03'),
        cost: 150,
        description: 'Thermal fan rattling and causing processor throttling.',
        status: 'Resolved',
        solution: 'Replaced core heat sink fan assemblies and reapplied premium thermal paste.',
        notes: 'Runs cool now. Tested under full synthetic stress test load.'
      }
    ];
    await Maintenance.insertMany(maintenanceRequests);
    console.log('Seeded maintenance history.');

    // 7. Seed Bookings
    console.log('Seeding Shared Bookings...');
    const bookings = [
      {
        resource: boardroomAsset._id,
        bookedBy: headUser._id,
        startTime: new Date('2026-07-12T10:00:00'),
        endTime: new Date('2026-07-12T12:00:00'),
        purpose: 'IT Quarterly Infrastructure Planning Review',
        status: 'Approved',
        notes: 'Need smartboard display working.'
      },
      {
        resource: teslaAsset._id,
        bookedBy: adminUser._id,
        startTime: new Date('2026-07-13T09:00:00'),
        endTime: new Date('2026-07-13T17:00:00'),
        purpose: 'Executive client site visit and contract signing in downtown.',
        status: 'Approved',
        notes: 'Requesting fully charged battery.'
      },
      {
        resource: projectorAsset._id,
        bookedBy: managerUser._id,
        startTime: new Date('2026-07-11T13:00:00'),
        endTime: new Date('2026-07-11T15:00:00'),
        purpose: 'HR Recruiting Open House Presentation',
        status: 'Approved',
        notes: 'Completed presentation and returned device safely.'
      }
    ];
    await Booking.insertMany(bookings);
    console.log('Seeded booking events.');

    // 8. Seed Notifications
    console.log('Seeding Notifications...');
    const notifications = [
      {
        user: null, // Global
        title: 'System Server Upgrade Scheduled',
        message: 'The AssetFlow cloud database will undergo maintenance next Sunday from 02:00 AM to 04:00 AM UTC. Expect brief service outages.',
        type: 'Info',
        read: false
      },
      {
        user: adminUser._id,
        title: 'New Maintenance Request Raised',
        message: 'A priority maintenance request has been submitted for ThinkPad T14 (AST-LPT-1003). Review technician schedule.',
        type: 'Warning',
        read: false
      },
      {
        user: employeeUser._id,
        title: 'Assigned Asset Repaired',
        message: 'Your Laptop Dell XPS 15 has been successfully serviced and returned to service. Diagnostics checked okay.',
        type: 'Success',
        read: false
      }
    ];
    await Notification.insertMany(notifications);
    console.log('Seeded notification feed.');

    // 9. Seed Settings
    console.log('Seeding Settings...');
    await Settings.create({
      companyName: 'AssetFlow Enterprise Ltd',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      currency: 'USD',
      maintenancePrefix: 'AF-MNT-',
      systemMode: 'Production'
    });
    console.log('Seeded global system settings.');

    // 10. Seed Activity Log
    console.log('Seeding Activity Logs...');
    const activityLogs = [
      { user: adminUser._id, action: 'Seed Database', details: 'Initialized enterprise schema and loaded demo datasets.', timestamp: new Date('2026-07-12T09:00:00') },
      { user: managerUser._id, action: 'Allocate Asset', details: 'Allocated Macbook Pro (AST-LPT-1002) to Employee Sarah Jenkins.', timestamp: new Date('2026-07-12T10:15:00') },
      { user: headUser._id, action: 'Create Booking', details: 'Reserved Boardroom Alfa (RES-MR-001) for IT Infrastructure sync.', timestamp: new Date('2026-07-12T11:00:00') }
    ];
    await ActivityLog.insertMany(activityLogs);
    console.log('Seeded initial activity log timeline.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
