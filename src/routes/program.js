const express = require('express');
const Program = require('../models/Program');
const Class = require('../models/Class');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all programs with their classes
router.get('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const programs = await Program.find().populate(['classes', 'teachers']);
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific program by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate(['classes', 'teachers']);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new program (Super Admin only)
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  const { name, description, academicYear } = req.body;
  
  try {
    const program = new Program({
      name,
      description,
      academicYear,
      classes: []
    });
    
    const newProgram = await program.save();
    res.status(201).json(newProgram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a program (Super Admin only)
router.patch('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] != null) {
        program[key] = req.body[key];
      }
    });

    const updatedProgram = await program.save();
    res.json(updatedProgram);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a program (Super Admin only)
router.delete('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Remove all associated classes
    await Class.deleteMany({ _id: { $in: program.classes } });
    await program.remove();
    
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes for a specific program
router.get('/:id/classes', auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('classes');
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json(program.classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a class to a program (Admin or Super Admin only)
router.post('/:id/classes', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const newClass = new Class({
      name: req.body.name,
      program: program._id,
      academicYear: req.body.academicYear,
      subjects: [],
      students: [],
      schedule: []
    });

    const savedClass = await newClass.save();
    program.classes.push(savedClass._id);
    await program.save();

    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/programs/assign-teacher:
 *   post:
 *     tags: [Programs]
 *     summary: Assign a teacher to a program
 *     description: Assign a specific teacher to a program by their ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - teacherId
 *             properties:
 *               programId:
 *                 type: string
 *               teacherId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher assigned to the program successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Program or teacher not found
 *       500:
 *         description: Server error
 */
router.post('/assign-teacher', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { programId, teacherId } = req.body;

    // Find the program by ID
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Find the teacher by ID
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if the teacher is already assigned to the program
    if (program.teachers.includes(teacherId)) {
      return res.status(400).json({ error: 'Teacher is already assigned to this program' });
    }

    // Assign the teacher to the program
    program.teachers.push(teacherId);
    await program.save();

    res.status(200).json({ message: 'Teacher assigned to program successfully' });
  } catch (error) {
    console.error('Error assigning teacher to program:', error);
    res.status(500).json({ error: 'Failed to assign teacher to program', details: error.message });
  }
});

/**
 * @swagger
 * /api/programs/unassign-teacher:
 *   post:
 *     tags: [Programs]
 *     summary: Unassign a teacher from a program
 *     description: Unassign a specific teacher from a program by their ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - teacherId
 *             properties:
 *               programId:
 *                 type: string
 *               teacherId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher unassigned from the program successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Program or teacher not found
 *       500:
 *         description: Server error
 */
router.post('/unassign-teacher', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { programId, teacherId } = req.body;

    // Find the program by ID
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Check if the teacher is assigned to the program
    if (!program.teachers.includes(teacherId)) {
      return res.status(400).json({ error: 'Teacher is not assigned to this program' });
    }

    // Unassign the teacher from the program
    program.teachers = program.teachers.filter(id => id.toString() !== teacherId);
    await program.save();

    res.status(200).json({ message: 'Teacher unassigned from program successfully' });
  } catch (error) {
    console.error('Error unassigning teacher from program:', error);
    res.status(500).json({ error: 'Failed to unassign teacher from program', details: error.message });
  }
});

module.exports = router;