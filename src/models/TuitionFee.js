const mongoose = require('mongoose');

const tuitionFeeSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true
  },
  program: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  }],
  class: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  }],
  baseAmount: {
    type: Number,
    required: true
  },
  installments: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    lateFee: {
      amount: Number,
      applicableAfter: Number // days after due date
    }
  }],
  additionalFees: [{
    name: String,
    amount: Number,
    description: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  discounts: [{
    name: String,
    type: {
      type: String,
      enum: ['Percentage', 'Fixed'],
      required: true
    },
    value: Number,
    conditions: String
  }],
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Archived'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

const studentTuitionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  tuitionFee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TuitionFee',
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  totalAmount: Number,
  paidAmount: {
    type: Number,
    default: 0
  },
  balance: Number,
  status: {
    type: String,
    enum: ['Unpaid', 'PartiallyPaid', 'Paid', 'Overdue'],
    default: 'Unpaid'
  },
  payments: [{
    amount: Number,
    installmentName: String,
    paymentDate: Date,
    paymentMethod: String,
    transactionId: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    }
  }],
  lastReminderSent: Date
}, {
  timestamps: true
});

const TuitionFee = mongoose.model('TuitionFee', tuitionFeeSchema);
const StudentTuition = mongoose.model('StudentTuition', studentTuitionSchema);

module.exports = { TuitionFee, StudentTuition };