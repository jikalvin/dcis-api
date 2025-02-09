const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  'branding.logo': String,
  'branding.systemColor': String,
  'general.schoolName': String,
  'general.address': String,
  'general.phone': String,
  'general.email': String,
  'security.twoFactorEnabled': { type: Boolean, default: false },
  'permissions.parentTeacherCommunication': { type: Boolean, default: true },
  'permissions.supportTickets': { type: Boolean, default: true },
  'permissions.smsNotifications': { type: Boolean, default: true },
  'permissions.emailNotifications': { type: Boolean, default: true },
  'permissions.adminPermissions.classes': { type: Boolean, default: true },
  'permissions.adminPermissions.teachers': { type: Boolean, default: true },
  'permissions.adminPermissions.tuition': { type: Boolean, default: true },
  'permissions.adminPermissions.noticeboard': { type: Boolean, default: true },
  'permissions.adminPermissions.exams': { type: Boolean, default: true },
  'permissions.adminPermissions.parents': { type: Boolean, default: true },
  'permissions.adminPermissions.services': { type: Boolean, default: true },
  'academic.currentYear': String,
  'academic.years': [{
    name: String,
    startDate: Date,
    endDate: Date,
    terms: [{
      name: String,
      startDate: Date,
      endDate: Date,
      firstEvalLabel: String,
      secondEvalLabel: String
    }]
  }],
  'academic.gradingScales': [{
    grade: String,
    minScore: Number,
    maxScore: Number
  }],
  'academic.reportCardTheme.backgroundColor': String,
  'academic.reportCardTheme.textColor': String,
  'academic.reportCardTheme.accentColor': String,
  'payment.methods.cash.enabled': { type: Boolean, default: true },
  'payment.methods.mobileMoney.enabled': { type: Boolean, default: false },
  'payment.methods.mobileMoney.apiKey': { type: String, default: '' },
  'payment.methods.mobileMoney.secretKey': { type: String, default: '' },
  'payment.methods.orangeMoney.enabled': { type: Boolean, default: false },
  'payment.methods.orangeMoney.apiKey': { type: String, default: '' },
  'payment.methods.orangeMoney.secretKey': { type: String, default: '' },
  'payment.methods.bankTransfer.enabled': { type: Boolean, default: false },
  'payment.methods.bankTransfer.accountDetails': { type: String, default: '' },
  'emailSettings.host': String,
  'emailSettings.port': Number,
  'emailSettings.username': String,
  'emailSettings.password': String,
  'emailSettings.from': String
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);



module.exports = Settings;