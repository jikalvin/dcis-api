const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

// Create a new chat
router.post('/', auth, async (req, res) => {
  try {
    const { participants, type, name, description } = req.body;
    
    // Add current user to participants if not included
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id);
    }
    
    const chat = new Chat({
      participants,
      type,
      name,
      description,
      adminUsers: [req.user._id] // Creator is initial admin
    });
    
    await chat.save();
    
    // Populate participants info
    await chat.populate('participants', 'name email avatar');
    
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      status: 'Active'
    })
    .populate('participants', 'name email avatar')
    .populate('lastMessage.sender', 'name')
    .select('-messages')
    .sort('-updatedAt');
    
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Chat and messaging functionality
 * 
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         sender:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             avatar:
 *               type: string
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         readBy:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               readAt:
 *                 type: string
 *                 format: date-time
 * 
 * /api/chat/{chatId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat messages
 *     description: Retrieve messages for a specific chat with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? new Date(req.query.before) : new Date();
    
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    })
    .populate('messages.sender', 'name email avatar')
    .populate('messages.readBy.user', 'name');
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const messages = chat.messages
      .filter(msg => msg.createdAt < before)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message
 *     description: Send a new message in a chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
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
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const message = {
      sender: req.user._id,
      content,
      attachments,
      readBy: [{ user: req.user._id }]
    };
    
    chat.messages.push(message);
    chat.lastMessage = {
      content,
      sender: req.user._id,
      timestamp: new Date()
    };
    
    await chat.save();
    
    // Populate sender info for the new message
    await chat.populate('messages.sender', 'name email avatar');
    const sentMessage = chat.messages[chat.messages.length - 1];
    
    res.status(201).json(sentMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.post('/:chatId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Mark all unread messages as read
    chat.messages.forEach(message => {
      if (!message.readBy.find(read => read.user.toString() === req.user._id.toString())) {
        message.readBy.push({
          user: req.user._id
        });
      }
    });
    
    await chat.save();
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add users to group chat
router.post('/:chatId/participants', auth, async (req, res) => {
  try {
    const { participants } = req.body;
    
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      adminUsers: req.user._id,
      type: 'Group'
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or not authorized' });
    }
    
    // Add new participants
    participants.forEach(userId => {
      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
      }
    });
    
    await chat.save();
    
    await chat.populate('participants', 'name email avatar');
    res.status(200).json(chat.participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/chat/{chatId}/participants/{userId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Remove participant
 *     description: Remove a user from a group chat (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *       404:
 *         description: Chat not found or not authorized
 *       500:
 *         description: Server error
 */
router.delete('/:chatId/participants/:userId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      adminUsers: req.user._id,
      type: 'Group'
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or not authorized' });
    }
    
    chat.participants = chat.participants.filter(
      p => p.toString() !== req.params.userId
    );
    
    await chat.save();
    res.status(200).json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;