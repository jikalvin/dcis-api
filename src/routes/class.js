const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, authorize } = require('../middleware/auth');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

/**
 * @swagger
 * tags:
 *   - name: Classes
 *     description: Class management and operations
 * 
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         grade:
 *           type: string
 *         section:
 *           type: string
 *         classTeacher:
 *           type: string
 *           description: Reference to teacher ID
 *         students:
 *           type: array
 *           items:
 *             type: string
 *             description: Reference to student IDs
 * 
 * /api/class:
 *   get:
 *     tags: [Classes]
 *     summary: Get all classes
 *     description: Retrieve a list of all classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *         description: Filter by grade
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         description: Filter by class teacher ID
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('students', 'firstName lastName studentId')
      .populate('subjects.teacher', 'firstName lastName');
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/class/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: Get a specific class
 *     description: Retrieve a specific class by ID
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
 *         description: Class retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, authorize('superadmin', 'admin', 'teacher'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('students')
      .populate('subjects.teacher')
      .populate('schedule.teacher');
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/class:
 *   post:
 *     tags: [Classes]
 *     summary: Create a new class
 *     description: Create a new class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const newClass = new Class(req.body);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/class/{id}/students:
 *   post:
 *     tags: [Classes]
 *     summary: Add student to class
 *     description: Add a student to a specific class
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
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               studentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 studentId:
 *                   type: string
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.post('/:id/students', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentData = {
      ...req.body,
      class: classData._id
    };

    const student = new Student(studentData);
    await student.save();

    classData.students.push(student._id);
    await classData.save();

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/class/{id}/subjects:
 *   post:
 *     tags: [Classes]
 *     summary: Add subject to class
 *     description: Add a subject to a specific class
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
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               teacher:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 category:
 *                   type: string
 *                 teacher:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.post('/:id/subjects', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const subject = new Subject({
      ...req.body,
      classes: [classData._id]
    });
    await subject.save();

    classData.subjects.push({
      name: subject.name,
      category: subject.category,
      teacher: subject.teacher,
      description: subject.description,
      status: subject.status
    });
    await classData.save();

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/class/{id}/schedule:
 *   put:
 *     tags: [Classes]
 *     summary: Update class schedule
 *     description: Update the schedule for a specific class
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
 *             properties:
 *               schedule:
 *                 type: object
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.put('/:id/schedule', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    classData.schedule = req.body.schedule;
    await classData.save();

    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/class/{id}/schedule:
 *   get:
 *     tags: [Classes]
 *     summary: Get class schedule
 *     description: Retrieve the schedule for a specific class
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
 *         description: Schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedule:
 *                   type: object
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */
router.get('/:id/schedule', auth, authorize('superadmin', 'admin', 'teacher', 'parent'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('schedule.teacher', 'firstName lastName')
      .select('schedule');
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json(classData.schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;