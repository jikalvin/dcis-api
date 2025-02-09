const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * tags:
 *   - name: SuperAdmin
 *     description: Super administrator operations for system configuration
 * 
 * components:
 *   schemas:
 *     SystemConfig:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         maintenanceMode:
 *           type: boolean
 *         allowedIPs:
 *           type: array
 *           items:
 *             type: string
 *         backupSchedule:
 *           type: string
 *         emailConfig:
 *           type: object
 *           properties:
 *             provider:
 *               type: string
 *             apiKey:
 *               type: string
 *             fromEmail:
 *               type: string
 * 
 * /api/super-admin/system/config:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get system configuration
 *     description: Retrieve current system configuration settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemConfig'
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
// router.get('/system/config', auth, authorize('superadmin'), async (req, res) => {
//   {{ ... }}
// });

/**
 * @swagger
 * /api/super-admin/system/config:
 *   put:
 *     tags: [SuperAdmin]
 *     summary: Update system configuration
 *     description: Update system-wide configuration settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenanceMode:
 *                 type: boolean
 *               allowedIPs:
 *                 type: array
 *                 items:
 *                   type: string
 *               backupSchedule:
 *                 type: string
 *               emailConfig:
 *                 type: object
 *                 properties:
 *                   provider:
 *                     type: string
 *                   apiKey:
 *                     type: string
 *                   fromEmail:
 *                     type: string
 *     responses:
 *       200:
 *         description: System configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemConfig'
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
// router.put('/system/config', auth, authorize('superadmin'), async (req, res) => {
//   {{ ... }}
// });

/**
 * @swagger
 * /api/super-admin/roles:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Create new role
 *     description: Create a new system role with specified permissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
// router.post('/roles', auth, authorize('superadmin'), async (req, res) => {
//   {{ ... }}
// });

/**
 * @swagger
 * /api/super-admin/audit:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Get system audit trail
 *     description: Retrieve detailed system audit trail with all changes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit trail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   action:
 *                     type: string
 *                   user:
 *                     type: string
 *                   details:
 *                     type: object
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
// router.get('/audit', auth, authorize('superadmin'), async (req, res) => {
//   {{ ... }}
// });

/**
 * @swagger
 * /api/super-admin/login:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Login with 2FA
 *     description: Login as super administrator with 2-factor authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - institutionId
 *             properties:
 *               institutionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent to email
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { institutionId } = req.body;
    const user = await User.findOne({ institutionId, role: 'superadmin' });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(3).toString('hex');
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send verification code via email
    await sendEmail({
      email: user.email,
      subject: 'Login Verification Code',
      message: `Your verification code is: ${verificationCode}`
    });

    res.status(200).json({ message: 'Verification code sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/super-admin/verify-login:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Verify 2FA code and complete login
 *     description: Verify 2-factor authentication code and complete login as super administrator
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - institutionId
 *               - verificationCode
 *             properties:
 *               institutionId:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired verification code
 *       500:
 *         description: Server error
 */
router.post('/verify-login', async (req, res) => {
  try {
    const { institutionId, verificationCode } = req.body;
    const user = await User.findOne({
      institutionId,
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Clear verification code
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/super-admin/create:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Create new super admin
 *     description: Create a new super administrator account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Super admin created successfully
 *       500:
 *         description: Server error
 */
router.post('/create', async (req, res) => {
  try {
    const userData = {
      ...req.body,
      role: 'superadmin',
      institutionId: generateInstitutionId()
    };
    
    const user = new User(userData);
    const verificationCode = crypto.randomBytes(3).toString('hex');
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    await user.save();

    // Send verification code via email
    await sendEmail({
      email: user.email,
      subject: 'Account Verification',
      message: `Your verification code is: ${verificationCode}`
    });

    res.status(201).json({
      message: 'Super admin created successfully. Verification code sent to email.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/super-admin/verify-account:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Verify super admin account
 *     description: Verify super administrator account using verification code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       500:
 *         description: Server error
 */
router.post('/verify-account', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const user = await User.findOne({
      email,
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Account verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/super-admin/resend-code:
 *   post:
 *     tags: [SuperAdmin]
 *     summary: Resend verification code
 *     description: Resend verification code to super administrator email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, role: 'superadmin' });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const verificationCode = crypto.randomBytes(3).toString('hex');
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'New Verification Code',
      message: `Your new verification code is: ${verificationCode}`
    });

    res.status(200).json({ message: 'New verification code sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateInstitutionId() {
  const timestamp = Date.now().toString().slice(-4);
  return `DCIS${new Date().getFullYear()}${timestamp}`;
}

module.exports = router;