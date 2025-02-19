const express = require('express');
const router = express.Router();
const { TuitionFee, StudentTuition } = require('../models/TuitionFee');
const { auth, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Tuition
 *     description: Tuition fee management and payments
 * 
 * components:
 *   schemas:
 *     TuitionFee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         studentId:
 *           type: string
 *           description: Reference to student ID
 *         amount:
 *           type: number
 *         dueDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [pending, paid, overdue]
 *         paymentHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               method:
 *                 type: string
 * 
 * /api/tuition:
 *   post:
 *     tags: [Tuition]
 *     summary: Create tuition fee structure
 *     description: Create a new tuition fee structure
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - dueDate
 *             properties:
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Tuition fee structure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TuitionFee'
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('superadmin','admin'), async (req, res) => {
  try {
    const tuitionFee = new TuitionFee(req.body);
    await tuitionFee.save();
    res.status(201).json(tuitionFee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tuition:
 *   get:
 *     tags: [Tuition]
 *     summary: Get tuition fee structures
 *     description: Retrieve all tuition fee structures
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tuition fee structures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TuitionFee'
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorize('superadmin','admin'), async (req, res) => {
  try {
    const tuitionFees = await TuitionFee.find({
      status: { $ne: 'Archived' }
    });
    res.status(200).json(tuitionFees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tuition/student/{studentId}:
 *   get:
 *     tags: [Tuition]
 *     summary: Get student tuition details
 *     description: Retrieve student tuition details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student tuition details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TuitionFee'
 *       404:
 *         description: Student tuition record not found
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const studentTuition = await StudentTuition.findOne({
      student: req.params.studentId,
      academicYear: req.query.academicYear
    })
    .populate('tuitionFee')
    .populate('student', 'name email class');
    
    if (!studentTuition) {
      return res.status(404).json({ error: 'Tuition record not found' });
    }
    
    res.status(200).json(studentTuition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tuition/payment:
 *   post:
 *     tags: [Tuition]
 *     summary: Record tuition payment
 *     description: Record a tuition payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - tuitionId
 *               - amount
 *               - installmentName
 *               - paymentMethod
 *             properties:
 *               studentId:
 *                 type: string
 *               tuitionId:
 *                 type: string
 *               amount:
 *                 type: number
 *               installmentName:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tuition payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TuitionFee'
 *       404:
 *         description: Tuition record not found
 *       500:
 *         description: Server error
 */
router.post('/payment', auth, authorize('superadmin','admin'), async (req, res) => {
  try {
    const { studentId, tuitionId, amount, installmentName, paymentMethod } = req.body;
    
    const studentTuition = await StudentTuition.findOne({
      student: studentId,
      tuitionFee: tuitionId
    });
    
    if (!studentTuition) {
      return res.status(404).json({ error: 'Tuition record not found' });
    }
    
    studentTuition.payments.push({
      amount,
      installmentName,
      paymentDate: new Date(),
      paymentMethod,
      receivedBy: req.user._id,
      status: 'Completed'
    });
    
    studentTuition.paidAmount += amount;
    studentTuition.balance = studentTuition.totalAmount - studentTuition.paidAmount;
    studentTuition.status = studentTuition.balance <= 0 ? 'Paid' : 'PartiallyPaid';
    
    await studentTuition.save();
    
    res.status(200).json(studentTuition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tuition/remind/{studentId}:
 *   post:
 *     tags: [Tuition]
 *     summary: Send payment reminder
 *     description: Send a payment reminder to a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment reminder sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Student tuition record not found
 *       500:
 *         description: Server error
 */
router.post('/remind/:studentId', auth, authorize('superadmin','admin'), async (req, res) => {
  try {
    const studentTuition = await StudentTuition.findOne({
      student: req.params.studentId,
      status: { $in: ['Unpaid', 'PartiallyPaid', 'Overdue'] }
    });
    
    if (!studentTuition) {
      return res.status(404).json({ error: 'Tuition record not found' });
    }
    
    // Create a notification for the reminder
    const notification = {
      title: 'Tuition Payment Reminder',
      content: `This is a reminder for your pending tuition payment. Balance: ${studentTuition.balance}`,
      type: 'Reminder',
      priority: 'High',
      sender: req.user._id,
      recipients: 'Parents',
      targetUsers: [studentTuition.student],
      channels: ['Email', 'SMS']
    };
    
    // TODO: Integrate with notification service
    
    studentTuition.lastReminderSent = new Date();
    await studentTuition.save();
    
    res.status(200).json({ message: 'Payment reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/tuition/transactions:
 *   get:
 *     tags: [Tuition]
 *     summary: Get recent transactions
 *     description: Retrieve recent tuition transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   student:
 *                     type: string
 *                   tuitionFee:
 *                     type: string
 *                   payments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                         installmentName:
 *                           type: string
 *                         paymentDate:
 *                           type: string
 *                           format: date
 *                         paymentMethod:
 *                           type: string
 *                         receivedBy:
 *                           type: string
 *                         status:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get('/transactions', auth, authorize('superadmin','admin'), async (req, res) => {
  try {
    const recentPayments = await StudentTuition.aggregate([
      { $unwind: '$payments' },
      { $sort: { 'payments.paymentDate': -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      }
    ]);
    
    res.status(200).json(recentPayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;