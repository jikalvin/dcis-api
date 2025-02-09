const express = require('express');
const Program = require('../models/Program');
const Class = require('../models/Class');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all programs with their classes
router.get('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const programs = await Program.find().populate('classes');
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific program by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('classes');
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

module.exports = router;