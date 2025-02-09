# School Management System API Documentation

The School Management System API provides comprehensive endpoints for managing school operations, including authentication, teacher dashboard, and parent dashboard functionalities.

## Authentication Flow

The system implements a secure Two-Factor Authentication (2FA) process:

1. User enters their institution identifier (format: DCIS[year][program][digits])
2. System sends a verification code to the user's registered email
3. User provides the verification code and password to complete login
4. Session token (JWT) is issued upon successful authentication

## Teacher Dashboard

Teachers can:
- View their timetable
- Manage exam sessions
- Submit and edit marks
- Mark attendance
- Upload assignments
- Manage disciplinary records
- Chat with other users

## Parent Dashboard

Parents can:
- View their children's records (report cards, schedules, attendance)
- Open support tickets
- Make payments for fees and services
- Chat with teachers and staff

## API Documentation

Full API documentation is available at `/api-docs` when running the application. The documentation is powered by Swagger/OpenAPI 3.0 and provides interactive documentation for all available endpoints.

## Security

- All endpoints (except authentication) require JWT authentication
- Sessions are managed using JWTs with configurable expiration
- 2FA is required for all user logins
- Passwords are hashed using bcrypt
- Role-based access control is implemented for all routes