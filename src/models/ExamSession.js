const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true
  },
  session: {
    type: String,
    required: true
  },
  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
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