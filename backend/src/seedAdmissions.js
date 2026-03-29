const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_management';

const Student = require('./models/Student');
const User = require('./models/User');
const Role = require('./models/Role');
const School = require('./models/School');
const { generateStudentId } = require('./utils/idGenerator');

const samplePhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=';

const sampleAdmissions = [
  {
    firstName: 'Ahmed',
    lastName: 'Khan',
    dateOfBirth: new Date('2015-03-15'),
    gender: 'Male',
    email: 'ahmed.khan@email.com',
    phone: '0300-1234567',
    parentName: 'Muhammad Khan',
    parentPhone: '0301-2345678',
    parentEmail: 'muhammad.khan@email.com',
    admissionStatus: 'Pending',
    admissionForm: {
      fullNameUrdu: 'احمد خان',
      placeOfBirth: 'Lahore',
      nationality: 'Pakistani',
      religion: 'Islam',
      bloodGroup: 'A+',
      birthCertNo: '35202-1234567-8',
      photo: samplePhoto,
      father: {
        fullName: 'Muhammad Khan',
        cnic: '35202-1234567-8',
        qualification: 'Bachelor',
        occupation: 'Business',
        organization: 'Khan Traders',
        monthlyIncome: '150000',
        mobile: '0301-2345678',
        whatsapp: '0301-2345678',
        email: 'muhammad.khan@email.com'
      },
      mother: {
        fullName: 'Fatima Khan',
        cnic: '35202-8765432-1',
        qualification: 'Masters',
        occupation: 'Teacher',
        mobile: '0302-3456789',
        email: 'fatima.khan@email.com'
      },
      guardian: {
        fullName: '',
        relation: '',
        cnic: '',
        mobile: '',
        address: ''
      },
      currentAddress: {
        houseNo: 'House # 45',
        area: 'Model Town',
        city: 'Lahore',
        postalCode: '54000'
      },
      permanentAddress: {
        houseNo: 'House # 45',
        area: 'Model Town',
        city: 'Lahore',
        postalCode: '54000'
      },
      sameAddress: true,
      academic: {
        previousSchool: '',
        previousClass: '',
        lastResult: '',
        reasonForLeaving: '',
        leavingCertificate: false
      },
      medical: {
        diseaseAllergy: 'None',
        physicalDisability: 'None',
        emergencyNotes: '',
        doctorName: 'Dr. Ali',
        emergencyContact: '0303-4567890'
      },
      transport: {
        required: true,
        pickUpAddress: 'Model Town, Lahore',
        dropOffAddress: 'Model Town, Lahore',
        routeArea: 'Model Town'
      },
      hostel: {
        required: false,
        guardianName: '',
        guardianContact: ''
      },
      sibling: {
        hasSibling: false,
        siblings: []
      },
      fee: {
        admissionFee: '10000',
        securityFee: '5000',
        monthlyTuitionFee: '5000',
        transportFee: '2000',
        hostelFee: '',
        otherFee: '1000',
        discount: '',
        remarks: ''
      },
      documents: {
        birthCertificate: true,
        fatherCnic: true,
        motherCnic: false,
        guardianCnic: false,
        photos: true,
        previousResult: false,
        leavingCertificate: false,
        medicalCertificate: false
      },
      declaration: {
        parentName: 'Muhammad Khan',
        signature: true,
        date: new Date()
      },
      session: '2024-2025',
      classGrade: 'Class 1'
    }
  },
  {
    firstName: 'Ayesha',
    lastName: 'Malik',
    dateOfBirth: new Date('2014-07-22'),
    gender: 'Female',
    email: 'ayesha.malik@email.com',
    phone: '0311-2345678',
    parentName: 'Usman Malik',
    parentPhone: '0312-3456789',
    parentEmail: 'usman.malik@email.com',
    admissionStatus: 'Pending',
    admissionForm: {
      fullNameUrdu: 'عائشہ ملک',
      placeOfBirth: 'Karachi',
      nationality: 'Pakistani',
      religion: 'Islam',
      bloodGroup: 'O+',
      birthCertNo: '42101-9876543-2',
      photo: samplePhoto,
      father: {
        fullName: 'Usman Malik',
        cnic: '42101-9876543-2',
        qualification: 'PhD',
        occupation: 'Doctor',
        organization: 'Jinnah Hospital',
        monthlyIncome: '300000',
        mobile: '0312-3456789',
        whatsapp: '0312-3456789',
        email: 'usman.malik@email.com'
      },
      mother: {
        fullName: 'Sana Malik',
        cnic: '42101-5678901-2',
        qualification: 'Masters',
        occupation: 'Home Maker',
        mobile: '0313-4567890',
        email: 'sana.malik@email.com'
      },
      guardian: {
        fullName: '',
        relation: '',
        cnic: '',
        mobile: '',
        address: ''
      },
      currentAddress: {
        houseNo: 'Flat # 12',
        area: 'Clifton',
        city: 'Karachi',
        postalCode: '75600'
      },
      permanentAddress: {
        houseNo: 'Flat # 12',
        area: 'Clifton',
        city: 'Karachi',
        postalCode: '75600'
      },
      sameAddress: true,
      academic: {
        previousSchool: 'Happy Home School',
        previousClass: 'Playgroup',
        lastResult: 'A Grade',
        reasonForLeaving: 'Relocation',
        leavingCertificate: true
      },
      medical: {
        diseaseAllergy: 'Dust Allergy',
        physicalDisability: 'None',
        emergencyNotes: 'Keep away from dusty areas',
        doctorName: 'Dr. Sarah',
        emergencyContact: '0314-5678901'
      },
      transport: {
        required: false,
        pickUpAddress: '',
        dropOffAddress: '',
        routeArea: ''
      },
      hostel: {
        required: false,
        guardianName: '',
        guardianContact: ''
      },
      sibling: {
        hasSibling: true,
        siblings: [
          { name: 'Hassan Malik', classGrade: 'Class 3' }
        ]
      },
      fee: {
        admissionFee: '15000',
        securityFee: '5000',
        monthlyTuitionFee: '6000',
        transportFee: '',
        hostelFee: '',
        otherFee: '2000',
        discount: '10% Sibling',
        remarks: ''
      },
      documents: {
        birthCertificate: true,
        fatherCnic: true,
        motherCnic: true,
        guardianCnic: false,
        photos: true,
        previousResult: true,
        leavingCertificate: true,
        medicalCertificate: true
      },
      declaration: {
        parentName: 'Usman Malik',
        signature: true,
        date: new Date()
      },
      session: '2024-2025',
      classGrade: 'Class 2'
    }
  },
  {
    firstName: 'Hassan',
    lastName: 'Ali',
    dateOfBirth: new Date('2015-11-08'),
    gender: 'Male',
    email: 'hassan.ali@email.com',
    phone: '0333-3456789',
    parentName: 'Imran Ali',
    parentPhone: '0334-4567890',
    parentEmail: 'imran.ali@email.com',
    admissionStatus: 'Pending',
    admissionForm: {
      fullNameUrdu: 'حسن علی',
      placeOfBirth: 'Islamabad',
      nationality: 'Pakistani',
      religion: 'Islam',
      bloodGroup: 'B+',
      birthCertNo: '61101-4567890-3',
      photo: samplePhoto,
      father: {
        fullName: 'Imran Ali',
        cnic: '61101-4567890-3',
        qualification: 'Masters',
        occupation: 'Engineer',
        organization: 'NESPAK',
        monthlyIncome: '200000',
        mobile: '0334-4567890',
        whatsapp: '0334-4567890',
        email: 'imran.ali@email.com'
      },
      mother: {
        fullName: 'Zainab Ali',
        cnic: '61101-3456789-0',
        qualification: 'Bachelor',
        occupation: 'Banker',
        mobile: '0335-5678901',
        email: 'zainab.ali@email.com'
      },
      guardian: {
        fullName: 'Abdul Rehman',
        relation: 'Uncle',
        cnic: '61101-2345678-9',
        mobile: '0336-6789012',
        address: 'F-10, Islamabad'
      },
      currentAddress: {
        houseNo: 'House # 78',
        area: 'F-7',
        city: 'Islamabad',
        postalCode: '44000'
      },
      permanentAddress: {
        houseNo: 'House # 23',
        area: 'Gulberg',
        city: 'Lahore',
        postalCode: '54000'
      },
      sameAddress: false,
      academic: {
        previousSchool: 'Beaconhouse School',
        previousClass: 'Class 1',
        lastResult: '85%',
        reasonForLeaving: 'Parent Transfer',
        leavingCertificate: true
      },
      medical: {
        diseaseAllergy: 'None',
        physicalDisability: 'None',
        emergencyNotes: '',
        doctorName: 'Dr. Imran',
        emergencyContact: '0337-7890123'
      },
      transport: {
        required: true,
        pickUpAddress: 'F-7, Islamabad',
        dropOffAddress: 'F-7, Islamabad',
        routeArea: 'F-6 to F-10'
      },
      hostel: {
        required: false,
        guardianName: '',
        guardianContact: ''
      },
      sibling: {
        hasSibling: false,
        siblings: []
      },
      fee: {
        admissionFee: '12000',
        securityFee: '5000',
        monthlyTuitionFee: '5500',
        transportFee: '2500',
        hostelFee: '',
        otherFee: '1500',
        discount: '',
        remarks: ''
      },
      documents: {
        birthCertificate: true,
        fatherCnic: true,
        motherCnic: true,
        guardianCnic: true,
        photos: true,
        previousResult: true,
        leavingCertificate: true,
        medicalCertificate: false
      },
      declaration: {
        parentName: 'Imran Ali',
        signature: true,
        date: new Date()
      },
      session: '2024-2025',
      classGrade: 'Class 2'
    }
  },
  {
    firstName: 'Fatima',
    lastName: 'Rashid',
    dateOfBirth: new Date('2016-02-14'),
    gender: 'Female',
    email: 'fatima.rashid@email.com',
    phone: '0345-4567890',
    parentName: 'Rashid Ahmed',
    parentPhone: '0346-5678901',
    parentEmail: 'rashid.ahmed@email.com',
    admissionStatus: 'Pending',
    admissionForm: {
      fullNameUrdu: 'فاطمہ راشد',
      placeOfBirth: 'Peshawar',
      nationality: 'Pakistani',
      religion: 'Islam',
      bloodGroup: 'AB+',
      birthCertNo: '17101-6789012-4',
      photo: samplePhoto,
      father: {
        fullName: 'Rashid Ahmed',
        cnic: '17101-6789012-4',
        qualification: 'Intermediate',
        occupation: 'Business',
        organization: 'Rashid Enterprises',
        monthlyIncome: '80000',
        mobile: '0346-5678901',
        whatsapp: '0346-5678901',
        email: 'rashid.ahmed@email.com'
      },
      mother: {
        fullName: 'Nadia Rashid',
        cnic: '17101-7890123-5',
        qualification: 'Graduate',
        occupation: 'Teacher',
        mobile: '0347-6789012',
        email: 'nadia.rashid@email.com'
      },
      guardian: {
        fullName: '',
        relation: '',
        cnic: '',
        mobile: '',
        address: ''
      },
      currentAddress: {
        houseNo: 'House # 5',
        area: 'Cantt',
        city: 'Peshawar',
        postalCode: '25000'
      },
      permanentAddress: {
        houseNo: 'House # 5',
        area: 'Cantt',
        city: 'Peshawar',
        postalCode: '25000'
      },
      sameAddress: true,
      academic: {
        previousSchool: '',
        previousClass: '',
        lastResult: '',
        reasonForLeaving: '',
        leavingCertificate: false
      },
      medical: {
        diseaseAllergy: 'Peanut Allergy',
        physicalDisability: 'None',
        emergencyNotes: 'Severe peanut allergy - avoid all peanut products',
        doctorName: 'Dr. Khan',
        emergencyContact: '0348-7890123'
      },
      transport: {
        required: false,
        pickUpAddress: '',
        dropOffAddress: '',
        routeArea: ''
      },
      hostel: {
        required: true,
        guardianName: 'Amir Rashid',
        guardianContact: '0349-8901234'
      },
      sibling: {
        hasSibling: false,
        siblings: []
      },
      fee: {
        admissionFee: '8000',
        securityFee: '3000',
        monthlyTuitionFee: '4000',
        transportFee: '',
        hostelFee: '8000',
        otherFee: '500',
        discount: '',
        remarks: ''
      },
      documents: {
        birthCertificate: true,
        fatherCnic: true,
        motherCnic: false,
        guardianCnic: false,
        photos: true,
        previousResult: false,
        leavingCertificate: false,
        medicalCertificate: true
      },
      declaration: {
        parentName: 'Rashid Ahmed',
        signature: true,
        date: new Date()
      },
      session: '2024-2025',
      classGrade: 'Nursery'
    }
  },
  {
    firstName: 'Muhammad',
    lastName: 'Usman',
    dateOfBirth: new Date('2014-09-30'),
    gender: 'Male',
    email: 'usman.muhammad@email.com',
    phone: '0355-5678901',
    parentName: 'Bilal Muhammad',
    parentPhone: '0356-6789012',
    parentEmail: 'bilal.muhammad@email.com',
    admissionStatus: 'Approved',
    admissionForm: {
      fullNameUrdu: 'محمد عثمان',
      placeOfBirth: 'Faisalabad',
      nationality: 'Pakistani',
      religion: 'Islam',
      bloodGroup: 'A-',
      birthCertNo: '33100-1234567-9',
      photo: samplePhoto,
      father: {
        fullName: 'Bilal Muhammad',
        cnic: '33100-1234567-9',
        qualification: 'Bachelors',
        occupation: 'Accountant',
        organization: 'Faisalabad Mills',
        monthlyIncome: '100000',
        mobile: '0356-6789012',
        whatsapp: '0356-6789012',
        email: 'bilal.muhammad@email.com'
      },
      mother: {
        fullName: 'Sajida Bilal',
        cnic: '33100-2345678-0',
        qualification: 'Masters',
        occupation: 'Nurse',
        mobile: '0357-7890123',
        email: 'sajida.bilal@email.com'
      },
      guardian: {
        fullName: '',
        relation: '',
        cnic: '',
        mobile: '',
        address: ''
      },
      currentAddress: {
        houseNo: 'Plot # 89',
        area: 'D Ground',
        city: 'Faisalabad',
        postalCode: '38000'
      },
      permanentAddress: {
        houseNo: 'Plot # 89',
        area: 'D Ground',
        city: 'Faisalabad',
        postalCode: '38000'
      },
      sameAddress: true,
      academic: {
        previousSchool: 'Government Primary School',
        previousClass: 'Class 1',
        lastResult: 'B+ Grade',
        reasonForLeaving: 'Better Education',
        leavingCertificate: true
      },
      medical: {
        diseaseAllergy: 'None',
        physicalDisability: 'None',
        emergencyNotes: '',
        doctorName: 'Dr. Faisal',
        emergencyContact: '0358-8901234'
      },
      transport: {
        required: true,
        pickUpAddress: 'D Ground, Faisalabad',
        dropOffAddress: 'D Ground, Faisalabad',
        routeArea: 'D Ground'
      },
      hostel: {
        required: false,
        guardianName: '',
        guardianContact: ''
      },
      sibling: {
        hasSibling: true,
        siblings: [
          { name: 'Ayesha Muhammad', classGrade: 'Class 4' },
          { name: 'Hamza Muhammad', classGrade: 'Class 1' }
        ]
      },
      fee: {
        admissionFee: '10000',
        securityFee: '4000',
        monthlyTuitionFee: '4500',
        transportFee: '1500',
        hostelFee: '',
        otherFee: '1000',
        discount: '15% Sibling',
        remarks: 'Good student'
      },
      documents: {
        birthCertificate: true,
        fatherCnic: true,
        motherCnic: true,
        guardianCnic: false,
        photos: true,
        previousResult: true,
        leavingCertificate: true,
        medicalCertificate: true
      },
      declaration: {
        parentName: 'Bilal Muhammad',
        signature: true,
        date: new Date()
      },
      session: '2024-2025',
      classGrade: 'Class 2'
    }
  }
];

async function seedAdmissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let school = await School.findOne();
    if (!school) {
      school = await School.create({
        name: 'Greenfield International School',
        email: 'info@greenfield.edu',
        phone: '042-35123456',
        address: '123 Education Street, Lahore',
        isActive: true
      });
      console.log('Created sample school');
    }

    const schoolId = school._id;

    let studentRole = await Role.findOne({ code: 'STUDENT' });
    if (!studentRole) {
      studentRole = await Role.create({
        name: 'Student',
        code: 'STUDENT',
        description: 'Student role with basic access',
        permissions: ['student:view', 'student:edit']
      });
      console.log('Created student role');
    }

    await Student.deleteMany({ school: schoolId });
    console.log('Cleared existing students');

    for (const admission of sampleAdmissions) {
      const studentId = await generateStudentId(schoolId);
      
      const student = await Student.create({
        ...admission,
        studentId,
        school: schoolId,
        admissionDate: new Date(),
        status: admission.admissionStatus === 'Approved' ? 'Active' : 'Active'
      });

      console.log(`Created: ${admission.firstName} ${admission.lastName} (${studentId}) - ${admission.admissionStatus}`);
    }

    console.log('\n=== Sample Admissions Created Successfully ===');
    console.log(`Total: ${sampleAdmissions.length}`);
    console.log(`Pending: ${sampleAdmissions.filter(a => a.admissionStatus === 'Pending').length}`);
    console.log(`Approved: ${sampleAdmissions.filter(a => a.admissionStatus === 'Approved').length}`);
    console.log('All students have sample photos attached');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedAdmissions();
