const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const AcademicYear = require('./models/AcademicYear');
    
    let year = await AcademicYear.findOne({});
    
    if (!year) {
      year = new AcademicYear({
        name: '2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isCurrent: true
      });
      await year.save();
      console.log('Created academic year: 2026');
    } else {
      console.log('Found academic year:', year.name);
    }
    
    console.log('Academic Year ID:', year._id.toString());
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
