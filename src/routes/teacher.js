const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
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
 * /api/teachers/{id}/classes:
 *   get:
 *     tags: [Teachers]
 *     summary: Get all classes for a teacher
 *     description: Retrieve a list of all classes where the specified teacher teaches
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
 *         description: List of classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
router.get('/:id/classes', auth, authorize('superadmin', 'admin', 'teacher'), async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get all classes where this teacher teaches
    const classes = await Class.find({ 'subjects.teacher': teacher._id })
      .populate({
        path: 'subjects.teacher',
        match: { _id: teacher._id },
        select: 'firstName lastName'
      })

    // Filter out classes where the teacher is not assigned to any subject
    const filteredClasses = classes.filter(cls => cls.subjects.some(subject => subject.teacher && subject.teacher._id.equals(teacher._id)));

    res.status(200).json(filteredClasses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     tags: [Teachers]
 *     summary: Create a new teacher
 *     description: Create a new teacher account with comprehensive details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name.firstName
 *               - name.lastName
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               sex:
 *                 type: string
 *                 enum: ['Male', 'Female', 'Other']
 *               dob:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: object
 *                 properties:
 *                   dailCode:
 *                     type: string
 *                     default: '+237'
 *                   number:
 *                     type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               employmentType:
 *                 type: string
 *                 enum: ['Full Time', 'Part Time', 'Contract']
 *               salary:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     default: 'XAF'
 *                   amount:
 *                     type: number
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   dailCode:
 *                     type: string
 *                     default: '+237'
 *                   number:
 *                     type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               academicBackground:
 *                 type: object
 *                 properties:
 *                   school:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   certificate:
 *                     type: string
 *               medicalBackground:
 *                 type: object
 *                 properties:
 *                   infos:
 *                     type: array
 *                     items:
 *                       type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher account created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { 
      name, 
      sex, 
      dob, 
      phone, 
      email, 
      address, 
      employmentType, 
      salary, 
      emergencyContact, 
      startDate, 
      academicBackground, 
      medicalBackground,
      password 
    } = req.body;

    // Generate institution ID
    const institutionId = `DCIS-T${new Date().getFullYear()}${Date.now().toString().slice(-4)}`;
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Prepare teacher data
    const teacherData = {
      firstName: name.firstName,
      lastName: name.lastName,
      email,
      password,
      role: 'teacher',
      institutionId,
      verificationCode,
      verificationCodeExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      gender: sex,
      dateOfBirth: dob ? new Date(dob) : null,
      contact: phone,
      address,
      teacherDetails: {
        employmentType,
        salary: {
          currency: salary.currency,
          amount: salary.amount
        },
        emergencyContact: {
          dailCode: emergencyContact.dailCode,
          number: emergencyContact.number
        },
        startDate: startDate ? new Date(startDate) : null,
        academicBackground: {
          school: academicBackground.school,
          date: academicBackground.date ? new Date(academicBackground.date) : null,
          certificate: academicBackground.certificate
        },
        medicalBackground: {
          infos: medicalBackground.infos || []
        }
      },
      isVerified: false
    };

    // Create new user
    const teacher = new User(teacherData);
    await teacher.save();

    // Send verification email
    await sendEmail({
      email: teacher.email,
      subject: 'Account Verification',
      message: `Your verification code is: ${verificationCode}
      Your institution ID is: ${institutionId}
      And password is: ${password}
      Please send the verification code to your administrator.`
    });

    // Prepare response
    const responseTeacher = {
      id: teacher._id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      institutionId: teacher.institutionId,
      role: teacher.role
    };

    res.status(201).json({
      message: 'Teacher account created successfully. Verification code sent to email.',
      teacher: responseTeacher
    });
  } catch (error) {
    console.error('Teacher creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create teacher', 
      details: error.message 
    });
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
    const { institutionId, verificationCode } = req.body;
    const teacher = await User.findOne({
      institutionId,
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

/**
 * @swagger
 * /api/teachers/sorted:
 *   get:
 *     tags: [Teachers]
 *     summary: Get all teachers sorted by programs
 *     description: Retrieve a list of all teachers sorted by their respective programs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of teachers sorted by their respective programs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   institutionId:
 *                     type: string
 *                   role:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/sorted', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Fetch all teachers
    const teachers = await User.find({ role: 'teacher' });

    // Sort teachers by their programs
    const sortedTeachers = teachers.sort((a, b) => {
      // Assuming each teacher has a programs array and we want to sort by the first program
      return (a.programs[0] || '').localeCompare(b.programs[0] || '');
    });

    res.status(200).json(sortedTeachers);
  } catch (error) {
    console.error('Error retrieving teachers:', error);
    res.status(500).json({ error: 'Failed to retrieve teachers', details: error.message });
  }
});

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     tags: [Teachers]
 *     summary: Update a teacher's information
 *     description: Update the details of a specific teacher by their ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the teacher to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: object
 *                 properties:
 *                   dailCode:
 *                     type: string
 *                   number:
 *                     type: string
 *               address:
 *                 type: string
 *               employmentType:
 *                 type: string
 *                 enum: ['Full Time', 'Part Time', 'Contract']
 *               salary:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                   amount:
 *                     type: number
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   dailCode:
 *                     type: string
 *                   number:
 *                     type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               academicBackground:
 *                 type: object
 *                 properties:
 *                   school:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   certificate:
 *                     type: string
 *               medicalBackground:
 *                 type: object
 *                 properties:
 *                   infos:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Teacher information updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the teacher by ID
    const teacher = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.status(200).json({ message: 'Teacher information updated successfully', teacher });
  } catch (error) {
    console.error('Error updating teacher information:', error);
    res.status(500).json({ error: 'Failed to update teacher information', details: error.message });
  }
});

module.exports = router;