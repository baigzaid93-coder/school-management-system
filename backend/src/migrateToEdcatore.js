const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');

    const School = require('./models/School');
    const User = require('./models/User');
    const Role = require('./models/Role');
    const Student = require('./models/Student');
    const Teacher = require('./models/Teacher');
    const Parent = require('./models/Parent');
    const ClassGrade = require('./models/ClassGrade');
    const Subject = require('./models/Subject');
    const Fee = require('./models/Fee');
    const Attendance = require('./models/Attendance');

    // Check if school already exists
    let school = await School.findOne({ code: 'EDCATORE' });
    
    if (school) {
      console.log('School Edcatore already exists with ID:', school._id);
    } else {
      // Create Edcatore school
      school = new School({
        name: 'Edcatore',
        code: 'EDCATORE',
        email: 'info@edcatore.com',
        phone: '0300-1234567',
        address: {
          street: 'Education Street',
          city: 'Karachi',
          country: 'Pakistan'
        },
        modules: [
          'student', 'teacher', 'attendance', 'fees', 'exams', 
          'grades', 'reports', 'timetable', 'subjects', 'classes',
          'expenses'
        ],
        subscription: {
          plan: 'Enterprise',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'Active',
          maxStudents: -1,
          maxTeachers: -1,
          price: 50000,
          billingCycle: 'Yearly'
        },
        isActive: true,
        isVerified: true
      });
      await school.save();
      console.log('Created school: Edcatore with ID:', school._id);
    }

    const schoolId = school._id;

    // Create Super Admin role if not exists
    let superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN' });
    if (!superAdminRole) {
      superAdminRole = new Role({
        name: 'Super Admin',
        code: 'SUPER_ADMIN',
        description: 'Full system access for SaaS platform management',
        permissions: ['*'],
        isSystem: true
      });
      await superAdminRole.save();
      console.log('Created Super Admin role');
    }

    // Create School Admin role if not exists
    let schoolAdminRole = await Role.findOne({ code: 'SCHOOL_ADMIN' });
    if (!schoolAdminRole) {
      schoolAdminRole = new Role({
        name: 'School Admin',
        code: 'SCHOOL_ADMIN',
        description: 'Full access within their school',
        permissions: ['*'],
        isSystem: true
      });
      await schoolAdminRole.save();
      console.log('Created School Admin role');
    }

    // Create Super Admin user for SaaS platform
    let superAdmin = await User.findOne({ email: 'superadmin@edcatore.com' });
    if (!superAdmin) {
      superAdmin = new User({
        username: 'superadmin',
        email: 'superadmin@edcatore.com',
        password: 'superadmin123',
        role: superAdminRole._id,
        isSuperAdmin: true,
        isActive: true,
        profile: {
          firstName: 'Super',
          lastName: 'Admin'
        }
      });
      await superAdmin.save();
      console.log('Created Super Admin user: superadmin@edcatore.com / superadmin123');
    }

    // Create School Admin user for Edcatore
    let schoolAdmin = await User.findOne({ email: 'admin@edcatore.com' });
    if (!schoolAdmin) {
      schoolAdmin = new User({
        username: 'admin.edcatore',
        email: 'admin@edcatore.com',
        password: 'schooladmin123',
        role: schoolAdminRole._id,
        school: schoolId,
        isSchoolAdmin: true,
        isActive: true,
        profile: {
          firstName: 'Edcatore',
          lastName: 'Admin'
        }
      });
      await schoolAdmin.save();
      console.log('Created School Admin user: admin@edcatore.com / schooladmin123');
      school.adminUser = schoolAdmin._id;
      await school.save();
    }

    console.log('\n--- Migrating existing data to Edcatore ---\n');

    // Update all Students
    const studentsUpdated = await Student.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${studentsUpdated.modifiedCount} students`);

    // Update all Teachers
    const teachersUpdated = await Teacher.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${teachersUpdated.modifiedCount} teachers`);

    // Update all Parents
    const parentsUpdated = await Parent.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${parentsUpdated.modifiedCount} parents`);

    // Update all Class Grades
    const classesUpdated = await ClassGrade.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${classesUpdated.modifiedCount} class grades`);

    // Update all Subjects
    const subjectsUpdated = await Subject.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${subjectsUpdated.modifiedCount} subjects`);

    // Update all Fees
    const feesUpdated = await Fee.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${feesUpdated.modifiedCount} fees`);

    // Update all Attendances
    const attendanceUpdated = await Attendance.updateMany(
      { school: { $exists: false } },
      { school: schoolId }
    );
    console.log(`Updated ${attendanceUpdated.modifiedCount} attendances`);

    console.log('\n--- Summary ---');
    console.log('School: Edcatore');
    console.log('School ID:', schoolId);
    console.log('\nLogin Credentials:');
    console.log('Super Admin: superadmin@edcatore.com / superadmin123');
    console.log('School Admin: admin@edcatore.com / schooladmin123');

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
