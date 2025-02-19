const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, authorize, generateToken } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const { upload } = require('../utils/cloudinary');
const mongoose = require('mongoose');

// Get all parents
/**
 * @swagger
 * /api/parents:
 *   get:
 *     tags: [Parents]
 *     summary: Get all parents
 *     description: Retrieve a list of all parents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parent'
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent' })
      .select('-password -verificationCode -verificationCodeExpires');
    res.status(200).json(parents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific parent
/**
 * @swagger
 * /api/parents/{id}:
 *   get:
 *     tags: [Parents]
 *     summary: Get specific parent
 *     description: Retrieve a specific parent by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parent'
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const parent = await User.findOne({ _id: req.params.id, role: 'parent' })
      .select('-password -verificationCode -verificationCodeExpires');

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Get children information
    const children = await Student.find({ 'guardianInfo.guardian': parent._id })
      .populate('class', 'name program level')
      .select('firstName lastName studentId class program academicYear performance payments');

    res.status(200).json({ parent, children });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new parent
/**
 * @swagger
 * /api/parents:
 *   post:
 *     tags: [Parents]
 *     summary: Add new parent
 *     description: Create a new parent account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               relation:
 *                 type: string
 *               childrenIds:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Parent account created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('superadmin', 'admin'), upload.single('profileImage'), async (req, res) => {
  try {
    const { childrenIds, ...parentData } = req.body;
    const institutionId = `DCIS${new Date().getFullYear()}${Date.now().toString().slice(-4)}`;

    // Handle picture upload
    let pictureUrl = null;
    if (req.file) {
      pictureUrl = req.file.path;
    }

    // Check if parent already exists
    let parent = await User.findOne({ email: parentData.email, role: 'parent' });
    if (parent) {
      // Update existing parent
      parent = await User.findOneAndUpdate(
        { email: parentData.email, role: 'parent' },
        { ...parentData, profileImage: pictureUrl ? pictureUrl : parent.profileImage },
        { new: true }
      );
      return res.status(201).json({
        message: 'Parent account updated successfully.'
      });
    }

    const password = crypto.randomBytes(8).toString('hex');
    // Create new parent account
    parent = new User({
      ...parentData,
      role: 'parent',
      password,
      institutionId,
      profileImage: pictureUrl
    });
    await parent.save();

    // Send credentials via email
    await sendEmail({
      email: parent.email,
      subject: 'Account Credentials',
      message: `Your institution ID is: ${institutionId}
      Your password is: ${password}
      Please change your password after first login.`
    });

    // Convert childrenIds to ObjectIds
    const childrenObjectIds = JSON.parse(childrenIds).map(id => new mongoose.Types.ObjectId(id));

    // Link parent to children
    if (childrenObjectIds && childrenObjectIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: childrenObjectIds } },
        { $push: { guardianInfo: { relation: parentData.relation, guardian: parent._id } } }
      );
    }

    res.status(201).json({
      message: 'Parent account created/updated successfully. Credentials sent to email if new account.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get parent's children information
/**
 * @swagger
 * /api/parents/{id}/children:
 *   get:
 *     tags: [Parents]
 *     summary: Get parent's children information
 *     description: Retrieve a list of children for a specific parent
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of children retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       403:
 *         description: Not authorized to access this information
 *       500:
 *         description: Server error
 */
router.get('/:id/children', auth, authorize('superadmin', 'admin', 'parent'), async (req, res) => {
  try {
    // Ensure parent can only access their own children's information
    if (req.user.role === 'parent' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized to access this information' });
    }

    const children = await Student.find({ 'guardianInfo.guardian': req.params.id })
      .populate('class', 'name program level')
      .select('name studentId class program academicYear performance payments attendance');

    res.status(200).json(children);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
/**
 * @swagger
 * /api/parents/change-password:
 *   post:
 *     tags: [Parents]
 *     summary: Change password
 *     description: Change the password for a parent account
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Current password is incorrect
 *       500:
 *         description: Server error
 */
router.post('/change-password', auth, authorize('parent'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const parent = await User.findById(req.user._id);

    const isMatch = await parent.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    parent.password = newPassword;
    await parent.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Parent login
/**
 * @swagger
 * /api/parents/login:
 *   post:
 *     tags: [Parents]
 *     summary: Parent login
 *     description: Login for parents using institution ID and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               institutionId:
 *                 type: string
 *               password:
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
 *                 parent:
 *                   $ref: '#/components/schemas/Parent'
 *       404:
 *         description: Parent not found
 *       400:
 *         description: Invalid password
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { institutionId, password } = req.body;
    const parent = await User.findOne({ institutionId, role: 'parent' });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const isMatch = await parent.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = generateToken(parent);
    res.status(200).json({ token, parent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
/**
 * @swagger
 * /api/parents/forgot-password:
 *   post:
 *     tags: [Parents]
 *     summary: Forgot password
 *     description: Request a password reset for a parent account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset instructions sent to your email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Parent not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const parent = await User.findOne({ email, role: 'parent' });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    parent.resetPasswordToken = resetToken;
    parent.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await parent.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/api/parents/reset-password/${resetToken}`;
    await sendEmail({
      email: parent.email,
      subject: 'Password Reset Request',
      message: `Click the following link to reset your password: ${resetUrl}`
    });

    res.status(200).json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
/**
 * @swagger
 * /api/parents/reset-password/{token}:
 *   post:
 *     tags: [Parents]
 *     summary: Reset password
 *     description: Reset the password for a parent account using the reset token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Password reset token is invalid or has expired
 *       500:
 *         description: Server error
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const parent = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!parent) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }

    parent.password = password;
    parent.resetPasswordToken = undefined;
    parent.resetPasswordExpires = undefined;
    await parent.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;