const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentStructure: {
    amount: {
      type: Number,
      required: true
    },
    frequency: {
      type: String,
      enum: ['One-time', 'Daily', 'Weekly', 'Monthly', 'Termly', 'Yearly'],
      required: true
    },
    installments: {
      allowed: {
        type: Boolean,
        default: false
      },
      maxInstallments: Number,
      installmentAmount: Number
    }
  },
  availability: {
    startDate: Date,
    endDate: Date,
    maxCapacity: Number,
    currentEnrollment: {
      type: Number,
      default: 0
    }
  },
  requirements: [{
    requirement: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  transactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    paymentMethod: String,
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    transactionId: String,
    paymentDate: Date
  }]
}, {
  timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;