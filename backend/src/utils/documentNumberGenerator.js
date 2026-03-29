const School = require('../models/School');

const getNextDocumentNumber = async (schoolId, docType) => {
  const school = await School.findOneAndUpdate(
    {
      _id: schoolId,
      'documentNumbers.type': docType
    },
    { $inc: { 'documentNumbers.$.currentNumber': 1 } },
    { new: true }
  );
  
  if (!school) {
    const defaultConfigs = {
      'FEE_VOUCHER': { prefix: 'FV', startNumber: 1 },
      'EXPENSE_VOUCHER': { prefix: 'EXP', startNumber: 1 },
      'ADMISSION': { prefix: 'ADM', startNumber: 1 },
      'STUDENT_ID': { prefix: 'STU', startNumber: 1 },
      'TEACHER_ID': { prefix: 'TCH', startNumber: 1 },
      'STAFF_ID': { prefix: 'STF', startNumber: 1 }
    };
    
    const defaultConfig = defaultConfigs[docType] || { prefix: docType, startNumber: 1 };
    
    const newDocConfig = {
      type: docType,
      prefix: defaultConfig.prefix,
      startNumber: defaultConfig.startNumber,
      currentNumber: defaultConfig.startNumber + 1
    };
    
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      { $push: { documentNumbers: newDocConfig } },
      { new: true, upsert: false }
    );
    
    if (!updatedSchool) return null;
    
    return `${defaultConfig.prefix}-${String(defaultConfig.startNumber).padStart(5, '0')}`;
  }
  
  const docConfig = school.documentNumbers.find(d => d.type === docType);
  const number = String(docConfig.currentNumber - 1).padStart(5, '0');
  
  return `${docConfig.prefix}-${number}`;
};

module.exports = { getNextDocumentNumber };
