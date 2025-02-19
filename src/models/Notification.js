const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Message', 'Event', 'Announcement', 'Reminder', 'Broadcast'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: {
    type: String,
    enum: ['All', 'Students', 'Teachers', 'Parents', 'Admins'],
    required: true
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduleDate: Date,
  channels: [{
    type: String,
    enum: ['Push', 'Email', 'SMS'],
    required: true
  }],
  metadata: {
    link: String,
    actionRequired: Boolean,
    dueDate: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Sent', 'Failed'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;