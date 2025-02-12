const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

// Get all parents
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
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { childrenIds, ...parentData } = req.body;
    const password = crypto.randomBytes(8).toString('hex');
    const institutionId = `DCIS${new Date().getFullYear()}${Date.now().toString().slice(-4)}`;

    // Create parent account
    const parent = new User({
      ...parentData,
      role: 'parent',
      password,
      institutionId
    });
    await parent.save();

    // Link parent to children
    if (childrenIds && childrenIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: childrenIds } },
        { $push: { guardianInfo: { relation: parentData.relation, guardian: parent._id } } }
      );
    }

    // Send credentials via email
    await sendEmail({
      email: parent.email,
      subject: 'Account Credentials',
      message: `Your institution ID is: ${institutionId}
      Your password is: ${password}
      Please change your password after first login.`
    });

    res.status(201).json({
      message: 'Parent account created successfully. Credentials sent to email.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get parent's children information
router.get('/:id/children', auth, authorize('superadmin', 'admin', 'parent'), async (req, res) => {
  try {
    // Ensure parent can only access their own children's information
    if (req.user.role === 'parent' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized to access this information' });
    }

    const children = await Student.find({ 'guardianInfo.guardian': req.params.id })
      .populate('class', 'name program level')
      .select('firstName lastName studentId class program academicYear performance payments attendance');
    
    res.status(200).json(children);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
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

module.exports = router;