const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Subject = require('./models/Subject');
    const Teacher = require('./models/Teacher');
    const ClassGrade = require('./models/ClassGrade');
    
    const teachers = await Teacher.find({}).sort({ firstName: 1 });
    const classes = await ClassGrade.find({}).sort({ level: 1 });
    
    console.log(`Found ${teachers.length} teachers`);
    console.log(`Found ${classes.length} classes`);
    
    let updated = 0;
    let teacherIndex = 0;
    
    for (const cls of classes) {
      console.log(`\nClass: ${cls.name}`);
      
      const subjects = await Subject.find({ classGrades: cls._id });
      
      for (const subject of subjects) {
        const oldName = subject.name.split(' - ')[0];
        
        subject.name = `${oldName} - ${cls.name}`;
        subject.code = `${cls.code}-${oldName.replace(/\s+/g, '')}`;
        
        const teacher = teachers[teacherIndex];
        subject.teachers = [teacher._id];
        
        await subject.save();
        
        console.log(`  ${subject.name} → Teacher: ${teacher.firstName} ${teacher.lastName}`);
        
        teacherIndex++;
        updated++;
      }
    }
    
    console.log(`\n========================================`);
    console.log(`Done! Updated ${updated} subjects with unique teachers.`);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
