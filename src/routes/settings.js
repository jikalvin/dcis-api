const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Settings = require('../models/Settings');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * tags:
 *   - name: Settings
 *     description: Operations related to system settings
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get system settings
 *     description: Retrieve system settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/email:
 *   put:
 *     tags: [Settings]
 *     summary: Update email settings
 *     description: Update the email settings for the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *               port:
 *                 type: number
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               from:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email settings updated successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/academic-year:
 *   put:
 *     tags: [Settings]
 *     summary: Update academic year
 *     description: Update the current academic year
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               academicYear:
 *                 type: string
 *     responses:
 *       200:
 *         description: Academic year updated successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/change-password:
 *   put:
 *     tags: [Settings]
 *     summary: Change super admin password
 *     description: Change the password for the super admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Current password is incorrect
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/audit-logs:
 *   get:
 *     tags: [Settings]
 *     summary: Get system audit logs
 *     description: Retrieve system audit logs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/branding:
 *   put:
 *     tags: [Settings]
 *     summary: Update branding settings
 *     description: Update the branding settings for the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *               systemColor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Branding settings updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/general:
 *   put:
 *     tags: [Settings]
 *     summary: Update general settings
 *     description: Update general settings for the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolName:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: General settings updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/security:
 *   put:
 *     tags: [Settings]
 *     summary: Update security settings
 *     description: Update security settings for the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twoFactorEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Security settings updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/permissions:
 *   put:
 *     tags: [Settings]
 *     summary: Update permissions
 *     description: Update permissions for the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/academic/years:
 *   post:
 *     tags: [Settings]
 *     summary: Create academic year
 *     description: Create a new academic year
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               terms:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Academic year created successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/academic/grading:
 *   put:
 *     tags: [Settings]
 *     summary: Update grading scales
 *     description: Update grading scales for an academic program
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               program:
 *                 type: string
 *               scales:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Grading scales updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/academic/report-theme:
 *   put:
 *     tags: [Settings]
 *     summary: Update report card theme
 *     description: Update the theme for report cards
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backgroundColor:
 *                 type: string
 *               textColor:
 *                 type: string
 *               accentColor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report card theme updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/settings/payment/methods:
 *   put:
 *     tags: [Settings]
 *     summary: Update payment methods
 *     description: Update the payment methods for the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               methods:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Payment methods updated successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
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