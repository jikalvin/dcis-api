const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Settings = require('../models/Settings');
const { generateToken, auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper function to send email
const sendEmail = async (to, subject, html) => {
  const settings = await Settings.findOne();
  const transporter = nodemailer.createTransport({
    host: settings?.emailSettings.host || process.env.EMAIL_HOST,
    port: settings?.emailSettings.port || process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: settings?.emailSettings.username || process.env.EMAIL_USER,
      pass: settings?.emailSettings.password || process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: settings?.emailSettings.from || "DCIS",
    to,
    subject,
    html
  });
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @swagger
 * /api/auth/login/step1:
 *   post:
 *     tags: [Authentication]
 *     summary: First step of 2FA login
 *     description: Submit institution identifier to receive verification code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Institution identifier (format DCIS[year][program][digits])
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID for step 2
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/login/step1', async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({ institutionId: identifier });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate and save verification code
    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    // Send verification code via email
    await sendEmail(
      user.email,
      'Login Verification Code',
      `Your verification code is: ${verificationCode}`
    );
    
    res.status(200).json({
      message: 'Verification code sent to your email',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login/step2:
 *   post:
 *     tags: [Authentication]
 *     summary: Second step of 2FA login
 *     description: Verify code and complete login process
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - verificationCode
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
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
 *                   description: JWT token for authentication
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login/step2', async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if verification code is valid and not expired
    if (
      user.verificationCode !== verificationCode ||
      Date.now() > user.verificationCodeExpires
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    // Clear verification code
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    
    // Generate auth token
    const token = generateToken(user);
    
    res.status(200).json({
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new verification code
    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    // Send new verification code via email
    await sendEmail(
      user.email,
      'New Login Verification Code',
      `Your new verification code is: ${verificationCode}`
    );
    
    res.status(200).json({
      message: 'New verification code sent to your email'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Institution identifier (format DCIS[year][program][digits])
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({ institutionId: identifier });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();
    
    // Send password reset email
    await sendEmail(
      user.email,
      'Password Reset Request',
      `Click the following link to reset your password: /reset-password/${resetToken}`
    );
    
    res.status(200).json({
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with token
 *     description: Reset user password using the token received via email
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        error: 'Password reset token is invalid or has expired'
      });
    }
    
    // Set new password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sign up (only for superadmin)
router.post('/signup', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { name, email, password, role } = req.body;
    
    // Generate institution ID
    const institutionId = generateInstitutionId();
    
    const user = new User({
      name,
      email,
      password,
      role,
      institutionId
    });
    
    // Generate verification code for email verification
    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    await user.save();
    
    // Send verification code via email
    await sendEmail(
      email,
      'Account Verification',
      `Your account has been created. Your institution ID is: ${institutionId}\n
       Your verification code is: ${verificationCode}`
    );
    
    res.status(201).json({
      message: 'User created successfully. Verification code sent to email.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify account
router.post('/verify', async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (
      user.verificationCode !== verificationCode ||
      Date.now() > user.verificationCodeExpires
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    
    res.status(200).json({
      message: 'Account verified successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate institution ID helper function
function generateInstitutionId() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DCIS${new Date().getFullYear()}${timestamp}${random}`;
}

module.exports = router;