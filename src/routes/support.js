const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { auth, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Support
 *     description: Support ticket management and help desk
 * 
 * components:
 *   schemas:
 *     SupportTicket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [technical, academic, administrative, other]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         submittedBy:
 *           type: string
 *           description: User ID who submitted the ticket
 *         assignedTo:
 *           type: string
 *           description: Staff ID assigned to the ticket
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 * /api/support:
 *   post:
 *     tags: [Support]
 *     summary: Create support ticket
 *     description: Create a new support ticket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [technical, academic, administrative, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       500:
 *         description: Server error
 */
router.post('/', auth, async (req, res) => {
  try {
    const ticket = new SupportTicket({
      ...req.body,
      submittedBy: req.user._id
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/support:
 *   get:
 *     tags: [Support]
 *     summary: Get support tickets
 *     description: Retrieve all support tickets with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter by ticket status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by ticket category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by ticket priority
 *     responses:
 *       200:
 *         description: List of support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    
    // Apply status filter if provided
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    const tickets = await SupportTicket.find(filters)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
      
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/support/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get support ticket details
 *     description: Retrieve a support ticket by ID
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
 *         description: Support ticket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email');
      
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check if user has permission to view this ticket
    if (!req.user.isAdmin && ticket.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/support/{id}/status:
 *   put:
 *     tags: [Support]
 *     summary: Update ticket status
 *     description: Update the status of a support ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        resolvedAt: status === 'Resolved' ? new Date() : undefined
      },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/support/{id}/comments:
 *   post:
 *     tags: [Support]
 *     summary: Add comment to ticket
 *     description: Add a new comment to a support ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check if user has permission to comment
    if (!req.user.isAdmin && ticket.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    ticket.comments.push({
      content: req.body.content,
      author: req.user._id
    });
    
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/support/{id}/assign:
 *   put:
 *     tags: [Support]
 *     summary: Assign support ticket
 *     description: Assign a support ticket to a staff member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.put('/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { assignedTo: req.body.userId },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/support/user/{userId}:
 *   get:
 *     tags: [Support]
 *     summary: Get support tickets by user
 *     description: Retrieve all support tickets submitted by a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ submittedBy: req.params.userId })
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
      
    if (!tickets.length) {
      return res.status(404).json({ error: 'No tickets found for this user' });
    }
    
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;