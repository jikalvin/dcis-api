const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Settings = require('../models/Settings');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

/**
 * @route GET /
 * @group Settings - Operations related to system settings
 * @security superadmin
 * @returns {object} 200 - System settings retrieved successfully
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /email
 * @group Settings - Operations related to system settings
 * @param {string} host.body.required - Email host
 * @param {number} port.body.required - Email port
 * @param {string} username.body.required - Email username
 * @param {string} password.body.required - Email password
 * @param {string} from.body.required - Email from address
 * @security superadmin
 * @returns {object} 200 - Email settings updated successfully
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /academic-year
 * @group Settings - Operations related to academic year
 * @param {string} academicYear.body.required - The academic year to set
 * @security superadmin
 * @returns {object} 200 - Academic year updated successfully
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /change-password
 * @group Settings - Operations related to user management
 * @param {string} currentPassword.body.required - Current password
 * @param {string} newPassword.body.required - New password
 * @security superadmin
 * @returns {object} 200 - Password updated successfully
 * @returns {object} 400 - Current password is incorrect
 * @returns {object} 500 - Internal server error
 */

/**
 * @route GET /audit-logs
 * @group Settings - Operations related to system audit logs
 * @security superadmin
 * @returns {object} 200 - Audit logs retrieved successfully
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /branding
 * @group Settings - Operations related to branding
 * @param {string} logo.body.required - Logo URL
 * @param {string} systemColor.body.required - System color
 * @security superadmin
 * @returns {object} 200 - Branding settings updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /general
 * @group Settings - Operations related to general settings
 * @param {string} schoolName.body.required - Name of the school
 * @param {string} address.body.required - Address of the school
 * @param {string} phone.body.required - Phone number of the school
 * @param {string} email.body.required - Email of the school
 * @security superadmin
 * @returns {object} 200 - General settings updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /security
 * @group Settings - Operations related to security settings
 * @param {boolean} twoFactorEnabled.body.required - Enable or disable two-factor authentication
 * @security superadmin
 * @returns {object} 200 - Security settings updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /permissions
 * @group Settings - Operations related to permissions
 * @param {object} permissions.body.required - Permissions object
 * @security superadmin
 * @returns {object} 200 - Permissions updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route POST /academic/years
 * @group Academic - Operations related to academic years
 * @param {string} name.body.required - The name of the academic year
 * @param {string} startDate.body.required - The start date of the academic year
 * @param {string} endDate.body.required - The end date of the academic year
 * @param {Array} terms.body.required - The terms within the academic year
 * @security superadmin
 * @returns {object} 201 - Academic year created successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /academic/grading
 * @group Academic - Operations related to grading scales
 * @param {string} program.body.required - The academic program
 * @param {Array} scales.body.required - The grading scales
 * @security superadmin
 * @returns {object} 200 - Grading scales updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /academic/report-theme
 * @group Academic - Operations related to report card themes
 * @param {string} backgroundColor.body.required - Background color of the report card
 * @param {string} textColor.body.required - Text color of the report card
 * @param {string} accentColor.body.required - Accent color of the report card
 * @security superadmin
 * @returns {object} 200 - Report card theme updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

/**
 * @route PUT /payment/methods
 * @group Payment - Operations related to payment methods
 * @param {Array} methods.body.required - Payment methods
 * @security superadmin
 * @returns {object} 200 - Payment methods updated successfully
 * @returns {object} 404 - Settings not found
 * @returns {object} 500 - Internal server error
 */

// Get system settings
router.get('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        branding: {},
        general: {},
        security: { twoFactorEnabled: false },
        permissions: {},
        academic: {
          programs: ['Creche', 'Kindergarten', 'Primary', 'Secondary', 'High School'],
          levels: {
            'Creche': ['Creche-Daycare'],
            'Kindergarten': ['Kindergarten 1', 'Kindergarten 2'],
            'Primary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
            'Secondary': ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'],
            'High School': ['Year 12', 'Year 13']
          }
        },
        payment: { methods: {} },
        emailSettings: {}
      });
    }
    
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update email settings
router.put('/email', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { host, port, username, password, from } = req.body;
    
    // Update environment variables (in a production environment, this should be done differently)
    process.env.EMAIL_HOST = host;
    process.env.EMAIL_PORT = port;
    process.env.EMAIL_USERNAME = username;
    process.env.EMAIL_PASSWORD = password;
    process.env.EMAIL_FROM = from;

    res.status(200).json({ message: 'Email settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update academic year
router.put('/academic-year', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { academicYear } = req.body;
    process.env.CURRENT_ACADEMIC_YEAR = academicYear;
    
    res.status(200).json({ message: 'Academic year updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change super admin password
router.put('/change-password', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.user._id);

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system audit logs (this would need a proper audit log implementation)
router.get('/audit-logs', auth, authorize('superadmin'), async (req, res) => {
  try {
    // This is a placeholder. In a real implementation, you would:
    // 1. Have a separate AuditLog model
    // 2. Log all important actions with user info and timestamps
    // 3. Implement filtering and pagination
    res.status(200).json({
      message: 'Audit logs functionality needs to be implemented with proper logging system'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update branding settings 
router.put('/branding', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { logo, systemColor } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.branding = { logo, systemColor };
    await settings.save();
    
    res.status(200).json({ message: 'Branding settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update general settings
router.put('/general', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { schoolName, address, phone, email } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.general = { schoolName, address, phone, email };
    await settings.save();
    
    res.status(200).json({ message: 'General settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update security settings
router.put('/security', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { twoFactorEnabled } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.security.twoFactorEnabled = twoFactorEnabled;
    await settings.save();
    
    res.status(200).json({ message: 'Security settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update permissions
router.put('/permissions', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { permissions } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.permissions = permissions;
    await settings.save();
    
    res.status(200).json({ message: 'Permissions updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create academic year
router.post('/academic/years', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { name, startDate, endDate, terms } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.academic.years.push({
      name,
      startDate,
      endDate,
      terms
    });
    
    settings.academic.currentYear = name;
    await settings.save();
    
    res.status(201).json({ message: 'Academic year created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update grading scales
router.put('/academic/grading', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { program, scales } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.academic.gradingScales.set(program, scales);
    await settings.save();
    
    res.status(200).json({ message: 'Grading scales updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update report card theme
router.put('/academic/report-theme', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { backgroundColor, textColor, accentColor } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.academic.reportCardTheme = { backgroundColor, textColor, accentColor };
    await settings.save();
    
    res.status(200).json({ message: 'Report card theme updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment methods
router.put('/payment/methods', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { methods } = req.body;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    settings.payment.methods = methods;
    await settings.save();
    
    res.status(200).json({ message: 'Payment methods updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;