const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      process.env.RENDER_EXTERNAL_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin) || isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management', {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('MongoDB connected successfully');
    const { seedRoles } = require('./controllers/roleController');
    await seedRoles();
    
    // Drop old attendance indexes
    try {
      const db = mongoose.connection.db;
      const indexes = await db.collection('attendances').indexes();
      console.log('Current indexes:', indexes.map(i => i.name));
      
      for (const idx of indexes) {
        if (idx.name === 'student_1_date_1' || idx.name === 'student_1_date_1') {
          await db.collection('attendances').dropIndex(idx.name);
          console.log('Dropped index:', idx.name);
        }
      }
    } catch (e) {
      console.log('Index cleanup skipped:', e.message);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));

app.use('/api/settings/school', require('./routes/schoolProfileRoutes'));
app.use('/api/settings/branches', require('./routes/branchRoutes'));
app.use('/api/settings/academic-years', require('./routes/academicYearRoutes'));
app.use('/api/settings/terms', require('./routes/termRoutes'));
app.use('/api/settings/classes', require('./routes/classGradeRoutes'));
app.use('/api/settings/sections', require('./routes/sectionRoutes'));
app.use('/api/settings/subjects', require('./routes/subjectRoutes'));
app.use('/api/settings/departments', require('./routes/departmentRoutes'));
app.use('/api/settings/staff-roles', require('./routes/staffRoleRoutes'));
app.use('/api/settings/fee-heads', require('./routes/feeHeadRoutes'));
app.use('/api/settings/exam-types', require('./routes/examTypeRoutes'));

app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/parents', require('./routes/parentRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/class-grades', require('./routes/classGradeRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/marks', require('./routes/markRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/report-templates', require('./routes/reportTemplateRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use('/api/letter-head', require('./routes/letterHeadRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/discipline', require('./routes/disciplineRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/bulk-upload', require('./routes/bulkUploadRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Serve static frontend files in production (before API routes)
if (isProduction) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for frontend in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'School Management System API is running' });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
