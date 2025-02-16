const User = require('../models/User');
const crypto = require('crypto');

const createDefaultSuperAdmin = async () => {
  try {
    // Check if super admin exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Default super admin already exists');
      return;
    }

    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
    const institutionId = `DCIS${new Date().getFullYear()}002`;
    console.log(institutionId);

    // Create default super admin
    const superAdmin = new User({
      firstName: 'Elvis',
      lastName: 'Admin',
      // email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@dcis.edu',
      email: 'elvisnjichii@gmail.com',
      password,
      role: 'superadmin',
      institutionId,
      isVerified: true,
      programs: ['Creche', 'Kindergarten', 'Primary', 'Secondary', 'High School'],
      gender: 'other'
    });

    await superAdmin.save();
    console.log('Default super admin created successfully');
  } catch (error) {
    console.error('Error creating default super admin:', error);
  }
};

module.exports = createDefaultSuperAdmin;