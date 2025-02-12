const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Creche', 'Kindergarten', 'Primary', 'Secondary', 'High School']
  },
  description: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Program = mongoose.model('Program', programSchema);

module.exports = Program;