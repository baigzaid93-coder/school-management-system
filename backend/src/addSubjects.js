const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Subject = require('./models/Subject');
    const ClassGrade = require('./models/ClassGrade');
    
    const classes = await ClassGrade.find({});
    console.log(`Found ${classes.length} classes`);
    
    const subjectTemplates = [
      { name: 'English', code: 'ENG', type: 'Theory', description: 'English Language and Literature', isCompulsory: true, theoryHoursPerWeek: 5 },
      { name: 'Mathematics', code: 'MATH', type: 'Theory', description: 'Basic Mathematics', isCompulsory: true, theoryHoursPerWeek: 5 },
      { name: 'Science', code: 'SCI', type: 'Theory', description: 'General Science', isCompulsory: true, theoryHoursPerWeek: 4 },
      { name: 'Urdu', code: 'URD', type: 'Theory', description: 'Urdu Language', isCompulsory: true, theoryHoursPerWeek: 5 },
      { name: 'Islamiyat', code: 'ISL', type: 'Theory', description: 'Islamic Studies', isCompulsory: true, theoryHoursPerWeek: 3 }
    ];
    
    for (const cls of classes) {
      console.log(`\nAdding subjects to ${cls.name}...`);
      
      for (const template of subjectTemplates) {
        const code = `${template.code}-${cls.code}`;
        
        const existing = await Subject.findOne({ code });
        if (existing) {
          console.log(`  ${template.name} (${code}) already exists`);
          continue;
        }
        
        const subject = new Subject({
          name: template.name,
          code: code,
          type: template.type,
          description: template.description,
          isCompulsory: template.isCompulsory,
          theoryHoursPerWeek: template.theoryHoursPerWeek,
          classGrades: [cls._id],
          isActive: true
        });
        
        await subject.save();
        console.log(`  Added: ${template.name} (${code})`);
      }
    }
    
    console.log('\nDone!');
    const totalSubjects = await Subject.countDocuments({});
    console.log(`Total subjects in database: ${totalSubjects}`);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
