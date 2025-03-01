const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    }
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  dob: {
    type: Date,
    required: true
  },
  sex: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  program: {
    type: String,
    // required: true,
    enum: ['Creche', 'Kindergarten', 'Primary', 'Secondary', 'High School']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  academicYear: {
    type: String,
    // required: true
  },
  address: {
    type: String,
    // required: true
  },
  emergencyContacts: [{
    dialCode: {
      type: String,
      // required: true
    },
    number: {
      type: Number,
      // required: true
    }
  }],
  guardianInfo: [{
    relation: {
      type: String,
      // required: true
    },
    guardian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true
    }
  }],
  academicBackground: {
    previousSchool: String,
    previousClass: String,
    lastAverage: Number,
    lastPosition: Number
  },
  medicalBackground: {
    infos: [{
      description: String
    }]
  },
  picture: String, // URL to uploaded picture
  attendance: [{
    date: {
      type: Date,
      // required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      // required: true
    },
    notes: String
  }],
  performance: {
    exams: [{
      examId: {
        type: String,
        // required: true
      },
      name: String,
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      datePublished: Date,
      marks: Number,
      totalMarks: Number,
      notes: String
    }],
    homework: [{
      homeworkId: {
        type: String,
        // required: true
      },
      name: String,
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      datePublished: Date,
      marks: Number,
      totalMarks: Number,
      notes: String
    }]
  },
  payments: [{
    type: {
      type: String,
      enum: ['school_fees', 'service'],
      // required: true
    },
    amount: {
      type: Number,
      // required: true
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      // required: true
    },
    dueDate: Date,
    paidDate: Date,
    description: String
  }]
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;