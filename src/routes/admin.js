const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative operations and system management
 */

// Get all administrators
/**
 * @swagger
 * /api/admin:
 *   get:
 *     tags: [Admin]
 *     summary: Get all administrators
 *     description: Retrieve a list of all administrators
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Administrators retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password -verificationCode -verificationCodeExpires');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific administrator
/**
 * @swagger
 * /api/admin/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get specific administrator
 *     description: Retrieve a specific administrator by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Administrator ID
 *     responses:
 *       200:
 *         description: Administrator retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Administrator not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, authorize('superadmin'), async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' })
      .select('-password -verificationCode -verificationCodeExpires');
    
    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found' });
    }
    
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new administrator
/**
 * @swagger
 * /api/admin:
 *   post:
 *     tags: [Admin]
 *     summary: Add new administrator
 *     description: Create a new administrator account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Administrator account created successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('superadmin'), async (req, res) => {
  try {
    const password = crypto.randomBytes(8).toString('hex');
    const institutionId = `DCIS${new Date().getFullYear()}${Date.now().toString().slice(-4)}`;
    const verificationCode = crypto.randomBytes(3).toString('hex');

    const adminData = {
      ...req.body,
      role: 'admin',
      password,
      institutionId,
      verificationCode,
      verificationCodeExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    const admin = new User(adminData);
    await admin.save();

    // Send verification code via email
    await sendEmail({
      email: admin.email,
      subject: 'Account Verification',
      message: `Your verification code is: ${verificationCode}
      Your institution ID is: ${institutionId}
      Your temporary password is: ${password}
      Please change your password after first login.`
    });

    res.status(201).json({
      message: 'Administrator account created successfully. Credentials sent to email.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify administrator account
/**
 * @swagger
 * /api/admin/verify:
 *   post:
 *     tags: [Admin]
 *     summary: Verify administrator account
 *     description: Verify an administrator account using a verification code
 *     security:
 *       - bearerAuth: []
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
 *                 format: email
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Administrator account verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/verify', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const admin = await User.findOne({
      email,
      role: 'admin',
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    admin.isVerified = true;
    admin.verificationCode = undefined;
    admin.verificationCodeExpires = undefined;
    await admin.save();

    res.status(200).json({ message: 'Administrator account verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend verification code
/**
 * @swagger
 * /api/admin/resend-code:
 *   post:
 *     tags: [Admin]
 *     summary: Resend verification code
 *     description: Resend a verification code to an administrator's email
 *     security:
 *       - bearerAuth: []
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
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       404:
 *         description: Administrator not found
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/resend-code', auth, authorize('superadmin'), async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found' });
    }

    const verificationCode = crypto.randomBytes(3).toString('hex');
    admin.verificationCode = verificationCode;
    admin.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await admin.save();

    await sendEmail({
      email: admin.email,
      subject: 'New Verification Code',
      message: `Your new verification code is: ${verificationCode}`
    });

    res.status(200).json({ message: 'New verification code sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
/**
 * @swagger
 * /api/admin/change-password:
 *   post:
 *     tags: [Admin]
 *     summary: Change password
 *     description: Change an administrator's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
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
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/change-password', auth, authorize('admin'), async (req, res) => {
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

module.exports = router;