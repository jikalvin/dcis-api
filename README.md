# School Management System API

## Overview
This is a RESTful API for a school management system built with Express.js and MongoDB. The system supports multiple user roles (Super Admin, Admin, Teacher, Parent) and provides comprehensive functionality for managing a school's operations.

## Features

### Authentication
- Role-based authentication system
- 2FA for Super Admin login
- Secure password management
- Email verification system

### User Management
- Super Admin management
- Administrator management
- Teacher management
- Parent management
- Student management

### Academic Management
- Class management
- Subject management
- Student attendance tracking
- Performance tracking (Exams & Homework)
- Schedule management

### Program Structure
- Creche (Creche-Daycare)
- Kindergarten (K1, K2)
- Primary (Grade 1-6)
- Secondary (Year 7-11)
- High School (Year 12-13)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_HOST=your_email_host
   EMAIL_PORT=your_email_port
   EMAIL_USERNAME=your_email_username
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=your_sender_email
   DEFAULT_ADMIN_EMAIL=default_super_admin_email
   DEFAULT_ADMIN_PASSWORD=default_super_admin_password
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Super Admin Routes

#### Authentication
- POST /api/superadmin/login - Login with institution ID
- POST /api/superadmin/verify-login - Verify 2FA code
- POST /api/superadmin/verify-account - Verify account
- POST /api/superadmin/resend-code - Resend verification code

#### Class Management
- GET /api/class - Get all classes
- GET /api/class/:id - Get specific class
- POST /api/class - Create new class
- POST /api/class/:id/students - Add student to class
- POST /api/class/:id/subjects - Add subject to class
- PUT /api/class/:id/schedule - Update class schedule
- GET /api/class/:id/schedule - Get class schedule

#### User Management
- GET /api/admin - Get all administrators
- POST /api/admin - Add new administrator
- GET /api/teacher - Get all teachers
- POST /api/teacher - Add new teacher
- GET /api/parent - Get all parents
- POST /api/parent - Add new parent

#### Settings
- GET /api/settings - Get system settings
- PUT /api/settings/email - Update email settings
- PUT /api/settings/academic-year - Update academic year
- PUT /api/settings/change-password - Change super admin password
- GET /api/settings/audit-logs - Get system audit logs

## Security
- JWT-based authentication
- Password hashing
- Role-based authorization
- Two-factor authentication for Super Admin
- Input validation
- Error handling

## Future Improvements
- Implement audit logging system
- Add file upload validation
- Implement rate limiting
- Add API documentation using Swagger
- Add test coverage
- Implement caching system