const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Settings = require('./models/Settings');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static upload folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/assets', require('./routes/asset.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/system', require('./routes/system.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/audits', require('./routes/audit.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AssetFlow API is running smoothly' });
});

// Seed default settings check on launch
const seedSettings = async () => {
  try {
    const count = await Settings.countDocuments({});
    if (count === 0) {
      await Settings.create({
        companyName: 'AssetFlow Enterprise Ltd',
        logo: '',
        currency: 'USD',
        maintenancePrefix: 'MNT-',
        systemMode: 'Production'
      });
      console.log('Seeded default system settings');
    }
  } catch (error) {
    console.error('Failed to check/seed default settings:', error);
  }
};
seedSettings();

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in production-ready state on port ${PORT}`);
});
