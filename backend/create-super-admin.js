const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Role = require('./src/models/Role');
    const User = require('./src/models/User');

    const role = await Role.findOne({ code: 'SUPER_ADMIN' });
    if (!role) {
      console.log('Super Admin role not found. Please restart the backend server first.');
      process.exit(1);
    }

    const existing = await User.findOne({ email: 's.admin@school.com' });
    if (existing) {
      console.log('User s.admin@school.com already exists');
    } else {
      const user = new User({
        username: 's.admin',
        email: 's.admin@school.com',
        password: 'Jan1993!',
        role: role._id,
        profile: {
          firstName: 'Super',
          lastName: 'Admin'
        },
        isActive: true
      });

      await user.save();
      console.log('Super Admin created successfully!');
      console.log('Email: s.admin@school.com');
      console.log('Password: Jan1993!');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createSuperAdmin();
