const express = require('express');
const router = express.Router();
const ExamSession = require('../models/ExamSession');
const Settings = require('../models/Settings');
const { auth, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Exam Sessions
 *     description: Exam session management and results
 * 
 * components:
 *   schemas:
 *     ExamSession:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         term:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         isOpen:
 *           type: boolean
 *         marks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               student:
 *                 type: string
 *               subject:
 *                 type: string
 *               score:
 *                 type: number
 *               submittedBy:
 *                 type: string
 *               submittedAt:
 *                 type: string
 *                 format: date
 * 
 * /api/exam-sessions:
 *   post:
 *     tags: [Exam Sessions]
 *     summary: Create exam session
 *     description: Create a new exam session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               term:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Exam session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSession'
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const {
      term,
      startDate,
      endDate,
      publicationDate,
      publicationTime,
      program,
      classes,
      submissionFrequency,
      session,
      sessionType
    } = req.body;

    // Combine publicationDate and publicationTime into a single Date object
    const publicationDateTime = new Date(`${publicationDate}T${publicationTime}:00`);

    const examSession = new ExamSession({
      term,
      startDate,
      endDate,
      publicationDateTime,
      program,
      classes,
      submissionFrequency,
      session: session,
      sessionType,
      academicYear: session[0],
    });

    await examSession.save();
    res.status(201).json(examSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions:
 *   get:
 *     tags: [Exam Sessions]
 *     summary: Get all exam sessions
 *     description: Retrieve all exam sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exam sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExamSession'
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const examSessions = await ExamSession.find()
      .populate('programs')
      .populate('classes').populate({
        path: 'classes',
        populate: {
          path: 'subjects',
          model: 'Subject'
        }
      })
      .populate('classes.subjects.teacher')
      .populate('classes.students')
      .populate('marks.student', 'name class')
      .populate('marks.subject', 'name')
      .populate('marks.submittedBy', 'name')
      .sort('-createdAt');
    res.status(200).json(examSessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}:
 *   get:
 *     tags: [Exam Sessions]
 *     summary: Get exam session details
 *     description: Retrieve exam session details
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
 *         description: Exam session details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSession'
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const examSession = await ExamSession.findById(req.params.id)
      .populate('programs')
      .populate('classes')
      .populate('marks.student', 'name class')
      .populate('marks.subject', 'name')
      .populate('marks.submittedBy', 'name');
      
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    
    res.status(200).json(examSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}:
 *   put:
 *     tags: [Exam Sessions]
 *     summary: Update exam session
 *     description: Update exam session details
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
 *               term:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Exam session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSession'
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const examSession = await ExamSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    
    res.status(200).json(examSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}/toggle-status:
 *   put:
 *     tags: [Exam Sessions]
 *     summary: Toggle exam session status
 *     description: Toggle exam session status between open and closed
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
 *         description: Exam session status toggled successfully
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.put('/:id/toggle-status', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const examSession = await ExamSession.findById(req.params.id);
    
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    
    examSession.isOpen = !examSession.isOpen;
    await examSession.save();
    
    res.status(200).json({
      message: `Exam session ${examSession.isOpen ? 'opened' : 'closed'} successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}/marks/{subjectId}:
 *   post:
 *     tags: [Exam Sessions]
 *     summary: Submit marks for a subject
 *     description: Submit marks for a subject in an exam session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subjectId
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
 *               marks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     score:
 *                       type: number
 *     responses:
 *       200:
 *         description: Marks submitted successfully
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.post('/:id/marks/:subjectId', auth, authorize(['admin', 'teacher']), async (req, res) => {
  try {
    const { marks } = req.body;
    const examSession = await ExamSession.findById(req.params.id);
    
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    
    if (!examSession.isOpen) {
      return res.status(400).json({ error: 'Exam session is closed' });
    }
    
    // Process each student's mark
    marks.forEach(mark => {
      const existingMarkIndex = examSession.marks.findIndex(
        m => m.student.toString() === mark.studentId &&
             m.subject.toString() === req.params.subjectId
      );
      
      if (existingMarkIndex > -1) {
        examSession.marks[existingMarkIndex].score = mark.score;
        examSession.marks[existingMarkIndex].submittedBy = req.user._id;
        examSession.marks[existingMarkIndex].submittedAt = new Date();
      } else {
        examSession.marks.push({
          student: mark.studentId,
          subject: req.params.subjectId,
          score: mark.score,
          submittedBy: req.user._id,
          submittedAt: new Date()
        });
      }
    });
    
    await examSession.save();
    res.status(200).json({ message: 'Marks submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}/student/{studentId}:
 *   get:
 *     tags: [Exam Sessions]
 *     summary: Get student's marks for a session
 *     description: Retrieve student's marks for an exam session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student's marks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   subject:
 *                     type: string
 *                   score:
 *                     type: number
 *                   submittedBy:
 *                     type: string
 *                   submittedAt:
 *                     type: string
 *                     format: date
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.get('/:id/student/:studentId', auth, async (req, res) => {
  try {
    const examSession = await ExamSession.findById(req.params.id);
    
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    
    const studentMarks = examSession.marks.filter(
      mark => mark.student.toString() === req.params.studentId
    );
    
    res.status(200).json(studentMarks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}/report-card/{studentId}:
 *   get:
 *     tags: [Exam Sessions]
 *     summary: Generate report card
 *     description: Generate report card for a student in an exam session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report card generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     class:
 *                       type: string
 *                     program:
 *                       type: string
 *                 examSession:
 *                   type: object
 *                   properties:
 *                     term:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                 marks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           category:
 *                             type: string
 *                       score:
 *                         type: number
 *                       grade:
 *                         type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalSubjects:
 *                       type: number
 *                     averageScore:
 *                       type: number
 *                     highestScore:
 *                       type: number
 *                     lowestScore:
 *                       type: number
 *                 theme:
 *                   type: string
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.get('/:id/report-card/:studentId', auth, async (req, res) => {
  try {
    const examSession = await ExamSession.findById(req.params.id)
      .populate('marks.student', 'name class program')
      .populate('marks.subject', 'name category');
    
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    
    const studentMarks = examSession.marks.filter(
      mark => mark.student._id.toString() === req.params.studentId
    );
    
    if (studentMarks.length === 0) {
      return res.status(404).json({ error: 'No marks found for student' });
    }
    
    // Get grading scale for student's program
    const settings = await Settings.findOne();
    const program = studentMarks[0].student.program;
    const gradingScale = settings.academic.gradingScales.get(program);
    
    // Calculate grades and statistics
    const reportCard = {
      student: studentMarks[0].student,
      examSession: {
        term: examSession.term,
        startDate: examSession.startDate,
        endDate: examSession.endDate
      },
      marks: studentMarks.map(mark => {
        const grade = gradingScale.find(
          g => mark.score >= g.minScore && mark.score <= g.maxScore
        );
        
        return {
          subject: mark.subject,
          score: mark.score,
          grade: grade ? grade.grade : 'N/A'
        };
      }),
      statistics: {
        totalSubjects: studentMarks.length,
        averageScore: studentMarks.reduce((sum, mark) => sum + mark.score, 0) / studentMarks.length,
        highestScore: Math.max(...studentMarks.map(mark => mark.score)),
        lowestScore: Math.min(...studentMarks.map(mark => mark.score))
      },
      theme: settings.academic.reportCardTheme
    };
    
    res.status(200).json(reportCard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/exam-sessions/{id}:
 *   delete:
 *     tags: [Exam Sessions]
 *     summary: Delete an exam session
 *     description: Delete an exam session by ID
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
 *         description: Exam session deleted successfully
 *       404:
 *         description: Exam session not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const examSession = await ExamSession.findByIdAndDelete(req.params.id);
    if (!examSession) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    res.status(200).json({ message: 'Exam session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;