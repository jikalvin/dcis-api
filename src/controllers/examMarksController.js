const StudentMark = require('../models/StudentMark');
const ExamSession = require('../models/ExamSession');
const Program = require('../models/Program');
const Student = require('../models/Student');

exports.recordMarks = async (req, res) => {
  try {
    const {
      studentId,
      examSessionId,
      subjectId,
      grade,
      academicEngagement,
      midtermExam,
      endtermExam,
      teacherComment,
      program: prg,
    } = req.body;

    // Get exam session details
    const examSession = await ExamSession.findById(examSessionId).populate('programs');
    if (!examSession) {
      return res.status(404).json({ message: 'Exam session not found' });
    }

    // Get student details to check their program
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find matching program from exam session programs
    const program = await Program.findById(prg);
    if (!program) {
      return res.status(404).json({ message: 'Program not found for this student in exam session' });
    }

    const pname = program.name;
    console.log(pname)
    // console.log(program, examSession)

    // Create new mark record
    const markRecord = new StudentMark({
      student: studentId,
      examSession: examSessionId,
      subject: subjectId,
      programLevel: pname.toLowerCase(),
      program: program._id,
      sessionType: examSession.sessionType,
      academicYear: examSession.session || examSession.academicYear,
      term: examSession.term,
      teacherComment,
      ...(program.name === 'Kindergarten' && { grade }),
      ...(examSession.sessionType === 'midterm' && {
        academicEngagement,
        midtermExam
      }),
      ...(examSession.sessionType === 'endterm' && {
        endtermExam
      })
    });

    await markRecord.save();
    res.status(201).json(markRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId, academicYear, term } = req.query;

    // Find marks with the specified filters
    const marks = await StudentMark.find({
      student: studentId,
      // term
    })
    // .populate({
    //   path: 'examSession',
    //   match: { academicYear }
    // })
    .populate('subject')
    // .populate('program');

    // Filter out marks where the examSession does not match the academicYear
    const filteredMarks = marks.filter(mark => mark.examSession);

    res.status(200).json(filteredMarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMarks = async (req, res) => {
  try {
    const markId = req.params.id;
    const updates = req.body;
    
    const mark = await StudentMark.findById(markId).populate({
      path: 'student',
      populate: {
        path: 'class',
        model: 'Class'
      }
    });

    const program = await Program.findById(mark.student.class.program);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (!mark) {
      return res.status(404).json({ message: 'Mark record not found' });
    }

    // Validate updates based on program and session type
    if (program.name === 'Kindergarten' && updates.grade) {
      mark.grade = updates.grade;
    } else if (mark.sessionType === 'midterm') {
      if (updates.academicEngagement) mark.academicEngagement = updates.academicEngagement;
      if (updates.midtermExam) mark.midtermExam = updates.midtermExam;
    } else if (mark.sessionType === 'endterm') {
      if (updates.endtermExam) mark.endtermExam = updates.endtermExam;
    }

    if (updates.teacherComment) mark.teacherComment = updates.teacherComment;
    
    await mark.save();
    res.status(200).json(mark);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllMarks = async (req, res) => {
  try {
    await StudentMark.deleteMany({});
    res.status(200).json({ message: 'All student marks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};