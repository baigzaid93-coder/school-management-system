// Simple test to verify document numbering in MongoDB
// Run with: node test-mongodb.js

const mongoose = require('mongoose');
const { getNextDocumentNumber } = require('../src/utils/documentNumberGenerator');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testMongo() {
  console.log('🔗 Connecting to MongoDB...\n');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get a school ID from the database
    const School = require('../src/models/School');
    const schools = await School.find().limit(1);
    
    if (schools.length === 0) {
      console.log('❌ No schools found in database');
      console.log('💡 Create a school first, then run this test\n');
      return;
    }
    
    const schoolId = schools[0]._id;
    console.log(`📚 Testing with School: ${schools[0].name}`);
    console.log(`   School ID: ${schoolId}\n`);
    
    // Test document numbering
    console.log('🧪 Testing Document Number Generation:\n');
    
    const docTypes = ['FEE_VOUCHER', 'EXPENSE_VOUCHER', 'STUDENT_ID', 'TEACHER_ID', 'STAFF_ID'];
    
    for (const docType of docTypes) {
      console.log(`   Testing ${docType}...`);
      
      const num1 = await getNextDocumentNumber(schoolId, docType);
      const num2 = await getNextDocumentNumber(schoolId, docType);
      const num3 = await getNextDocumentNumber(schoolId, docType);
      
      console.log(`   ✅ Generated: ${num1}, ${num2}, ${num3}`);
    }
    
    // Show current state
    console.log('\n📋 Current School Document Numbers:');
    const updatedSchool = await School.findById(schoolId);
    console.log(JSON.stringify(updatedSchool.documentNumbers, null, 2));
    
    console.log('\n========================================');
    console.log('✅ Document Numbering Test Complete!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

testMongo();
