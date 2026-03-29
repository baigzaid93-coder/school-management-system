const { getNextDocumentNumber } = require('./documentNumberGenerator');

const generateStudentId = async (schoolId) => {
  return await getNextDocumentNumber(schoolId, 'STUDENT_ID');
};

const generateTeacherId = async (schoolId) => {
  return await getNextDocumentNumber(schoolId, 'TEACHER_ID');
};

const generateStaffId = async (schoolId) => {
  return await getNextDocumentNumber(schoolId, 'STAFF_ID');
};

const generateStaffMemberId = async (schoolId) => {
  return await getNextDocumentNumber(schoolId, 'STAFF_ID');
};

module.exports = {
  generateStudentId,
  generateTeacherId,
  generateStaffId,
  generateStaffMemberId
};
