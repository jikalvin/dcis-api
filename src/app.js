const express = require('express');
const swaggerUI = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/superAdmin');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const programRoutes = require('./routes/program');
const parentRoutes = require('./routes/parent');
const classRoutes = require('./routes/class');
const settingsRoutes = require('./routes/settings');
const subjectRoutes = require('./routes/subject');
const servicesRoutes = require('./routes/services');
const tuitionRoutes = require('./routes/tuition');
const examRoutes = require('./routes/exam');
const notificationRoutes = require('./routes/notifications');
const supportRoutes = require('./routes/support');
const createDefaultSuperAdmin = require('./config/defaultAdmin');
const cors = require('cors');
const studentRoutes = require('./routes/student');

dotenv.config();

// Initialize express app
const app = express();

app.use(cors());

// Swagger UI setup
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/class', classRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/tuition', tuitionRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/students', studentRoutes);

// Create default super admin account
// createDefaultSuperAdmin();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;