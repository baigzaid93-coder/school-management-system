const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Teacher = require('./models/Teacher');
    const User = require('./models/User');
    const Role = require('./models/Role');
    
    const teacherData = [
      { firstName: 'Muhammad', lastName: 'Ahmed', gender: 'Male', email: 'ahmed@school.edu' },
      { firstName: 'Fatima', lastName: 'Khan', gender: 'Female', email: 'fatima.khan@school.edu' },
      { firstName: 'Abdul', lastName: 'Rehman', gender: 'Male', email: 'rehman@school.edu' },
      { firstName: 'Ayesha', lastName: 'Malik', gender: 'Female', email: 'ayesha.malik@school.edu' },
      { firstName: 'Hassan', lastName: 'Ali', gender: 'Male', email: 'hassan.ali@school.edu' },
      { firstName: 'Zainab', lastName: 'Hussain', gender: 'Female', email: 'zainab@school.edu' },
      { firstName: 'Usman', lastName: 'Qureshi', gender: 'Male', email: 'usman@school.edu' },
      { firstName: 'Mariam', lastName: 'Siddiqui', gender: 'Female', email: 'mariam@school.edu' },
      { firstName: 'Ali', lastName: 'Raza', gender: 'Male', email: 'ali.raza@school.edu' },
      { firstName: 'Sara', lastName: 'Imran', gender: 'Female', email: 'sara.imran@school.edu' },
      { firstName: 'Bilal', lastName: 'Sheikh', gender: 'Male', email: 'bilal@school.edu' },
      { firstName: 'Hira', lastName: 'Nadeem', gender: 'Female', email: 'hira.nadeem@school.edu' },
      { firstName: 'Hamza', lastName: 'Tariq', gender: 'Male', email: 'hamza@school.edu' },
      { firstName: 'Nadia', lastName: 'Shahid', gender: 'Female', email: 'nadia@school.edu' },
      { firstName: 'Saad', lastName: 'Ahmed', gender: 'Male', email: 'saad.ahmed@school.edu' },
      { firstName: 'Kinza', lastName: 'Ali', gender: 'Female', email: 'kinza.ali@school.edu' },
      { firstName: 'Imran', lastName: 'Khan', gender: 'Male', email: 'imran.khan@school.edu' },
      { firstName: 'Sana', lastName: 'Bibi', gender: 'Female', email: 'sana.bibi@school.edu' },
      { firstName: 'Arham', lastName: 'Saeed', gender: 'Male', email: 'arham@school.edu' },
      { firstName: 'Maham', lastName: 'Zaidi', gender: 'Female', email: 'maham@school.edu' },
      { firstName: 'Fahad', lastName: 'Nasir', gender: 'Male', email: 'fahad.nasir@school.edu' },
      { firstName: 'Iqra', lastName: 'Amjad', gender: 'Female', email: 'iqra@school.edu' },
      { firstName: 'Danish', lastName: 'Mehmood', gender: 'Male', email: 'danish@school.edu' },
      { firstName: 'Aleena', lastName: 'Shahid', gender: 'Female', email: 'aleena.sha@school.edu' },
      { firstName: 'Rizwan', lastName: 'Akhtar', gender: 'Male', email: 'rizwan@school.edu' }
    ];
    
    const teacherRole = await Role.findOne({ code: 'TEACHER' });
    if (!teacherRole) {
      console.error('Teacher role not found!');
      process.exit(1);
    }
    
    let added = 0;
    for (let i = 0; i < teacherData.length; i++) {
      const data = teacherData[i];
      
      const existing = await Teacher.findOne({ email: data.email });
      if (existing) {
        console.log(`Skipped ${data.firstName} ${data.lastName} (already exists)`);
        continue;
      }
      
      const teacher = new Teacher({
        teacherId: `T${String(i + 1).padStart(3, '0')}`,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        email: data.email,
        phone: `0300${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        subjects: [],
        status: 'Active',
        dateOfJoining: new Date()
      });
      
      await teacher.save();
      
      const username = `${(data.firstName || 'teacher').toLowerCase()}.${(data.lastName || '').toLowerCase()}`;
      const existingUser = await User.findOne({ username });
      
      if (!existingUser) {
        const user = new User({
          username: username,
          email: data.email,
          password: 'teacher123',
          role: teacherRole._id,
          profile: {
            firstName: data.firstName,
            lastName: data.lastName
          }
        });
        await user.save();
        
        teacher.userId = user._id;
        await teacher.save();
      }
      
      added++;
      console.log(`Added: ${data.firstName} ${data.lastName} (${data.email})`);
    }
    
    console.log(`\nDone! Added ${added} new teachers.`);
    const totalTeachers = await Teacher.countDocuments({});
    console.log(`Total teachers in database: ${totalTeachers}`);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
