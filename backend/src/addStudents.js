const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Student = require('./models/Student');
    const User = require('./models/User');
    const Role = require('./models/Role');
    const ClassGrade = require('./models/ClassGrade');
    const Fee = require('./models/Fee');
    
    const classes = await ClassGrade.find({}).sort({ level: 1 });
    console.log(`Found ${classes.length} classes`);
    
    const studentNames = [
      'Ahmed', 'Fatima', 'Ali', 'Ayesha', 'Hassan', 'Zainab', 'Usman', 'Mariam',
      'Abdul', 'Sara', 'Bilal', 'Hira', 'Hamza', 'Nadia', 'Saad', 'Kinza',
      'Imran', 'Sana', 'Arham', 'Maham', 'Fahad', 'Iqra', 'Danish', 'Aleena', 'Rizwan'
    ];
    
    const studentRole = await Role.findOne({ code: 'STUDENT' });
    if (!studentRole) {
      console.error('Student role not found!');
      process.exit(1);
    }
    
    let totalStudents = 0;
    let totalFees = 0;
    
    for (const cls of classes) {
      const baseFee = 13200;
      const classIncrement = 2000;
      const classIndex = classes.findIndex(c => c._id.toString() === cls._id.toString());
      const classFee = baseFee + (classIndex * classIncrement);
      
      console.log(`\nClass ${cls.name} (Fee: PKR ${classFee.toLocaleString()})`);
      
      for (let i = 0; i < 25; i++) {
        const firstName = studentNames[i];
        const lastName = `${cls.name}${String(i + 1).padStart(2, '0')}`;
        
        const existingStudent = await Student.findOne({ 
          firstName, 
          lastName: { $regex: lastName } 
        });
        
        if (existingStudent) {
          console.log(`  Skipped ${firstName} ${lastName} (exists)`);
          continue;
        }
        
        const student = new Student({
          studentId: `${cls.code}-${String(i + 1).padStart(3, '0')}`,
          firstName: firstName || 'Student',
          lastName: lastName || `Number${i}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          dateOfBirth: `20${String(14 + (i % 5)).padStart(2, '0')}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
          email: `${(firstName || 'student').toLowerCase()}.${(lastName || i).toLowerCase()}@student.edu`,
          phone: `0300${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          classGrade: cls._id,
          status: 'Active',
          dateOfAdmission: new Date()
        });
        
        await student.save();
        
        const username = `${(firstName || 'student').toLowerCase()}.${(lastName || i).toLowerCase()}`;
        const existingUser = await User.findOne({ username });
        
        if (!existingUser) {
          const user = new User({
            username: username,
            email: student.email,
            password: 'student123',
            role: studentRole._id,
            profile: {
              firstName: firstName,
              lastName: lastName
            }
          });
          await user.save();
          
          student.userId = user._id;
          await student.save();
        }
        
        const fee = new Fee({
          student: student._id,
          classGrade: cls._id,
          feeType: 'Tuition',
          amount: classFee,
          paidAmount: 0,
          dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10),
          status: 'Pending',
          description: `Annual tuition fee for ${cls.name}`
        });
        
        await fee.save();
        
        console.log(`  Added: ${firstName} ${lastName} - Fee: PKR ${classFee.toLocaleString()}`);
        totalStudents++;
        totalFees += classFee;
      }
    }
    
    console.log(`\n========================================`);
    console.log(`Done!`);
    console.log(`Total students added: ${totalStudents}`);
    console.log(`Total fee records: ${totalStudents}`);
    console.log(`Total fee value: PKR ${totalFees.toLocaleString()}`);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
