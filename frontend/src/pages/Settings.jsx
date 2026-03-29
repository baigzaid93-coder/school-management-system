import { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Calendar, Clock, BookOpen, Users, Briefcase, 
  DollarSign, ClipboardList, Plus, Edit2, Trash2, X, Save, Check, FileText
} from 'lucide-react';
import { settingsService, teacherService } from '../services/api';
import useToast from '../hooks/useToast';

const getDefaultPrefix = (type) => {
  const defaults = {
    'STUDENT_ID': 'STU',
    'TEACHER_ID': 'TCH',
    'STAFF_ID': 'STF',
    'FEE_VOUCHER': 'FV',
    'EXPENSE_VOUCHER': 'EXP',
    'ADMISSION': 'ADM'
  };
  return defaults[type] || type.substring(0, 3);
};

const getDocTypeLabel = (type) => {
  const labels = {
    'STUDENT_ID': 'Student ID',
    'TEACHER_ID': 'Teacher ID',
    'STAFF_ID': 'Staff ID',
    'FEE_VOUCHER': 'Fee Voucher',
    'EXPENSE_VOUCHER': 'Expense Voucher',
    'ADMISSION': 'Admission'
  };
  return labels[type] || type;
};

const tabs = [
  { id: 'school', label: 'School Profile', icon: Building2 },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'academic', label: 'Academic Year', icon: Calendar },
  { id: 'terms', label: 'Terms', icon: Clock },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'sections', label: 'Sections', icon: BookOpen },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'departments', label: 'Departments', icon: Users },
  { id: 'staffroles', label: 'Staff Roles', icon: Briefcase },
  { id: 'feeheads', label: 'Fee Heads', icon: DollarSign },
  { id: 'examtypes', label: 'Exam Types', icon: ClipboardList },
];

function Settings() {
  const [activeTab, setActiveTab] = useState('school');
  const [teachers, setTeachers] = useState([]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalFormData, setModalFormData] = useState({});
  const [schoolProfile, setSchoolProfile] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'school') {
      loadTabData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (editingItem) {
      setModalFormData(editingItem);
    } else {
      setModalFormData({});
    }
  }, [editingItem]);

  const loadInitialData = async () => {
    try {
      const [schoolRes, teachersRes] = await Promise.all([
        settingsService.school.get(),
        teacherService.getAll()
      ]);
      setSchoolProfile(schoolRes.data);
      setTeachers(teachersRes.data);
      setData({ school: schoolRes.data });
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'branches':
          const branches = await settingsService.branches.getAll();
          setData(prev => ({ ...prev, branches: branches.data }));
          break;
        case 'academic':
          const years = await settingsService.academicYears.getAll();
          setData(prev => ({ ...prev, academicYears: years.data }));
          break;
        case 'terms':
          const terms = await settingsService.terms.getAll();
          setData(prev => ({ ...prev, terms: terms.data }));
          break;
        case 'classes':
          const classes = await settingsService.classes.getAll();
          setData(prev => ({ ...prev, classes: classes.data }));
          break;
        case 'sections':
          const sections = await settingsService.sections.getAll();
          setData(prev => ({ ...prev, sections: sections.data }));
          break;
        case 'subjects':
          const subjects = await settingsService.subjects.getAll();
          setData(prev => ({ ...prev, subjects: subjects.data }));
          break;
        case 'departments':
          const departments = await settingsService.departments.getAll();
          setData(prev => ({ ...prev, departments: departments.data }));
          break;
        case 'staffroles':
          const roles = await settingsService.staffRoles.getAll();
          setData(prev => ({ ...prev, staffRoles: roles.data }));
          break;
        case 'feeheads':
          const feeHeads = await settingsService.feeHeads.getAll();
          setData(prev => ({ ...prev, feeHeads: feeHeads.data }));
          break;
        case 'examtypes':
          const examTypes = await settingsService.examTypes.getAll();
          setData(prev => ({ ...prev, examTypes: examTypes.data }));
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSave = async (formData) => {
    try {
      await settingsService.school.update(formData);
      setSchoolProfile(formData);
      showToast('School profile saved successfully!', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Failed to save', 'error');
    }
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setModalFormData(item || {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalFormData({});
  };

  const getModalFields = () => {
    switch (activeTab) {
      case 'departments':
        return [
          { name: 'name', label: 'Department Name', required: true },
          { name: 'code', label: 'Code', required: true },
          { name: 'description', label: 'Description' }
        ];
      case 'staffroles':
        return [
          { name: 'name', label: 'Role Name', required: true },
          { name: 'code', label: 'Code', required: true },
          { name: 'description', label: 'Description' },
          { name: 'isTeaching', label: 'Teaching Role', type: 'checkbox' }
        ];
      default:
        return [];
    }
  };

  const getModalService = () => {
    switch (activeTab) {
      case 'departments':
        return settingsService.departments;
      case 'staffroles':
        return settingsService.staffRoles;
      default:
        return null;
    }
  };

  const handleModalSave = async (formData) => {
    const service = getModalService();
    if (!service) {
      showToast('Service not found for this tab', 'error');
      return;
    }
    
    try {
      console.log('Saving with data:', formData);
      if (editingItem) {
        await service.update(editingItem._id, formData);
      } else {
        await service.create(formData);
      }
      closeModal();
      loadTabData();
      showToast('Saved successfully!', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save';
      showToast(errorMsg, 'error');
    }
  };

  if (loading && !data[activeTab]) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'school' && <SchoolProfileForm profile={schoolProfile} onSave={handleSchoolSave} />}
          {activeTab === 'branches' && <CrudList 
            title="Branches" 
            data={data.branches || []} 
            columns={['name', 'code', 'city', 'status']}
            fields={[
              { name: 'name', label: 'Branch Name', required: true },
              { name: 'code', label: 'Code', required: true },
              { name: 'phone', label: 'Phone' },
              { name: 'email', label: 'Email' },
              { name: 'isMain', label: 'Main Branch', type: 'checkbox' },
              { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ]}
            service={settingsService.branches}
            onRefresh={loadTabData}
            onOpenModal={openModal}
          />}
          {activeTab === 'academic' && <AcademicYearList 
            data={data.academicYears || []} 
            onRefresh={loadTabData}
          />}
          {activeTab === 'terms' && <TermsList 
            data={data.terms || []} 
            academicYears={data.academicYears || []}
            onRefresh={loadTabData}
          />}
          {activeTab === 'classes' && <ClassesList 
            data={data.classes || []} 
            onRefresh={loadTabData}
          />}
          {activeTab === 'sections' && <SectionsList 
            data={data.sections || []}
            classes={data.classes || []}
            teachers={teachers}
            onRefresh={loadTabData}
          />}
          {activeTab === 'subjects' && <SubjectsList 
            data={data.subjects || []} 
            classes={data.classes || []}
            onRefresh={loadTabData}
          />}
          {activeTab === 'departments' && <CrudList 
            title="Departments" 
            data={data.departments || []} 
            columns={['name', 'code']}
            fields={[
              { name: 'name', label: 'Department Name', required: true },
              { name: 'code', label: 'Code', required: true },
              { name: 'description', label: 'Description' }
            ]}
            service={settingsService.departments}
            onRefresh={loadTabData}
            onOpenModal={openModal}
          />}
          {activeTab === 'staffroles' && <CrudList 
            title="Staff Roles" 
            data={data.staffRoles || []} 
            columns={['name', 'code', 'isTeaching']}
            fields={[
              { name: 'name', label: 'Role Name', required: true },
              { name: 'code', label: 'Code', required: true },
              { name: 'description', label: 'Description' },
              { name: 'isTeaching', label: 'Teaching Role', type: 'checkbox' }
            ]}
            service={settingsService.staffRoles}
            onRefresh={loadTabData}
            onOpenModal={openModal}
          />}
          {activeTab === 'feeheads' && <FeeHeadsList 
            data={data.feeHeads || []}
            classes={data.classes || []}
            onRefresh={loadTabData}
          />}
          {activeTab === 'examtypes' && <ExamTypesList 
            data={data.examTypes || []}
            onRefresh={loadTabData}
          />}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit' : 'Add'} {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modalFormData); }}>
              {getModalFields().map(field => (
                <div key={field.name} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={modalFormData[field.name] || false}
                      onChange={(e) => setModalFormData({ ...modalFormData, [field.name]: e.target.checked })}
                      className="w-4 h-4"
                    />
                  ) : (
                    <input
                      type="text"
                      required={field.required}
                      value={modalFormData[field.name] || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SchoolProfileForm({ profile, onSave }) {
  const [formData, setFormData] = useState(profile || {});

  useEffect(() => {
    setFormData(profile || {});
  }, [profile]);

  const updateDocumentNumber = (type, field, value) => {
    const docNumbers = formData.documentNumbers || [];
    const existingIndex = docNumbers.findIndex(d => d.type === type);
    
    if (existingIndex >= 0) {
      const updated = [...docNumbers];
      updated[existingIndex] = { ...updated[existingIndex], [field]: value };
      setFormData(prev => ({ ...prev, documentNumbers: updated }));
    } else {
      setFormData(prev => ({
        ...prev,
        documentNumbers: [...docNumbers, { type, prefix: getDefaultPrefix(type), startNumber: 1, [field]: value }]
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <h3 className="text-lg font-semibold">School Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
          <input
            type="text"
            required
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
          <input
            type="text"
            required
            value={formData.code || ''}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          value={formData.address?.street || ''}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Street"
        />
        <div className="grid grid-cols-3 gap-4 mt-3">
          <input
            type="text"
            value={formData.address?.city || ''}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="City"
          />
          <input
            type="text"
            value={formData.address?.state || ''}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="State"
          />
          <input
            type="text"
            value={formData.address?.zipCode || ''}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="ZIP Code"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
          <input
            type="text"
            value={formData.principleName || ''}
            onChange={(e) => setFormData({ ...formData, principleName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
          <input
            type="number"
            value={formData.foundedYear || ''}
            onChange={(e) => setFormData({ ...formData, foundedYear: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={20} /> Fee Structure (Default Values)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.feeStructure?.admissionFee || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  admissionFee: Math.max(0, parseInt(e.target.value) || 0) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Fee (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.feeStructure?.securityFee || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  securityFee: Math.max(0, parseInt(e.target.value) || 0) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Tuition (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.feeStructure?.monthlyTuitionFee || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  monthlyTuitionFee: Math.max(0, parseInt(e.target.value) || 0) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Fee (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.feeStructure?.transportFee || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  transportFee: Math.max(0, parseInt(e.target.value) || 0) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Fee (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.feeStructure?.hostelFee || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  hostelFee: Math.max(0, parseInt(e.target.value) || 0) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Fee (PKR)</label>
            <input
              type="number"
              min="0"
              value={formData.feeStructure?.otherFee || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  otherFee: Math.max(0, parseInt(e.target.value) || 0) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.feeStructure?.discountPercentage || 0}
              onChange={(e) => setFormData({ 
                ...formData, 
                feeStructure: { 
                  ...formData.feeStructure, 
                  discountPercentage: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">These values will be pre-filled in admission forms but can be edited per student.</p>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Declaration & Policies</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              rows={4}
              value={formData.declaration?.termsAndConditions || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                declaration: { 
                  ...formData.declaration, 
                  termsAndConditions: e.target.value 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter terms and conditions for admission..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Policy</label>
            <textarea
              rows={3}
              value={formData.declaration?.refundPolicy || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                declaration: { 
                  ...formData.declaration, 
                  refundPolicy: e.target.value 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter refund policy..."
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText size={20} /> Document Numbering
        </h3>
        <p className="text-xs text-gray-500 mb-4">Configure prefixes and starting numbers for different document types. Numbers will auto-increment.</p>
        <div className="space-y-3">
          {['STUDENT_ID', 'TEACHER_ID', 'STAFF_ID', 'FEE_VOUCHER', 'EXPENSE_VOUCHER', 'ADMISSION'].map(docType => {
            const doc = formData.documentNumbers?.find(d => d.type === docType) || { type: docType, prefix: getDefaultPrefix(docType), startNumber: 1 };
            return (
              <div key={docType} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-40">
                  <span className="text-sm font-medium text-gray-700">{getDocTypeLabel(docType)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={doc.prefix || ''}
                    onChange={(e) => updateDocumentNumber(docType, 'prefix', e.target.value.toUpperCase())}
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="Prefix"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min="1"
                    value={doc.startNumber || 1}
                    onChange={(e) => updateDocumentNumber(docType, 'startNumber', parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="Start"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Next: {doc.prefix || 'XXX'}-{String(doc.currentNumber || doc.startNumber || 1).padStart(5, '0')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Save size={18} />
        Save School Profile
      </button>
    </form>
  );
}

function CrudList({ title, data, columns, fields, service, onRefresh, onOpenModal }) {
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await service.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={() => onOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Add {title}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map(item => (
              <tr key={item._id} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-3 text-sm">
                    {col === 'isTeaching' ? (item[col] ? 'Yes' : 'No') : item[col]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onOpenModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="text-center py-8 text-gray-500">No data found</p>}
      </div>
    </div>
  );
}

function AcademicYearList({ data, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.academicYears.create(formData);
      setShowForm(false);
      setFormData({ name: '', startDate: '', endDate: '', isCurrent: false });
      onRefresh();
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this academic year?')) return;
    await settingsService.academicYears.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Academic Years</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Academic Year
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Year Name (e.g., 2024-2025)" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="date" required value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" required value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isCurrent}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} />
              Set as Current Year
            </label>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(year => (
          <div key={year._id} className={`p-4 rounded-lg border-2 ${year.isCurrent ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{year.name}</h4>
              {year.isCurrent && <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Current</span>}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleDelete(year._id)} className="text-red-600 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && <p className="text-center py-8 text-gray-500">No academic years defined</p>}
    </div>
  );
}

function TermsList({ data, academicYears, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', termNumber: 1, academicYear: '', startDate: '', endDate: '', isCurrent: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.terms.create(formData);
      setShowForm(false);
      setFormData({ name: '', termNumber: 1, academicYear: '', startDate: '', endDate: '', isCurrent: false });
      onRefresh();
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this term?')) return;
    await settingsService.terms.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Terms / Semesters</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Term
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Term Name (e.g., Term 1)" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <select required value={formData.termNumber}
              onChange={(e) => setFormData({ ...formData, termNumber: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>Term {n}</option>)}
            </select>
          </div>
          <select required value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">Select Academic Year</option>
            {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" required value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="date" required value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} />
            Set as Current Term
          </label>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map(term => (
              <tr key={term._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{term.name}</td>
                <td className="px-4 py-3 text-sm">{term.academicYear?.name}</td>
                <td className="px-4 py-3 text-sm">{new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {term.isCurrent && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Current</span>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(term._id)} className="text-red-600 text-sm hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="text-center py-8 text-gray-500">No terms defined</p>}
      </div>
    </div>
  );
}

function ClassesList({ data, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', level: 1 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        code: formData.code,
        level: formData.level
      };
      await settingsService.classes.create(submitData);
      setShowForm(false);
      setFormData({ name: '', code: '', level: 1 });
      onRefresh();
    } catch (error) {
      console.error('Failed:', error);
      showToast(error.response?.data?.message || 'Failed to create class', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this class?')) return;
    try {
      await settingsService.classes.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast(error.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Classes / Grades</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Class
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-3 gap-4">
            <input type="text" placeholder="Class Name (e.g., Class 1)" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Code (e.g., C1)" required value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="number" placeholder="Level" required value={formData.level} min="1"
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.map(cls => (
          <div key={cls._id} className="p-4 bg-white border rounded-lg hover:shadow-md">
            <h4 className="font-semibold">{cls.name}</h4>
            <p className="text-sm text-gray-500">Level: {cls.level}</p>
            <p className="text-sm text-gray-500">{cls.code}</p>
            <button onClick={() => handleDelete(cls._id)} className="text-red-600 text-xs mt-2 hover:underline">Delete</button>
          </div>
        ))}
      </div>
      {data.length === 0 && <p className="text-center py-8 text-gray-500">No classes defined</p>}
    </div>
  );
}

function SectionsList({ data, classes, teachers, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', classGrade: '', teacher: '', capacity: 40 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        code: formData.code,
        classGrade: formData.classGrade || null,
        teacher: formData.teacher || null,
        capacity: formData.capacity
      };
      await settingsService.sections.create(submitData);
      setShowForm(false);
      setFormData({ name: '', code: '', classGrade: '', teacher: '', capacity: 40 });
      onRefresh();
    } catch (error) {
      console.error('Failed:', error);
      showToast(error.response?.data?.message || 'Failed to create section', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return;
    try {
      await settingsService.sections.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast(error.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sections</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Section
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Section Name (e.g., A, B)" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Code (e.g., 1-A)" required value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <select required value={formData.classGrade}
            onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">Select Class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Class Teacher</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
            </select>
            <input type="number" placeholder="Capacity" value={formData.capacity} min="1"
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map(section => (
              <tr key={section._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{section.name} ({section.code})</td>
                <td className="px-4 py-3 text-sm">{section.classGrade?.name}</td>
                <td className="px-4 py-3 text-sm">{section.teacher ? `${section.teacher.firstName} ${section.teacher.lastName}` : '-'}</td>
                <td className="px-4 py-3 text-sm">{section.students?.length || 0}/{section.capacity}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(section._id)} className="text-red-600 text-sm hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="text-center py-8 text-gray-500">No sections defined</p>}
      </div>
    </div>
  );
}

function SubjectsList({ data, classes, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'Theory', classGrade: '', theoryHoursPerWeek: 0, isCompulsory: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        classGrade: formData.classGrade || null,
        theoryHoursPerWeek: formData.theoryHoursPerWeek,
        isCompulsory: formData.isCompulsory
      };
      await settingsService.subjects.create(submitData);
      setShowForm(false);
      setFormData({ name: '', code: '', type: 'Theory', classGrade: '', theoryHoursPerWeek: 0, isCompulsory: false });
      onRefresh();
    } catch (error) {
      console.error('Failed:', error);
      showToast(error.response?.data?.message || 'Failed to create subject', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await settingsService.subjects.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast(error.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subjects</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Subject Name" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Code" required value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="Theory">Theory</option>
              <option value="Practical">Practical</option>
              <option value="Both">Both</option>
            </select>
            <select value={formData.classGrade}
              onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Hours/Week" value={formData.theoryHoursPerWeek} min="0"
              onChange={(e) => setFormData({ ...formData, theoryHoursPerWeek: parseInt(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isCompulsory}
                onChange={(e) => setFormData({ ...formData, isCompulsory: e.target.checked })} />
              Compulsory Subject
            </label>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(subject => (
          <div key={subject._id} className="p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{subject.name}</h4>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">{subject.code}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{subject.type}</span>
              {subject.isCompulsory && <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Compulsory</span>}
            </div>
            {subject.classGrade && <p className="text-xs text-gray-400 mt-2">Class: {subject.classGrade.name}</p>}
            <button onClick={() => handleDelete(subject._id)} className="text-red-600 text-xs mt-2 hover:underline">Delete</button>
          </div>
        ))}
      </div>
      {data.length === 0 && <p className="text-center py-8 text-gray-500">No subjects defined</p>}
    </div>
  );
}

function FeeHeadsList({ data, classes, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: '一次性', amount: 0, isCompulsory: true, applicableTo: ['All'] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.feeHeads.create(formData);
      setShowForm(false);
      setFormData({ name: '', code: '', type: '一次性', amount: 0, isCompulsory: true, applicableTo: ['All'] });
      onRefresh();
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee head?')) return;
    await settingsService.feeHeads.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fee Heads</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Fee Head
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Fee Head Name" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Code" required value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="一次性">One-time</option>
              <option value="Monthly">Monthly</option>
              <option value="Termly">Termly</option>
              <option value="Annual">Annual</option>
            </select>
            <input type="number" placeholder="Amount" value={formData.amount} min="0"
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.isCompulsory}
              onChange={(e) => setFormData({ ...formData, isCompulsory: e.target.checked })} />
            Compulsory Fee
          </label>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map(fee => (
              <tr key={fee._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{fee.name}</td>
                <td className="px-4 py-3 text-sm">{fee.code}</td>
                <td className="px-4 py-3 text-sm">{fee.type}</td>
                <td className="px-4 py-3 text-sm">${fee.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(fee._id)} className="text-red-600 text-sm hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="text-center py-8 text-gray-500">No fee heads defined</p>}
      </div>
    </div>
  );
}

function ExamTypesList({ data, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'Both', weightage: 0, maxScore: 100, passingScore: 40 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.examTypes.create(formData);
      setShowForm(false);
      setFormData({ name: '', code: '', type: 'Both', weightage: 0, maxScore: 100, passingScore: 40 });
      onRefresh();
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam type?')) return;
    await settingsService.examTypes.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Exam Types</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add Exam Type
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Exam Type Name" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Code" required value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <select value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="Continuous">Continuous</option>
              <option value="Summative">Summative</option>
              <option value="Both">Both</option>
            </select>
            <input type="number" placeholder="Max Score" value={formData.maxScore} min="1"
              onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="number" placeholder="Passing Score" value={formData.passingScore} min="1"
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              Weightage (%):
              <input type="number" value={formData.weightage} min="0" max="100"
                onChange={(e) => setFormData({ ...formData, weightage: parseInt(e.target.value) })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(exam => (
          <div key={exam._id} className="p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{exam.name}</h4>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">{exam.code}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{exam.type}</span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">Max: {exam.maxScore}</span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">Pass: {exam.passingScore}</span>
            </div>
            {exam.weightage > 0 && <p className="text-xs text-gray-500 mt-2">Weightage: {exam.weightage}%</p>}
            <button onClick={() => handleDelete(exam._id)} className="text-red-600 text-xs mt-2 hover:underline">Delete</button>
          </div>
        ))}
      </div>
      {data.length === 0 && <p className="text-center py-8 text-gray-500">No exam types defined</p>}
    </div>
  );
}

export default Settings;
