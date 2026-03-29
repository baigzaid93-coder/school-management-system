# School Management System

A full-featured MERN (MongoDB, Express, React, Node.js) school management system.

## Features

- **Dashboard** - Overview of school statistics and recent activity
- **Student Management** - Add, edit, delete, and search students
- **Teacher Management** - Manage teacher profiles and subjects
- **Course Management** - Create and manage courses/classes
- **Grade Management** - Record and track student grades
- **Attendance Tracking** - Mark and track student attendance
- **Fee Management** - Manage fees, payments, and billing

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

## Setup Instructions

### 1. Clone and Navigate
```bash
cd school-management-system
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Database
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school_management
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/school_management
```

### 5. Start MongoDB
Make sure MongoDB is running locally or you have your Atlas connection string ready.

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Grades
- `GET /api/grades` - Get all grades
- `POST /api/grades` - Create grade
- `PUT /api/grades/:id` - Update grade
- `DELETE /api/grades/:id` - Delete grade
- `GET /api/grades/student/:id` - Get grades by student
- `GET /api/grades/course/:id` - Get grades by course

### Attendance
- `GET /api/attendance` - Get all attendance
- `POST /api/attendance/mark` - Mark single attendance
- `POST /api/attendance/bulk` - Bulk mark attendance
- `GET /api/attendance/stats` - Get attendance statistics

### Fees
- `GET /api/fees` - Get all fees
- `POST /api/fees` - Create fee
- `POST /api/fees/:id/payment` - Record payment
- `GET /api/fees/summary` - Get fee summary

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/monthly` - Get monthly statistics

## Project Structure

```
school-management-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## License

MIT
