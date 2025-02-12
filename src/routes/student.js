const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Student = require('../models/Student');

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: Get all students
 *     description: Retrieve a list of all students
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       500:
 *         description: Server error
 *   post:
 *     tags: [Students]
 *     summary: Add a new student
 *     description: Create a new student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       500:
 *         description: Server error
 */

// Get all students
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new student
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by ID
 *     description: Retrieve a student by their ID
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
 *         description: Student data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 *   put:
 *     tags: [Students]
 *     summary: Update student by ID
 *     description: Update a student's information by their ID
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
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 *   delete:
 *     tags: [Students]
 *     summary: Delete student by ID
 *     description: Delete a student by their ID
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
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update student by ID
router.put('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete student by ID
router.delete('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{studentId}/assign-class/{classId}:
 *   post:
 *     tags: [Students]
 *     summary: Assign class to student
 *     description: Assign a class to a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class assigned to student successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */

// Assign class to student
router.post('/:studentId/assign-class/:classId', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    student.class = req.params.classId;
    await student.save();
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{studentId}/grades:
 *   get:
 *     tags: [Students]
 *     summary: Get student grades
 *     description: Retrieve grades for a student
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
 *         description: Student grades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Grade'
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */

// Get student grades
router.get('/:studentId/grades', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('grades');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student.grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{studentId}/attendance:
 *   get:
 *     tags: [Students]
 *     summary: Get student attendance
 *     description: Retrieve attendance records for a student
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
 *         description: Student attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendance'
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */

// Get student attendance
router.get('/:studentId/attendance', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('attendance');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student.attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;