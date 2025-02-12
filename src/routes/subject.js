const express = require('express');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose');

// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('teacher', 'firstName lastName email')
      .populate('program', 'name')
      .populate('class', 'name');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subjects by program
router.get('/program/:programId', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ program: req.params.programId })
      .populate('teacher', 'firstName lastName email')
      .populate('program', 'name')
      .populate('class', 'name');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subjects by class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ class: req.params.classId })
      .populate('teacher', 'firstName lastName email')
      .populate('program', 'name')
      .populate('class', 'name');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific subject
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('teacher', 'firstName lastName email')
      .populate('program', 'name')
      .populate('class', 'name');
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new subject (Admin or Super Admin only)
router.post('/', auth, authorize('superadmin', 'admin'), async (req, res) => {
  const {
    name,
    program,
    class: className,
    category,
    teacher,
    status,
    description
  } = req.body;

  if (!className || !mongoose.isValidObjectId(className)) {
    return res.status(400).json({ message: 'Invalid class ID provided.' });
  }

  try {
    // Verify teacher exists and is a teacher
    const teacherExists = await User.findOne({ _id: teacher, role: 'teacher' });
    if (!teacherExists) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify class exists
    const classExists = await Class.findById(className);
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const subject = new Subject({
      name,
      program,
      class: className,
      category,
      teacher,
      status: status || 'active',
      description
    });

    const newSubject = await subject.save();

    // Add subject to class's subjects array
    await Class.findByIdAndUpdate(
      className,
      { $push: { subjects: newSubject._id } }
    );

    // Add subject to teacher's subjects array
    await User.findByIdAndUpdate(
      teacher,
      { $push: { subjects: newSubject._id } }
    );

    res.status(201).json(await newSubject.populate([
      { path: 'teacher', select: 'firstName lastName email' },
      { path: 'program', select: 'name' },
      { path: 'class', select: 'name' }
    ]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a subject (Admin or Super Admin only)
router.patch('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  const updates = req.body;
  const updateFields = {};

  // Only allow updating certain fields
  const allowedUpdates = ['name', 'category', 'teacher', 'status', 'description', 'class'];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key) && updates[key] != null) {
      updateFields[key] = updates[key];
    }
  });

  if (updateFields.class && (!updateFields.class || !mongoose.isValidObjectId(updateFields.class))) {
    return res.status(400).json({ message: 'Invalid class ID provided.' });
  }

  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // If teacher is being updated, handle the change
    if (updateFields.teacher && updateFields.teacher !== subject.teacher.toString()) {
      // Verify new teacher exists and is a teacher
      const newTeacher = await User.findOne({ _id: updateFields.teacher, role: 'teacher' });
      if (!newTeacher) {
        return res.status(404).json({ message: 'New teacher not found' });
      }

      // Remove subject from old teacher's subjects array
      await User.findByIdAndUpdate(
        subject.teacher,
        { $pull: { subjects: subject._id } }
      );

      // Add subject to new teacher's subjects array
      await User.findByIdAndUpdate(
        updateFields.teacher,
        { $push: { subjects: subject._id } }
      );
    }

    // If class is being updated, handle the change
    if (updateFields.class && updateFields.class !== subject.class.toString()) {
      // Verify new class exists
      const newClass = await Class.findById(updateFields.class);
      if (!newClass) {
        return res.status(404).json({ message: 'New class not found' });
      }

      // Remove subject from old class's subjects array
      await Class.findByIdAndUpdate(
        subject.class,
        { $pull: { subjects: subject._id } }
      );

      // Add subject to new class's subjects array
      await Class.findByIdAndUpdate(
        updateFields.class,
        { $push: { subjects: subject._id } }
      );
    }

    Object.assign(subject, updateFields);
    const updatedSubject = await subject.save();

    res.json(await updatedSubject.populate([
      { path: 'teacher', select: 'firstName lastName email' },
      { path: 'program', select: 'name' },
      { path: 'class', select: 'name' }
    ]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a subject (Admin or Super Admin only)
router.delete('/:id', auth, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove subject from class's subjects array
    await Class.findByIdAndUpdate(
      subject.class,
      { $pull: { subjects: subject._id } }
    );

    // Remove subject from teacher's subjects array
    await User.findByIdAndUpdate(
      subject.teacher,
      { $pull: { subjects: subject._id } }
    );

    await subject.remove();
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;