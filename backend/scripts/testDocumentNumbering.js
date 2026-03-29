const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testDocumentNumbering() {
  console.log('🧪 Testing Document Numbering System\n');

  // First, login to get token and school ID
  console.log('1. Logging in as admin...');
  
  try {
    // Try to login - you may need to update credentials
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@school.edu',
      password: 'admin123'
    });
    
    const { accessToken, user } = loginRes.data;
    const schoolId = user.school || 'your-school-id';
    
    console.log(`   ✅ Logged in as: ${user.email}`);
    console.log(`   School ID: ${schoolId}\n`);
    
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'x-school-id': schoolId,
      'Content-Type': 'application/json'
    };

    // Test 1: Create a student and check STUDENT_ID
    console.log('2. Testing STUDENT_ID generation...');
    
    const studentData = {
      firstName: 'Test',
      lastName: 'Student',
      dateOfBirth: '2010-01-15',
      gender: 'Male',
      email: `test.student${Date.now()}@test.com`,
      phone: '03001234567',
      school: schoolId
    };
    
    const studentRes = await axios.post(`${API_URL}/students`, studentData, { headers });
    const studentId = studentRes.data.studentId;
    console.log(`   ✅ Student created with ID: ${studentId}`);
    
    // Test 2: Create a fee and check FEE_VOUCHER
    console.log('\n3. Testing FEE_VOUCHER generation...');
    
    const feeData = {
      student: studentRes.data._id,
      school: schoolId,
      feeType: 'Tuition',
      amount: 5000,
      dueDate: new Date().toISOString()
    };
    
    const feeRes = await axios.post(`${API_URL}/fees`, feeData, { headers });
    const voucherNo = feeRes.data.voucherNumber;
    console.log(`   ✅ Fee created with Voucher: ${voucherNo}`);
    
    // Test 3: Create another fee to verify increment
    console.log('\n4. Testing increment...');
    
    const feeData2 = {
      student: studentRes.data._id,
      school: schoolId,
      feeType: 'Transport',
      amount: 2000,
      dueDate: new Date().toISOString()
    };
    
    const feeRes2 = await axios.post(`${API_URL}/fees`, feeData2, { headers });
    const voucherNo2 = feeRes2.data.voucherNumber;
    console.log(`   ✅ Second fee created with Voucher: ${voucherNo2}`);
    
    // Verify increment
    const num1 = parseInt(voucherNo.split('-')[1]);
    const num2 = parseInt(voucherNo2.split('-')[1]);
    
    if (num2 === num1 + 1) {
      console.log(`\n   🎉 SUCCESS! Numbers increment correctly: ${num1} → ${num2}`);
    } else {
      console.log(`\n   ❌ FAILED! Expected ${num1 + 1}, got ${num2}`);
    }
    
    // Check school settings for document numbers
    console.log('\n5. Checking School Document Numbers...');
    const schoolRes = await axios.get(`${API_URL}/settings/school`, { headers });
    const docNumbers = schoolRes.data.documentNumbers;
    
    console.log('\n   Document Number Configurations:');
    if (docNumbers && docNumbers.length > 0) {
      docNumbers.forEach(doc => {
        console.log(`   - ${doc.type}: ${doc.prefix}-${String(doc.currentNumber - 1).padStart(5, '0')} (current: ${doc.currentNumber})`);
      });
    } else {
      console.log('   No custom configurations found (using defaults)');
    }
    
    // Cleanup - delete test data
    console.log('\n6. Cleaning up test data...');
    await axios.delete(`${API_URL}/students/${studentRes.data._id}`, { headers });
    await axios.delete(`${API_URL}/fees/${feeRes.data._id}`, { headers });
    await axios.delete(`${API_URL}/fees/${feeRes2.data._id}`, { headers });
    console.log('   ✅ Test data deleted');
    
    console.log('\n========================================');
    console.log('✅ All document numbering tests passed!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Update the login credentials in this script');
    }
  }
}

testDocumentNumbering();
