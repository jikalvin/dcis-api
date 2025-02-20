const express = require('express');
const router = express.Router();
const examMarksController = require('../controllers/examMarksController');
const { auth, authorize } = require('../middleware/auth');

router.post('/record', auth, authorize('superadmin', 'admin', 'teacher'), examMarksController.recordMarks);
router.get('/student', auth, examMarksController.getStudentMarks);
router.put('/:id', auth, examMarksController.updateMarks);

module.exports = router; 