const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
    enum: [
      'Creche-Daycare',
      'Kindergarten 1', 'Kindergarten 2',
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
      'Year 12', 'Year 13'
    ]
  },
  academicYear: {
    type: String,
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  subjects: [{
    name: {
      type: String,
      required: true
    },
    category: String,
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  }],
  schedule: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    activityType: {
      type: String,
      enum: ['class', 'break', 'lunch', 'assembly', 'other'],
      required: true
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Virtual for getting total population
classSchema.virtual('totalStudents').get(function() {
  return this.students.length;
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;