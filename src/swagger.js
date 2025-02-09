/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: Teachers
 *     description: Teacher dashboard operations
 *   - name: Parents
 *     description: Parent dashboard operations
 *   - name: Programs
 *     description: School program management
 *   - name: Subjects
 *     description: Subject management within programs and classes
 *   - name: Chat
 *     description: Chat operations
 * 
 * /api/auth/login/step1:
 *   post:
 *     tags: [Authentication]
 *     summary: First step of 2FA login
 *     description: Submit institution identifier to receive verification code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: "Institution identifier (format: DCIS[year][program][digits])"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 * 
 * /api/auth/login/step2:
 *   post:
 *     tags: [Authentication]
 *     summary: Second step of 2FA login
 *     description: Verify code and complete login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - verificationCode
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid code or password
 *       404:
 *         description: User not found
 * 
 * /api/auth/resend-code:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend verification code
 *     description: Request a new verification code
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
 *         description: New code sent successfully
 *       404:
 *         description: User not found
 * 
 * /api/teacher/timetable:
 *   get:
 *     tags: [Teachers]
 *     summary: Get teacher's timetable
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher's timetable retrieved successfully
 * 
 * /api/teacher/exam-sessions:
 *   get:
 *     tags: [Teachers]
 *     summary: Get exam sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exam sessions
 *   
 *   put:
 *     tags: [Teachers]
 *     summary: Update exam session status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - isOpen
 *             properties:
 *               sessionId:
 *                 type: string
 *               isOpen:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Exam session updated successfully
 * 
 * /api/teacher/marks:
 *   post:
 *     tags: [Teachers]
 *     summary: Submit marks for a session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - classId
 *               - subjectId
 *               - marks
 *             properties:
 *               sessionId:
 *                 type: string
 *               classId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               marks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     score:
 *                       type: number
 *     responses:
 *       200:
 *         description: Marks submitted successfully
 * 
 * /api/teacher/attendance:
 *   post:
 *     tags: [Teachers]
 *     summary: Mark attendance for a class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - date
 *               - attendance
 *             properties:
 *               classId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               attendance:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late]
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 * 
 * /api/teacher/assignments:
 *   post:
 *     tags: [Teachers]
 *     summary: Upload assignment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Assignment uploaded successfully
 * 
 * /api/parent/children:
 *   get:
 *     tags: [Parents]
 *     summary: Get all children's records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Children's records retrieved successfully
 * 
 * /api/parent/support-tickets:
 *   post:
 *     tags: [Parents]
 *     summary: Open support ticket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Support ticket created successfully
 * 
 * /api/chat/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get user's chat messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID of the user to get chat history with
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
 * 
 *   post:
 *     tags: [Chat]
 *     summary: Send a chat message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 * 
 * /api/parent/payments:
 *   post:
 *     tags: [Parents]
 *     summary: Make a payment for fees or services
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - studentId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [tuition, services]
 *               amount:
 *                 type: number
 *               studentId:
 *                 type: string
 *               serviceId:
 *                 type: string
 *                 description: Required if type is services
 *     responses:
 *       200:
 *         description: Payment processed successfully
 * 
 * /api/teacher/disciplinary-records:
 *   get:
 *     tags: [Teachers]
 *     summary: Get disciplinary records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Optional class ID to filter records
 *     responses:
 *       200:
 *         description: Disciplinary records retrieved successfully
 *   
 *   post:
 *     tags: [Teachers]
 *     summary: Create disciplinary record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - description
 *               - severity
 *             properties:
 *               studentId:
 *                 type: string
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [minor, moderate, severe]
 *               action:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disciplinary record created successfully
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Program:
 *       type: object
 *       required:
 *         - name
 *         - academicYear
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated program ID
 *         name:
 *           type: string
 *           description: Program name (e.g., Creche, Kindergarten, Primary)
 *         description:
 *           type: string
 *         academicYear:
 *           type: string
 *         classes:
 *           type: array
 *           items:
 *             type: string
 *             description: Class IDs
 *
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *         - program
 *         - class
 *         - teacher
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated subject ID
 *         name:
 *           type: string
 *           description: Subject name
 *         program:
 *           type: string
 *           description: Program ID
 *         class:
 *           type: string
 *           description: Class ID
 *         category:
 *           type: string
 *           description: Subject category (e.g., Core, Elective)
 *         teacher:
 *           type: string
 *           description: Teacher ID
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         description:
 *           type: string
 * 
 * /api/programs:
 *   get:
 *     tags: [Programs]
 *     summary: Get all programs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all programs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Program'
 *   post:
 *     tags: [Programs]
 *     summary: Create a new program
 *     security:
 *       - bearerAuth: []
 *     description: Super Admin only
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Program'
 *     responses:
 *       201:
 *         description: Program created successfully
 *       403:
 *         description: Insufficient permissions
 * 
 * /api/programs/{id}:
 *   get:
 *     tags: [Programs]
 *     summary: Get a specific program
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
 *         description: Program details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Program'
 *   patch:
 *     tags: [Programs]
 *     summary: Update a program
 *     security:
 *       - bearerAuth: []
 *     description: Super Admin only
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
 *             $ref: '#/components/schemas/Program'
 *     responses:
 *       200:
 *         description: Program updated successfully
 *   delete:
 *     tags: [Programs]
 *     summary: Delete a program
 *     security:
 *       - bearerAuth: []
 *     description: Super Admin only
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Program deleted successfully
 * 
 * /api/programs/{id}/classes:
 *   get:
 *     tags: [Programs]
 *     summary: Get all classes for a program
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
 *         description: List of classes in the program
 *   post:
 *     tags: [Programs]
 *     summary: Add a class to a program
 *     security:
 *       - bearerAuth: []
 *     description: Admin or Super Admin only
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
 *               - name
 *               - academicYear
 *             properties:
 *               name:
 *                 type: string
 *               academicYear:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class added successfully
 * 
 * /api/subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: Get all subjects
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *   post:
 *     tags: [Subjects]
 *     summary: Create a new subject
 *     security:
 *       - bearerAuth: []
 *     description: Admin or Super Admin only
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subject'
 *     responses:
 *       201:
 *         description: Subject created successfully
 * 
 * /api/subjects/program/{programId}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get subjects by program
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subjects in the program
 * 
 * /api/subjects/class/{classId}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get subjects by class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subjects in the class
 * 
 * /api/subjects/{id}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get a specific subject
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
 *         description: Subject details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *   patch:
 *     tags: [Subjects]
 *     summary: Update a subject
 *     security:
 *       - bearerAuth: []
 *     description: Admin or Super Admin only
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
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               teacher:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *   delete:
 *     tags: [Subjects]
 *     summary: Delete a subject
 *     security:
 *       - bearerAuth: []
 *     description: Admin or Super Admin only
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 */