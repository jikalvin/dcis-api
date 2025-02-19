const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { upload } = require('../utils/cloudinary');

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   middleName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               sex:
 *                 type: string
 *                 enum: [male, female, other]
 *               classId:
 *                 type: string
 *               address:
 *                 type: string
 *               emergencyContact1:
 *                 type: object
 *                 properties:
 *                   dialCode:
 *                     type: string
 *                   number:
 *                     type: number
 *               emergencyContact2:
 *                 type: object
 *                 properties:
 *                   dialCode:
 *                     type: string
 *                   number:
 *                     type: number
 *               academicBackground:
 *                 type: object
 *                 properties:
 *                   previousSchool:
 *                     type: string
 *                   previousClass:
 *                     type: string
 *                   lastAverage:
 *                     type: number
 *                   lastPosition:
 *                     type: number
 *               medicalBackground:
 *                 type: object
 *                 properties:
 *                   infos:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         description:
 *                           type: string
 *               picture:
 *                 type: string
 *                 format: binary
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
router.post('/', auth, authorize('superadmin', 'admin'), upload.single('picture'), async (req, res) => {
  try {
    const {
      name,
      dob,
      sex,
      classId,
      address,
      emergencyContact1,
      emergencyContact2,
      academicBackground,
      medicalBackground
    } = req.body;

    // Verify class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Handle picture upload
    let pictureUrl = null;
    if (req.file) {
      pictureUrl = req.file.path;
    }

    // Create new student
    const student = new Student({
      name,
      dob,
      sex,
      class: classId,
      address,
      emergencyContacts: [emergencyContact1, emergencyContact2],
      academicBackground,
      medicalBackground,
      studentId: `STU${Math.floor(1000 + Math.random() * 9000)}`,
      picture: pictureUrl
    });
    await student.save();

    // Add student to class
    classExists.students.push(student._id);
    await classExists.save();

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

/**
 * @swagger
 * /api/students/class/{classId}:
 *   get:
 *     tags: [Students]
 *     summary: Get students by class
 *     description: Retrieve a list of students by class ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       404:
 *         description: No students found for this class
 *       500:
 *         description: Server error
 */

// Get students by class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const students = await Student.find({ class: req.params.classId })
      .populate('class')
      .populate('emergencyContacts')
      .populate('academicBackground')
      .populate('medicalBackground.infos')
      .populate('guardianInfo.guardian', 'firstName lastName')
      .populate('performance.exams.subject', 'name')
      .populate('performance.homework.subject', 'name')
      .populate('payments');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/students/search:
 *   get:
 *     tags: [Students]
 *     summary: Search students by name
 *     description: Search for students by their name and provide real-time suggestions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students matching the search query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       500:
 *         description: Server error
 */

// Search students by name
router.get('/search', auth, async (req, res) => {
  try {
    const { name } = req.query;
    const students = await Student.find({
      $or: [
        { 'name.firstName': { $regex: name, $options: 'i' } },
        { 'name.middleName': { $regex: name, $options: 'i' } },
        { 'name.lastName': { $regex: name, $options: 'i' } }
      ]
    }).populate('class')
      .populate('emergencyContacts')
      .populate('academicBackground')
      .populate('medicalBackground.infos')
      .populate('guardianInfo.guardian', 'firstName lastName')
      .populate('performance.exams.subject', 'name')
      .populate('performance.homework.subject', 'name')
      .populate('payments');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;