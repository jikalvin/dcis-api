const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    required: true
  },
  sessionType: {
    type: String,
    enum: ['midterm', 'endterm', 'kindergarten'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  programLevel: {
    type: String,
    enum: ['kindergarten', 'primary', 'secondary', 'highschool'],
    // required: true
  },
  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },],
  reminderFrequency: {
    type: Number,  // in days
    default: 1
  },
  publicationDateTime: {
    type: Date,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  marks: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    score: Number,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  }]
}, {
  timestamps: true
});

const ExamSession = mongoose.model('ExamSession', examSessionSchema);

module.exports = ExamSession;