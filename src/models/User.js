const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'teacher', 'parent'],
    required: true
  },
  institutionId: {
    type: String,
    required: true,
    unique: true
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  programs: [{
    type: String,
    enum: ['Creche', 'Kindergarten', 'Primary', 'Secondary', 'High School']
  }],
  prgs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],
  nationality: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  contact: String,
  address: String,
  profileImage: {
    type: String
  },
  teacherDetails: {
    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract']
    },
    salary: {
      currency: {
        type: String,
        default: 'XAF'
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    emergencyContact: {
      dailCode: {
        type: String,
        default: '+237'
      },
      number: {
        type: String
      }
    },
    startDate: {
      type: Date
    },
    academicBackground: {
      school: {
        type: String
      },
      date: {
        type: Date
      },
      certificate: {
        type: String
      }
    },
    medicalBackground: {
      infos: [{
        type: String
      }]
    }
  },
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;