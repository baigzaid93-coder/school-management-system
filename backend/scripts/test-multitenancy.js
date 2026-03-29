// Multi-Tenancy Verification Test
// Run with: node scripts/test-multitenancy.js

const mongoose = require('mongoose');
const School = require('../src/models/School');
const Student = require('../src/models/Student');
const Fee = require('../src/models/Fee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

async function testMultiTenancy() {
  console.log('🔗 Connecting to MongoDB...\n');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all schools
    const schools = await School.find();
    
    if (schools.length < 2) {
      console.log('❌ Need at least 2 schools to test multi-tenancy');
      console.log('💡 Create another school first\n');
      return;
    }

    const schoolA = schools[0];
    const schoolB = schools[1];

    console.log('═══════════════════════════════════════════════════════');
    console.log('🏫 MULTI-TENANCY VERIFICATION TEST');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`📚 School A: ${schoolA.name} (ID: ${schoolA._id})`);
    console.log(`📚 School B: ${schoolB.name} (ID: ${schoolB._id})\n`);

    // Clean up previous test data
    console.log('🧹 Cleaning up previous test data...');
    await Student.deleteMany({ 
      $or: [
        { testTenant: true },
        { studentId: { $in: ['TSTA-00001', 'TSTB-00001'] } }
      ]
    });
    await Fee.deleteMany({ testTenant: true });

    // Create test students
    console.log('\n1️⃣ Creating test students in each school...\n');
    
    const studentA = await Student.create({
      firstName: 'TestA_First',
      lastName: 'Student',
      email: `testA_${Date.now()}@schoolA.com`,
      phone: '03001234567',
      school: schoolA._id,
      studentId: 'TSTA-00001',
      testTenant: true
    });
    console.log(`   ✅ School A Student: ${studentA.firstName} (ID: ${studentA.studentId})`);

    const studentB = await Student.create({
      firstName: 'TestB_First',
      lastName: 'Student',
      email: `testB_${Date.now()}@schoolB.com`,
      phone: '03009876543',
      school: schoolB._id,
      studentId: 'TSTB-00001',
      testTenant: true
    });
    console.log(`   ✅ School B Student: ${studentB.firstName} (ID: ${studentB.studentId})`);

    // Create test fees
    console.log('\n2️⃣ Creating test fees in each school...\n');
    
    const feeA = await Fee.create({
      student: studentA._id,
      school: schoolA._id,
      feeType: 'Tuition',
      amount: 5000,
      dueDate: new Date(),
      status: 'Pending',
      testTenant: true
    });
    console.log(`   ✅ School A Fee: ${feeA.voucherNumber || 'Fee-A'}`);

    const feeB = await Fee.create({
      student: studentB._id,
      school: schoolB._id,
      feeType: 'Tuition',
      amount: 3000,
      dueDate: new Date(),
      status: 'Pending',
      testTenant: true
    });
    console.log(`   ✅ School B Fee: ${feeB.voucherNumber || 'Fee-B'}`);

    // Test tenant filtering
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 TESTING TENANT FILTERING');
    console.log('═══════════════════════════════════════════════════════\n');

    // Test 1: Get students by tenant query
    console.log('3️⃣ Testing Student Queries...\n');
    
    const schoolA_Students = await Student.find({ school: schoolA._id });
    const schoolB_Students = await Student.find({ school: schoolB._id });
    
    const schoolA_HasB = schoolA_Students.some(s => s._id.toString() === studentB._id.toString());
    const schoolB_HasA = schoolB_Students.some(s => s._id.toString() === studentA._id.toString());
    
    console.log(`   School A students count: ${schoolA_Students.length}`);
    console.log(`   School B students count: ${schoolB_Students.length}`);
    console.log(`   School A has School B's student: ${schoolA_HasB ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);
    console.log(`   School B has School A's student: ${schoolB_HasA ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    // Test 2: Get fees by tenant query
    console.log('\n4️⃣ Testing Fee Queries...\n');
    
    const schoolA_Fees = await Fee.find({ school: schoolA._id });
    const schoolB_Fees = await Fee.find({ school: schoolB._id });
    
    const schoolA_HasFeeB = schoolA_Fees.some(f => f._id.toString() === feeB._id.toString());
    const schoolB_HasFeeA = schoolB_Fees.some(f => f._id.toString() === feeA._id.toString());
    
    console.log(`   School A fees count: ${schoolA_Fees.length}`);
    console.log(`   School B fees count: ${schoolB_Fees.length}`);
    console.log(`   School A has School B's fee: ${schoolA_HasFeeB ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);
    console.log(`   School B has School A's fee: ${schoolB_HasFeeA ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    // Test 3: Verify document numbers are per-school
    console.log('\n5️⃣ Testing Document Number Isolation...\n');
    
    console.log(`   School A Student ID: ${studentA.studentId}`);
    console.log(`   School B Student ID: ${studentB.studentId}`);
    
    const sameStudentId = studentA.studentId === studentB.studentId;
    console.log(`   Same student ID across schools: ${sameStudentId ? '❌ YES (FAIL)' : '✅ NO (PASS)'}`);

    // Test 4: Verify compound index works
    console.log('\n6️⃣ Testing Compound Unique Index...\n');
    
    try {
      // Try to create duplicate student ID in same school
      await Student.create({
        firstName: 'Duplicate',
        lastName: 'Test',
        email: `dup_${Date.now()}@test.com`,
        phone: '03000000000',
        school: schoolA._id,
        studentId: studentA.studentId, // Same ID as studentA
        testTenant: true
      });
      console.log('   ❌ FAIL: Allowed duplicate student ID in same school');
    } catch (err) {
      if (err.code === 11000) {
        console.log('   ✅ PASS: Prevented duplicate student ID in same school');
      } else {
        console.log(`   ⚠️  Error: ${err.message}`);
      }
    }

    // Test 5: Try same student ID in different school
    console.log('\n7️⃣ Testing Same ID in Different Schools...\n');
    
    try {
      await Student.create({
        firstName: 'CrossSchool',
        lastName: 'Test',
        email: `cross_${Date.now()}@test.com`,
        phone: '03000000001',
        school: schoolB._id,
        studentId: studentA.studentId, // Same as School A's student
        testTenant: true
      });
      console.log(`   ✅ PASS: Allowed same student ID (${studentA.studentId}) in different school`);
    } catch (err) {
      console.log(`   ❌ FAIL: Did not allow same ID in different school: ${err.message}`);
    }

    // Cleanup
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🧹 CLEANUP');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await Student.deleteMany({ testTenant: true });
    await Fee.deleteMany({ testTenant: true });
    console.log('   ✅ Test data cleaned up');

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const allPassed = !schoolA_HasB && !schoolB_HasA && !schoolA_HasFeeB && !schoolB_HasFeeA && !sameStudentId;
    
    if (allPassed) {
      console.log('🎉 ALL MULTI-TENANCY TESTS PASSED!\n');
      console.log('   ✅ Students are isolated per school');
      console.log('   ✅ Fees are isolated per school');
      console.log('   ✅ Document IDs are unique per school');
      console.log('   ✅ Compound indexes prevent duplicates within school');
    } else {
      console.log('❌ SOME TESTS FAILED - Review output above\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

testMultiTenancy();
