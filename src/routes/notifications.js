const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Notification management and delivery
 * 
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         type:
 *           type: string
 *           enum: [info, warning, alert]
 *         recipient:
 *           type: string
 *           description: User ID of the recipient
 *         read:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a new notification
 *     description: Create a new notification for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, alert]
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorize(['admin', 'teacher', 'superadmin']), async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      sender: req.user._id
    });
    await notification.save();
    
    // TODO: Implement notification sending logic based on channels
    // This would integrate with FCM for push notifications,
    // email service for emails, and SMS gateway for SMS
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     description: Retrieve all notifications for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter unread notifications only
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications to return
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    if (!req.user.isAdmin) {
      filters.$or = [
        { recipients: req.user.role },
        { targetUsers: req.user._id }
      ];
    }
    
    const notifications = await Notification.find(filters)
      .populate('sender', 'name email')
      .sort('-createdAt');
      
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.post('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (!notification.readBy.find(read => read.user.toString() === req.user._id.toString())) {
      notification.readBy.push({
        user: req.user._id
      });
      await notification.save();
    }
    
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/schedule:
 *   post:
 *     tags: [Notifications]
 *     summary: Schedule a new notification
 *     description: Schedule a new notification for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, alert]
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Notification scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */
router.post('/schedule', auth, authorize(['admin', 'teacher']), async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      sender: req.user._id,
      status: 'Scheduled'
    });
    await notification.save();
    
    // TODO: Implement notification scheduling logic
    // This would integrate with a job scheduler like bull
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     description: Delete a specific notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;