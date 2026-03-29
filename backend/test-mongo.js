const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/school_management', {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('Connected successfully');
  mongoose.connection.close();
})
.catch(err => {
  console.error('Connection failed:', err.message);
});
