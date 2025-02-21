const mongoose = require('mongoose');

const studentMarkSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  examSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  // For kindergarten
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: function() {
      return this.programLevel === 'kindergarten';
    }
  },
  // For primary/secondary/highschool
  academicEngagement: {
    type: Number,
    min: 0,
    max: 20,
    required: function() {
      return this.sessionType === 'midterm' && this.programLevel !== 'kindergarten';
    }
  },
  midtermExam: {
    type: Number,
    min: 0,
    max: 80,
    required: function() {
      return this.sessionType === 'midterm' && this.programLevel !== 'kindergarten';
    }
  },
  endtermExam: {
    type: Number,
    min: 0,
    max: 100,
    required: function() {
      return this.sessionType === 'endterm' && this.programLevel !== 'kindergarten';
    }
  },
  teacherComment: {
    type: String,
    required: true
  },
  programLevel: {
    type: String,
    enum: ['kindergarten', 'primary', 'secondary', 'highschool'],
    required: true
  },
  sessionType: {
    type: String,
    enum: ['midterm', 'endterm', 'kindergarten'],
    required: true
  },
  academicYear: {
    type: String,
  },
  term: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate final grade for primary/secondary/highschool
studentMarkSchema.virtual('finalGrade').get(function() {
  if (this.programLevel === 'kindergarten') {
    return this.grade;
  }
  
  if (this.sessionType === 'midterm') {
    return this.academicEngagement + this.midtermExam;
  }
  
  if (this.sessionType === 'endterm') {
    return this.endtermExam;
  }
});

module.exports = mongoose.model('StudentMark', studentMarkSchema); 