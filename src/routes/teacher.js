const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

/**
 * @swagger
 * tags:
 *   - name: Teachers
 *     description: Teacher management and operations
 * 
 * components:
 *   schemas:
 *     Teacher:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         programs:
 *           type: array
 *           items:
 *             type: string
 * 
 * /api/teachers:
 *   get:
 *     tags: [Teachers]
 *     summary: Get all teachers
 *     description: Retrieve a list of all teachers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teachers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Teacher'
 *                 teachersByProgram:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password -verificationCode -verificationCodeExpires');
    
    const teachersByProgram = teachers.reduce((acc, teacher) => {
      teacher.programs.forEach(program => {
        if (!acc[program]) {
          acc[program] = 0;
        }
        acc[program]++;
      });
      return acc;
    }, {});

    res.status(200).json({ teachers, teachersByProgram });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     tags: [Teachers]
 *     summary: Get specific teacher
 *     description: Retrieve a specific teacher by ID
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
 *         description: Teacher retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
      .select('-password -verificationCode -verificationCodeExpires');
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     tags: [Teachers]
 *     summary: Add new teacher
 *     description: Create a new teacher account
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
 *               - programs
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               programs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Teacher account created successfully
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const password = crypto.randomBytes(8).toString('hex');
    const institutionId = `DCIS${new Date().getFullYear()}${Date.now().toString().slice(-4)}`;
    const verificationCode = crypto.randomBytes(3).toString('hex');

    const teacherData = {
      ...req.body,
      role: 'teacher',
      password,
      institutionId,
      verificationCode,
      verificationCodeExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    const teacher = new User(teacherData);
    await teacher.save();

    // Send credentials via email
    await sendEmail({
      email: teacher.email,
      subject: 'Account Credentials',
      message: `Your verification code is: ${verificationCode}
      Your institution ID is: ${institutionId}
      Your temporary password is: ${password}
      Please change your password after first login.`
    });

    res.status(201).json({
      message: 'Teacher account created successfully. Credentials sent to email.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teachers/verify:
 *   post:
 *     tags: [Teachers]
 *     summary: Verify teacher account
 *     description: Verify a teacher account using the verification code
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
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher account verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       500:
 *         description: Server error
 */
router.post('/verify', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const teacher = await User.findOne({
      email,
      role: 'teacher',
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!teacher) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    teacher.isVerified = true;
    teacher.verificationCode = undefined;
    teacher.verificationCodeExpires = undefined;
    await teacher.save();

    res.status(200).json({ message: 'Teacher account verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teachers/{id}/timetable:
 *   get:
 *     tags: [Teachers]
 *     summary: Get teacher's timetable
 *     description: Retrieve the teaching timetable for a specific teacher
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
 *         description: Teacher's timetable retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   day:
 *                     type: string
 *                   periods:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         subject:
 *                           type: string
 *                         class:
 *                           type: string
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
router.get('/:id/timetable', auth, authorize('superadmin', 'admin', 'teacher'), async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get all classes where this teacher teaches
    const classes = await Class.find({ 'subjects.teacher': teacher._id })
      .populate('subjects.teacher', 'firstName lastName')
      .select('schedule');

    // Filter schedule entries for this teacher
    const timetable = classes.reduce((acc, cls) => {
      const teacherSchedule = cls.schedule.filter(entry => 
        entry.teacher.toString() === teacher._id.toString()
      );
      return [...acc, ...teacherSchedule];
    }, []);

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teachers/{id}/timetable:
 *   put:
 *     tags: [Teachers]
 *     summary: Update teacher's timetable
 *     description: Update the teaching timetable for a specific teacher
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - schedule
 *             properties:
 *               classId:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   day:
 *                     type: string
 *                   periods:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         subject:
 *                           type: string
 *                         class:
 *                           type: string
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *     responses:
 *       200:
 *         description: Timetable updated successfully
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
router.put('/:id/timetable', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { classId, schedule } = req.body;
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update schedule entries for this teacher
    classDoc.schedule = classDoc.schedule.map(entry => {
      if (entry.teacher.toString() === teacher._id.toString()) {
        return { ...entry.toObject(), ...schedule };
      }
      return entry;
    });

    await classDoc.save();
    res.status(200).json({ message: 'Timetable updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;