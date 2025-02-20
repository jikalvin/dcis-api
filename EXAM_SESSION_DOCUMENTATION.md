# Exam Session Documentation

## Overview
The exam session system has been updated to support:
- Two sets of marks per student
- Time limits for mark submissions
- Remarks-based evaluation for creche and kindergarten students
- Automatic closing of mark submissions after deadlines
- Administrative control over reopening closed sessions

## Key Features

### 1. Dual Mark Entry System
- Each student can have two sets of marks/remarks per subject
- Each set has its own submission deadline
- Both sets can be entered simultaneously or separately

### 2. Time Management
- `startDate`: Beginning of exam session
- `endDate`: End of exam session
- `firstMarksDeadline`: Deadline for first set of marks
- `secondMarksDeadline`: Deadline for second set of marks
- `publicationDateTime`: When results should be published

### 3. Creche and Kindergarten Support
- Students in creche and kindergarten receive remarks instead of numerical marks
- System automatically validates appropriate entry type based on student's level
- Remarks are required for creche/kindergarten students

### 4. Session Status Control
The exam session can be in one of four states:
- `draft`: Initial setup phase
- `active`: Open for mark/remark entry
- `closed`: Submissions are closed
- `published`: Results are published

### 5. Administrative Controls
- Only admin or superadmin can reopen a closed session
- Reopening is tracked with `reopenedBy` and `reopenedAt`
- All modifications are tracked with `lastModifiedBy` and `lastModifiedAt`

## Data Structure

### Mark Entry Schema
```javascript
{
  student: ObjectId,
  subject: ObjectId,
  firstEntry: {
    score: Number,      // For non-kindergarten/creche
    remarks: String,    // For kindergarten/creche
    submittedBy: ObjectId,
    submittedAt: Date
  },
  secondEntry: {
    score: Number,      // For non-kindergarten/creche
    remarks: String,    // For kindergarten/creche
    submittedBy: ObjectId,
    submittedAt: Date
  },
  isRemarkRequired: Boolean
}
```

## Usage Guidelines

### 1. Creating an Exam Session
When creating a new exam session, ensure to set:
- Term and session information
- Start and end dates
- Deadlines for both sets of marks
- Publication date and time

### 2. Managing Mark Entries
- Teachers can enter marks/remarks until respective deadlines
- System automatically validates entry type based on student level
- Both sets of marks can be entered independently

### 3. Session Closure
- Sessions automatically close after both deadlines pass
- Results are automatically published at publicationDateTime
- Admin/superadmin can reopen closed sessions if needed

### 4. Best Practices
- Set reasonable time gaps between deadlines
- Ensure publication date is after all deadlines
- Use the reminder frequency feature to notify teachers of approaching deadlines